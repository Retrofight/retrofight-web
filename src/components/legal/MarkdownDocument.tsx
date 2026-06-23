import type { ReactNode } from "react";

type MarkdownDocumentProps = {
  markdown: string;
};

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

export function MarkdownDocument({ markdown }: MarkdownDocumentProps) {
  const blocks = parseMarkdown(markdown);

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        if (block.type === "heading" && block.level === 1) {
          return (
            <h1
              key={index}
              className="font-display text-4xl font-black uppercase italic tracking-normal text-white sm:text-5xl"
            >
              {block.text}
            </h1>
          );
        }

        if (block.type === "heading") {
          return (
            <h2
              key={index}
              className="pt-4 font-display text-2xl font-black uppercase italic tracking-normal text-white"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={index} className="space-y-3 text-zinc-300">
              {block.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand-purple-500" />
                  <span>{renderInlineMarkdown(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="text-base leading-relaxed text-zinc-300">
            {renderInlineMarkdown(block.text)}
          </p>
        );
      })}
    </div>
  );
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.split(/\r?\n/);
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push({ type: "heading", level: 2, text: trimmed.slice(3) });
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      blocks.push({ type: "heading", level: 1, text: trimmed.slice(2) });
      return;
    }

    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      return;
    }

    flushList();
    blocks.push({ type: "paragraph", text: trimmed });
  });

  flushList();
  return blocks;
}

function renderInlineMarkdown(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const [, label, href] = match;
    parts.push(
      <a
        key={`${href}-${match.index}`}
        href={href}
        className="font-semibold text-brand-purple-300 underline-offset-4 transition hover:text-white hover:underline"
      >
        {label}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
