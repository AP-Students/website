/** EditorJS uses row arrays; Firestore requires a map between nested arrays. */
export function storeChapterTables<T>(chapter: T): T {
  return transformTables(chapter, false);
}

export function restoreChapterTables<T>(chapter: T): T {
  return transformTables(chapter, true);
}

function transformTables<T>(chapter: T, restore: boolean): T {
  if (!chapter || typeof chapter !== "object" || !("blocks" in chapter) || !Array.isArray(chapter.blocks)) return chapter;
  return { ...chapter, blocks: chapter.blocks.map((block: unknown) => {
    if (!block || typeof block !== "object" || !("type" in block) || block.type !== "table" || !("data" in block) || !block.data || typeof block.data !== "object") return block;
    const data = block.data as Record<string, unknown>;
    const rows = data.content;
    let content = rows;
    if (!restore && Array.isArray(rows)) content = Object.fromEntries(rows.map((row: unknown, index: number) => [`row${index}`, row]));
    if (restore && rows && typeof rows === "object" && !Array.isArray(rows)) {
      content = Object.entries(rows as Record<string, unknown>).sort(([a], [b]) => Number(a.replace(/^row/, "")) - Number(b.replace(/^row/, ""))).map(([, row]) => row);
    }
    return { ...block, data: { ...data, content } };
  }) };
}
