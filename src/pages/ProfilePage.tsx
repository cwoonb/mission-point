import {
  Bell,
  Building2,
  ChevronRight,
  LogOut,
  RefreshCw,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "../components/layout/Header";
import {
  getDemoKind,
  getSelectedDemoScenarioId,
  resetDemoSession,
  startDemoScenario,
} from "../data/demoSession";
import { useAuthStore } from "../store/authStore";
import { useGroupStore } from "../store/groupStore";
import { useMembershipStore } from "../store/membershipStore";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, isDemoMode, logout } = useAuthStore();
  const groups = useGroupStore((s) => s.groups);
  const {
    organizations,
    memberships,
    activeMembershipId,
    selectMembership,
    clearActiveMembership,
  } = useMembershipStore();
  const [notifications, setNotifications] = useState(true);
  if (!currentUser) return null;
  const mine = memberships.filter(
    (m) => m.userId === currentUser.id && m.status === "ACTIVE",
  );
  const active = mine.find((m) => m.id === activeMembershipId);
  const organization = organizations.find(
    (o) => o.id === active?.organizationId,
  );
  const group = groups.find((g) => g.id === active?.groupId);
  const student = active?.role === "STUDENT";
  const studentDemo = isDemoMode && getDemoKind() === "student";
  const roleLabel = student ? "학생" : "운영자";
  const signOut = async () => {
    clearActiveMembership();
    const error = await logout();
    if (!error) navigate('/login', { replace: true });
  };
  const endDemo = async () => {
    clearActiveMembership();
    await logout();
    navigate('/demo', { replace: true });
  };
  const switchMembership = (id: string) => {
    selectMembership(id);
    navigate("/", { replace: true });
  };
  return (
    <div className="page-container bg-[#F8F5F0]">
      <Header title="내 정보" showBack={false} />
      <main className="content-area space-y-4 px-4 py-5">
        <section className="rounded-[14px] border border-[#E1DBD3] bg-[#FFFDFC] p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#F1E7D6] text-xl font-bold text-[#14233B]">
              {currentUser.profileImage ? (
                <img
                  src={currentUser.profileImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                currentUser.name.slice(0, 1)
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#14233B]">
                {currentUser.name} {student ? "학생" : ""}
              </h1>
              <p className="mt-1 text-xs text-[#687282]">
                {group?.name ?? organization?.name ?? "소속 미설정"}
              </p>
              {isDemoMode && (
                <span className="mt-2 inline-flex rounded-full bg-[#F1E7D6] px-2 py-1 text-[9px] font-bold text-[#9A7138]">
                  DEMO
                </span>
              )}
            </div>
          </div>
        </section>
        <section className="rounded-[14px] border border-[#E1DBD3] bg-[#FFFDFC] p-4">
          <p className="text-[11px] font-bold text-[#9A7138]">현재 이용 중</p>
          <div className="mt-2 flex items-center gap-3">
            <Building2 size={19} className="text-[#B58A4A]" />
            <div>
              <strong className="block text-sm text-[#14233B]">
                {organization?.name ?? "소속"}
              </strong>
              <span className="text-xs text-[#687282]">
                {roleLabel}
                {group ? ` · ${group.name}` : ""}
              </span>
            </div>
          </div>
        </section>
        {mine.length > 1 && (
          <section>
            <h2 className="mb-2 px-1 text-xs font-bold text-[#53606F]">
              다른 소속과 역할
            </h2>
            <div className="overflow-hidden rounded-[14px] border border-[#E1DBD3] bg-[#FFFDFC]">
              {mine
                .filter((m) => m.id !== activeMembershipId)
                .map((m) => {
                  const org = organizations.find(
                    (o) => o.id === m.organizationId,
                  );
                  return (
                    <button
                      key={m.id}
                      onClick={() => switchMembership(m.id)}
                      className="flex min-h-16 w-full items-center gap-3 border-b border-[#EEE9E2] px-4 text-left last:border-0"
                    >
                      <UserRound size={18} className="text-[#B58A4A]" />
                      <span className="flex-1">
                        <strong className="block text-sm text-[#14233B]">
                          {org?.name}
                        </strong>
                        <span className="text-xs text-[#687282]">
                          {m.role === "STUDENT" ? "학생" : "운영자"}
                        </span>
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  );
                })}
            </div>
          </section>
        )}
        <section className="overflow-hidden rounded-[14px] border border-[#E1DBD3] bg-[#FFFDFC]">
          <label className="flex min-h-16 w-full items-center gap-3 border-b border-[#EEE9E2] px-4">
            <Bell size={18} className="text-[#B58A4A]" />
            <span className="flex-1 text-left text-sm font-semibold text-[#14233B]">
              알림 설정
            </span>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(event) => setNotifications(event.target.checked)}
              className="h-5 w-5 accent-[#14233B]"
            />
          </label>
          <button
            onClick={() => navigate("/memberships")}
            className="flex min-h-16 w-full items-center gap-3 border-b border-[#EEE9E2] px-4 text-left"
          >
            <RefreshCw size={18} className="text-[#B58A4A]" />
            <span className="flex-1 text-sm font-semibold text-[#14233B]">
              소속과 역할 전환
            </span>
            <ChevronRight size={16} />
          </button>
          {!student && (
            <button
              onClick={() => navigate("/profile/status-settings")}
              className="flex min-h-16 w-full items-center gap-3 px-4 text-left"
            >
              <UserRound size={18} className="text-[#B58A4A]" />
              <span className="flex-1 text-sm font-semibold text-[#14233B]">
                운영 기준 설정
              </span>
              <ChevronRight size={16} />
            </button>
          )}
        </section>
        {isDemoMode && (
          <section className="overflow-hidden rounded-[14px] border border-[#D8C39D] bg-[#FFFCF7]">
            <div className="px-4 py-3 text-[11px] font-bold text-[#9A7138]">
              현재 데모 · {organization?.name} · {roleLabel}
            </div>
            <button
              onClick={() => {
                resetDemoSession();
                navigate("/", { replace: true });
              }}
              className="flex min-h-14 w-full items-center gap-3 border-t border-[#EEE0C7] px-4 text-left"
            >
              <RotateCcw size={17} />
              <span className="flex-1 text-sm font-semibold">데모 초기화</span>
            </button>
            {studentDemo && (
              <button
                onClick={() => {
                  startDemoScenario(getSelectedDemoScenarioId());
                  navigate("/", { replace: true });
                }}
                className="flex min-h-14 w-full items-center gap-3 border-t border-[#EEE0C7] px-4 text-left"
              >
                <RefreshCw size={17} />
                <span className="flex-1 text-sm font-semibold">
                  운영자 데모로 전환
                </span>
              </button>
            )}
            <button
              onClick={() => void endDemo()}
              className="flex min-h-14 w-full items-center gap-3 border-t border-[#EEE0C7] px-4 text-left"
            >
              <LogOut size={17} />
              <span className="flex-1 text-sm font-semibold">데모 종료</span>
            </button>
          </section>
        )}
        <button
          onClick={() => void signOut()}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[10px] border border-[#DFB9B5] bg-[#FFF8F7] text-sm font-bold text-[#B35F5A]"
        >
          <LogOut size={17} />
          로그아웃
        </button>
      </main>
    </div>
  );
}
