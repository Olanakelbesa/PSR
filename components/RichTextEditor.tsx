"use client";

import React, { useMemo } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CharacterCount from "@tiptap/extension-character-count";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Minus,
  Link as LinkIcon,
  Highlighter,
  CheckSquare,
  Eraser,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * BEST PRACTICE: Separate Toolbar Component
 */
const Toolbar = ({ editor }: { editor: any }) => {
  const states = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) return null;
      return {
        bold: ctx.editor.isActive("bold"),
        italic: ctx.editor.isActive("italic"),
        underline: ctx.editor.isActive("underline"),
        strike: ctx.editor.isActive("strike"),
        highlight: ctx.editor.isActive("highlight"),
        code: ctx.editor.isActive("code"),
        h1: ctx.editor.isActive("heading", { level: 1 }),
        h2: ctx.editor.isActive("heading", { level: 2 }),
        h3: ctx.editor.isActive("heading", { level: 3 }),
        left: ctx.editor.isActive({ textAlign: "left" }),
        center: ctx.editor.isActive({ textAlign: "center" }),
        right: ctx.editor.isActive({ textAlign: "right" }),
        justify: ctx.editor.isActive({ textAlign: "justify" }),
        bulletList: ctx.editor.isActive("bulletList"),
        orderedList: ctx.editor.isActive("orderedList"),
        taskList: ctx.editor.isActive("taskList"),
        blockquote: ctx.editor.isActive("blockquote"),
        link: ctx.editor.isActive("link"),
      };
    },
  });

  if (!editor || !states) return null;

  const setLink = () => {
    const url = window.prompt("Enter the URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-1 border-b bg-muted/40 sticky top-0 z-10 backdrop-blur-sm transition-colors group-focus-within:bg-muted/60">
      <TooltipProvider delayDuration={400}>
        <div className="flex items-center gap-0.5">
          <ToolbarToggle
            pressed={states.bold}
            onClick={() => editor.chain().focus().toggleBold().run()}
            icon={Bold}
            tooltip="Bold (Ctrl+B)"
          />
          <ToolbarToggle
            pressed={states.italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            icon={Italic}
            tooltip="Italic (Ctrl+I)"
          />
          <ToolbarToggle
            pressed={states.underline}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            icon={UnderlineIcon}
            tooltip="Underline (Ctrl+U)"
          />
          <ToolbarToggle
            pressed={states.strike}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            icon={Strikethrough}
            tooltip="Strikethrough"
          />
          <ToolbarToggle
            pressed={states.highlight}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            icon={Highlighter}
            tooltip="Highlight"
          />
          <ToolbarToggle
            pressed={states.code}
            onClick={() => editor.chain().focus().toggleCode().run()}
            icon={Code}
            tooltip="Code"
          />
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex items-center gap-0.5">
          <ToolbarToggle
            pressed={states.h1}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            icon={Heading1}
            tooltip="Heading 1"
          />
          <ToolbarToggle
            pressed={states.h2}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            icon={Heading2}
            tooltip="Heading 2"
          />
          <ToolbarToggle
            pressed={states.h3}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            icon={Heading3}
            tooltip="Heading 3"
          />
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex items-center gap-0.5">
          <ToolbarToggle
            pressed={states.left}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            icon={AlignLeft}
            tooltip="Align Left"
          />
          <ToolbarToggle
            pressed={states.center}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            icon={AlignCenter}
            tooltip="Align Center"
          />
          <ToolbarToggle
            pressed={states.right}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            icon={AlignRight}
            tooltip="Align Right"
          />
          <ToolbarToggle
            pressed={states.justify}
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            icon={AlignJustify}
            tooltip="Align Justify"
          />
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex items-center gap-0.5">
          <ToolbarToggle
            pressed={states.bulletList}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            icon={List}
            tooltip="Bullet List"
          />
          <ToolbarToggle
            pressed={states.orderedList}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            icon={ListOrdered}
            tooltip="Ordered List"
          />
          <ToolbarToggle
            pressed={states.taskList}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            icon={CheckSquare}
            tooltip="Task List"
          />
          <ToolbarToggle
            pressed={states.blockquote}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            icon={Quote}
            tooltip="Blockquote"
          />
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/5"
            onClick={setLink}
            data-state={states.link ? "on" : "off"}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/5"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-primary/5"
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
      </TooltipProvider>
    </div>
  );
};

/**
 * Reusable Toolbar Toggle Component
 */
const ToolbarToggle = ({
  pressed,
  onClick,
  icon: Icon,
  tooltip,
}: {
  pressed: boolean;
  onClick: () => void;
  icon: any;
  tooltip: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Toggle
        type="button"
        size="sm"
        pressed={pressed}
        onClick={onClick}
        className="h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm transition-all"
      >
        <Icon className="h-4 w-4" />
      </Toggle>
    </TooltipTrigger>
    <TooltipContent>{tooltip}</TooltipContent>
  </Tooltip>
);

/**
 * MAIN COMPONENT
 */
export default function RichTextEditor({
  content = "<p></p>",
  onChange,
  onBlur,
  placeholder = "Write something amazing...",
}: {
  content?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}) {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-primary underline cursor-pointer hover:text-primary/80 transition-colors",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
    ],
    [placeholder],
  );

  const editor = useEditor({
    extensions,
    content,
    autofocus: "end",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert focus:outline-none",
          "min-h-[300px] max-w-none p-5 text-base leading-relaxed",
          "prose-headings:font-bold prose-p:text-foreground/90",
          "prose-blockquote:border-l-4 prose-blockquote:border-primary/20 prose-blockquote:pl-4 prose-blockquote:italic",
          "prose-ul:list-disc prose-ul:pl-5",
          "prose-ol:list-decimal prose-ol:pl-5",
          "prose-li:my-0.5",
          "prose-li:marker:text-primary prose-li:marker:font-bold",
          "selection:bg-primary/20",
        ),
      },
    },
  });

  // Sync content from parent only if not focused
  React.useEffect(() => {
    if (!editor || content === undefined || editor.isFocused) return;
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  return (
    <div className="border rounded-xl overflow-hidden shadow-md bg-background/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all duration-300 group">
      <Toolbar editor={editor} />
      <div className="relative overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
