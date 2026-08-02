import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/layout/Header';
import ReportSnapshotView from '../../components/report/ReportSnapshotView';
import EmptyState from '../../components/ui/EmptyState';
import { useGuardianStore } from '../../store/guardianStore';

export default function GuardianReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const report = useGuardianStore((state) => state.reports.find((item) => item.id === reportId));
  const markViewed = useGuardianStore((state) => state.markReportViewed);
  useEffect(() => { if (report && !report.lastViewedAt) void markViewed(report.id).catch(()=>undefined); }, [markViewed, report?.id, report?.lastViewedAt]);
  return <div className="page-container bg-[#F8F5F0]"><Header title="활동 리포트" showBack showPoints={false}/><main className="content-area px-4 py-4">{report ? <ReportSnapshotView report={report.snapshot}/> : <EmptyState title="리포트를 찾을 수 없습니다." description="연결이 해제되었거나 접근할 수 없는 리포트입니다."/>}</main></div>;
}
