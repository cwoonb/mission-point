import { CheckCircle2, FileText, MessageCircle, Send } from 'lucide-react';
import Header from '../../components/layout/Header';
import EmptyState from '../../components/ui/EmptyState';
import { useGuardianStore } from '../../store/guardianStore';
import { formatDateTime } from '../../utils/helpers';

export default function GuardianActivityPage() {
  const { reports, selectedStudentId } = useGuardianStore();
  const source = reports.filter((report) => !selectedStudentId || report.studentId === selectedStudentId);
  const events = source.flatMap((report) => [
    { key: `report-${report.id}`, date: report.createdAt, title: '활동 리포트가 도착했습니다.', kind: 'report' as const },
    ...report.snapshot.recentActivities.map((item, index) => ({ key: `activity-${report.id}-${index}`, date: item.date, title: `${item.title} 제출`, kind: 'submit' as const })),
    ...report.snapshot.completedMissions.map((item, index) => ({ key: `complete-${report.id}-${index}`, date: item.date, title: `${item.title} 승인 완료`, kind: 'complete' as const })),
    ...report.snapshot.feedback.map((item, index) => ({ key: `feedback-${report.id}-${index}`, date: item.date, title: `${item.mission} 선생님 피드백`, kind: 'feedback' as const })),
  ]).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  const unique = events.filter((event, index) => events.findIndex((candidate) => candidate.date === event.date && candidate.title === event.title) === index).slice(0, 40);
  const icons = { report: FileText, submit: Send, complete: CheckCircle2, feedback: MessageCircle };
  return <div className="page-container bg-[#F8F5F0]"><Header title="활동" showBack={false} showPoints={false}/><main className="content-area px-4 py-4">{unique.length ? <section className="space-y-0">{unique.map((event, index) => { const Icon = icons[event.kind]; return <div key={event.key} className="flex gap-3"><div className="flex w-8 flex-col items-center"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1E7D6] text-[#9A7138]"><Icon size={14}/></span>{index < unique.length - 1 && <span className="min-h-8 w-px flex-1 bg-[#DED8D0]"/>}</div><div className="min-w-0 flex-1 pb-5"><p className="text-sm font-semibold text-[#27313F]">{event.title}</p><p className="mt-1 text-[10px] text-[#8B929C]">{formatDateTime(event.date)}</p></div></div>; })}</section> : <EmptyState title="공개된 활동 기록이 없습니다." description="리포트가 도착하면 제출·승인·피드백 기록을 확인할 수 있습니다."/>}</main></div>;
}
