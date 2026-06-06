import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import Header from '../components/layout/Header';
import MissionCard from '../components/mission/MissionCard';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import type { MissionStatus } from '../types';

type FilterTab = 'all' | 'active' | 'done';

const filterConfig: Array<{ key: FilterTab; label: string; statuses: MissionStatus[] }> = [
  { key: 'all', label: '전체', statuses: [] },
  {
    key: 'active',
    label: '진행중',
    statuses: ['IN_PROGRESS', 'REVIEWING', 'REJECTED', 'PENDING'],
  },
  { key: 'done', label: '완료', statuses: ['SUCCESS', 'FAILED', 'EXPIRED'] },
];

export default function MissionListPage() {
  const navigate = useNavigate();
  const { currentUser, viewMode } = useAuthStore();
  const { missions } = useMissionStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) return null;

  const isFacilitator = viewMode === 'FACILITATOR';

  const baseMissions = isFacilitator
    ? missions.filter((m) => m.creatorId === currentUser.id)
    : missions.filter((m) => m.assigneeId === currentUser.id);

  const filteredTab = filterConfig.find((f) => f.key === activeTab)!;
  const tabFiltered =
    activeTab === 'all'
      ? baseMissions
      : baseMissions.filter((m) => filteredTab.statuses.includes(m.status));

  const searched = searchQuery
    ? tabFiltered.filter(
        (m) =>
          m.title.includes(searchQuery) || m.description.includes(searchQuery)
      )
    : tabFiltered;

  const sorted = [...searched].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="page-container">
      <Header
        title="🎯 미션"
        showBack={false}
        rightElement={
          isFacilitator ? (
            <button
              onClick={() => navigate('/missions/create')}
              className="w-8 h-8 bg-purple-500 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-md"
            >
              <Plus size={16} />
            </button>
          ) : undefined
        }
      />

      <div className="content-area">
        {/* 검색바 */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="미션 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-0 rounded-2xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </div>

        {/* 탭 필터 */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {filterConfig.map((tab) => {
            const count =
              tab.key === 'all'
                ? baseMissions.length
                : baseMissions.filter((m) => tab.statuses.includes(m.status)).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 미션 목록 */}
        <div className="px-4 pb-4 space-y-3">
          {sorted.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">📭</p>
              <p className="text-gray-500 font-semibold">미션이 없어요</p>
              {isFacilitator && (
                <button
                  onClick={() => navigate('/missions/create')}
                  className="mt-4 btn-primary text-sm py-2 px-5 rounded-xl inline-flex items-center gap-1"
                >
                  <Plus size={14} /> 새 미션 만들기
                </button>
              )}
            </div>
          ) : (
            sorted.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <MissionCard mission={m} showAssignee={isFacilitator} />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
