'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  content: string
  className?: string
}

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-slate-900 mt-5 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-bold text-slate-900 mt-4 mb-2 first:mt-0 pb-1 border-b border-slate-100">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-slate-800 mt-3 mb-1.5 first:mt-0">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-slate-800 leading-relaxed mb-3 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-700">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1 mb-3 text-sm text-slate-800">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1 mb-3 text-sm text-slate-800">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-slate-600 my-3 text-sm">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-700">
              {children}
            </code>
          ),
          hr: () => <hr className="border-slate-200 my-4" />,
          a: ({ href, children }) => (
            <a href={href} className="text-indigo-600 hover:underline" target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
