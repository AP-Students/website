import Fuse from "fuse.js";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { formatSlug } from "@/lib/utils";
import { type Subject } from "@/types/firestore";

const SEARCH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SEARCH_CACHE_KEY_PREFIX = "guide-search-index-v2";

export type GuideChapterSearchItem = {
  subjectSlug: string;
  subjectTitle: string;
  unitId: string;
  unitIndex: number;
  unitTitle: string;
  chapterId: string;
  chapterTitle: string;
  chapterPath: string;
  searchableText: string;
};

export type GuideSearchCache = {
  timestamp: number;
  items: GuideChapterSearchItem[];
};

const getCacheKey = (canPreview: boolean) =>
  `${SEARCH_CACHE_KEY_PREFIX}:${canPreview ? "preview" : "public"}`;

const normalizeQuery = (query: string) => query.trim().toLowerCase();

const isPrimitive = (value: unknown): value is string | number | boolean => {
  const valueType = typeof value;
  return valueType === "string" || valueType === "number" || valueType === "boolean";
};

const collectText = (value: unknown): string[] => {
  if (value == null) {
    return [];
  }

  if (isPrimitive(value)) {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectText(item));
  }

  if (typeof value === "object") {
    return Object.values(value).flatMap((entry) => collectText(entry));
  }

  return [];
};

const buildChapterPath = (input: {
  subjectSlug: string;
  unitIndex: number;
  unitId: string;
  chapterId: string;
  chapterTitle: string;
}) => {
  const { subjectSlug, unitIndex, unitId, chapterId, chapterTitle } = input;
  const unitSegment = `unit-${unitIndex + 1}-${unitId}`;

  return `/subject/${subjectSlug}/${unitSegment}/chapter/${chapterId}/${formatSlug(chapterTitle)}`;
};

const buildSearchableText = (input: {
  subjectTitle: string;
  unitTitle: string;
  chapterTitle: string;
  content?: unknown;
}) => {
  const blockText = collectText(input.content).join(" ");

  return [input.subjectTitle, input.unitTitle, input.chapterTitle, blockText]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeChapterDocId = (chapterId: string) => {
  const normalized = chapterId.split("-").slice(0, 2).join("-");
  return normalized || chapterId;
};

const fetchChapterContent = async (
  subjectSlug: string,
  unitId: string,
  chapterId: string,
): Promise<unknown> => {
  const candidateChapterIds = Array.from(
    new Set([chapterId, normalizeChapterDocId(chapterId)]),
  );

  for (const candidateChapterId of candidateChapterIds) {
    const chapterDocRef = doc(
      db,
      "subjects",
      subjectSlug,
      "units",
      unitId,
      "chapters",
      candidateChapterId,
    );

    const chapterDocSnapshot = await getDoc(chapterDocRef);
    if (chapterDocSnapshot.exists()) {
      const chapterDocData = chapterDocSnapshot.data() as {
        data?: unknown;
        content?: unknown;
      };
      const dataValue = chapterDocData.data;
      if (dataValue != null) {
        return dataValue;
      }

      const contentValue = chapterDocData.content;
      if (contentValue != null) {
        return contentValue;
      }

      return null;
    }
  }

  return null;
};

const hasIndexedContent = (content: unknown) => {
  if (!content || typeof content !== "object") {
    return false;
  }

  const collected = collectText(content)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return collected.length > 0;
};

const mapSubjectToSearchItems = (
  subjectSlug: string,
  subject: Subject,
  canPreview: boolean,
): Promise<GuideChapterSearchItem[]> => {
  const perChapterPromises = subject.units.flatMap((unit, unitIndex) =>
    unit.chapters
      .filter((chapter) => chapter.isPublic === true || canPreview)
      .map(async (chapter) => {
        let indexedContent: unknown = chapter.content;

        if (!hasIndexedContent(indexedContent)) {
          indexedContent = await fetchChapterContent(
            subjectSlug,
            unit.id,
            chapter.id,
          );
        }

        return {
          subjectSlug,
          subjectTitle: subject.title,
          unitId: unit.id,
          unitIndex,
          unitTitle: unit.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterPath: buildChapterPath({
            subjectSlug,
            unitIndex,
            unitId: unit.id,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
          }),
          searchableText: buildSearchableText({
            subjectTitle: subject.title,
            unitTitle: unit.title,
            chapterTitle: chapter.title,
            content: indexedContent,
          }),
        };
      }),
  );

  return Promise.all(perChapterPromises);
};

const readCache = (canPreview: boolean): GuideChapterSearchItem[] | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = localStorage.getItem(getCacheKey(canPreview));
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as GuideSearchCache;
    if (Date.now() - parsed.timestamp > SEARCH_CACHE_TTL_MS) {
      return null;
    }

    return parsed.items;
  } catch {
    return null;
  }
};

