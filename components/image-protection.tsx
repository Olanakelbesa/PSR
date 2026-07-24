"use client";

import { useEffect } from "react";

const MEDIA_SELECTOR = "img, video, picture, canvas, [data-image-protected]";

function isMediaElement(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  return !!el.closest(MEDIA_SELECTOR);
}

export function ImageProtection() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      if (isMediaElement(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onDragStart = (e: DragEvent) => {
      if (isMediaElement(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2 && isMediaElement(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "s" || e.key === "S" || e.key === "u" || e.key === "U")
      ) {
        if (isMediaElement(document.activeElement)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("dragstart", onDragStart, true);
    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("dragstart", onDragStart, true);
      document.removeEventListener("mousedown", onMouseDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return null;
}
