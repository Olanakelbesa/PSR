import { toast } from "sonner";

/**
 * Safely downloads a file by pre-checking headers and content-type.
 * If the file is missing or returns Django traceback HTML (text/html),
 * it displays a clean toast instead of navigating or downloading HTML.
 */
export async function safeDownloadFile(url: string, defaultFileName: string = "download") {
  if (!url) {
    toast.error("Invalid File URL", { description: "No document URL was provided." });
    return;
  }

  const safeUrl = encodeURI(url);

  try {
    const res = await fetch(safeUrl);
    const contentType = res.headers.get("content-type") || "";

    if (!res.ok || contentType.includes("text/html")) {
      toast.error("Document Unavailable", {
        description: "The requested file is missing or unavailable on server storage.",
      });
      return;
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = defaultFileName;
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch {
    toast.error("Download Error", {
      description: "Could not connect to document server to download file.",
    });
  }
}
