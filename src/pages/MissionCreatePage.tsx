import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Check, Users } from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { useTemplateStore } from '../store/templateStore';
import { useMembershipStore } from '../store/membershipStore';
import type { MissionType, ParentShareType, RepeatType, SubmissionType } from '../types';

const dateInputValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = () => dateInputValue(new Date());
const nextWeek = () => { const date = new Date(); date.setDate(date.getDate() + 7); return dateInputValue(date); };
const TYPES: Array<[MissionType, string]> = [['HOMEWORK', '숙제'], ['VOCABULARY', '단어'], ['READING', '독서'], ['REVIEW_NOTES', '오답 정리'], ['ATTENDANCE', '출석'], ['LIFESTYLE', '생활 습관'], ['OTHER', '기타']];
const SUBMISSIONS: Array<[SubmissionType, string]> = [['IMAGE', '파일 제출'], ['TEXT', '글 제출'], ['BOTH', '파일 + 글']];
const REPEATS: Array<[RepeatType, string]> = [['ONCE', '한 번'], ['DAILY', '매일'], ['WEEKDAYS', '평일'], ['WEEKLY', '매주']];
const inputClass = 'mt-2 min-h-12 w-full rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] px-3 text-sm text-[#27313F] outline-none focus:border-[#14233B]';

