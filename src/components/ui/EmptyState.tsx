import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[#FFFDFC] px-6 py-10 text-center">
    {Icon && <Icon size={28} strokeWidth={1.7} aria-hidden className="mx-auto text-[#737B86]" />}
    <p className="mt-3 text-sm font-semibold text-[#27313F]">{title}</p>
    {description && <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[#737B86]">{description}</p>}
    {actionLabel && onAction && <button type="button" onClick={onAction} className="mt-4 min-h-11 rounded-[10px] bg-[#14233B] px-4 text-sm font-semibold text-white">{actionLabel}</button>}
  </div>;
}
