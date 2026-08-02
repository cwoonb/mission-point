import { useState } from 'react';
import { CheckSquare2, ChevronLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EmptyState from '../components/ui/EmptyState';
import { useAuthStore } from '../store/authStore';
import { useMembershipStore } from '../store/membershipStore';

type SetupMode = 'create' | 'join' | 'personal';

export function organizationSetupErrorMessage(cause: unknown, mode: SetupMode) {
  const message = cause instanceof Error ? cause.message : '';
  if (message.includes('AUTH_REQUIRED')) return '로그인 연결을 확인할 수 없습니다. 다시 로그인한 뒤 시도해 주세요.';
  if (message.includes('PERSONAL_WORKSPACE_SETUP_REQUIRED')) return '개인 TODO 저장 공간 설정이 필요합니다. 잠시 후 다시 시도해 주세요.';
  if (message.includes('duplicate key') || message.includes('unique constraint')) return '이미 사용 중인 정보입니다. 이름을 바꿔 다시 시도해 주세요.';
  if (mode === 'join') return '초대 코드를 확인하지 못했습니다. 코드를 다시 확인해 주세요.';
  return '저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}

export default function MembershipSetupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { createOrganization, joinOrganization, selectMembership } = useMembershipStore();
  const initialMode: SetupMode = params.get('action') === 'join' ? 'join' : params.get('action') === 'personal' ? 'personal' : 'create';
  const [mode, setMode] = useState<SetupMode>(initialMode);
  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!currentUser) return <EmptyState title="로그인이 필요합니다." />;

  const changeMode = (next: SetupMode) => { setMode(next); setError(''); };
  const complete = async () => {
    if (saving) return;
    if (mode === 'create' && !name.trim()) { setError('기관명 또는 그룹명을 입력해 주세요.'); return; }
    if (mode === 'join' && !code.trim()) { setError('초대 코드를 입력해 주세요.'); return; }
    setSaving(true); setError('');
    try {
      const membership = mode === 'join'
        ? await joinOrganization(currentUser.id, code)
        : await createOrganization(
          currentUser.id,
          mode === 'personal' ? `${currentUser.name}의 TODO` : name,
          'OWNER',
          mode === 'create' ? groupName : undefined,
          mode === 'personal' ? 'PERSONAL' : 'EDUCATION',
        );
      if (!membership) { setError('초대 코드를 확인해 주세요.'); return; }
      selectMembership(membership.id);
      navigate('/', { replace: true });
    } catch (cause) {
      setError(organizationSetupErrorMessage(cause, mode));
    } finally {
      setSaving(false);
    }
  };

  return <div className="page-container bg-[#F8F5F0]">
    <main className="min-h-[100dvh] px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <button onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center" aria-label="뒤로 가기"><ChevronLeft size={20}/></button>
      <h1 className="mt-5 text-2xl font-bold text-[#14233B]">어떻게 시작할까요?</h1>
      <p className="mt-2 text-sm leading-6 text-[#687282]">기관을 운영하거나, 초대받은 소속에 참여하거나, 나만의 TODO를 바로 시작할 수 있습니다.</p>
      <div className="mt-6 grid grid-cols-3 rounded-[10px] bg-[#EEE9E2] p-1">
        {([['create', '소속 만들기'], ['join', '초대 코드'], ['personal', '개인 TODO']] as const).map(([key, label]) =>
          <button key={key} onClick={() => changeMode(key)} className={`min-h-11 rounded-[8px] px-1 text-[11px] font-bold ${mode === key ? 'bg-[#FFFDFC] text-[#14233B] shadow-sm' : 'text-[#7D8490]'}`}>{label}</button>)}
      </div>

      {mode === 'create' ? <section className="mt-6 space-y-3">
        <label className="block text-xs font-bold text-[#53606F]">기관명 또는 그룹명<input value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 미술 학원" className="mt-2 min-h-12 w-full rounded-[9px] border border-[#DED7CE] bg-[#FFFDFC] px-4 text-sm"/></label>
        <label className="block text-xs font-bold text-[#53606F]">첫 반 이름 · 선택<input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="예: 수채화반" className="mt-2 min-h-12 w-full rounded-[9px] border border-[#DED7CE] bg-[#FFFDFC] px-4 text-sm"/></label>
        <div className="rounded-[10px] bg-[#F1E7D6] p-3 text-xs text-[#806332]">기본 역할: 운영자(OWNER)</div>
      </section> : mode === 'join' ? <section className="mt-6">
        <label className="block text-xs font-bold text-[#53606F]">초대 코드<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="6자리 코드" className="mt-2 min-h-12 w-full rounded-[9px] border border-[#DED7CE] bg-[#FFFDFC] px-4 text-center text-base font-bold tracking-[.2em]"/></label>
        <p className="mt-3 text-xs leading-5 text-[#687282]">코드 확인 후 연결된 소속과 역할로 참여합니다.</p>
      </section> : <section className="mt-6 rounded-[14px] border border-[#DDD5CA] bg-[#FFFDFC] p-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-[11px] bg-[#E9EDF2] text-[#14233B]"><CheckSquare2 size={22}/></span>
        <h2 className="mt-4 text-lg font-bold text-[#14233B]">혼자서 TODO 작성하기</h2>
        <p className="mt-2 text-sm leading-6 text-[#687282]">학생이나 반을 등록하지 않아도 내가 해야 할 일을 직접 적고, 마감일과 완료 상태를 관리할 수 있습니다.</p>
        <ul className="mt-4 space-y-2 text-xs text-[#53606F]"><li>✓ 할 일 직접 작성</li><li>✓ 오늘 할 일과 완료 목록 확인</li><li>✓ 나중에 기관 소속도 추가 가능</li></ul>
      </section>}

      {error && <p role="alert" className="mt-4 rounded-[8px] bg-[#F7ECEA] p-3 text-xs text-[#A65F59]">{error}</p>}
      <button onClick={complete} disabled={saving} className="mt-8 min-h-12 w-full rounded-[9px] bg-[#14233B] text-sm font-bold text-white disabled:opacity-50">{saving ? '처리 중...' : mode === 'create' ? '소속 만들기' : mode === 'join' ? '참여 완료' : '개인 TODO 시작하기'}</button>
    </main>
  </div>;
}
