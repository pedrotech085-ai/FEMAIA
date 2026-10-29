import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface MathMarkdownProps {
  content: string;
  compact?: boolean;
  /**
   * Utilisé à l'intérieur des éléments interactifs (<button>) pour garantir
   * un balisage HTML5 strictement valide (<span> au lieu de <div>/<p>).
   */
  inline?: boolean;
}

/**
 * Normalise les délimiteurs LaTeX générés par l'IA avant le rendu KaTeX :
 * 1. Convertit \[ ... \] en $$ ... $$ et \( ... \) en $ ... $ hors des blocs de code.
 * 2. Promeut automatiquement en bloc défilable ($$ ... $$) les formules en ligne $ ... $
 *    contenant des environnements matriciels ou multi-lignes (\begin{pmatrix}, \begin{cases}, etc.)
 *    afin d'éviter tout débordement horizontal sur écran mobile.
 */
function normalizeMathMarkdown(raw: string): string {
  if (!raw) return "";

  // Sépare les blocs de code ```...``` pour ne jamais altérer le code informatique
  const segments = raw.split(/(```[\s\S]*?```)/g);

  return segments
    .map((segment) => {
      if (segment.startsWith("```")) {
        return segment;
      }

      let normalized = segment
        // \[ ... \] -> $$ ... $$
        .replace(/\\\[([\s\S]*?)\\\]/g, (_match, expr: string) => {
          return `\n$$\n${expr.trim()}\n$$\n`;
        })
        // \( ... \) -> $ ... $
        .replace(/\\\(([\s\S]*?)\\\)/g, (_match, expr: string) => {
          return `$${expr.trim()}$`;
        });

      // Promeut les environnements matriciels/systèmes écrits par erreur entre simples $...$ vers $$...$$
      normalized = normalized.replace(
        /(^|[^$])\$([^$\n]*\\begin\{(?:matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|aligned|array|split)\}[\s\S]*?\\end\{(?:matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|aligned|array|split)\}[^$\n]*)\$(?!\$)/g,
        (_match, prefix: string, expr: string) => {
          return `${prefix}\n$$\n${expr.trim()}\n$$\n`;
        },
      );

      return normalized;
    })
    .join("");
}

/**
 * Rendu typographique académique combinant Markdown structuré (GFM) et formules scientifiques KaTeX ($...$ et $$...$$).
 * - Désactive le mode strict KaTeX afin d'accepter les caractères accentués français sans générer d'avertissements console.
 * - Sépare proprement <pre> et <code> pour éviter toute imbrication invalide <pre><pre> en React 19.
 * - Confine strictement chaque bloc mathématique, tableau et paragraphe pour zéro débordement horizontal sur mobile.
 */
export function MathMarkdown({ content, compact = false, inline = false }: MathMarkdownProps) {
  if (!content) return null;

  const preparedContent = normalizeMathMarkdown(content);

  if (inline) {
    return (
      <span className="math-prose inline-block max-w-full min-w-0 overflow-x-auto align-top text-sm leading-relaxed text-current">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
          components={{
            p: ({ children }) => <span className="break-words">{children}</span>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            code: ({ children }) => (
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.88em] text-slate-900 break-words">
                {children}
              </code>
            ),
          }}
        >
          {preparedContent}
        </ReactMarkdown>
      </span>
    );
  }

  return (
    <div
      className={
        compact
          ? "math-prose w-full min-w-0 max-w-full text-sm leading-relaxed text-slate-800 space-y-2.5"
          : "math-prose w-full min-w-0 max-w-full text-[15px] sm:text-base leading-[1.7] text-slate-800 space-y-4 sm:max-w-[75ch]"
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
        components={{
          h1: ({ children }) => (
            <h2 className="font-display text-lg sm:text-2xl font-semibold text-slate-950 tracking-tight pt-3 pb-1 border-b border-slate-200 break-words">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="font-display text-base sm:text-xl font-semibold text-slate-950 tracking-tight pt-3 break-words">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="font-display text-sm sm:text-lg font-semibold text-slate-900 pt-2 break-words">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="max-w-full overflow-x-auto overflow-y-hidden py-0.5 text-slate-800">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1.5 max-w-full text-slate-800">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1.5 max-w-full text-slate-800">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="pl-1 max-w-full overflow-x-auto overflow-y-hidden py-0.5">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-950">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <div className="my-3 max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 sm:p-4 text-slate-800">
              {children}
            </div>
          ),
          pre: ({ children }) => (
            <pre className="my-3 w-full max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-slate-950 p-3.5 sm:p-4 font-mono text-xs sm:text-sm text-slate-100">
              {children}
            </pre>
          ),
          code: ({ className, children }) => {
            const isBlock = Boolean(className);
            if (isBlock) {
              return <code className="font-mono text-slate-100">{children}</code>;
            }
            return (
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.88em] text-slate-900 break-words">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="my-4 w-full max-w-full overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-left text-xs sm:text-sm tabular-nums">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3 sm:px-3.5 py-2.5 whitespace-nowrap">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 sm:px-3.5 py-2.5 border-t border-slate-100 text-slate-800">
              {children}
            </td>
          ),
          hr: () => <hr className="my-5 border-slate-200" />,
        }}
      >
        {preparedContent}
      </ReactMarkdown>
    </div>
  );
}
