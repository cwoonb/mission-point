import { ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import EmptyState from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { useGuardianStore } from '../../store/guardianStore';
import { formatDate, formatDateTime } from '../../utils/helpers';

export default function GuardianReportsPage() {
  const navigate = useNavigate();
  const users = useAuthStore((state) => state.users);
  const { reports, links, selectedStudentId, setSelectedStudent } = useGuardianStore();
  const studentIds = [...new Set(links.map((link) => link.studentId))];
  const shown = reports.filter((report) => !selectedStudentId || report.studentId === selectedStudentId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return <div className="page-container bg-[#F8F5F0]"><Header title="리포트" showBack={false} showPoints={false}/><main className="content-area px-4 py-4">
    {studentIds.length > 1 && <select aria-label="학생 선택" value={selectedStudentId ?? ''} onChange={(event) => setSelectedStudent(event.target.value)} className="mb-4 min-h-12 w-full rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] px-3 text-sm font-semibold">{studentIds.map((id) => <option key={id} value={id}>{users.find((user) => user.id === id)?.name ?? '학생'}</option>)}</select>}
    <section className="space-y-2">{shown.map((report) => <button key={report.id} onClick={() => navigate(`/guardian/reports/${report.id}`)} className="flex min-h-24 w-full items-center gap-3 rounded-[13px] border border-[#E1DBD3] bg-[#FFFDFC] p-4 text-left"><FileText size={20} className="text-[#B58A4A]"/><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#14233B]">{report.snapshot.student.name} 활동 리포트</strong><span className="mt-1 block text-xs text-[#687282]">{report.snapshot.periodStart ? `${formatDate(report.snapshot.periodStart)} ~ ` : ''}{formatDate(report.snapshot.generatedAt)}</span><span className="mt-1 block text-[10px] text-[#8B929C]">{formatDate(report.createdAt)} 생성 · {report.snapshot.teacherName ?? '선생님'}</span><span className={`mt-1 block text-[10px] font-bold ${report.lastViewedAt ? 'text-[#6D7A88]' : 'text-[#B58A4A]'}`}>{report.lastViewedAt ? `읽음 · ${formatDateTime(report.lastViewedAt)}` : '읽지 않음'}</span></span><ChevronRight size={16}/></button>)}{shown.length === 0 && <EmptyState title="아직 도착한 리포트가 없습니다." description="선생님이 공유한 리포트가 여기에 모입니다."/>}</section>
  </main></div>;
}
