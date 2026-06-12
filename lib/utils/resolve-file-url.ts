/** Resolve backend file URLs for authenticated viewing through the BFF proxy. */
export function resolveFileUrl(filePath?: string | null): string | null {
  if (!filePath || filePath === "#") return null;
  if (filePath.startsWith("/bff")) return filePath;

  if (/^https?:\/\//i.test(filePath)) {
    try {
      const url = new URL(filePath);
      return `/bff${url.pathname}${url.search}`;
    } catch {
      return filePath;
    }
  }

  if (filePath.startsWith("/")) return `/bff${filePath}`;
  return `/bff/${filePath}`;
}

export function extractFileName(filePath?: string | null): string {
  if (!filePath) return "Document";
  const segment = filePath.split("/").pop();
  return segment || "Document";
}
