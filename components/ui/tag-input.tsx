"use client";

import React, { useState, useRef, KeyboardEvent } from "react";

type TagInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
};

export default function TagInput({
  tags,
  onChange,
  placeholder,
  className,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  function addTag(v: string) {
    const next = v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (next.length === 0) return;
    const merged = Array.from(new Set([...tags, ...next]));
    onChange(merged);
    setInput("");
    inputRef.current?.focus();
  }

  function removeTag(index: number) {
    const next = tags.filter((_, i) => i !== index);
    onChange(next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim() !== "") addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length) {
      // remove last
      removeTag(tags.length - 1);
    }
  }

  return (
    <div className={className}>
      <div className="w-full">
        <div className="rounded-md border border-input px-3 py-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => {
              if (input.trim() !== "") addTag(input);
            }}
            placeholder={placeholder}
            className="w-full bg-transparent outline-none text-sm"
            aria-label="Add keyword"
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span
              key={tag + i}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm"
            >
              <span className="truncate max-w-50">{tag}</span>
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeTag(i)}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
