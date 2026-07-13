interface SegmentTab<T extends string> { key: T; label: string; count?: number }

interface SegmentTabsProps<T extends string> {
  tabs: readonly SegmentTab<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export default function SegmentTabs<T extends string>({ tabs, value, onChange, ariaLabel }: SegmentTabsProps<T>) {
  return <div role="tablist" aria-label={ariaLabel} className="flex gap-1.5 overflow-x-auto scrollbar-hide">
    {tabs.map((tab) => <button key={tab.key} type="button" role="tab" aria-selected={value === tab.key} onClick={() => onChange(tab.key)} className={`min-h-9 shrink-0 rounded-[9px] px-3 text-[11px] font-semibold transition-colors ${value === tab.key ? 'bg-[#14233B] text-white' : 'bg-[#F1EDE7] text-[#737B86]'}`}>
      {tab.label}{tab.count != null && <span className="ml-1 opacity-70">{tab.count}</span>}
    </button>)}
  </div>;
}
