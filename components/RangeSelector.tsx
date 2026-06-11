'use client'

export type Range = '1Y' | '5Y' | '10Y' | '25Y' | 'Max'

const RANGES: Range[] = ['1Y', '5Y', '10Y', '25Y', 'Max']

interface RangeSelectorProps {
  selected: Range
  onChange: (range: Range) => void
}

export default function RangeSelector({ selected, onChange }: RangeSelectorProps) {
  return (
    <div className="flex gap-1">
      {RANGES.map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`px-3 py-1 text-[11px] font-mono border transition-colors ${
            selected === r
              ? 'border-[#2A5DB0] bg-[#2A5DB0] text-white'
              : 'border-[#D6D9DD] text-[#6B7280] hover:border-[#2A5DB0] hover:text-[#2A5DB0] bg-white'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  )
}
