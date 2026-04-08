import HistoryList from '@/components/history/HistoryList'

export default function HistoryPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">History</h1>
        <p className="text-slate-500 mt-1 text-sm">Your past generations</p>
      </div>
      <HistoryList />
    </div>
  )
}
