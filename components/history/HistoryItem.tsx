'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Copy, CheckCircle, AlertCircle } from 'lucide-react'

const CONTENT_TYPE_LABELS: Record<string, string> = {
  product_description:  'Product Description',
  blog_post_outline:    'Blog Blueprint',
  email_composer:       'Email Composer',
  social_media_caption: 'Social Post',
}

interface Generation {
  id: string
  content_type: string
  inputs: Record<string, unknown>
  result: string
  created_at: string
}

interface HistoryItemProps {
  item: Generation
  onDelete: (id: string) => void
}

export default function HistoryItem({ item, onDelete }: HistoryItemProps) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/history/${item.id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        onDelete(item.id)
      } else {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error || 'Failed to delete')
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyError(true)
      setTimeout(() => setCopyError(false), 2000)
    }
  }

  const date = new Date(item.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const preview =
    item.result.length > 100 ? item.result.slice(0, 100) + '…' : item.result

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium bg-teal-100 text-teal-700 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
            </span>
            <span className="text-xs text-slate-400">{date}</span>
          </div>
          <p className="text-sm text-slate-600 truncate">{preview}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy() }}
            aria-label="Copy to clipboard"
            title={copyError ? 'Copy failed — clipboard access denied' : 'Copy to clipboard'}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : copyError ? (
              <AlertCircle className="w-4 h-4 text-red-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete() }}
            disabled={deleting}
            aria-label={confirmDelete ? 'Confirm deletion' : 'Delete generation'}
            title={confirmDelete ? 'Click again to confirm deletion' : 'Delete'}
            className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
              confirmDelete
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'hover:bg-slate-100 text-slate-400 hover:text-red-500'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="px-5 py-2.5 bg-red-50 border-t border-red-100 text-xs text-red-600 font-medium">
          Click the delete button again to confirm deletion
        </div>
      )}

      {deleteError && (
        <div className="px-5 py-2.5 bg-red-50 border-t border-red-100 text-xs text-red-600 font-medium flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {deleteError}
        </div>
      )}

      {expanded && (
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">
            {item.result}
          </pre>
        </div>
      )}
    </div>
  )
}
