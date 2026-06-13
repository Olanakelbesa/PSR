/** Normalize API file paths to same-origin browser URLs. */
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

  if (filePath.startsWith("/bff/media/stream/")) {
    return `/media/${filePath.slice("/bff/media/stream/".length)}`;
  }

  if (filePath.startsWith("/bff/media/")) {
    return filePath.slice("/bff".length);
  }

  if (filePath.startsWith("/bff/")) {
    return filePath.slice("/bff".length);
  }

  if (!filePath.startsWith("/")) {
    filePath = `/${filePath}`;
  }

  return filePath;
}

/** @deprecated Use resolveFileUrl — kept for callers expecting this name. */
export const getPublicFileUrl = resolveFileUrl;

export function extractFileName(filePath?: string | null): string {
  if (!filePath) return "Document";
  const normalized = resolveFileUrl(filePath) ?? filePath;
  const segment = normalized.split("/").pop();
  return segment || "Document";
}
