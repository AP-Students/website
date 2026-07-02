import type { OutputData } from "@editorjs/editorjs";
import { env } from "@/env.js";

/**
 * Server-side helpers for reading public subject data via the Firestore REST
 * API. The app otherwise talks to Firestore through the client SDK, but route
 * handlers like `sitemap.ts` and server `generateMetadata` run before hydration
 * and need a dependency-free way to read the publicly readable `subjects`
 * collection (`allow read: if true` in firestore.rules).
 */

const PROJECT_ID = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = env.NEXT_PUBLIC_FIREBASE_API_KEY;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Cache for a day; subject structure changes rarely.
const REVALIDATE_SECONDS = 86_400;

interface RestValue {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  nullValue?: null;
  timestampValue?: string;
  arrayValue?: { values?: RestValue[] };
  mapValue?: { fields?: Record<string, RestValue> };
}

interface RestDocument {
  name: string;
  fields?: Record<string, RestValue>;
}

function parseValue(value: RestValue): unknown {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(parseValue);
  if (value.mapValue) return parseFields(value.mapValue.fields ?? {});
  return null;
}

function parseFields(
  fields: Record<string, RestValue>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = parseValue(value);
  }
  return out;
}

export interface SitemapChapter {
  id: string;
  title: string;
  isPublic?: boolean;
}

export interface SitemapUnit {
  id: string;
  title: string;
  chapters: SitemapChapter[];
}

export interface SitemapSubject {
  slug: string;
  title: string;
  units: SitemapUnit[];
}

/**
 * Returns every subject with its embedded units and chapters. Falls back to an
 * empty array on any failure so callers (e.g. the sitemap) still render their
 * static entries instead of crashing the build.
 */
export async function getAllSubjects(): Promise<SitemapSubject[]> {
  try {
    const res = await fetch(`${BASE}/subjects?pageSize=300&key=${API_KEY}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { documents?: RestDocument[] };
    return (data.documents ?? []).map((doc) => {
      const slug = doc.name.split("/").pop() ?? "";
      const fields = parseFields(doc.fields ?? {});
      return {
        slug,
        title: typeof fields.title === "string" ? fields.title : slug,
        units: (Array.isArray(fields.units)
          ? fields.units
          : []) as SitemapUnit[],
      };
    });
  } catch {
    return [];
  }
}

/** Returns a single subject (title + embedded units), or null on failure. */
export async function getSubject(slug: string): Promise<SitemapSubject | null> {
  try {
    const res = await fetch(`${BASE}/subjects/${slug}?key=${API_KEY}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as RestDocument;
    const fields = parseFields(data.fields ?? {});
    return {
      slug,
      title: typeof fields.title === "string" ? fields.title : slug,
      units: (Array.isArray(fields.units) ? fields.units : []) as SitemapUnit[],
    };
  } catch {
    return null;
  }
}

/** Returns a single subject's display title, or null if it can't be read. */
export async function getSubjectTitle(slug: string): Promise<string | null> {
  return (await getSubject(slug))?.title ?? null;
}

export interface ChapterContent {
  data: OutputData;
  author: string;
  displayName: string;
  title: string;
}

/**
 * Firestore stores table block content as a map (`{ row0: [...], row1: [...] }`)
 * because nested arrays aren't allowed. EditorJS expects an array of rows, so
 * convert every table block back. Mirrors `revertTableObjectToArray`, but kept
 * here so this server module doesn't import the client-only article helpers.
 */
function revertTableBlocks(data: OutputData): void {
  for (const block of data.blocks ?? []) {
    if (block.type !== "table") continue;
    const blockData = block.data as { content?: unknown };
    const content = blockData.content;
    if (content && typeof content === "object" && !Array.isArray(content)) {
      const rows = content as Record<string, unknown>;
      blockData.content = Object.keys(rows)
        .sort()
        .map((key) => rows[key]);
    }
  }
}

/**
 * Reads a single chapter's content document via the Firestore REST API. The
 * `chapters` rule allows unauthenticated reads only when `isPublic == true`, so a
 * successful read here means the chapter is public and safe to server-render;
 * gated chapters return 403 and this resolves to `null`. Doc-id mapping mirrors
 * the client `useFetchAndCache` hook.
 */
export async function getChapterContent(
  slug: string,
  unitParam: string,
  idParam: string,
): Promise<ChapterContent | null> {
  try {
    const unitId = unitParam.split("-").at(-1);
    const chapterId = idParam.split("-").slice(0, 2).join("-");
    if (!unitId || !chapterId) return null;

    const res = await fetch(
      `${BASE}/subjects/${slug}/units/${unitId}/chapters/${chapterId}?key=${API_KEY}`,
      { next: { revalidate: REVALIDATE_SECONDS } },
    );
    if (!res.ok) return null;

    const doc = (await res.json()) as RestDocument;
    const fields = parseFields(doc.fields ?? {});
    const data = fields.data as OutputData | undefined;
    if (!data || !Array.isArray(data.blocks)) return null;

    revertTableBlocks(data);

    return {
      data,
      author: typeof fields.author === "string" ? fields.author : "",
      displayName:
        typeof fields.displayName === "string" ? fields.displayName : "",
      title: typeof fields.title === "string" ? fields.title : "",
    };
  } catch {
    return null;
  }
}