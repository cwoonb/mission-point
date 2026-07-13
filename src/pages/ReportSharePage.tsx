import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Copy, MessageSquare, QrCode, Share2 } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';

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
  const student = useAuthStore((state) => state.users.find((user) => user.id === id));
  const [notice, setNotice] = useState('');
  const reportUrl = `${window.location.origin}/students/${id}/report`;
  const shareText = `${student?.name ?? '학생'} 활동 리포트가 준비되었습니다.\n${reportUrl}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(reportUrl); } catch { fallbackCopy(reportUrl); }
    setNotice('리포트 링크를 복사했습니다.');
  };

  const share = async () => {
    if (!navigator.share) return;
    try { await navigator.share({ title: `${student?.name ?? '학생'} 활동 리포트`, text: shareText, url: reportUrl }); setNotice('공유 창을 열었습니다.'); }
    catch (error) { if ((error as DOMException).name !== 'AbortError') setNotice('공유 창을 열지 못했습니다.'); }
  };

  return (
    <div className="page-container bg-[#F8F5F0]">
      <Header title="공유 완료" showBack showPoints={false}/>
      <main className="content-area flex min-h-[calc(100dvh-9rem)] flex-col items-center justify-center px-6 py-10 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#14233B] text-[#14233B]"><Check size={34}/></span>
        <h1 className="mt-6 text-xl font-bold text-[#14233B]">리포트가 준비되었습니다.</h1>
        <p className="mt-2 text-sm leading-6 text-[#687282]">원하는 공유 방법을 선택하세요.</p>

        <div className="mt-8 w-full space-y-2">
          <button type="button" onClick={copy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] text-sm font-bold text-[#14233B]"><Copy size={17}/>링크 복사</button>
          <button type="button" disabled title="QR 생성 기능 준비 중" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-[#E7E1D9] bg-[#F1EDE7] text-sm font-bold text-[#9A9FA7]"><QrCode size={17}/>QR 코드 준비 중</button>
          {typeof navigator.share === 'function' && <button type="button" onClick={share} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#C6944C] text-sm font-bold text-white"><Share2 size={17}/>기기 공유</button>}
          <a href={`sms:?&body=${encodeURIComponent(shareText)}`} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] text-sm font-bold text-[#14233B]"><MessageSquare size={17}/>문자 메시지 공유</a>
        </div>

        {notice && <p role="status" className="mt-4 rounded-full bg-[#EDF4EF] px-4 py-2 text-xs font-bold text-[#3E6F50]">{notice}</p>}
        <p className="mt-6 text-[11px] leading-5 text-[#9A9FA7]">현재 링크는 로그인한 사용자에게만 열립니다.<br/>보호자에게 전달하기 전 접근 권한을 확인해 주세요.</p>
        <button type="button" onClick={() => navigate(`/students/${id}/report`, { replace: true })} className="mt-5 min-h-11 text-xs font-bold text-[#687282] underline underline-offset-4">리포트로 돌아가기</button>
      </main>
    </div>
  );
}
