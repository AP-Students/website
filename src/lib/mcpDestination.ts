/** Destination checks shared by MCP ingestion, publication and asset access. */
export function contentCollection(contentType: unknown): "chapters" | "tests" | "frqs" | null {
  switch (contentType) {
    case "chapter": return "chapters";
    case "test": return "tests";
    case "frq": return "frqs";
    default: return null;
  }
}

type Destination = {
  subjectSlug?: unknown;
  unitId?: unknown;
  contentId?: unknown;
  baseRevisionId?: unknown;
  mode?: unknown;
};

function isDocumentId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && !value.includes("/") && value !== "." && value !== "..";
}

export function destinationError(destination: Destination): string | null {
  if (!isDocumentId(destination.subjectSlug) || !isDocumentId(destination.unitId)) return "Valid existing subjectSlug and unitId are required.";
  if (destination.mode !== undefined && destination.mode !== "create" && destination.mode !== "update") return "Destination mode must be create or update.";
  if (destination.mode === "update") {
    if (!isDocumentId(destination.contentId)) return "Update imports require the existing contentId.";
    if (!isDocumentId(destination.baseRevisionId)) return "Update imports require the baseRevisionId.";
  } else if (destination.contentId != null && !isDocumentId(destination.contentId)) {
    return "contentId must be a valid document ID.";
  }
  return null;
}

export function publishedContentPath(contentType: unknown, destination: Destination): string | null {
  const collection = contentCollection(contentType);
  if (!collection || !isDocumentId(destination.subjectSlug) || !isDocumentId(destination.unitId) || !isDocumentId(destination.contentId)) return null;
  return `subjects/${destination.subjectSlug}/units/${destination.unitId}/${collection}/${destination.contentId}`;
}
