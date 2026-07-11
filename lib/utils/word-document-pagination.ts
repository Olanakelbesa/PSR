/** US Letter content area: 11in page − 2×1in margins at 96dpi */
export const WORD_PAGE_INNER_WIDTH_PX = 624;
export const WORD_PAGE_CONTENT_HEIGHT_PX = 864;

/**
 * Splits mammoth HTML into fixed-height virtual pages by packing top-level blocks.
 */
export function paginateWordDocumentHtml(html: string): string[] {
  if (typeof document === "undefined") {
    return [html];
  }

  const sandbox = document.createElement("div");
  sandbox.style.cssText =
    "position:fixed;left:-10000px;top:0;pointer-events:none;visibility:hidden;";

  const source = document.createElement("div");
  source.className = "word-document-content word-document-content--measure";
  source.innerHTML = html;
  sandbox.appendChild(source);
  document.body.appendChild(sandbox);

  const blocks = Array.from(source.children) as HTMLElement[];
  if (blocks.length === 0) {
    document.body.removeChild(sandbox);
    return [html];
  }

  const pageMeasure = document.createElement("div");
  pageMeasure.className = "word-document-content word-document-content--measure";
  pageMeasure.style.width = `${WORD_PAGE_INNER_WIDTH_PX}px`;
  sandbox.appendChild(pageMeasure);

  const pages: string[] = [];
  let currentBlocks: string[] = [];

  for (const block of blocks) {
    const blockHtml = block.outerHTML;
    pageMeasure.insertAdjacentHTML("beforeend", blockHtml);

    if (
      pageMeasure.scrollHeight > WORD_PAGE_CONTENT_HEIGHT_PX &&
      currentBlocks.length > 0
    ) {
      pageMeasure.lastElementChild?.remove();
      pages.push(currentBlocks.join(""));
      currentBlocks = [blockHtml];
      pageMeasure.innerHTML = blockHtml;
    } else {
      currentBlocks.push(blockHtml);
    }
  }

  if (currentBlocks.length > 0) {
    pages.push(currentBlocks.join(""));
  }

  document.body.removeChild(sandbox);
  return pages.length > 0 ? pages : [html];
}
