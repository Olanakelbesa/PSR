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

  // Bare media-relative paths (e.g. final_outputs/reports/file.pdf)
  if (
    filePath.startsWith("/final_outputs/") ||
    filePath.startsWith("/registered_policies/") ||
    filePath.startsWith("/drafts/") ||
    filePath.startsWith("/attachments/")
  ) {
    return `/bff/media/stream/${filePath.slice(1)}`;
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

/** Fetch a proxied file and trigger a browser download (works with BFF media URLs). */
export async function downloadRemoteFile(
  filePath?: string | null,
  filename?: string,
  options?: { token?: string | null },
): Promise<void> {
  const url = resolveFileUrl(filePath);
  if (!url) {
    throw new Error("File URL is unavailable.");
  }

  const headers: HeadersInit = {};
  const token = options?.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error("Failed to download file.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename || extractFileName(filePath);
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Fetch a proxied file and open it in a new tab (works with BFF media URLs). */
export async function openRemoteFile(
  filePath?: string | null,
  options?: { token?: string | null },
): Promise<void> {
  const url = resolveFileUrl(filePath);
  if (!url) {
    throw new Error("File URL is unavailable.");
  }

  const headers: HeadersInit = {};
  const token = options?.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error("Failed to open file.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("Pop-up blocked. Allow pop-ups to open this file.");
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
