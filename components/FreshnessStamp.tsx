interface FreshnessStampProps {
  lastUpdated: string
  isStale?: boolean
}

export default function FreshnessStamp({ lastUpdated, isStale }: FreshnessStampProps) {
  const formatted = lastUpdated
    ? new Date(lastUpdated + 'T12:00:00Z').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : 'Unknown'

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10px] font-mono tracking-wider uppercase whitespace-nowrap ${
        isStale
          ? 'border-amber-400 text-amber-700 bg-amber-50'
          : 'border-[#D6D9DD] text-[#6B7280] bg-[#FAFAFA]'
      }`}
      title={`Data as of ${formatted}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          isStale ? 'bg-amber-400' : 'bg-[#D6D9DD]'
        }`}
      />
      {isStale ? `STALE · ${formatted}` : formatted}
    </div>
  )
}
