import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Copy, Link2, MessageSquare, Share2 } from 'lucide-react';
import Header from '../components/layout/Header';
import { secureBackendEnabled, supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMembershipStore } from '../store/membershipStore';
import { useMissionStore } from '../store/missionStore';

function fallbackCopy(text: string) {
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  area.remove();
}

export default function ReportSharePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, teacherNotes } = useAuthStore();
  const groups = useGroupStore((state) => state.groups);
  const active = useMembershipStore((state) => state.memberships.find((item) => item.id === state.activeMembershipId));
  const { missions, submissions, reviewLogs } = useMissionStore();
  const student = users.find((user) => user.id === id);
  const [notice, setNotice] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const snapshot = useMemo(() => {
    if (!student) return null;
    const studentMissions = missions.filter((mission) => mission.assigneeId === student.id && mission.organizationId === active?.organizationId);
    const missionIds = new Set(studentMissions.map((mission) => mission.id));
    const recent = submissions.filter((submission) => submission.userId === student.id && missionIds.has(submission.missionId)).sort((a,b)=>Date.parse(b.submittedAt)-Date.parse(a.submittedAt)).slice(0,8);
    const feedback = reviewLogs.filter((log) => missionIds.has(log.missionId) && log.reason).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,5);
    const completed = studentMissions.filter((mission) => mission.status === 'SUCCESS').slice(0,8);
    const ongoing = studentMissions.filter((mission) => ['PENDING','IN_PROGRESS','REVIEWING','REJECTED'].includes(mission.status)).slice(0,8);
    const title = (missionId:string) => studentMissions.find((mission)=>mission.id===missionId)?.title ?? '미션';
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      student: { name: student.name, group: groups.find((group)=>group.id===student.groupId)?.name ?? '소속 반' },
      recentActivities: recent.map((item)=>({ title:title(item.missionId), date:item.submittedAt, comment:item.message ?? '' })),
      completedMissions: completed.map((item)=>({ title:item.title, date:item.endDate })),
      ongoingMissions: ongoing.map((item)=>({ title:item.title, dueDate:item.endDate, status:item.status })),
      feedback: feedback.map((item)=>({ mission:title(item.missionId), text:item.reason, date:item.createdAt, action:item.action })),
      photos: recent.flatMap((item)=>item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : []).slice(0,6),
      strengths: completed.length ? '꾸준히 활동에 참여하며 완료한 기록을 쌓고 있습니다.' : '새 활동을 시작할 수 있도록 함께 준비하고 있습니다.',
      nextGoal: ongoing[0] ? `${ongoing[0].title} 활동을 차분히 마무리해 보세요.` : '지금의 좋은 활동 흐름을 이어가 보세요.',
      teacherMemo: (teacherNotes[student.id] ?? [])[0]?.text ?? '학생의 활동 과정을 꾸준히 살펴보고 있습니다.',
    };
  }, [active?.organizationId, groups, missions, reviewLogs, student, submissions, teacherNotes]);

  const createLink = async () => {
    if (!student || !snapshot || !active?.organizationId || creating) return;
    if (!secureBackendEnabled) { setNotice('공개 리포트 보안 설정이 아직 서버에 적용되지 않았습니다.'); return; }
    setCreating(true);
    setNotice('');
    const reportId = `report-${active.organizationId}-${student.id}`;
    const { data, error } = await supabase.rpc('create_public_report', {
      report_id: reportId,
      target_org: active.organizationId,
      target_student: student.id,
      report_snapshot: snapshot,
      valid_days: 7,
    });
    setCreating(false);
    if (error || !data) {
      setNotice(error?.code === 'PGRST202' ? '공개 리포트 보안 설정이 아직 서버에 적용되지 않았습니다.' : '공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setReportUrl(`${window.location.origin}/r/${data as string}`);
    setNotice('7일 동안 열리는 보호자용 링크를 만들었습니다.');
  };

  const copy = async () => {
    if (!reportUrl) return;
    try { await navigator.clipboard.writeText(reportUrl); } catch { fallbackCopy(reportUrl); }
    setNotice('공개 리포트 링크를 복사했습니다.');
  };
  const shareText = `${student?.name ?? '학생'} 활동 리포트가 준비되었습니다.\n${reportUrl}`;
  const share = async () => {
    if (!reportUrl || !navigator.share) return;
    try { await navigator.share({ title: `${student?.name ?? '학생'} 활동 리포트`, text: shareText, url: reportUrl }); }
    catch (error) { if ((error as DOMException).name !== 'AbortError') setNotice('공유 창을 열지 못했습니다.'); }
  };

  return <div className="page-container bg-[#F8F5F0]">
    <Header title="리포트 공유" showBack showPoints={false}/>
    <main className="content-area flex min-h-[calc(100dvh-9rem)] flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#14233B] text-[#14233B]"><Check size={34}/></span>
      <h1 className="mt-6 text-xl font-bold text-[#14233B]">보호자용 공개 링크</h1>
      <p className="mt-2 text-sm leading-6 text-[#687282]">로그인 없이 볼 수 있고 7일 후 자동 만료됩니다.</p>
      {!reportUrl ? <button type="button" onClick={createLink} disabled={creating || !student} className="mt-8 flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#14233B] text-sm font-bold text-white disabled:opacity-50"><Link2 size={17}/>{creating?'링크 만드는 중...':'공개 링크 만들기'}</button> : <div className="mt-8 w-full space-y-2">
        <button type="button" onClick={copy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] text-sm font-bold text-[#14233B]"><Copy size={17}/>링크 복사</button>
        {typeof navigator.share === 'function' && <button type="button" onClick={share} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#C6944C] text-sm font-bold text-white"><Share2 size={17}/>기기 공유</button>}
        <a href={`sms:?&body=${encodeURIComponent(shareText)}`} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] text-sm font-bold text-[#14233B]"><MessageSquare size={17}/>문자 메시지 공유</a>
      </div>}
      {notice && <p role="status" className="mt-4 rounded-xl bg-[#EDF4EF] px-4 py-2 text-xs font-bold text-[#3E6F50]">{notice}</p>}
      <button type="button" onClick={()=>navigate(`/students/${id}/report`,{replace:true})} className="mt-6 min-h-11 text-xs font-bold text-[#687282] underline underline-offset-4">리포트로 돌아가기</button>
    </main>
  </div>;
}
