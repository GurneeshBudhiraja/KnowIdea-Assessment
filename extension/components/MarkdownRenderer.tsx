import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
}

function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-zinc-100 mb-3 mt-4 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-zinc-100 mb-2 mt-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-zinc-100 mb-2 mt-3 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-zinc-200 mb-1 mt-2 first:mt-0">
              {children}
            </h4>
          ),

          p: ({ children }) => (
            <p className="text-sm text-zinc-200 mb-2 last:mb-0 leading-relaxed">
              {children}
            </p>
          ),

          ul: ({ children }) => (
            <ul className="list-disc list-inside text-sm text-zinc-200 mb-2 space-y-1 ml-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-sm text-zinc-200 mb-2 space-y-1 ml-2">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-zinc-200">{children}</li>,

          code: ({ children, node, ...props }) => {
            const isBlock =
              node?.position?.start.line !== node?.position?.end.line ||
              node?.position?.start.column === 1;

            if (isBlock) {
              return (
                <code
                  className="block bg-zinc-900 text-zinc-100 p-3 rounded-lg text-xs font-theme-ibm-mono overflow-x-auto"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="bg-zinc-700/50 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-theme-ibm-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-zinc-900 rounded-lg overflow-hidden mb-2">
              {children}
            </pre>
          ),

          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-zinc-700/50">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-zinc-700">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="text-left px-3 py-2 text-zinc-100 font-semibold text-xs">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-zinc-300 text-xs">{children}</td>
          ),

          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-emerald-500 pl-3 py-1 my-2 text-zinc-300 italic">
              {children}
            </blockquote>
          ),

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline"
            >
              {children}
            </a>
          ),

          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-100">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-300">{children}</em>
          ),

          hr: () => <hr className="border-zinc-700 my-3" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
