/** Normalize API file paths to browser-usable URLs via the BFF media stream. */
export function resolveFileUrl(filePath?: string | null): string | null {
  if (!filePath || filePath === "#") return null;

  if (/^https?:\/\//i.test(filePath)) {
    try {
      const url = new URL(filePath);
      filePath = `${url.pathname}${url.search}`;
    } catch {
      return filePath;
    }
  }

  if (filePath.startsWith("/bff/")) {
    return filePath;
  }

  if (!filePath.startsWith("/")) {
    filePath = `/${filePath}`;
  }

  // Serve through BFF → backend /api/media/stream/ (works in dev + prod without nginx /media/)
  if (filePath.startsWith("/media/")) {
    return `/bff/media/stream/${filePath.slice("/media/".length)}`;
  }

  return filePath;
}

/** @deprecated Use resolveFileUrl — kept for callers expecting this name. */
export const getPublicFileUrl = resolveFileUrl;

export function extractFileName(filePath?: string | null): string {
  if (!filePath) return "Document";
  const normalized = resolveFileUrl(filePath) ?? filePath;
  const withoutQuery = normalized.split("?")[0] ?? normalized;
  const segment = withoutQuery.split("/").pop();
  return segment || "Document";
}
