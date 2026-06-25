import { useEffect, type ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold, Italic, List, ListOrdered, Redo2, Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  disabled?: boolean;
};

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      className="size-8 cursor-pointer"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write something...",
  className,
  editorClassName,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "min-h-28 px-3 py-2 text-sm focus:outline-none prose prose-sm dark:prose-invert max-w-none",
          "[&_p.is-editor-empty:first-child]:before:text-muted-foreground [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:pointer-events-none",
          editorClassName,
        ),
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = editor.getHTML();
    const next = value || "";

    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("rounded-md border bg-background", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <div className="mx-1 h-6 w-px bg-border" />
        <ToolbarButton
          label="Undo"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="size-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export function isRichTextEmpty(value?: string | null): boolean {
  if (!value) {
    return true;
  }

  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();

  return text.length === 0;
}

export function RichTextContent({
  html,
  className,
}: {
  html?: string | null;
  className?: string;
}) {
  if (isRichTextEmpty(html)) {
    return null;
  }

  return (
    <div
      className={cn("prose prose-sm dark:prose-invert max-w-none text-sm", className)}
      dangerouslySetInnerHTML={{ __html: html ?? "" }}
    />
  );
}
