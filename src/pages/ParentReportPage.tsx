import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight, MessageCircle, Pencil, Share2, Target } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { formatDate, formatDateTime } from '../utils/helpers';
import { useMembershipStore } from '../store/membershipStore';
import { useReportContentStore } from '../store/reportContentStore';

function Empty({ children }: { children: string }) {
  return <p className="rounded-xl bg-[#F5F2ED] px-4 py-5 text-center text-xs font-semibold text-[#8B929C]">{children}</p>;
}

export default function ParentReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, currentUser } = useAuthStore();
  const groups = useGroupStore((state) => state.groups);
  const { missions, submissions, reviewLogs } = useMissionStore();
  const activeMembership = useMembershipStore((state) => state.memberships.find((item) => item.id === state.activeMembershipId));
  const { load, saveMemo } = useReportContentStore();
  const savedMemo = useReportContentStore((state) => activeMembership?.organizationId && id ? state.getMemo(activeMembership.organizationId, id) : '');
  const [memo, setMemo] = useState('');
  const [editingMemo, setEditingMemo] = useState(false);
  const [savingMemo, setSavingMemo] = useState(false);
  const [memoNotice, setMemoNotice] = useState('');
  const student = users.find((user) => user.id === id);
  const studentMissions = useMemo(() => missions.filter((mission) => mission.assigneeId === id && (!currentUser || currentUser.role === 'CHILD' || mission.creatorId === currentUser.id)), [missions, id, currentUser]);

  if (!student) return <div className="page-container flex items-center justify-center"><p className="text-sm text-[#687282]">학생 정보를 찾을 수 없습니다.</p></div>;

  const ids = new Set(studentMissions.map((mission) => mission.id));
  const recentSubmissions = submissions.filter((submission) => submission.userId === id && ids.has(submission.missionId)).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 5);
  const reviewFeedback = reviewLogs.filter((log) => ids.has(log.missionId) && log.action === 'APPROVED' && log.publicFeedback).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
  const active = studentMissions.filter((mission) => ['PENDING', 'IN_PROGRESS', 'REVIEWING', 'REJECTED'].includes(mission.status)).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  const groupName = groups.find((group) => group.id === student.groupId)?.name ?? '반 미지정';
  const missionTitle = (missionId: string) => studentMissions.find((mission) => mission.id === missionId)?.title ?? '미션';
  const periodStart = new Date(Date.now() - 29 * 86400000).toISOString();
  const nextGoal = active[0]?.title ? `${active[0].title} 미션을 기한 안에 차분히 마무리해 보세요.` : '지금의 꾸준한 활동 흐름을 이어가 보세요.';

  useEffect(() => { setMemo(savedMemo); }, [savedMemo]);
  useEffect(() => {
    if (!activeMembership?.organizationId || !id) return;
    void load(activeMembership.organizationId, id).catch((error: Error) => {
      setMemoNotice(error.message === 'REPORT_CONTENT_MIGRATION_REQUIRED' ? '리포트 메모 저장 설정이 아직 적용되지 않았습니다.' : '저장된 메모를 불러오지 못했습니다.');
    });
  }, [activeMembership?.organizationId, id, load]);

  const persistMemo = async () => {
    if (!activeMembership?.organizationId || !id || savingMemo) return;
    setSavingMemo(true); setMemoNotice('');
    try {
      await saveMemo(activeMembership.organizationId, id, memo);
      setEditingMemo(false);
      setMemoNotice('한줄 메모를 저장했습니다. 새로 만든 공유 링크에 반영됩니다.');
    } catch {
      setMemoNotice('메모 저장에 실패했습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.');
    } finally {
      setSavingMemo(false);
    }
  };

  return (
    <div className="page-container bg-[#F8F5F0]">
      <header className="sticky top-0 z-40 flex min-h-14 items-center gap-2 border-b border-[#E7E1D9] bg-[#F8F5F0]/95 px-3 backdrop-blur">
        <button type="button" onClick={() => navigate(-1)} aria-label="뒤로 가기" className="flex h-11 w-11 items-center justify-center text-xl text-[#14233B]">‹</button>
        <h1 className="min-w-0 flex-1 truncate text-sm font-bold text-[#14233B]">{student.name} 학생 활동 리포트</h1>
        <button type="button" onClick={() => navigate(`/students/${student.id}/report/share`)} className="flex min-h-11 items-center gap-1.5 rounded-[9px] bg-[#14233B] px-3 text-xs font-bold text-white"><Share2 size={14}/>공유</button>
      </header>

      <main className="content-area px-4 py-4">
        <article className="overflow-hidden rounded-[18px] border border-[#E7E1D9] bg-[#FFFDFC] shadow-[0_8px_28px_rgba(20,35,59,.05)]">
          <header className="border-b border-[#E7E1D9] bg-[#F5F2ED] p-5 text-center">
            <p className="text-[11px] font-semibold text-[#B58A4A]">{formatDate(periodStart)} ~ {formatDate(new Date().toISOString())}</p>
            <div className="mt-4 flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#E9EDF2] text-xl font-bold text-[#14233B]">{student.profileImage ? <img src={student.profileImage} alt="" className="h-full w-full object-cover"/> : student.name.slice(0, 1)}</div>
              <h2 className="mt-3 text-xl font-bold text-[#14233B]">{student.name}</h2>
              <p className="mt-1 text-xs text-[#687282]">{groupName}</p>
            </div>
          </header>

          <div className="space-y-7 p-5">
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#14233B]"><CheckCircle2 size={17} className="text-[#4F8A68]"/>최근 활동 기록</h3>
              {recentSubmissions.length === 0 ? <Empty>최근 30일 활동 기록이 없습니다.</Empty> : <div className="divide-y divide-[#ECE7E0] rounded-xl border border-[#E7E1D9]">{recentSubmissions.map((submission) => <div key={submission.id} className="flex items-start gap-3 p-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#4F8A68]"/><div className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#27313F]">{missionTitle(submission.missionId)}</strong><p className="mt-1 text-[11px] text-[#8B929C]">{formatDateTime(submission.submittedAt)} · 제출 완료</p>{submission.message && <p className="mt-2 text-xs leading-5 text-[#687282]">{submission.message}</p>}</div></div>)}</div>}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-bold text-[#14233B]"><MessageCircle size={17} className="text-[#B58A4A]"/>선생님 피드백</h3><span className="rounded-full bg-[#F1E7D6] px-2 py-1 text-[9px] font-bold text-[#8A672F]">보호자 공개</span></div>
              {reviewFeedback.length === 0 ? <Empty>승인된 제출물의 공개 피드백이 없습니다.</Empty> : <div className="space-y-2">{reviewFeedback.map((log) => <div key={log.id} className="rounded-xl bg-[#F5F2ED] p-3"><p className="text-sm leading-6 text-[#53606F]">{log.publicFeedback}</p><button type="button" onClick={() => navigate(`/missions/${log.missionId}/review`)} className="mt-2 flex min-h-10 items-center gap-1 text-[11px] font-bold text-[#14233B]"><Pencil size={12}/>피드백 수정</button></div>)}</div>}
            </section>

            <section className="rounded-xl border border-[#D6DEE8] bg-[#F2F5F8] p-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#40536F]"><Target size={17}/>다음 목표</h3>
              <p className="mt-2 text-sm leading-6 text-[#53606F]">{nextGoal}</p>
              {active[0] && <button type="button" onClick={() => navigate(`/missions/${active[0].id}`)} className="mt-3 flex min-h-11 items-center gap-1 text-xs font-bold text-[#14233B]">미션 자세히 보기<ChevronRight size={14}/></button>}
            </section>

            <section className="rounded-xl border border-[#D8D0C5] bg-[#F3EFE9] p-4">
              <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-[#B58A4A]">선생님 한줄 메모</p><span className="rounded-full bg-[#F1E7D6] px-2 py-1 text-[9px] font-bold text-[#8A672F]">보호자 공개</span></div>
              {editingMemo ? <div className="mt-3"><textarea value={memo} onChange={(event) => setMemo(event.target.value)} maxLength={150} rows={4} placeholder="이번 기간의 성장이나 격려할 내용을 작성해 주세요." className="w-full resize-none rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] p-3 text-sm leading-6 outline-none focus:border-[#14233B]"/><p className="mt-1 text-right text-[10px] text-[#8B929C]">{memo.length}/150</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => { setMemo(savedMemo); setEditingMemo(false); setMemoNotice(''); }} disabled={savingMemo} className="min-h-11 flex-1 rounded-[9px] border border-[#D8D0C5] text-xs font-bold text-[#687282]">취소</button><button type="button" onClick={persistMemo} disabled={savingMemo || memo.trim() === savedMemo} className="min-h-11 flex-1 rounded-[9px] bg-[#14233B] text-xs font-bold text-white disabled:opacity-40">{savingMemo ? '저장 중...' : '저장'}</button></div></div> : <>{savedMemo ? <p className="mt-2 text-sm font-semibold leading-6 text-[#27313F]">{savedMemo}</p> : <p className="mt-2 text-xs leading-5 text-[#8B929C]">작성된 공개 메모가 없습니다. 비워 두면 공개 리포트에서 이 영역은 숨겨집니다.</p>}<button type="button" onClick={() => setEditingMemo(true)} className="mt-3 flex min-h-10 items-center gap-1 text-xs font-bold text-[#14233B]"><Pencil size={13}/>{savedMemo ? '수정' : '작성'}</button></>}
              {memoNotice && <p role="status" className={`mt-2 text-[11px] font-semibold ${memoNotice.includes('실패') || memoNotice.includes('못') || memoNotice.includes('아직') ? 'text-[#A65F59]' : 'text-[#4F8A68]'}`}>{memoNotice}</p>}
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
