import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { secureBackendEnabled, supabase } from '../lib/supabase';
import { getDemoReportSnapshot } from '../utils/demoReportSnapshot';
import type { ReportSnapshot } from '../types';
import ReportSnapshotView from '../components/report/ReportSnapshotView';

export default function PublicReportPage(){
  const {token}=useParams<{token:string}>();
  const [report,setReport]=useState<ReportSnapshot|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const demoSnapshot = token ? getDemoReportSnapshot<ReportSnapshot>(token) : null;
    if(demoSnapshot){setReport(demoSnapshot);setLoading(false);return;}
    if(!secureBackendEnabled){setLoading(false);return;}
    void (async()=>{const {data,error}=await supabase.rpc('get_public_report',{raw_token:token??''});if(!error&&data)setReport(data as unknown as ReportSnapshot);setLoading(false);})();
  },[token]);
  if(loading)return <div className="page-container flex items-center justify-center bg-[#F8F5F0]"><p className="text-sm font-semibold text-[#687282]">리포트를 불러오는 중...</p></div>;
  if(!report)return <div className="page-container flex items-center justify-center bg-[#F8F5F0] px-6 text-center"><div><h1 className="text-xl font-bold text-[#14233B]">열 수 없는 리포트입니다.</h1><p className="mt-3 text-sm leading-6 text-[#687282]">링크가 만료되었거나 공유가 취소되었습니다.<br/>선생님께 새 링크를 요청해 주세요.</p></div></div>;
  return <div className="page-container bg-[#F8F5F0]"><main className="px-4 py-6"><ReportSnapshotView report={report}/><p className="py-5 text-center text-[10px] text-[#9A9FA7]">민감한 학생 정보가 포함되어 있습니다. 링크를 외부에 재공유하지 마세요.</p></main></div>;
}
