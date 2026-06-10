import { isAxiosError } from "axios";
import { Crown, Flame, LogOut, Mail, ShieldCheck, Sparkles, Ticket, UserPlus, UserRound, Wallet } from "lucide-react";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { progress, user as mockUser } from "../data/mockData";

const roleLabels = {
  admin: "Quản trị viên",
  teacher: "Giáo viên",
  student: "Học sinh",
  guest: "Guest Pass",
};

const roleCapabilities = {
  admin: ["Quản lý tài khoản", "Cập nhật quyền", "Điều phối hệ thống"],
  teacher: ["Theo dõi lớp", "Giao nhiệm vụ", "Xem tiến độ học sinh"],
  student: ["Học và làm quiz", "Nhận XP", "Dùng AI mentor"],
  guest: ["Xem dashboard", "Thử giao diện", "Nâng cấp thành tài khoản"],
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
  }
  return "Chưa tạo được tài khoản. Hãy thử lại sau.";
}

export function ProfilePage() {
  const { user, mode, register, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return null;
  }

  async function handleUpgrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await register(email, password);
      navigate("/profile", { replace: true });
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/auth", { replace: true });
  }

  const isGuest = mode === "guest";
  const capabilities = roleCapabilities[user.role];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-soft">
        <div className="grid gap-6 bg-[linear-gradient(135deg,#ffffff_0%,#f5f3ff_46%,#eef6ff_100%)] p-5 sm:p-7 lg:grid-cols-[1fr_380px]">
          <div className="flex items-start gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[1.5rem] bg-slate-950 text-2xl font-black text-white shadow-lift">
              {user.avatar}
            </div>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-black text-brand-700 shadow-sm">
                <ShieldCheck size={16} />
                {roleLabels[user.role]}
              </p>
              <h1 className="mt-4 break-words text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{user.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <Mail size={16} />
                {user.email}
              </p>
              <div className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white">
                {isGuest ? "Guest Pass đang bật" : "Session đã được xác thực"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-[1.2rem] border border-white bg-white/75 p-3 shadow-sm backdrop-blur">
            <div className="rounded-2xl bg-slate-50 p-4">
              <Sparkles className="text-brand-600" size={20} />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Level</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{mockUser.level}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <Wallet className="text-amber-500" size={20} />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">XP</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{mockUser.xp}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <Flame className="text-orange-500" size={20} />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Streak</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{mockUser.streak}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
        <aside className="order-first app-card p-5 sm:p-6">
          {isGuest ? (
            <form className="space-y-4" onSubmit={handleUpgrade}>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <Ticket size={24} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Nâng cấp Guest Pass</p>
                <h2 className="mt-1 text-2xl font-black">Mở hồ sơ học tập thật</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Tạo tài khoản để lưu tiến độ, giữ buddy, đồng bộ quiz và mở đầy đủ profile học tập của bạn.
                </p>
              </div>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@buddystudy.vn"
                required
                type="email"
                value={email}
              />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mật khẩu tối thiểu 8 ký tự"
                required
                type="password"
                value={password}
              />
              {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</p> : null}
              <button className="primary-button w-full" disabled={isSubmitting} type="submit">
                <UserPlus size={18} />
                {isSubmitting ? "Đang nâng cấp..." : "Nâng cấp tài khoản"}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <UserRound size={24} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Hồ sơ học tập</p>
                <h2 className="mt-1 text-2xl font-black">Tài khoản đã sẵn sàng</h2>
              </div>
              <div className="space-y-3 text-sm font-semibold text-slate-600">
                <p>Thời gian học: {progress.studyTime}</p>
                <p>Quiz hoàn thành: {progress.quizCompleted}</p>
                <p>Độ chính xác: {progress.accuracy}%</p>
              </div>
            </div>
          )}
        </aside>

        <section className="app-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Phân quyền</p>
              <h2 className="mt-1 text-2xl font-black">Quyền hiện tại</h2>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Crown size={24} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {capabilities.map((capability) => (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={capability}>
                <p className="font-black text-slate-900">{capability}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-black text-slate-950">Trạng thái phiên</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {isGuest
                    ? "Bạn đang dùng Guest Pass để xem nhanh giao diện trước khi tạo tài khoản."
                    : "Tài khoản này đang hoạt động đầy đủ với dữ liệu học tập đã được lưu."}
                </p>
              </div>
              <button className="secondary-button" onClick={handleLogout} type="button">
                <LogOut size={18} />
                Đăng xuất
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
