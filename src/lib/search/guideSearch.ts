import Fuse from "fuse.js";
import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { formatSlug } from "@/lib/utils";
import { type Chapter, type Subject, type Unit } from "@/types/firestore";

const SEARCH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SEARCH_CACHE_KEY_PREFIX = "guide-search-index-v3";

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

const fetchUnitDocs = async (subjectSlug: string, subject: Subject) => {
  try {
    const unitsSnapshot = await getDocs(
      collection(db, "subjects", subjectSlug, "units"),
    );

    if (unitsSnapshot.empty) {
      return subject.units ?? [];
    }

    return unitsSnapshot.docs.map((unitDoc) => {
      const unitData = unitDoc.data() as Unit;
      return {
        ...unitData,
        id: unitData.id || unitDoc.id,
        title: unitData.title || "Untitled Unit",
        chapters: unitData.chapters ?? [],
      };
    });
  } catch (error) {
    console.error(`Failed loading units for ${subjectSlug}`, error);
    return subject.units ?? [];
  }
};

const fetchChapterDocs = async (subjectSlug: string, unitId: string) => {
  try {
    const chaptersSnapshot = await getDocs(
      collection(db, "subjects", subjectSlug, "units", unitId, "chapters"),
    );

    return chaptersSnapshot.docs.map((chapterDoc) => {
      const chapterData = chapterDoc.data() as Chapter;
      return {
        ...chapterData,
        id: chapterData.id || chapterDoc.id,
      };
    });
  } catch (error) {
    console.error(`Failed loading chapters for ${subjectSlug}/${unitId}`, error);
    return [];
  }
};

const isChapterVisible = (chapter: Chapter, canPreview: boolean) => {
  if (canPreview) {
    return true;
  }

  // Treat undefined as visible to avoid excluding legacy data that omitted this flag.
  return chapter.isPublic !== false;
};

const mergeChapters = (unitChapters: Chapter[] = [], chapterDocs: Chapter[] = []) => {
  const chapterMap = new Map<string, Chapter>();

  unitChapters.forEach((chapter) => {
    chapterMap.set(chapter.id, chapter);
  });

  chapterDocs.forEach((chapterDoc) => {
    const existing = chapterMap.get(chapterDoc.id);
    chapterMap.set(chapterDoc.id, {
      ...existing,
      ...chapterDoc,
      id: chapterDoc.id,
      title: chapterDoc.title ?? existing?.title ?? "Untitled Chapter",
    });
  });

  return Array.from(chapterMap.values());
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
  return (async () => {
    const units = await fetchUnitDocs(subjectSlug, subject);

    const perUnitItems = await Promise.all(
      units.map(async (unit, unitIndex) => {
        const chapterDocs = await fetchChapterDocs(subjectSlug, unit.id);
        const chapters = mergeChapters(unit.chapters, chapterDocs);

        return chapters
          .filter((chapter) => isChapterVisible(chapter, canPreview))
          .map((chapter) => {
            let indexedContent: unknown = chapter.content;
            if (!hasIndexedContent(indexedContent)) {
              const chapterDocMatch = chapterDocs.find((docItem) => docItem.id === chapter.id);
              indexedContent = chapterDocMatch?.content;
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
          });
      }),
    );

    return perUnitItems.flat();
  })();
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
      try {
        return await mapSubjectToSearchItems(
          subjectDoc.id,
          subjectData,
          canPreview,
        );
      } catch (error) {
        console.error(`Failed building search index for ${subjectDoc.id}`, error);
        return [];
      }
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
