'use client'

import { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import HistoryItem from './HistoryItem'

interface Generation {
  id: string
  content_type: string
  inputs: Record<string, unknown>
  result: string
  created_at: string
}

export default function HistoryList() {
  const [items, setItems] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history')
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error((data as { error?: string }).error || 'Failed to load history')
        }
        const data: Generation[] = await res.json()
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 h-20 animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm">
        <strong>Failed to load history:</strong> {error}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-slate-100 p-5 rounded-2xl mb-4">
          <FileText className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-1">No generations yet</h3>
        <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
          Head to <strong className="text-slate-500">Generate</strong> to create content and save
          it to your history.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">{items.length} generation{items.length !== 1 ? 's' : ''}</p>
      {items.map((item) => (
        <HistoryItem key={item.id} item={item} onDelete={handleDelete} />
      ))}
    </div>
  )
}
