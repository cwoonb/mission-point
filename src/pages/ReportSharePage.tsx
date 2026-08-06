import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Link2, MessageSquare, Share2, UserRound, XCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import { secureBackendEnabled, supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useGuardianStore } from '../store/guardianStore';
import { useMembershipStore } from '../store/membershipStore';
import { useMissionStore } from '../store/missionStore';
import { useReportContentStore } from '../store/reportContentStore';
import type { GuardianReport, ReportSnapshot } from '../types';
import { revokeDemoReportSnapshot, saveDemoReportSnapshot } from '../utils/demoReportSnapshot';
import { formatDateTime } from '../utils/helpers';
import { isStudentInOrganization } from '../utils/membershipAccess';

type ShareHistory = { id: string; reportId: string; guardianId?: string; expiresAt: string; revokedAt?: string; createdAt: string };

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
  const { currentUser, users, isDemoMode } = useAuthStore();
  const groups = useGroupStore((state) => state.groups);
  const memberships = useMembershipStore((state) => state.memberships);
  const activeMembershipId = useMembershipStore((state) => state.activeMembershipId);
  const active = memberships.find((item) => item.id === activeMembershipId);
  const { missions, submissions, reviewLogs } = useMissionStore();
  const { guardians, links, initializeData } = useGuardianStore();
  const student = users.find((user) => user.id === id && isStudentInOrganization(memberships, user.id, active?.organizationId));
  const linked = links.filter((link) => link.studentId === id && link.organizationId === active?.organizationId && link.status === 'ACTIVE');
  const linkedGuardians = linked.map((link) => ({ link, guardian: guardians.find((guardian) => guardian.id === link.guardianId) })).filter((item) => item.guardian);
  const primaryGuardianId = linked.find((link) => link.isPrimary)?.guardianId ?? linked[0]?.guardianId ?? '';
  const [selectedGuardianId, setSelectedGuardianId] = useState('');
  const [notice, setNotice] = useState('');
  const [reportUrl, setReportUrl] = useState('');
  const [activeTokenId, setActiveTokenId] = useState('');
  const [demoToken, setDemoToken] = useState('');
  const [creating, setCreating] = useState(false);
  const [history, setHistory] = useState<ShareHistory[]>([]);
  const { load } = useReportContentStore();
  const teacherMemo = useReportContentStore((state) => active?.organizationId && id ? state.getMemo(active.organizationId, id) : '');

  useEffect(() => { if (!selectedGuardianId && primaryGuardianId) setSelectedGuardianId(primaryGuardianId); }, [primaryGuardianId, selectedGuardianId]);
  useEffect(() => {
    if (!active?.organizationId || !id) return;
    void load(active.organizationId, id).catch(() => setNotice('저장된 공개 메모를 불러오지 못했습니다.'));
    void initializeData(active.organizationId).catch(() => setNotice('보호자 정보를 불러오지 못했습니다.'));
  }, [active?.organizationId, id, initializeData, load]);

  const loadHistory = async () => {
    if (isDemoMode || !active?.organizationId || !id) return;
    const { data, error } = await supabase.from('public_report_tokens')
      .select('id,report_id,guardian_id,expires_at,revoked_at,created_at,reports!inner(student_id,organization_id)')
      .eq('reports.student_id', id).eq('reports.organization_id', active.organizationId)
      .order('created_at', { ascending: false });
    if (error) return;
    setHistory((data ?? []).map((row) => ({ id: row.id, reportId: row.report_id, guardianId: row.guardian_id ?? undefined, expiresAt: row.expires_at, revokedAt: row.revoked_at ?? undefined, createdAt: row.created_at })));
  };
  useEffect(() => { void loadHistory(); }, [active?.organizationId, id, isDemoMode]);

  const snapshot = useMemo<ReportSnapshot | null>(() => {
    if (!student) return null;
    const studentMissions = missions.filter((mission) => mission.assigneeId === student.id && mission.organizationId === active?.organizationId);
    const missionIds = new Set(studentMissions.map((mission) => mission.id));
    const recent = submissions.filter((submission) => submission.userId === student.id && missionIds.has(submission.missionId)).sort((a,b)=>Date.parse(b.submittedAt)-Date.parse(a.submittedAt)).slice(0,8);
    const feedback = reviewLogs.filter((log) => missionIds.has(log.missionId) && log.action === 'APPROVED' && log.publicFeedback).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,5);
    const completed = studentMissions.filter((mission) => mission.status === 'SUCCESS').slice(0,8);
    const ongoing = studentMissions.filter((mission) => ['PENDING','IN_PROGRESS','REVIEWING','REJECTED'].includes(mission.status)).slice(0,8);
    const title = (missionId:string) => studentMissions.find((mission)=>mission.id===missionId)?.title ?? '미션';
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      periodStart: new Date(Date.now() - 30 * 86400000).toISOString(),
      teacherName: currentUser?.name,
      student: { name: student.name, group: groups.find((group)=>group.id===student.groupId && group.organizationId===active?.organizationId)?.name ?? '소속 반' },
      recentActivities: recent.map((item)=>({ title:title(item.missionId), date:item.submittedAt, comment:item.message ?? '' })),
      completedMissions: completed.map((item)=>({ title:item.title, date:item.endDate })),
      ongoingMissions: ongoing.map((item)=>({ title:item.title, dueDate:item.endDate, status:item.status })),
      feedback: feedback.map((item)=>({ mission:title(item.missionId), text:item.publicFeedback ?? '', date:item.createdAt, action:item.action })),
      photos: recent.flatMap((item)=>item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : []).slice(0,6),
      strengths: completed.length ? '꾸준히 활동에 참여하며 완료한 기록을 쌓고 있습니다.' : '새 활동을 시작할 수 있도록 함께 준비하고 있습니다.',
      nextGoal: ongoing[0] ? `${ongoing[0].title} 활동을 차분히 마무리해 보세요.` : '지금의 좋은 활동 흐름을 이어가 보세요.',
      teacherMemo,
    };
  }, [active?.organizationId, currentUser?.name, groups, missions, reviewLogs, student, submissions, teacherMemo]);

  const createLink = async () => {
    if (!student || !snapshot || !active?.organizationId || creating) return;
    const guardianId = selectedGuardianId || undefined;
    const reportId = `report-${active.organizationId}-${student.id}-${crypto.randomUUID()}`;
    if (isDemoMode) {
      const token = saveDemoReportSnapshot(snapshot);
      const report: GuardianReport = { id: reportId, organizationId: active.organizationId, studentId: student.id, createdBy: currentUser?.id ?? 'demo', snapshot, createdAt: snapshot.generatedAt, updatedAt: snapshot.generatedAt };
      useGuardianStore.setState((state) => ({ reports: [report, ...state.reports.filter((item) => item.id !== report.id)] }));
      setDemoToken(token);
      setActiveTokenId(token);
      setReportUrl(`${window.location.origin}/r/${token}`);
      setNotice('현재 브라우저에서 7일 동안 열리는 데모 보호자 링크를 만들었습니다.');
      return;
    }
    if (!secureBackendEnabled) { setNotice('공개 리포트 보안 설정이 서버에 적용되지 않았습니다.'); return; }
    setCreating(true);
    setNotice('');
    const { data, error } = await supabase.rpc('create_guardian_report', {
      report_id: reportId,
      target_org: active.organizationId,
      target_student: student.id,
      target_guardian: guardianId ?? null,
      report_snapshot: snapshot,
      valid_days: 7,
    });
    setCreating(false);
    if (error || !data) { setNotice('공유 링크를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.'); return; }
    const result = data as { raw_token: string; token_id: string };
    setActiveTokenId(result.token_id);
    setReportUrl(`${window.location.origin}/r/${result.raw_token}`);
    setNotice('7일 동안 열리는 보호자용 링크를 만들었습니다.');
    await initializeData(active.organizationId);
    await loadHistory();
  };

  const revoke = async (tokenId = activeTokenId) => {
    if (!tokenId) return;
    if (isDemoMode) {
      revokeDemoReportSnapshot(demoToken || tokenId);
    } else {
      const { error } = await supabase.rpc('revoke_public_report_token', { target_token: tokenId });
      if (error) { setNotice('링크를 취소하지 못했습니다.'); return; }
      await loadHistory();
    }
    if (tokenId === activeTokenId) { setReportUrl(''); setActiveTokenId(''); }
    setNotice('공개 링크를 취소했습니다. 기존 주소로는 더 이상 열 수 없습니다.');
  };

  const copy = async () => { if (!reportUrl) return; try { await navigator.clipboard.writeText(reportUrl); } catch { fallbackCopy(reportUrl); } setNotice('공개 리포트 링크를 복사했습니다.'); };
  const shareText = `${student?.name ?? '학생'} 활동 리포트가 준비되었습니다.\n${reportUrl}`;
  const share = async () => { if (!reportUrl || !navigator.share) return; try { await navigator.share({ title: `${student?.name ?? '학생'} 활동 리포트`, text: shareText, url: reportUrl }); } catch (error) { if ((error as DOMException).name !== 'AbortError') setNotice('공유 창을 열지 못했습니다.'); } };

  return <div className="page-container bg-[#F8F5F0]">
    <Header title="리포트 공유" showBack showPoints={false}/>
    <main className="content-area space-y-6 px-4 py-5">
      <section><h1 className="text-xl font-bold text-[#14233B]">받을 보호자를 선택하세요</h1><p className="mt-2 text-sm leading-6 text-[#687282]">선택한 보호자와 리포트 열람 이력을 연결합니다. 링크 자체는 로그인 없이 열립니다.</p></section>
      <section className="space-y-2">
        {linkedGuardians.map(({ guardian, link }) => guardian && <button type="button" key={guardian.id} onClick={() => setSelectedGuardianId(guardian.id)} className={`flex min-h-16 w-full items-center gap-3 rounded-[12px] border bg-[#FFFDFC] px-4 text-left ${selectedGuardianId === guardian.id ? 'border-[#C89B55]' : 'border-[#E1DBD3]'}`}><UserRound size={19} className="text-[#B58A4A]"/><span className="min-w-0 flex-1"><strong className="block text-sm text-[#14233B]">{guardian.name}</strong><span className="mt-1 block text-xs text-[#687282]">{link.relationship}{link.isPrimary ? ' · 주 보호자' : ''} · {guardian.email || guardian.phone || '연락처 미등록'}</span></span></button>)}
        <button type="button" onClick={() => setSelectedGuardianId('')} className={`min-h-12 w-full rounded-[10px] border px-4 text-left text-xs font-semibold ${selectedGuardianId === '' ? 'border-[#C89B55] bg-[#FFFCF7] text-[#14233B]' : 'border-[#E1DBD3] bg-[#FFFDFC] text-[#687282]'}`}>보호자 미지정 공개 링크</button>
        {linkedGuardians.length === 0 && <p className="rounded-[12px] bg-[#F1E7D6] px-4 py-3 text-xs leading-5 text-[#795B31]">연결된 보호자가 없습니다. 학생 상세의 보호자 탭에서 먼저 등록할 수 있습니다.</p>}
      </section>
      {!reportUrl ? <button type="button" onClick={createLink} disabled={creating || !student} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#14233B] text-sm font-bold text-white disabled:opacity-50"><Link2 size={17}/>{creating?'링크 만드는 중...':'공개 링크 만들기'}</button> : <section className="space-y-2 rounded-[14px] border border-[#D8D0C5] bg-[#FFFDFC] p-4"><h2 className="text-sm font-bold text-[#14233B]">공유 링크가 준비되었습니다</h2><button type="button" onClick={copy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-[#D8D0C5] text-sm font-bold text-[#14233B]"><Copy size={17}/>링크 복사</button>{typeof navigator.share === 'function' && <button type="button" onClick={share} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#C6944C] text-sm font-bold text-white"><Share2 size={17}/>기기 공유</button>}<a href={`sms:?&body=${encodeURIComponent(shareText)}`} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-[#D8D0C5] text-sm font-bold text-[#14233B]"><MessageSquare size={17}/>문자 메시지 공유</a><button type="button" onClick={() => void revoke()} className="flex min-h-11 w-full items-center justify-center gap-2 text-xs font-bold text-[#B35F5A]"><XCircle size={16}/>이 링크 취소</button></section>}
      {history.length > 0 && <section><h2 className="mb-2 text-sm font-bold text-[#14233B]">최근 공유 기록</h2><div className="divide-y divide-[#EEE9E2] overflow-hidden rounded-[12px] border border-[#E1DBD3] bg-[#FFFDFC]">{history.slice(0, 8).map((item) => { const guardian = guardians.find((entry) => entry.id === item.guardianId); const activeLink = !item.revokedAt && Date.parse(item.expiresAt) > Date.now(); return <div key={item.id} className="flex min-h-16 items-center gap-3 px-4 py-2"><div className="min-w-0 flex-1"><strong className="block text-xs text-[#14233B]">{guardian?.name ?? '보호자 미지정'}</strong><span className="mt-1 block text-[10px] text-[#8B929C]">{formatDateTime(item.createdAt)} · {activeLink ? '열람 가능' : item.revokedAt ? '취소됨' : '만료됨'}</span></div>{activeLink && <button type="button" onClick={() => void revoke(item.id)} className="min-h-11 px-2 text-[10px] font-bold text-[#B35F5A]">취소</button>}</div>; })}</div></section>}
      {notice && <p role="status" className="rounded-xl bg-[#EDF4EF] px-4 py-3 text-xs font-bold leading-5 text-[#3E6F50]">{notice}</p>}
      <button type="button" onClick={()=>navigate(`/students/${id}/report`,{replace:true})} className="min-h-11 w-full text-xs font-bold text-[#687282] underline underline-offset-4">리포트로 돌아가기</button>
    </main>
  </div>;
}
