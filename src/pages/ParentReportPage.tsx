import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, MessageCircle, Send, Share2, Sparkles, Target } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import type { Mission } from '../types';
import { formatDate, formatDateTime } from '../utils/helpers';
import { getActiveDemoScenario } from '../data/demoSession';
import { getDemoFacilitatorLabel } from '../data/demoScenarios';

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

function Empty({ children }: { children: string }) {
  return <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">{children}</p>;
}

function MissionRows({ missions, empty }: { missions: Mission[]; empty: string }) {
  return missions.length === 0 ? <Empty>{empty}</Empty> : <div className="space-y-2">{missions.map((mission) => <div key={mission.id} className="rounded-2xl bg-slate-50 p-3"><div className="flex items-start justify-between gap-2"><strong className="text-sm text-slate-800">{mission.title}</strong><span className="shrink-0 text-[10px] font-bold text-slate-400">{formatDate(mission.endDate)}</span></div>{mission.description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{mission.description}</p>}</div>)}</div>;
}

export default function ParentReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, currentUser, teacherNotes } = useAuthStore();
  const groups = useGroupStore((state) => state.groups);
  const { missions, submissions, reviewLogs } = useMissionStore();
  const [shareNotice, setShareNotice] = useState('');
  const student = users.find((user) => user.id === id);
  const scenario = currentUser?.id.startsWith('demo-') ? getActiveDemoScenario() : null;
  const memberLabel = scenario?.memberLabel ?? '학생';
  const facilitatorLabel = scenario ? getDemoFacilitatorLabel(scenario.id) : '선생님';

  const studentMissions = useMemo(() => missions.filter((mission) => mission.assigneeId === id && (!currentUser || currentUser.role === 'CHILD' || mission.creatorId === currentUser.id)), [missions, id, currentUser]);
  const studentMissionIds = new Set(studentMissions.map((mission) => mission.id));
  const completed = [...studentMissions].filter((mission) => mission.status === 'SUCCESS').sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()).slice(0, 4);
  const active = [...studentMissions].filter((mission) => ['PENDING', 'IN_PROGRESS', 'REVIEWING', 'REJECTED'].includes(mission.status)).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()).slice(0, 4);
  const studentSubmissions = [...submissions].filter((submission) => submission.userId === id && studentMissionIds.has(submission.missionId)).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  const recentActivity = studentSubmissions.slice(0, 4);
  const revisions = studentSubmissions.filter((submission) => submission.attemptNumber > 1).slice(0, 3);
  const photos = studentSubmissions.filter((submission) => submission.imageUrl).slice(0, 4);
  const feedback = [...reviewLogs].filter((log) => studentMissions.some((mission) => mission.id === log.missionId) && log.reason).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  const notes = teacherNotes[id ?? ''] ?? [];
  const groupName = groups.find((group) => group.id === student?.groupId)?.name ?? '반 미지정';
  const teacherName = currentUser?.role === 'CHILD'
    ? users.find((user) => user.id === studentMissions[0]?.creatorId)?.name ?? '담당'
    : currentUser?.name ?? '담당';
  const titleFor = (missionId: string) => studentMissions.find((mission) => mission.id === missionId)?.title ?? '미션';
  const strengths = completed.length > 0 ? `‘${completed[0].title}’ 미션을 마무리하며 맡은 활동을 끝까지 수행했습니다.` : recentActivity.length > 0 ? '최근 활동을 제출하며 꾸준히 참여하고 있습니다.' : '앞으로의 활동을 차근차근 기록해 나갈 예정입니다.';
  const nextGoal = active.length > 0 ? `다음 목표는 ‘${active[0].title}’ 미션을 이어가는 것입니다.` : revisions.length > 0 ? `‘${titleFor(revisions[0].missionId)}’ 미션의 수정 내용을 다시 확인해 주세요.` : '다음 미션을 정하면 작은 단계부터 시작해 주세요.';
  const oneLineNote = notes[0]?.text ?? '최근 활동을 함께 살펴보고 다음 목표를 응원해 주세요.';

  if (!student) return <div className="page-container"><main className="content-area flex items-center justify-center text-sm font-bold text-slate-400">{memberLabel}을 찾을 수 없습니다.</main></div>;

  const shareText = `${student.name} ${memberLabel} 활동 리포트\n\n최근 활동: ${recentActivity.length ? recentActivity.map((item) => titleFor(item.missionId)).join(', ') : '기록 없음'}\n최근 완료: ${completed.length ? completed.map((mission) => mission.title).join(', ') : '기록 없음'}\n현재 진행: ${active.length ? active.map((mission) => mission.title).join(', ') : '없음'}\n\n잘한 점: ${strengths}\n다음 목표: ${nextGoal}\n${facilitatorLabel} 메모: ${oneLineNote}`;
  const handleShare = async () => {
    setShareNotice('');
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: `${student.name} 활동 리포트`, text: shareText, url: window.location.href });
        setShareNotice('공유 화면을 열었습니다.');
      } else {
        try { await navigator.clipboard.writeText(shareText); } catch { fallbackCopy(shareText); }
        setShareNotice('리포트 내용을 복사했습니다.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try { fallbackCopy(shareText); setShareNotice('리포트 내용을 복사했습니다.'); } catch { setShareNotice('공유하지 못했습니다. 다시 시도해 주세요.'); }
    }
  };

  return <div className="min-h-screen bg-slate-100 py-4">
    <main className="mx-auto w-full max-w-md px-4 pb-24">
      <div className="mb-4 flex items-center gap-3"><button onClick={() => navigate(-1)} aria-label="뒤로 가기" className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm"><ArrowLeft size={18}/></button><div className="min-w-0 flex-1"><h1 className="font-black text-slate-900">보호자 활동 리포트</h1><p className="text-[11px] font-bold text-slate-400">{memberLabel}의 최근 활동을 편하게 읽는 기록</p></div><button onClick={handleShare} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-black text-white"><Share2 size={14}/>공유</button></div>
      {shareNotice && <p role="status" className={`mb-3 rounded-xl px-3 py-2 text-center text-xs font-black ${shareNotice.includes('못') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{shareNotice}</p>}

      <article className="overflow-hidden rounded-[28px] bg-white shadow-lg">
        <header className="bg-gradient-to-br from-violet-700 to-indigo-800 p-6 text-white"><p className="text-xs font-black text-violet-200">{formatDate(new Date(Date.now() - 29 * 86400000).toISOString())} ~ {formatDate(new Date().toISOString())}</p><div className="mt-4 flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-4xl">{student.profileImage ? <img src={student.profileImage} alt={`${student.name} 프로필`} className="h-full w-full object-cover"/> : student.avatar}</div><div><h2 className="text-2xl font-black">{student.name}</h2><p className="mt-1 text-xs font-bold text-white/65">{groupName} · {teacherName} {facilitatorLabel}</p></div></div></header>

        <div className="space-y-7 p-5">
          <section><div className="mb-3 flex items-center gap-2"><Send size={17} className="text-purple-600"/><h3 className="font-black text-slate-800">최근 활동</h3></div>{recentActivity.length === 0 ? <Empty>최근 제출 활동이 없습니다.</Empty> : <div className="space-y-2">{recentActivity.map((submission) => <div key={submission.id} className="rounded-2xl bg-purple-50 p-3"><div className="flex items-start justify-between gap-2"><strong className="text-sm text-slate-800">{titleFor(submission.missionId)}</strong><span className="shrink-0 text-[10px] font-bold text-purple-500">{formatDateTime(submission.submittedAt)}</span></div>{submission.message && <p className="mt-2 text-xs leading-relaxed text-slate-600">{submission.message}</p>}</div>)}</div>}</section>
          <section><div className="mb-3 flex items-center gap-2"><CheckCircle2 size={17} className="text-emerald-600"/><h3 className="font-black text-slate-800">최근 완료한 미션</h3></div><MissionRows missions={completed} empty="최근 완료한 미션이 없습니다."/></section>
          <section><div className="mb-3 flex items-center gap-2"><Target size={17} className="text-blue-600"/><h3 className="font-black text-slate-800">현재 진행 중인 미션</h3></div><MissionRows missions={active} empty="현재 진행 중인 미션이 없습니다."/></section>
          <section><div className="mb-3 flex items-center gap-2"><MessageCircle size={17} className="text-indigo-600"/><h3 className="font-black text-slate-800">{facilitatorLabel} 피드백</h3></div>{feedback.length === 0 ? <Empty>최근 전달된 피드백이 없습니다.</Empty> : <div className="space-y-2">{feedback.map((log) => <div key={log.id} className="rounded-2xl bg-indigo-50 p-3"><strong className="text-xs text-indigo-800">{titleFor(log.missionId)}</strong><p className="mt-1 text-sm leading-relaxed text-slate-700">{log.reason}</p></div>)}</div>}</section>
          <section><div className="mb-3 flex items-center gap-2"><Send size={17} className="text-amber-600"/><h3 className="font-black text-slate-800">수정·보완한 내용</h3></div>{revisions.length === 0 ? <Empty>다시 제출한 기록이 없습니다.</Empty> : <div className="space-y-2">{revisions.map((submission) => <div key={submission.id} className="rounded-2xl bg-amber-50 p-3"><strong className="text-xs text-amber-800">{titleFor(submission.missionId)} · {submission.attemptNumber}회차</strong><p className="mt-1 text-sm leading-relaxed text-slate-700">{submission.message || '내용을 보완해 다시 제출했습니다.'}</p></div>)}</div>}</section>
          <section><div className="mb-3 flex items-center gap-2"><Camera size={17} className="text-rose-600"/><h3 className="font-black text-slate-800">활동 사진</h3></div>{photos.length === 0 ? <Empty>공유할 활동 사진이 없습니다.</Empty> : <div className="grid grid-cols-2 gap-2">{photos.map((submission) => <figure key={submission.id} className="overflow-hidden rounded-2xl bg-slate-100"><img src={submission.imageUrl} alt={`${titleFor(submission.missionId)} 활동`} className="aspect-square w-full object-cover"/><figcaption className="truncate px-2 py-2 text-[10px] font-bold text-slate-500">{titleFor(submission.missionId)}</figcaption></figure>)}</div>}</section>
          <section className="rounded-3xl bg-emerald-50 p-4"><div className="flex items-center gap-2"><Sparkles size={17} className="text-emerald-600"/><h3 className="font-black text-emerald-900">잘한 점</h3></div><p className="mt-2 text-sm leading-relaxed text-emerald-900">{strengths}</p></section>
          <section className="rounded-3xl bg-blue-50 p-4"><div className="flex items-center gap-2"><Target size={17} className="text-blue-600"/><h3 className="font-black text-blue-900">다음 목표</h3></div><p className="mt-2 text-sm leading-relaxed text-blue-900">{nextGoal}</p></section>
          <section className="rounded-3xl border border-violet-100 bg-violet-50 p-4"><p className="text-xs font-black text-violet-600">{facilitatorLabel} 한줄메모</p><p className="mt-2 text-base font-bold leading-relaxed text-slate-800">“{oneLineNote}”</p></section>
        </div>
      </article>
    </main>
  </div>;
}
