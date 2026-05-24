"use client";

import DOMPurify from "dompurify";

interface HtmlContentRendererProps {
  content: string | undefined | null;
  maxHeight?: number;
  showFullContent?: boolean;
  maxLines?: number; // New prop for line clamping
}

export function HtmlContentRenderer({
  content,
  maxHeight = 400,
  showFullContent = false,
  maxLines,
}: HtmlContentRendererProps) {
  if (!content || content.trim() === "") {
    return <p className="text-sm text-muted-foreground">Not provided</p>;
  }

  const heightClass =
    showFullContent || maxLines
      ? ""
      : maxHeight === 200
        ? "max-h-[200px]"
        : maxHeight === 300
          ? "max-h-[300px]"
          : "max-h-[400px]";

  const overflowClass = showFullContent
    ? ""
    : maxLines
      ? "overflow-hidden"
      : "overflow-y-auto";

  // Line clamp classes for truncated preview mode
  const lineClampClass = maxLines
    ? maxLines === 2
      ? "line-clamp-2"
      : maxLines === 3
        ? "line-clamp-3"
        : maxLines === 4
          ? "line-clamp-4"
          : maxLines === 5
            ? "line-clamp-5"
            : ""
    : "";

  // Process HTML to add table borders if not present
  const processedContent = content
    .replace(/<table([^>]*)>/gi, (match, attributes) => {
      // Add border-collapse and border styles if not present
      if (attributes && attributes.includes("style=")) {
        // Add border to existing style
        return match.replace(/style="([^"]*)"/i, (styleMatch, styleContent) => {
          if (!styleContent.includes("border")) {
            return `style="${styleContent}; border: 1px solid #e5e7eb; border-collapse: collapse;"`;
          }
          return styleMatch;
        });
      }
      // Add style attribute with borders
      return `<table${attributes} style="border: 1px solid #e5e7eb; border-collapse: collapse; width: 100%;">`;
    })
    // Add borders to table cells (td) if not present
    .replace(/<td([^>]*)>/gi, (match, attributes) => {
      if (attributes && attributes.includes("style=")) {
        return match.replace(/style="([^"]*)"/i, (styleMatch, styleContent) => {
          if (!styleContent.includes("border")) {
            return `style="${styleContent}; border: 1px solid #e5e7eb; padding: 8px;"`;
          }
          return styleMatch;
        });
      }
      return `<td${attributes} style="border: 1px solid #e5e7eb; padding: 8px;">`;
    })
    // Add borders to table header cells (th) if not present
    .replace(/<th([^>]*)>/gi, (match, attributes) => {
      if (attributes && attributes.includes("style=")) {
        return match.replace(/style="([^"]*)"/i, (styleMatch, styleContent) => {
          if (!styleContent.includes("border")) {
            return `style="${styleContent}; border: 1px solid #e5e7eb; padding: 8px;"`;
          }
          return styleMatch;
        });
      }
      return `<th${attributes} style="border: 1px solid #e5e7eb; padding: 8px;">`;
    });

  return (
    <div
      className={`${heightClass} ${overflowClass} ${
        showFullContent || maxLines ? "" : "pr-2"
      }`}
    >
      <style>{`
        .prose table {
          border-collapse: collapse !important;
          width: 100%;
          margin: 1.5rem 0;
        }
        .prose table td,
        .prose table th {
          border: 1px solid #e5e7eb !important;
          padding: 12px;
          text-align: left;
        }
        .prose table th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        .html-content h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.3;
        }
        .html-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 0.875rem;
          line-height: 1.4;
        }
        .html-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.5;
        }
        .html-content h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.625rem;
          line-height: 1.5;
        }
        .html-content h5 {
          font-size: 1rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        .html-content h6 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        .html-content p {
          margin-bottom: 1rem;
          line-height: 1.75;
        }
        .html-content ul,
        .html-content ol {
          margin-top: 0.75rem;
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        .html-content ul {
          list-style-type: disc;
        }
        .html-content ol {
          list-style-type: decimal;
        }
        .html-content li {
          margin-bottom: 0.5rem;
          line-height: 1.75;
        }
        .html-content ul ul,
        .html-content ul ol,
        .html-content ol ul,
        .html-content ol ol {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .html-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #6b7280;
        }
        .html-content pre {
          background-color: #f9fafb;
          border-radius: 0.375rem;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
        }
        .html-content code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-family: monospace;
        }
        .html-content pre code {
          background-color: transparent;
          padding: 0;
        }
        .html-content a {
          color: #3b82f6;
          text-decoration: underline;
          text-decoration-color: #93c5fd;
          transition: all 0.2s;
        }
        .html-content a:hover {
          color: #2563eb;
          text-decoration-color: #3b82f6;
        }
        .html-content strong,
        .html-content b {
          font-weight: 600;
        }
        .html-content em,
        .html-content i {
          font-style: italic;
        }
        .html-content hr {
          border: 0;
          border-top: 1px solid #e5e7eb;
          margin: 2rem 0;
        }
        .html-content img {
          max-width: 100%;
          height: auto;
          margin: 1.5rem 0;
          border-radius: 0.5rem;
        }
        /* First element top margin removal */
        .html-content > *:first-child {
          margin-top: 0 !important;
        }
        /* Last element bottom margin removal */
        .html-content > *:last-child {
          margin-bottom: 0 !important;
        }
        /* Compact styles for truncated mode */
        .html-content-compact p {
          margin-bottom: 0.25rem;
          line-height: 1.6;
        }
        .html-content-compact h1,
        .html-content-compact h2,
        .html-content-compact h3,
        .html-content-compact h4,
        .html-content-compact h5,
        .html-content-compact h6 {
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .html-content-compact ul,
        .html-content-compact ol {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        .html-content-compact li {
          margin-bottom: 0.25rem;
        }
      `}</style>
      <div
        className={`html-content ${
          maxLines ? "html-content-compact" : ""
        } text-sm text-foreground prose prose-sm max-w-none ${lineClampClass}`}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(processedContent, {
            ADD_ATTR: ["style"],
            FORBID_TAGS: ["script", "iframe", "object", "embed", "link", "meta"],
          }),
        }}
      />
    </div>
  );
}
