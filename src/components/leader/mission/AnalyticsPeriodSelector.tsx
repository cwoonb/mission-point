import { AnimatePresence, motion } from 'framer-motion';
import { CalendarRange } from 'lucide-react';
import {
  ANALYTICS_PERIOD_OPTIONS,
  useAnalyticsPeriodStore,
  type AnalyticsPeriod,
} from '../../../store/analyticsPeriodStore';

export default function AnalyticsPeriodSelector() {
  const {
    selectedPeriod,
    customStart,
    customEnd,
    setSelectedPeriod,
    setCustomRange,
  } = useAnalyticsPeriodStore();

  return (
    <section className="rounded-xl bg-white px-2.5 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarRange size={14} className="shrink-0 text-purple-600" />
        <select
          value={selectedPeriod}
          onChange={(event) => setSelectedPeriod(event.target.value as AnalyticsPeriod)}
          aria-label="통계 조회 기간"
          className="min-w-0 flex-1 bg-transparent text-[11px] font-black text-slate-700 outline-none"
        >
          {ANALYTICS_PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <span className="text-[9px] font-bold text-slate-400">모든 통계에 적용</span>
      </div>
      <AnimatePresence initial={false}>
        {selectedPeriod === 'custom' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="overflow-hidden"
          >
            <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-slate-100 pt-2">
              <input type="date" value={customStart} onChange={(event) => setCustomRange(event.target.value, customEnd)} className="min-w-0 rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] font-bold text-slate-600" />
              <span className="text-[10px] text-slate-300">~</span>
              <input type="date" value={customEnd} onChange={(event) => setCustomRange(customStart, event.target.value)} className="min-w-0 rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] font-bold text-slate-600" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
