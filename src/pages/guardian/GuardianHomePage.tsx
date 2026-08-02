import { ChevronRight, FileText, MessageCircle, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import EmptyState from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { useGuardianStore } from '../../store/guardianStore';
import { useMembershipStore } from '../../store/membershipStore';
import { formatDate, formatDateTime } from '../../utils/helpers';

export default function GuardianHomePage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const users = useAuthStore((state) => state.users);
  const active = useMembershipStore((state) => state.memberships.find((item) => item.id === state.activeMembershipId));
  const { links, reports, selectedStudentId, setSelectedStudent } = useGuardianStore();
  if (!currentUser || !active) return null;
  const studentIds = [...new Set(links.filter((link) => link.organizationId === active.organizationId && link.status === 'ACTIVE').map((link) => link.studentId))];
  const studentId = selectedStudentId && studentIds.includes(selectedStudentId) ? selectedStudentId : studentIds[0];
  const student = users.find((user) => user.id === studentId);
  const studentReports = reports.filter((report) => report.studentId === studentId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const latest = studentReports[0];
  const snapshot = latest?.snapshot;
  const feedbackCount = snapshot?.feedback.length ?? 0;
  const ongoingCount = snapshot?.ongoingMissions.length ?? 0;
  return <div className="page-container bg-[#F8F5F0]">
    <Header title="홈" showBack={false} showPoints={false}/>
    <main className="content-area space-y-6 px-4 py-5">
      <section><p className="text-sm font-semibold text-[#53606F]">{currentUser.name} 보호자님,</p><h1 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-[#14233B]">최근 활동을 정리했습니다.</h1></section>
      {studentIds.length > 1 && <section><label htmlFor="guardian-student" className="text-xs font-bold text-[#53606F]">확인할 학생</label><select id="guardian-student" value={studentId} onChange={(event) => setSelectedStudent(event.target.value)} className="mt-2 min-h-12 w-full rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] px-3 text-sm font-semibold text-[#14233B]">{studentIds.map((id) => <option key={id} value={id}>{users.find((user) => user.id === id)?.name ?? '학생'}</option>)}</select></section>}
      {!student ? <EmptyState title="연결된 학생이 없습니다." description="소속 운영자에게 보호자 연결을 요청해 주세요."/> : <>
        <section className="rounded-[14px] border border-[#E1DBD3] bg-[#FFFDFC] p-4"><p className="text-[10px] font-bold text-[#B58A4A]">현재 확인 중</p><h2 className="mt-1 text-lg font-bold text-[#14233B]">{student.name}</h2><p className="mt-1 text-xs text-[#687282]">학생의 공개 리포트와 활동만 표시됩니다.</p></section>
        <section className="grid grid-cols-3 gap-2">{[[studentReports.length, '최근 리포트'], [feedbackCount, '새 피드백'], [ongoingCount, '진행 중 활동']].map(([value, label]) => Number(value) > 0 ? <div key={label as string} className="rounded-[12px] border border-[#E1DBD3] bg-[#FFFDFC] p-3"><strong className="text-xl text-[#14233B]">{value}</strong><p className="mt-1 text-[10px] text-[#687282]">{label}</p></div> : <div key={label as string} className="rounded-[12px] bg-[#F2EEE8] p-3"><strong className="text-sm text-[#9A9FA7]">—</strong><p className="mt-1 text-[10px] text-[#8B929C]">{label}</p></div>)}</section>
        <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-[#14233B]">최근 리포트</h2><button onClick={() => navigate('/guardian/reports')} className="min-h-10 text-xs font-bold text-[#536D8B]">전체 보기</button></div>{latest ? <button onClick={() => navigate(`/guardian/reports/${latest.id}`)} className="flex min-h-20 w-full items-center gap-3 rounded-[13px] border border-[#E1DBD3] bg-[#FFFDFC] p-4 text-left"><FileText size={20} className="text-[#B58A4A]"/><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#14233B]">{latest.snapshot.student.name} 활동 리포트</strong><span className="mt-1 block text-xs text-[#687282]">{latest.snapshot.periodStart ? `${formatDate(latest.snapshot.periodStart)} ~ ` : ''}{formatDate(latest.snapshot.generatedAt)}</span><span className={`mt-1 block text-[10px] font-bold ${latest.lastViewedAt ? 'text-[#8B929C]' : 'text-[#B58A4A]'}`}>{latest.lastViewedAt ? `읽음 · ${formatDateTime(latest.lastViewedAt)}` : '새로 도착'}</span></span><ChevronRight size={16}/></button> : <EmptyState title="도착한 리포트가 없습니다."/>}</section>
        {snapshot && <section className="space-y-3"><h2 className="text-sm font-bold text-[#14233B]">최근 공개 내용</h2>{snapshot.recentActivities.slice(0, 2).map((item, index) => <div key={`${item.date}-${index}`} className="rounded-[12px] border border-[#E1DBD3] bg-[#FFFDFC] p-3"><p className="text-sm font-semibold text-[#27313F]">{item.title}</p><p className="mt-1 text-[10px] text-[#8B929C]">{formatDateTime(item.date)}</p></div>)}{snapshot.feedback.slice(0, 1).map((item, index) => <div key={`${item.date}-${index}`} className="rounded-[12px] bg-[#F5F2ED] p-4"><h3 className="flex items-center gap-2 text-xs font-bold text-[#B58A4A]"><MessageCircle size={14}/>선생님 피드백</h3><p className="mt-2 text-sm leading-6 text-[#53606F]">{item.text}</p></div>)}<div className="rounded-[12px] bg-[#F2F5F8] p-4"><h3 className="flex items-center gap-2 text-xs font-bold text-[#40536F]"><Target size={15}/>다음 목표</h3><p className="mt-2 text-sm leading-6 text-[#53606F]">{snapshot.nextGoal}</p></div></section>}
      </>}
    </main>
  </div>;
}
