import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Markdown({ content }) {
  if (!content) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="markdown-content text-sm break-words"
      components={{
        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-400 underline hover:text-violet-300">
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        code: ({ inline, className, children }) => {
          if (inline) {
            return (
              <code className="bg-surface-glass px-1.5 py-0.5 rounded text-xs font-mono text-violet-300">
                {children}
              </code>
            );
          }
          return (
            <pre className="bg-surface-glass rounded-lg p-3 my-1 overflow-x-auto">
              <code className="text-xs font-mono">{children}</code>
            </pre>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-violet-500/50 pl-3 my-1 text-content-secondary italic">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
