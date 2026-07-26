import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Image as ImageIcon, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { formatDateTime } from '../utils/helpers';
import { useMembershipStore } from '../store/membershipStore';

export default function SubmissionReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const groups = useGroupStore((state) => state.groups);
  const { missions, reviewLogs, getLatestSubmission, approveMission, rejectMission, updateReviewFeedback } = useMissionStore();
  const activeOrganizationId = useMembershipStore((state)=>state.memberships.find((item)=>item.id===state.activeMembershipId)?.organizationId);
  const [feedback, setFeedback] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [error, setError] = useState('');

  const mission = missions.find((item) => item.id === id);
  const submission = mission ? getLatestSubmission(mission.id) : undefined;
  const student = users.find((user) => user.id === mission?.assigneeId);
  const groupName = groups.find((group) => group.id === student?.groupId)?.name ?? '반 미지정';
  const latestReview = reviewLogs.filter((item) => item.missionId === mission?.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];

  useEffect(() => {
    setFeedback(latestReview?.publicFeedback ?? '');
  }, [latestReview?.id, latestReview?.publicFeedback]);

  if (!mission || !student) {
    return <div className="page-container"><Header title="제출물 확인" showBack showPoints={false}/><main className="content-area px-4 py-10"><EmptyState title="제출 정보를 찾을 수 없습니다." actionLabel="승인 대기로 이동" onAction={() => navigate('/missions?tab=pending')}/></main></div>;
  }

  const approve = async () => {
    if (!currentUser || processing) return;
    setProcessing(true); setError('');
    try {
      await approveMission(mission.id, currentUser.id, feedback);
      navigate('/missions?tab=pending', { replace: true, state: { notice: `${student.name} 학생의 제출물을 승인했습니다.` } });
    } catch {
      setError('승인 처리에 실패했습니다. 피드백은 유지됩니다. 네트워크 연결을 확인하고 다시 시도해 주세요.');
      setProcessing(false);
    }
  };

  const reject = async () => {
    if (!currentUser || processing || !rejectReason.trim()) return;
    setProcessing(true); setError('');
    const reason = rejectReason.trim();
    try {
      await rejectMission(mission.id, currentUser.id, reason, feedback);
      navigate('/missions?tab=pending', { replace: true, state: { notice: `${student.name} 학생에게 보완 요청을 보냈습니다.` } });
    } catch {
      setRejectOpen(false);
      setError('반려 처리에 실패했습니다. 입력 내용은 유지됩니다. 네트워크 연결을 확인하고 다시 시도해 주세요.');
      setProcessing(false);
    }
  };

  const saveExistingFeedback = async () => {
    if (!latestReview || processing) return;
    setProcessing(true); setError('');
    try {
      await updateReviewFeedback(latestReview.id, feedback);
      setError('피드백을 저장했습니다. 새로 만든 보호자 링크에 반영됩니다.');
    } catch {
      setError('피드백 저장에 실패했습니다. 입력 내용은 유지됩니다. 다시 시도해 주세요.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page-container bg-[#F8F5F0]">
      <Header title="제출물 확인" showBack showPoints={false}/>
      <main className="content-area space-y-5 px-4 py-4 pb-32">
        <section className="flex items-center gap-3 border-b border-[#E7E1D9] pb-4">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#E9EDF2] font-bold text-[#14233B]">
            {student.profileImage ? <img src={student.profileImage} alt="" className="h-full w-full object-cover"/> : student.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-[#14233B]">{student.name}</h2>
            <p className="mt-0.5 text-xs text-[#687282]">{groupName} · {mission.title}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${mission.status === 'SUCCESS' ? 'bg-[#EAF2EC] text-[#52775E]' : mission.status === 'REJECTED' ? 'bg-[#F7ECEA] text-[#A65F59]' : 'bg-[#F1E7D6] text-[#8A672F]'}`}>{mission.status === 'SUCCESS' ? '승인 완료' : mission.status === 'REJECTED' ? '수정 요청' : '승인 대기'}</span>
        </section>

        {submission ? (
          <>
            <section>
              <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-bold text-[#14233B]">제출 내용</h3><time className="text-[11px] text-[#8B929C]">{formatDateTime(submission.submittedAt)}</time></div>
              {submission.imageUrl ? (
                <button type="button" onClick={() => setImageOpen(true)} className="block w-full overflow-hidden rounded-[14px] border border-[#E7E1D9] bg-[#F1EDE7]">
                  <img src={submission.imageUrl} alt={`${mission.title} 제출 사진`} className="max-h-[420px] w-full object-contain"/>
                </button>
              ) : (
                <div className="flex min-h-44 flex-col items-center justify-center rounded-[14px] border border-dashed border-[#D8D0C5] bg-[#FFFDFC] text-[#9A9FA7]"><ImageIcon size={28}/><p className="mt-2 text-xs font-semibold">첨부된 사진이 없습니다.</p></div>
              )}
              {submission.message && <p className="mt-3 rounded-xl border border-[#E7E1D9] bg-[#FFFDFC] p-4 text-sm leading-6 text-[#53606F]">{submission.message}</p>}
            </section>
            {error && <p role="alert" className="rounded-[10px] bg-[#F8EAE8] px-3 py-2 text-xs font-bold text-[#A14E49]">{error}</p>}

            <section>
              <div className="flex items-center justify-between gap-2"><label htmlFor="review-feedback" className="text-sm font-bold text-[#14233B]">학생과 보호자에게 전달할 피드백</label><span className="rounded-full bg-[#F1E7D6] px-2 py-1 text-[9px] font-bold text-[#8A672F]">보호자 공개</span></div>
              <p className="mt-1 text-[11px] leading-5 text-[#687282]">승인된 제출물의 피드백은 학생 활동 리포트에 표시될 수 있습니다.</p>
              <textarea id="review-feedback" value={feedback} onChange={(event) => setFeedback(event.target.value)} maxLength={300} rows={4} placeholder="학생이 바로 이해할 수 있도록 구체적으로 적어주세요." className="mt-2 w-full resize-none rounded-[12px] border border-[#D8D0C5] bg-[#FFFDFC] p-3 text-sm leading-6 text-[#27313F] outline-none focus:border-[#14233B]"/>
              <p className="mt-1 text-right text-[10px] text-[#9A9FA7]">{feedback.length}/300</p>
              {mission.status !== 'REVIEWING' && latestReview && <button type="button" onClick={saveExistingFeedback} disabled={processing || feedback.trim() === (latestReview.publicFeedback ?? '')} className="mt-2 min-h-11 w-full rounded-[10px] border border-[#14233B] text-xs font-bold text-[#14233B] disabled:opacity-40">{processing ? '저장 중...' : '피드백 수정 저장'}</button>}
            </section>
          </>
        ) : <EmptyState title="제출 기록이 없습니다." description="학생이 제출한 뒤 검토할 수 있습니다."/>}
      </main>

      {submission && mission.status === 'REVIEWING' && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex w-full max-w-[430px] -translate-x-1/2 gap-2 border-t border-[#E7E1D9] bg-[#FFFDFC]/95 px-4 py-3 backdrop-blur">
          <button type="button" onClick={() => setRejectOpen(true)} disabled={processing} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[10px] border border-[#CF6B64] font-bold text-[#B44E48] disabled:opacity-50"><X size={17}/>반려</button>
          <button type="button" onClick={approve} disabled={processing} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#14233B] font-bold text-white disabled:opacity-50"><Check size={17}/>승인</button>
        </div>
      )}

      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="보완 요청">
        <div className="flex items-center justify-between"><label htmlFor="reject-reason" className="text-sm font-bold text-[#14233B]">반려 사유</label><span className="rounded-full bg-[#F7ECEA] px-2 py-1 text-[9px] font-bold text-[#A65F59]">학생 수정 요청</span></div>
        <p className="mt-1 text-[11px] leading-5 text-[#687282]">학생에게만 수정 요청으로 전달되며 보호자 리포트에는 표시하지 않습니다.</p>
        <textarea id="reject-reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={4} maxLength={200} placeholder="보완할 내용을 구체적으로 알려주세요." className="mt-2 w-full resize-none rounded-xl border border-[#D8D0C5] p-3 text-sm outline-none focus:border-[#14233B]"/>
        <button type="button" onClick={reject} disabled={!rejectReason.trim() || processing} className="mt-4 min-h-12 w-full rounded-[10px] bg-[#B44E48] font-bold text-white disabled:opacity-40">보완 요청 보내기</button>
      </Modal>

      {imageOpen && submission?.imageUrl && <button type="button" aria-label="확대 이미지 닫기" onClick={() => setImageOpen(false)} className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0D192B]/90 p-4"><img src={submission.imageUrl} alt="확대된 제출 사진" className="max-h-full max-w-full object-contain"/><span className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white"><X/></span></button>}
    </div>
  );
}
