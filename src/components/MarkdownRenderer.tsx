import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  const schema = useMemo(() => {
    return {
      ...defaultSchema,
      attributes: {
        ...(defaultSchema.attributes || {}),
        code: [
          ...(((defaultSchema.attributes || {}).code as Array<string | [string, string]>) || []),
          ["className"],
        ],
        span: [
          ...(((defaultSchema.attributes || {}).span as Array<string | [string, string]>) || []),
          ["className"],
        ],
      },
    };
  }, []);

  return (
    <div className={cn("markdown-body space-y-3 text-sm leading-relaxed text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, schema]]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const CodeBlock: NonNullable<Components["code"]> = ({ inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const language = typeof className === "string" ? className.replace("language-", "") : "";

  if (inline) {
    return (
      <code
        className={cn(
          "rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground/90",
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }

  const text = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.warn("code copy failed", error);
    }
  };

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-border bg-background/80 not-prose">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-border bg-background/90 px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="코드 복사"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? "복사됨" : "복사"}
      </button>
      <SyntaxHighlighter
        {...props}
        language={language || undefined}
        style={oneDark}
        PreTag="div"
        customStyle={{ margin: 0, background: "transparent", padding: "1rem" }}
        wrapLongLines
      >
        {text}
      </SyntaxHighlighter>
    </div>
  );
};

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-semibold text-foreground">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-6 text-xl font-semibold text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-5 text-lg font-semibold text-foreground">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-4 text-base font-semibold text-foreground">{children}</h4>,
  h5: ({ children }) => <h5 className="mt-4 text-sm font-semibold text-foreground">{children}</h5>,
  h6: ({ children }) => <h6 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</h6>,
  p: ({ children }) => <p className="text-sm leading-relaxed text-foreground">{children}</p>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline underline-offset-2"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/40 pl-3 text-sm italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: CodeBlock,
  hr: () => <hr className="my-4 border-border" />,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm text-foreground">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-border/60">{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border/60 last:border-0">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 align-top">{children}</td>,
};

export default MarkdownRenderer;