const writeCache = (canPreview: boolean, items: GuideChapterSearchItem[]) => {
  if (typeof window === "undefined") {
    return;
  }

  const payload: GuideSearchCache = {
    timestamp: Date.now(),
    items,
  };

  localStorage.setItem(getCacheKey(canPreview), JSON.stringify(payload));
};

const compareSearchItems = (
  left: GuideChapterSearchItem,
  right: GuideChapterSearchItem,
) => {
  return (
    left.subjectTitle.localeCompare(right.subjectTitle) ||
    left.unitIndex - right.unitIndex ||
    left.chapterTitle.localeCompare(right.chapterTitle)
  );
};

export const loadGuideSearchItems = async (
  canPreview: boolean,
  forceRefresh = false,
): Promise<GuideChapterSearchItem[]> => {
  if (!forceRefresh) {
    const cachedItems = readCache(canPreview);
    if (cachedItems) {
      return cachedItems;
    }
  }

  const subjectsSnapshot = await getDocs(collection(db, "subjects"));

  const itemsBySubject = await Promise.all(
    subjectsSnapshot.docs.map(async (subjectDoc) => {
      const subjectData = subjectDoc.data() as Subject;
      if (!(subjectData.units?.length ?? 0)) {
        return [];
      }

      return mapSubjectToSearchItems(subjectDoc.id, subjectData, canPreview);
    }),
  );

  const items = itemsBySubject.flat().sort(compareSearchItems);

  writeCache(canPreview, items);

  return items;
};

export const createGuideSearchFuse = (items: GuideChapterSearchItem[]) => {
  return new Fuse(items, {
    includeScore: true,
    minMatchCharLength: 2,
    threshold: 0.4,
    ignoreLocation: false,
    distance: 120,
    keys: [
      { name: "chapterTitle", weight: 0.62 },
      { name: "unitTitle", weight: 0.14 },
      { name: "subjectTitle", weight: 0.08 },
      { name: "searchableText", weight: 0.16 },
    ],
  });
};

const getTitleSignalBoost = (title: string, normalizedQuery: string) => {
  const normalizedTitle = normalizeQuery(title);
  let boost = 0;

  if (normalizedTitle === normalizedQuery) {
    return 0.5;
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    boost += 0.34;
  }

  const wordMatchRegex = new RegExp(`\\b${normalizedQuery.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i");
  if (wordMatchRegex.test(normalizedTitle)) {
    boost += 0.24;
  }

  const firstIndex = normalizedTitle.indexOf(normalizedQuery);
  if (firstIndex >= 0) {
    boost += Math.max(0, 0.18 - firstIndex * 0.0035);
  }

  return boost;
};

const getSearchableTextSignalBoost = (
  searchableText: string,
  normalizedQuery: string,
) => {
  const normalizedText = normalizeQuery(searchableText);
  const firstIndex = normalizedText.indexOf(normalizedQuery);
  if (firstIndex < 0) {
    return 0;
  }

  return Math.max(0, 0.08 - firstIndex * 0.00012);
};

export const searchGuideChapters = (
  fuse: Fuse<GuideChapterSearchItem>,
  query: string,
  maxResults = 12,
): GuideChapterSearchItem[] => {
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const results = fuse.search(normalizedQuery, { limit: maxResults });

  return results
    .sort((left, right) => {
      const leftBaseScore = left.score ?? 1;
      const rightBaseScore = right.score ?? 1;

      const leftAdjustedScore =
        leftBaseScore -
        getTitleSignalBoost(left.item.chapterTitle, normalizedQuery) -
        getSearchableTextSignalBoost(left.item.searchableText, normalizedQuery);

      const rightAdjustedScore =
        rightBaseScore -
        getTitleSignalBoost(right.item.chapterTitle, normalizedQuery) -
        getSearchableTextSignalBoost(right.item.searchableText, normalizedQuery);

      return (
        leftAdjustedScore - rightAdjustedScore ||
        compareSearchItems(left.item, right.item)
      );
    })
    .map((result) => result.item);
};