export default function MissionCreatePage() {
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const activeMembership = useMembershipStore((state) => state.memberships.find((membership) => membership.id === state.activeMembershipId));
  const personal = useMembershipStore((state) => state.organizations.find((organization) => organization.id === activeMembership?.organizationId)?.type === 'PERSONAL');
  const groups = useGroupStore((state) => state.groups.filter((group) => !currentUser || group.facilitatorId === currentUser.id));
  const createMission = useMissionStore((state) => state.createMission);
  const { templates, incrementUsage } = useTemplateStore();
  const students = users.filter((user) => user.role === 'CHILD' && (!currentUser?.socialProvider || user.facilitatorId === currentUser.id));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetMode, setTargetMode] = useState<'group' | 'student'>('group');
  const [groupId, setGroupId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [missionType, setMissionType] = useState<MissionType>('HOMEWORK');
  const [submissionType, setSubmissionType] = useState<SubmissionType>('BOTH');
  const [repeatType, setRepeatType] = useState<RepeatType>('ONCE');
  const [parentShare, setParentShare] = useState<ParentShareType>('NONE');
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(nextWeek());
  const [templateOpen, setTemplateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const targetIds = personal && currentUser ? [currentUser.id] : targetMode === 'group' ? students.filter((student) => student.groupId === groupId).map((student) => student.id) : selectedIds;
  const valid = !!currentUser && !!title.trim() && (personal || !!description.trim()) && targetIds.length > 0 && !!startDate && !!endDate && startDate <= endDate;

  const save = async () => {
    if (!valid || !currentUser || saving) { setError(personal ? 'TODO 제목과 마감일을 확인해 주세요.' : '제목, 설명, 대상, 기간을 모두 확인해 주세요.'); return; }
    setSaving(true); setError('');
    const base = { title: title.trim(), description: description.trim() || title.trim(), rewardPoint: 0, creatorId: currentUser.id, submissionType: personal ? 'TEXT' as const : submissionType, startDate: new Date(`${startDate}T00:00:00`).toISOString(), endDate: new Date(`${endDate}T23:59:59`).toISOString(), missionType: personal ? 'OTHER' as const : missionType, missionGoal: 'STUDY_HABIT' as const, repeatType, parentShare: personal ? 'NONE' as const : parentShare };
    try {
      await Promise.all(targetIds.map((assigneeId) => createMission({ ...base, assigneeId })));
      navigate('/missions', { replace: true });
    } catch (cause) {
      setError(cause instanceof Error && cause.message === 'MISSION_SCHEMA_UPDATE_REQUIRED' ? '소속별 미션 저장을 위한 운영 데이터 설정이 필요합니다. 관리자에게 문의해 주세요.' : '미션을 저장하지 못했습니다. 입력 내용은 유지됩니다. 네트워크 연결을 확인하고 다시 시도해 주세요.');
      setSaving(false);
    }
  };

  const applyTemplate = (id: string) => {
    const template = templates.find((item) => item.id === id); if (!template) return;
    setTitle(template.title); setDescription(template.description); setSubmissionType(template.submissionType); setMissionType(template.missionType ?? 'OTHER'); setRepeatType(template.repeatType ?? 'ONCE'); setParentShare(template.parentShare ?? 'NONE'); incrementUsage(id); setTemplateOpen(false);
  };

  const toggleStudent = (id: string) => setSelectedIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  return (
    <div className="page-container bg-[#F8F5F0]">
      <Header title={personal ? '새 TODO 작성' : '새 미션 만들기'} showBack showPoints={false} rightElement={<button type="button" onClick={save} disabled={!valid || saving} className="min-h-11 px-2 text-sm font-bold text-[#14233B] disabled:text-[#A7ABB2]">{saving ? '저장 중' : '저장'}</button>}/>
      <main className="content-area space-y-6 px-4 py-5">
        {!personal && <button type="button" onClick={() => setTemplateOpen(true)} className="flex min-h-12 w-full items-center gap-3 rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] px-3 text-left"><BookOpen size={17} className="text-[#B58A4A]"/><span className="flex-1 text-sm font-semibold text-[#14233B]">템플릿에서 불러오기</span><span className="text-xs text-[#8B929C]">{templates.length}개</span></button>}

        <section>
          <label htmlFor="mission-title" className="text-xs font-bold text-[#53606F]">{personal ? '할 일' : '미션 제목'}</label>
          <input id="mission-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={50} placeholder={personal ? '예: 계약서 검토하기' : '미션 제목을 입력하세요'} className={inputClass}/>
        </section>
        <section>
          <label htmlFor="mission-description" className="text-xs font-bold text-[#53606F]">{personal ? '메모 · 선택' : '설명'}</label>
          <textarea id="mission-description" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={300} rows={personal ? 3 : 4} placeholder={personal ? '필요한 내용이나 순서를 적어 두세요.' : '학생이 해야 할 내용을 구체적으로 적어주세요.'} className={`${inputClass} resize-none py-3`}/>
        </section>

        {!personal && <section>
          <h2 className="text-xs font-bold text-[#53606F]">대상</h2>
          <div className="mt-2 grid grid-cols-2 rounded-[10px] bg-[#EDE9E3] p-1">{([['group', '반 선택'], ['student', '학생 선택']] as const).map(([key, label]) => <button type="button" key={key} onClick={() => setTargetMode(key)} className={`min-h-10 rounded-[8px] text-xs font-bold ${targetMode === key ? 'bg-[#FFFDFC] text-[#14233B] shadow-sm' : 'text-[#7D8490]'}`}>{label}</button>)}</div>
          {targetMode === 'group' ? <select value={groupId} onChange={(event) => setGroupId(event.target.value)} className={inputClass}><option value="">반을 선택하세요</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name} · {students.filter((student) => student.groupId === group.id).length}명</option>)}</select> : <div className="mt-2 max-h-64 divide-y divide-[#ECE7E0] overflow-y-auto rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC]">{students.map((student) => { const checked = selectedIds.includes(student.id); return <button type="button" key={student.id} onClick={() => toggleStudent(student.id)} className="flex min-h-12 w-full items-center gap-3 px-3 text-left"><span className={`flex h-5 w-5 items-center justify-center rounded border ${checked ? 'border-[#14233B] bg-[#14233B] text-white' : 'border-[#C8C1B8]'}`}>{checked && <Check size={13}/>}</span><span className="flex-1 text-sm font-semibold text-[#27313F]">{student.name}</span><span className="text-[10px] text-[#8B929C]">{groups.find((group) => group.id === student.groupId)?.name ?? '미배정'}</span></button>; })}{students.length === 0 && <EmptyState title="등록된 학생이 없습니다."/>}</div>}
          {targetIds.length > 0 && <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#4F8A68]"><Users size={14}/>{targetIds.length}명에게 배정됩니다.</p>}
        </section>}

        {!personal && <section>
          <label htmlFor="mission-type" className="text-xs font-bold text-[#53606F]">과목 및 유형</label>
          <select id="mission-type" value={missionType} onChange={(event) => setMissionType(event.target.value as MissionType)} className={inputClass}>{TYPES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        </section>}

        <section>
          <h2 className="text-xs font-bold text-[#53606F]">{personal ? '마감일' : '기간 설정'}</h2>
          {personal ? <input aria-label="마감일" type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} className={inputClass}/> : <div className="mt-2 grid grid-cols-2 gap-2"><label className="text-[10px] text-[#8B929C]">시작일<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`${inputClass} mt-1`}/></label><label className="text-[10px] text-[#8B929C]">종료일<input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} className={`${inputClass} mt-1`}/></label></div>}
        </section>

        {!personal && <section><label htmlFor="submission-type" className="text-xs font-bold text-[#53606F]">제출 형식</label><select id="submission-type" value={submissionType} onChange={(event) => setSubmissionType(event.target.value as SubmissionType)} className={inputClass}>{SUBMISSIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></section>}
        <section><label htmlFor="repeat-type" className="text-xs font-bold text-[#53606F]">반복</label><select id="repeat-type" value={repeatType} onChange={(event) => setRepeatType(event.target.value as RepeatType)} className={inputClass}>{REPEATS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></section>
        {!personal && <label className="flex min-h-12 items-center justify-between rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] px-3"><span><strong className="block text-sm text-[#27313F]">완료 후 리포트에 포함</strong><span className="text-[10px] text-[#8B929C]">보호자 활동 리포트에서 확인할 수 있습니다.</span></span><input type="checkbox" checked={parentShare !== 'NONE'} onChange={(event) => setParentShare(event.target.checked ? 'ON_COMPLETE' : 'NONE')} className="h-5 w-5 accent-[#14233B]"/></label>}
        {error && <p role="alert" className="rounded-[10px] bg-[#F8EAE8] px-3 py-2 text-xs font-bold text-[#A14E49]">{error}</p>}
        <button type="button" onClick={save} disabled={!valid || saving} className="min-h-12 w-full rounded-[10px] bg-[#14233B] text-sm font-bold text-white disabled:bg-[#A7ABB2]">{saving ? '저장 중...' : personal ? 'TODO 추가' : targetIds.length > 0 ? `${targetIds.length}명에게 미션 저장` : '미션 저장'}</button>
      </main>

      <Modal isOpen={templateOpen} onClose={() => setTemplateOpen(false)} title="템플릿 선택">
        <div className="space-y-2">{templates.map((template) => <button type="button" key={template.id} onClick={() => applyTemplate(template.id)} className="w-full rounded-[10px] border border-[#E7E1D9] p-3 text-left"><strong className="block text-sm text-[#14233B]">{template.name}</strong><span className="mt-1 block line-clamp-2 text-xs leading-5 text-[#687282]">{template.description}</span></button>)}{templates.length === 0 && <EmptyState title="저장된 템플릿이 없습니다."/>}</div>
      </Modal>
    </div>
  );
}
