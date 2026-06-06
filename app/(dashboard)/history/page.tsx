import HistoryList from '@/components/history/HistoryList'

export default function HistoryPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#1c1c17] tracking-tight">History</h1>
        <p className="text-[#6b6660] mt-1 text-sm">Your past generations</p>
      </div>
      <HistoryList />
    </div>
  )
}
