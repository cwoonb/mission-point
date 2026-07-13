import { useNavigate } from 'react-router-dom';
import { ChevronRight, ClipboardCheck } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { formatDateTime } from '../utils/helpers';

interface ApprovalPageProps { embedded?: boolean }

export default function ApprovalPage({ embedded = false }: ApprovalPageProps) {
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const groups = useGroupStore((state) => state.groups);
  const { missions, getLatestSubmission } = useMissionStore();
  const pending = missions
    .filter((mission) => mission.creatorId === currentUser?.id && mission.status === 'REVIEWING')
    .sort((a, b) => {
      const aDate = getLatestSubmission(a.id)?.submittedAt ?? a.createdAt;
      const bDate = getLatestSubmission(b.id)?.submittedAt ?? b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  const content = pending.length === 0 ? (
    <EmptyState title="검토를 기다리는 제출물이 없습니다." description="새 제출물이 도착하면 이곳에서 바로 확인할 수 있습니다."/>
  ) : (
    <div className="space-y-2">
      {pending.map((mission) => {
        const student = users.find((user) => user.id === mission.assigneeId);
        const groupName = groups.find((group) => group.id === student?.groupId)?.name ?? '반 미지정';
        const submission = getLatestSubmission(mission.id);
        return (
          <button key={mission.id} type="button" onClick={() => navigate(`/missions/${mission.id}/review`)} className="flex min-h-[76px] w-full items-center gap-3 rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC] p-3 text-left shadow-[0_2px_10px_rgba(20,35,59,.035)]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E9EDF2] font-bold text-[#14233B]">{student?.profileImage ? <img src={student.profileImage} alt="" className="h-full w-full object-cover"/> : student?.name.slice(0, 1) ?? <ClipboardCheck size={18}/>}</span>
            <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#14233B]">{student?.name ?? '알 수 없는 학생'} · {mission.title}</strong><span className="mt-1 block text-[11px] text-[#687282]">{groupName}{submission ? ` · ${formatDateTime(submission.submittedAt)}` : ''}</span></span>
            <ChevronRight size={17} className="shrink-0 text-[#A7ABB2]"/>
          </button>
        );
      })}
    </div>
  );

  return embedded ? content : <main className="content-area px-4 py-4">{content}</main>;
}
