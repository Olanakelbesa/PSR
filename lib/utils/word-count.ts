import { MAX_CONCEPT_NOTE_SUMMARY_WORDS } from "@/lib/constants";

/** Fixed ~2-page editor: scroll inside the box instead of growing with content. */
export const CONCEPT_NOTE_SUMMARY_TEXTAREA_CLASS =
  "h-72 max-h-72 field-sizing-fixed resize-none overflow-y-auto overflow-x-hidden leading-6";

/** Fixed-height read-only summary panel for detail/review views. */
export const CONCEPT_NOTE_SUMMARY_PANEL_CLASS =
  "max-h-72 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap";

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function getSummaryWordCountStatus(
  wordCount: number,
  maxWords: number = MAX_CONCEPT_NOTE_SUMMARY_WORDS,
) {
  const isOverLimit = wordCount > maxWords;
  const overBy = wordCount - maxWords;
  const remaining = Math.max(0, maxWords - wordCount);

  return {
    isOverLimit,
    badgeLabel: `${wordCount} words`,
    hintLabel: isOverLimit
      ? `${overBy} word${overBy === 1 ? "" : "s"} over the ~2-page limit (${maxWords} words)`
      : `${remaining} word${remaining === 1 ? "" : "s"} remaining`,
  };
}
