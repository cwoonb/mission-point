import {
  Building2,
  CheckCircle2,
  ChevronRight,
  LogOut,
  Plus,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import { useAuthStore } from "../store/authStore";
import { useMembershipStore } from "../store/membershipStore";

export default function MembershipSelectionPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const {
    organizations,
    memberships,
    activeMembershipId,
    selectMembership,
    clearActiveMembership,
  } = useMembershipStore();
  if (!currentUser) return null;
  const mine = memberships.filter(
    (m) => m.userId === currentUser.id && m.status === "ACTIVE",
  );
  const choose = (id: string) => {
    selectMembership(id);
    navigate("/", { replace: true });
  };
  const signOut = async () => {
    clearActiveMembership();
    const error = await logout();
    if (!error) navigate('/login', { replace: true });
  };
  return (
    <div className="page-container bg-[#F8F5F0]">
      <main className="flex min-h-[100dvh] flex-col px-5 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="serif-brand text-[44px]">M</div>
        <section className="mt-8">
          <h1 className="text-2xl font-bold text-[#14233B]">
            어디로 들어갈까요?
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#687282]">
            현재 이용할 소속과 역할을 선택하세요.
            <br />
            선택한 역할에 맞는 화면으로 이동합니다.
          </p>
        </section>
        {mine.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="아직 연결된 소속이 없습니다."
              description="초대 코드로 참여하거나 새 소속을 만들어보세요."
              actionLabel="소속 추가"
              onAction={() => navigate("/onboarding")}
            />
          </div>
        ) : (
          <section className="mt-7 space-y-3">
            <h2 className="text-xs font-bold text-[#53606F]">내 소속</h2>
            {mine.map((m) => {
              const org = organizations.find((o) => o.id === m.organizationId);
              const Icon = m.role === "STUDENT" || m.role === "GUARDIAN" ? UsersRound : Building2;
              return (
                <button
                  key={m.id}
                  onClick={() => choose(m.id)}
                  className={`flex min-h-20 w-full items-center gap-3 rounded-[13px] border bg-[#FFFDFC] p-4 text-left ${m.id === activeMembershipId ? "border-[#C89B55]" : "border-[#E1DBD3]"}`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F1E7D6] text-[#A67B3F]">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm text-[#14233B]">
                      {org?.name ?? "소속"}
                    </strong>
                    <span className="mt-1 block text-xs text-[#687282]">
                      {m.role === "STUDENT" ? "학생" : m.role === "GUARDIAN" ? "보호자" : "운영자(선생님)"}
                      {m.groupId ? " · 연결된 반" : ""}
                    </span>
                  </span>
                  {m.id === activeMembershipId ? (
                    <CheckCircle2 size={18} className="text-[#C89B55]" />
                  ) : (
                    <ChevronRight size={17} />
                  )}
                </button>
              );
            })}
          </section>
        )}
        <button
          onClick={() => navigate("/onboarding")}
          className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-[9px] border border-[#D8D0C5] bg-[#FFFDFC] text-sm font-bold text-[#14233B]"
        >
          <Plus size={17} />
          다른 소속 추가
        </button>
        <button
          onClick={() => void signOut()}
          className="mt-auto flex min-h-12 items-center justify-center gap-2 text-xs font-semibold text-[#687282]"
        >
          <LogOut size={15} />
          로그아웃
        </button>
      </main>
    </div>
  );
}
