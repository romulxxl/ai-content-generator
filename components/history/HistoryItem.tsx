'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Copy, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import MarkdownContent from '@/components/shared/MarkdownContent'

const CONTENT_TYPE_LABELS: Record<string, string> = {
  product_description:  'Product',
  blog_post_outline:    'Blog',
  email_composer:       'Email',
  social_media_caption: 'Social',
}

interface Generation {
  id: string
  content_type: string
  inputs: Record<string, unknown>
  result: string
  tokens_used?: number | null
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
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const previewText = item.result
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\n/g, ' ')
    .trim()
  const preview = previewText.length > 120 ? previewText.slice(0, 120) + '…' : previewText

  return (
    <div className="bg-white rounded-xl border border-[#e8e4db] shadow-[0_1px_4px_0_rgba(0,0,0,0.03)] overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#faf8f3] transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold bg-[#e0f0e8] text-[#1b3f2d] px-2.5 py-0.5 rounded-full whitespace-nowrap">
              {CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
            </span>
            <span className="text-xs text-[#a09890]">{date}</span>
            {item.tokens_used != null && (
              <span className="flex items-center gap-0.5 text-xs text-[#a09890]">
                <Zap className="w-3 h-3 text-amber-400" />
                {item.tokens_used.toLocaleString()}
              </span>
            )}
          </div>
          <p className="text-sm text-[#6b6660] truncate">{preview}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); handleCopy() }}
            title={copyError ? 'Copy failed' : 'Copy'}
            className="p-1.5 rounded-lg hover:bg-[#f0ede6] transition text-[#a09890] hover:text-[#1c1c17]">
            {copied ? <CheckCircle className="w-4 h-4 text-green-500" />
              : copyError ? <AlertCircle className="w-4 h-4 text-red-400" />
              : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete() }}
            disabled={deleting}
            title={confirmDelete ? 'Click again to confirm' : 'Delete'}
            className={`p-1.5 rounded-lg transition disabled:opacity-50 ${
              confirmDelete ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'hover:bg-[#f0ede6] text-[#a09890] hover:text-red-500'
            }`}>
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-[#a09890]" />
            : <ChevronDown className="w-4 h-4 text-[#a09890]" />}
        </div>
      </div>

      {confirmDelete && (
        <div className="px-5 py-2.5 bg-red-50 border-t border-red-100 text-xs text-red-600 font-medium">
          Click delete again to confirm
        </div>
      )}

      {deleteError && (
        <div className="px-5 py-2.5 bg-red-50 border-t border-red-100 text-xs text-red-600 font-medium flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{deleteError}
        </div>
      )}

      {expanded && (
        <div className="px-5 py-4 border-t border-[#eeebe3] bg-[#faf8f3]">
          <MarkdownContent content={item.result} />
        </div>
      )}
    </div>
  )
}
