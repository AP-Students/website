import { collection, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { formatSlug } from "@/lib/utils";
import { type Chapter, type Subject, type Unit } from "@/types/firestore";

const SEARCH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SEARCH_CACHE_KEY_PREFIX = "guide-search-index-v10";

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
  chapterBodyText: string;
};

export type GuideSearchCache = {
  timestamp: number;
  items: GuideChapterSearchItem[];
};

const getCacheKey = (canPreview: boolean) =>
  `${SEARCH_CACHE_KEY_PREFIX}:${canPreview ? "preview" : "public"}`;

const normalizeSearchText = (text: unknown) =>
  String(text ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035`'"“”]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

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

type ChapterDocPayload = Chapter & {
  data?: unknown;
  content?: unknown;
};

const fetchUnitDocs = async (subjectSlug: string, subject: Subject) => {
  const fallbackUnits = subject.units ?? [];

  // Keep canonical routing IDs from subject doc when available.
  if (fallbackUnits.length > 0) {
    return fallbackUnits;
  }

  try {
    const unitsSnapshot = await getDocs(
      collection(db, "subjects", subjectSlug, "units"),
    );

    if (unitsSnapshot.empty) {
      return fallbackUnits;
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
    return fallbackUnits;
  }
};

const fetchChapterDocs = async (subjectSlug: string, unitId: string) => {
  try {
    const chaptersSnapshot = await getDocs(
      collection(db, "subjects", subjectSlug, "units", unitId, "chapters"),
    );

    return chaptersSnapshot.docs.map((chapterDoc) => {
      const chapterData = chapterDoc.data() as ChapterDocPayload;
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

const getChapterIdCandidates = (chapterId: string) => {
  const shortId = chapterId.split("-").slice(0, 2).join("-");
  return Array.from(new Set([chapterId, shortId])).filter(Boolean);
};

const findChapterDocMatch = (
  chapterDocs: ChapterDocPayload[],
  chapterId: string,
) => {
  const candidates = getChapterIdCandidates(chapterId);
  for (const candidate of candidates) {
    const match = chapterDocs.find((docItem) => docItem.id === candidate);
    if (match) {
      return match;
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

const parseUnitNumberFromTitle = (unitTitle?: string) => {
  if (!unitTitle) {
    return null;
  }

  const match = unitTitle.match(/unit\s*(\d+)/i);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return parsed - 1;
};

const resolveUnitIndex = (
  subject: Subject,
  unit: Unit,
  chapterId: string,
  fallbackUnitIndex: number,
) => {
  const chapterUnitIndex = (subject.units ?? []).findIndex((candidate) =>
    (candidate.chapters ?? []).some((chapter) => chapter.id === chapterId),
  );

  if (chapterUnitIndex >= 0) {
    return chapterUnitIndex;
  }

  const canonicalUnitIndex = (subject.units ?? []).findIndex(
    (candidate) => candidate.id === unit.id,
  );

  if (canonicalUnitIndex >= 0) {
    return canonicalUnitIndex;
  }

  const parsedTitleIndex = parseUnitNumberFromTitle(unit.title);
  if (parsedTitleIndex != null) {
    return parsedTitleIndex;
  }

  return fallbackUnitIndex;
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
        const chapterDocs = canPreview
          ? await fetchChapterDocs(subjectSlug, unit.id)
          : [];

        return (unit.chapters ?? [])
          .filter((chapter) => isChapterVisible(chapter, canPreview))
          .map((chapter) => {
            const resolvedUnitIndex = resolveUnitIndex(
              subject,
              unit,
              chapter.id,
              unitIndex,
            );

            let indexedContent: unknown = chapter.content;
            if (!hasIndexedContent(indexedContent)) {
              const chapterDocMatch = findChapterDocMatch(
                chapterDocs,
                chapter.id,
              );
              indexedContent =
                chapterDocMatch?.data ?? chapterDocMatch?.content ?? null;
            }

            return {
              subjectSlug,
              subjectTitle: subject.title,
              unitId: unit.id,
              unitIndex: resolvedUnitIndex,
              unitTitle: unit.title,
              chapterId: chapter.id,
              chapterTitle: chapter.title,
              chapterPath: buildChapterPath({
                subjectSlug,
                unitIndex: resolvedUnitIndex,
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
              chapterBodyText: collectText(indexedContent)
                .join(" ")
                .replace(/\s+/g, " ")
                .trim(),
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

export const searchGuideChapters = (
  items: GuideChapterSearchItem[],
  query: string,
  maxResults = 5,
): GuideChapterSearchItem[] => {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  const countOccurrences = (text: string, token: string) => {
    if (!text || !token) {
      return 0;
    }

    let count = 0;
    let index = 0;

    while (index <= text.length - token.length) {
      const found = text.indexOf(token, index);
      if (found === -1) {
        break;
      }

      count += 1;
      index = found + token.length;
    }

    return count;
  };

  const scoredItems = items
    .map((item) => {
      const normalizedTitle = normalizeSearchText(item.chapterTitle);
      const normalizedBody = normalizeSearchText(item.chapterBodyText);
      const titleCount = countOccurrences(normalizedTitle, normalizedQuery);
      const bodyCount = countOccurrences(normalizedBody, normalizedQuery);

      return {
        item,
        titleMatch: titleCount > 0,
        titleCount,
        bodyCount,
      };
    })
    .filter((entry) => entry.titleMatch || entry.bodyCount > 0);

  const sortByCount = (
    left: {
      item: GuideChapterSearchItem;
      titleMatch: boolean;
      titleCount: number;
      bodyCount: number;
    },
    right: {
      item: GuideChapterSearchItem;
      titleMatch: boolean;
      titleCount: number;
      bodyCount: number;
    },
  ) => {
    return (
      right.titleCount - left.titleCount ||
      right.bodyCount - left.bodyCount ||
      compareSearchItems(left.item, right.item)
    );
  };

  const titleMatches = scoredItems.filter((entry) => entry.titleMatch).sort(sortByCount);
  const bodyOnlyMatches = scoredItems
    .filter((entry) => !entry.titleMatch)
    .sort(sortByCount);

  return [...titleMatches, ...bodyOnlyMatches]
    .slice(0, maxResults)
    .map((entry) => entry.item);
};
