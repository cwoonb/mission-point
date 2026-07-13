import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
}

export default function SearchInput({ value, onChange, placeholder, label = placeholder }: SearchInputProps) {
  return <label className="relative block">
    <span className="sr-only">{label}</span>
    <Search size={16} aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9099]" />
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 w-full rounded-[10px] border border-[var(--color-border)] bg-[#F1EDE7] pl-10 pr-11 text-sm text-[#27313F] outline-none placeholder:text-[#9299A3] focus:border-[#14233B] focus:bg-[#FFFDFC]" />
    {value && <button type="button" onClick={() => onChange('')} aria-label="검색어 지우기" className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-[#737B86]"><X size={16}/></button>}
  </label>;
}
