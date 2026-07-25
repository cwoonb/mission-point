import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { authErrorMessage, useAuthStore } from '../store/authStore';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) { setError('비밀번호는 8자 이상 입력해 주세요.'); return; }
    if (password !== confirm) { setError('비밀번호가 일치하지 않습니다.'); return; }
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) { setError(authErrorMessage(updateError.message)); return; }
    setDone(true);
  };

  if (done) return <div className="page-container flex min-h-[100dvh] items-center justify-center bg-[#F8F5F0] px-6 text-center"><div><h1 className="text-xl font-bold text-[#14233B]">비밀번호를 변경했습니다.</h1><button onClick={async () => { await logout(); navigate('/login', { replace: true }); }} className="mt-6 min-h-12 rounded-[9px] bg-[#14233B] px-6 text-sm font-bold text-white">새 비밀번호로 로그인</button></div></div>;
  return <div className="page-container bg-[#F8F5F0]"><main className="min-h-[100dvh] px-6 pb-8 pt-[max(3rem,env(safe-area-inset-top))]"><div className="serif-brand text-[42px]">M</div><h1 className="mt-10 text-2xl font-bold text-[#14233B]">새 비밀번호 설정</h1><p className="mt-2 text-sm text-[#687282]">사용할 비밀번호를 입력해 주세요.</p><form onSubmit={submit} className="mt-8 space-y-3"><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="새 비밀번호 8자 이상" className="min-h-12 w-full rounded-[9px] border border-[#E0DAD2] bg-[#FFFDFC] px-4 text-sm"/><input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" placeholder="새 비밀번호 확인" className="min-h-12 w-full rounded-[9px] border border-[#E0DAD2] bg-[#FFFDFC] px-4 text-sm"/>{error && <p role="alert" className="rounded-[8px] bg-[#F7ECEA] px-3 py-2 text-xs text-[#A65F59]">{error}</p>}<button disabled={saving} className="min-h-12 w-full rounded-[9px] bg-[#14233B] text-sm font-bold text-white disabled:opacity-50">{saving ? '변경 중' : '비밀번호 변경'}</button></form></main></div>;
}
