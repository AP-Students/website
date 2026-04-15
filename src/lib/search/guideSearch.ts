import Fuse from "fuse.js";
import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { formatSlug } from "@/lib/utils";
import { type Subject } from "@/types/firestore";

const SEARCH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SEARCH_CACHE_KEY_PREFIX = "guide-search-index-v1";

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

const mapSubjectToSearchItems = (
  subjectSlug: string,
  subject: Subject,
  canPreview: boolean,
): GuideChapterSearchItem[] => {
  return subject.units.flatMap((unit, unitIndex) =>
    unit.chapters
      .filter((chapter) => chapter.isPublic === true || canPreview)
      .map((chapter) => ({
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
          content: chapter.content,
        }),
      })),
  );
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

  const items = subjectsSnapshot.docs
    .flatMap((subjectDoc) => {
      const subjectData = subjectDoc.data() as Subject;
      if (!(subjectData.units?.length ?? 0)) {
        return [];
      }

      return mapSubjectToSearchItems(subjectDoc.id, subjectData, canPreview);
    })
    .sort(compareSearchItems);

  writeCache(canPreview, items);

  return items;
};

export const createGuideSearchFuse = (items: GuideChapterSearchItem[]) => {
  return new Fuse(items, {
    includeScore: true,
    minMatchCharLength: 2,
    threshold: 0.3,
    ignoreLocation: true,
    keys: [
      { name: "chapterTitle", weight: 0.45 },
      { name: "unitTitle", weight: 0.2 },
      { name: "subjectTitle", weight: 0.15 },
      { name: "searchableText", weight: 0.2 },
    ],
  });
};

export const searchGuideChapters = (
  fuse: Fuse<GuideChapterSearchItem>,
  query: string,
  maxResults = 8,
): GuideChapterSearchItem[] => {
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const results = fuse.search(normalizedQuery, { limit: maxResults });

  return results
    .sort((left, right) => {
      const leftScore = left.score ?? 1;
      const rightScore = right.score ?? 1;
      return leftScore - rightScore || compareSearchItems(left.item, right.item);
    })
    .map((result) => result.item);
};
