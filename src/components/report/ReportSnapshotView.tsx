import { CheckCircle2, Clock3, MessageCircle, Target } from 'lucide-react';
import type { ReportSnapshot } from '../../types';
import { formatDate, formatDateTime } from '../../utils/helpers';

const Empty = ({ children }: { children: string }) => <p className="rounded-xl bg-[#F5F2ED] px-4 py-5 text-center text-xs font-semibold text-[#8B929C]">{children}</p>;

export default function ReportSnapshotView({ report }: { report: ReportSnapshot }) {
  return <article className="overflow-hidden rounded-[18px] border border-[#E7E1D9] bg-[#FFFDFC] shadow-[0_8px_28px_rgba(20,35,59,.05)]">
    <header className="border-b border-[#E7E1D9] bg-[#F5F2ED] p-6 text-center">
      <p className="text-[11px] font-semibold text-[#B58A4A]">{report.periodStart ? `${formatDate(report.periodStart)} ~ ${formatDate(report.generatedAt)}` : `${formatDate(report.generatedAt)} 활동 리포트`}</p>
      <div className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E9EDF2] text-xl font-bold text-[#14233B]">{report.student.name.slice(0, 1)}</div>
      <h1 className="mt-3 text-xl font-bold text-[#14233B]">{report.student.name}</h1>
      <p className="mt-1 text-xs text-[#687282]">{report.student.group}</p>
      {report.teacherName && <p className="mt-2 text-[10px] text-[#8B929C]">{report.teacherName} 선생님</p>}
    </header>
    <div className="space-y-7 p-5">
      <section><h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#14233B]"><Clock3 size={17}/>최근 활동</h2>{report.recentActivities.length ? <div className="space-y-2">{report.recentActivities.map((item, index) => <div key={`${item.date}-${index}`} className="rounded-xl border border-[#E7E1D9] p-3"><strong className="text-sm text-[#27313F]">{item.title}</strong><p className="mt-1 text-[11px] text-[#8B929C]">{formatDateTime(item.date)}</p>{item.comment && <p className="mt-2 text-xs leading-5 text-[#687282]">{item.comment}</p>}</div>)}</div> : <Empty>최근 활동이 없습니다.</Empty>}</section>
      <section><h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#14233B]"><CheckCircle2 size={17} className="text-[#4F8A68]"/>최근 완료한 미션</h2>{report.completedMissions.length ? <ul className="space-y-2">{report.completedMissions.map((item, index) => <li key={`${item.title}-${index}`} className="rounded-xl bg-[#EDF4EF] p-3 text-sm font-semibold text-[#3E6F50]">{item.title}</li>)}</ul> : <Empty>최근 완료한 미션이 없습니다.</Empty>}</section>
      <section><h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#14233B]"><Clock3 size={17}/>현재 진행 중 미션</h2>{report.ongoingMissions.length ? <ul className="space-y-2">{report.ongoingMissions.map((item, index) => <li key={`${item.title}-${index}`} className="rounded-xl bg-[#F5F2ED] p-3"><strong className="text-sm text-[#27313F]">{item.title}</strong><p className="mt-1 text-[11px] text-[#8B929C]">{formatDate(item.dueDate)}까지</p></li>)}</ul> : <Empty>현재 진행 중인 미션이 없습니다.</Empty>}</section>
      {report.feedback.length > 0 && <section><h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#14233B]"><MessageCircle size={17} className="text-[#B58A4A]"/>선생님 피드백</h2><div className="space-y-2">{report.feedback.map((item, index) => <div key={`${item.date}-${index}`} className="rounded-xl bg-[#F5F2ED] p-3"><strong className="text-xs text-[#14233B]">{item.mission}</strong><p className="mt-2 text-sm leading-6 text-[#53606F]">{item.text}</p></div>)}</div></section>}
      {report.photos.length > 0 && <section><h2 className="mb-3 text-sm font-bold text-[#14233B]">활동 사진</h2><div className="grid grid-cols-2 gap-2">{report.photos.map((url, index) => <img key={`${url}-${index}`} src={url} alt="학생 활동" className="aspect-square w-full rounded-xl object-cover"/>)}</div></section>}
      <section className="rounded-xl bg-[#EDF4EF] p-4"><h2 className="text-xs font-bold text-[#3E6F50]">잘한 점</h2><p className="mt-2 text-sm leading-6 text-[#365D45]">{report.strengths}</p></section>
      <section className="rounded-xl bg-[#F2F5F8] p-4"><h2 className="flex items-center gap-2 text-xs font-bold text-[#40536F]"><Target size={16}/>다음 목표</h2><p className="mt-2 text-sm leading-6 text-[#53606F]">{report.nextGoal}</p></section>
      {report.teacherMemo && <section className="rounded-xl border border-[#D8D0C5] bg-[#F3EFE9] p-4"><h2 className="text-xs font-bold text-[#B58A4A]">선생님 한줄 메모</h2><p className="mt-2 text-sm font-semibold leading-6 text-[#27313F]">{report.teacherMemo}</p></section>}
    </div>
  </article>;
}
