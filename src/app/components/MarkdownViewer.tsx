import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 min-h-[500px]">
      <div className="prose prose-zinc dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  {...props}
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-md !bg-[#1e1e1e] !p-4 !my-4"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code {...props} className={`${className} bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400`}>
                  {children}
                </code>
              );
            },
            // Custom styling for other elements to ensure good look without full typography plugin if missing
            h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mt-6 mb-3" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />,
            p: ({node, ...props}) => <p className="leading-7 mb-4" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
            li: ({node, ...props}) => <li className="" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-zinc-300 dark:border-zinc-700 pl-4 italic my-4 text-zinc-600 dark:text-zinc-400" {...props} />,
            a: ({node, ...props}) => <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />,
            img: ({node, ...props}) => <img className="rounded-lg max-w-full h-auto my-4 border border-zinc-200 dark:border-zinc-800" {...props} />,
            table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800" {...props} /></div>,
            th: ({node, ...props}) => <th className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-left text-sm font-semibold text-zinc-900 dark:text-zinc-100" {...props} />,
            td: ({node, ...props}) => <td className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 text-sm" {...props} />,
            hr: ({node, ...props}) => <hr className="my-8 border-zinc-200 dark:border-zinc-800" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
