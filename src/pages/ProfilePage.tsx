import { isAxiosError } from "axios";
import { Crown, Flame, LogOut, Mail, RefreshCcw, ShieldCheck, Sparkles, Ticket, UserPlus, UserRound, Wallet } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useUserStats } from "../features/user-stats/UserStatsProvider";
import { apiClient } from "../services/apiClient";
import { resendVerificationOtpWithApi } from "../services/authApi";
import type { ApiUser } from "../services/types";
import { USER_STATS_UPDATED_EVENT } from "../services/userStatsEvents";

const RESEND_COOLDOWN_SECONDS = 60;

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
    const message = error.response?.data?.message;
    if (typeof message === "string") {
      return message;
    }
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
  }
  return "Chưa tạo được tài khoản. Hãy thử lại sau.";
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

export function ProfilePage() {
  const { user, mode, register, verifyEmail, logout } = useAuth();
  const { stats: liveStats } = useUserStats();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [upgradeVerification, setUpgradeVerification] = useState<{
    email: string;
    verificationSessionId: string;
  } | null>(null);
  const [stats, setStats] = useState<ApiUser | null>(null);

  async function refreshProfileStats() {
    if (isGuest) return;

    try {
      const response = await apiClient.get<ApiUser>("/users/me/stats");
      setStats(response.data);
    } catch {
      // Keep the current values if realtime refresh fails.
    }
  }

  if (!user) {
    return null;
  }

  async function handleUpgrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const result = await register(email, password);
      if (result?.verification_required) {
        setUpgradeVerification({
          email: result.email,
          verificationSessionId: result.verification_session_id,
        });
        setOtp("");
        setPassword("");
        setCooldown(RESEND_COOLDOWN_SECONDS);
        setMessage("Mã OTP đã được gửi tới email của bạn. Nhập mã để hoàn tất nâng cấp.");
        return;
      }
      setMessage("Nâng cấp tài khoản thành công.");
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyUpgrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!upgradeVerification || otp.length !== 6 || isVerifying) return;
    setError("");
    setMessage("");
    setIsVerifying(true);
    try {
      await verifyEmail(upgradeVerification.verificationSessionId, otp);
      setUpgradeVerification(null);
      setOtp("");
      setMessage("Nâng cấp tài khoản thành công. Hồ sơ học tập của bạn đã được kích hoạt.");
      navigate("/profile", { replace: true });
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendUpgradeOtp() {
    if (!upgradeVerification || cooldown > 0 || isResending) return;
    setError("");
    setMessage("");
    setIsResending(true);
    try {
      const result = await resendVerificationOtpWithApi(upgradeVerification.verificationSessionId);
      setUpgradeVerification({
        email: result.email,
        verificationSessionId: result.verification_session_id,
      });
      setOtp("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setMessage("Mã OTP mới đã được gửi. Hãy kiểm tra email của bạn.");
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsResending(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/auth", { replace: true });
  }

  const isGuest = mode === "guest";
  const capabilities = roleCapabilities[user.role];

  useEffect(() => {
    if (isGuest) return;
    let cancelled = false;
    apiClient.get<ApiUser>("/users/me/stats").then((response) => {
      if (!cancelled) setStats(response.data);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isGuest]);

  useEffect(() => {
    const handleStatsUpdated = () => {
      void refreshProfileStats();
    };

    window.addEventListener(USER_STATS_UPDATED_EVENT, handleStatsUpdated);
    return () => window.removeEventListener(USER_STATS_UPDATED_EVENT, handleStatsUpdated);
  }, [isGuest]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const profileStats = stats ?? {
    level: 0,
    xp: 0,
    streak: 0,
    studyTime: "0h 0m",
    quizCompleted: 0,
    accuracy: 0,
  };
  const displayLevel = liveStats?.level ?? profileStats.level;
  const displayXp = liveStats?.xp ?? profileStats.xp;
  const displayStreak = liveStats?.streak ?? profileStats.streak;

  return (
    <div className="space-y-6">
      <section className="hero-surface overflow-hidden rounded-[1.35rem]">
        <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[1fr_380px]">
          <div className="flex items-start gap-5">
            <div className="surface-strong grid h-20 w-20 shrink-0 place-items-center rounded-[1.5rem] border border-border/70 text-2xl font-black text-foreground shadow-lift">
              {user.avatar}
            </div>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/78 px-3 py-1 text-sm font-black text-primary shadow-sm dark:bg-slate-900/72">
                <ShieldCheck size={16} />
                {roleLabels[user.role]}
              </p>
              <h1 className="mt-4 break-words text-3xl font-black tracking-tight text-foreground sm:text-4xl">{user.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Mail size={16} />
                {user.email}
              </p>
              <div className="surface-accent mt-4 inline-flex rounded-full border border-border/60 px-4 py-2 text-sm font-black text-foreground">
                {isGuest ? "Guest Pass đang bật" : "Session đã được xác thực"}
              </div>
            </div>
          </div>

          <div className="soft-panel grid grid-cols-3 gap-3 rounded-[1.2rem] p-3">
            <div className="soft-tile rounded-2xl p-4">
              <Sparkles className="text-brand-600" size={20} />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Level</p>
              <p className="mt-1 text-2xl font-black text-foreground">{displayLevel}</p>
            </div>
            <div className="soft-tile rounded-2xl p-4">
              <Wallet className="text-amber-500" size={20} />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">XP</p>
              <p className="mt-1 text-2xl font-black text-foreground">{displayXp}</p>
            </div>
            <div className="soft-tile rounded-2xl p-4">
              <Flame className="text-orange-500" size={20} />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Streak</p>
              <p className="mt-1 text-2xl font-black text-foreground">{displayStreak}</p>
            </div>
          </div>
        </div>
      </section>

      {message ? <p className="rounded-2xl border border-emerald-300/60 bg-emerald-100/70 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-2xl border border-rose-300/60 bg-rose-100/70 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <aside className="order-first app-card p-5 sm:p-6">
          {isGuest && upgradeVerification ? (
            <form className="space-y-4" onSubmit={handleVerifyUpgrade}>
              <div className="surface-accent grid h-12 w-12 place-items-center rounded-2xl text-primary-foreground dark:text-violet-100">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">Xác thực email</p>
                <h2 className="mt-1 text-2xl font-black">Nhập mã OTP</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Chúng tôi đã gửi mã gồm 6 chữ số tới <span className="font-black text-foreground">{maskEmail(upgradeVerification.email)}</span>.
                </p>
              </div>
              <input
                autoComplete="one-time-code"
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-center text-2xl font-black tracking-[0.45em] text-foreground outline-none placeholder:text-muted-foreground"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) => {
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                pattern="[0-9]{6}"
                placeholder="000000"
                value={otp}
              />
              <button className="primary-button w-full" disabled={otp.length !== 6 || isVerifying} type="submit">
                <ShieldCheck size={18} />
                {isVerifying ? "Đang xác thực..." : "Xác nhận OTP"}
              </button>
              <button className="secondary-button w-full" disabled={cooldown > 0 || isResending} onClick={handleResendUpgradeOtp} type="button">
                <RefreshCcw size={18} />
                {isResending ? "Đang gửi..." : cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : "Gửi lại mã"}
              </button>
              <button
                className="secondary-button w-full"
                onClick={() => {
                  setUpgradeVerification(null);
                  setOtp("");
                  setMessage("");
                  setError("");
                  setCooldown(0);
                }}
                type="button"
              >
                Quay lại nhập email
              </button>
            </form>
          ) : isGuest ? (
            <form className="space-y-4" onSubmit={handleUpgrade}>
              <div className="surface-accent grid h-12 w-12 place-items-center rounded-2xl text-primary-foreground dark:text-violet-100">
                <Ticket size={24} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">Nâng cấp Guest Pass</p>
                <h2 className="mt-1 text-2xl font-black">Mở hồ sơ học tập thật</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Tạo tài khoản để lưu tiến độ, giữ buddy, đồng bộ quiz và mở đầy đủ profile học tập của bạn.
                </p>
              </div>
              <input
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@buddystudy.vn"
                required
                type="email"
                value={email}
              />
              <input
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mật khẩu tối thiểu 8 ký tự"
                required
                type="password"
                value={password}
              />
              <button className="primary-button w-full" disabled={isSubmitting} type="submit">
                <UserPlus size={18} />
                {isSubmitting ? "Đang nâng cấp..." : "Nâng cấp tài khoản"}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="success-soft grid h-12 w-12 place-items-center rounded-2xl text-emerald-600 dark:text-emerald-200">
                <UserRound size={24} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">Hồ sơ học tập</p>
                <h2 className="mt-1 text-2xl font-black">Tài khoản đã sẵn sàng</h2>
              </div>
              <div className="space-y-3 text-sm font-semibold text-muted-foreground">
                <p>Thời gian học: {profileStats.studyTime}</p>
                <p>Quiz hoàn thành: {profileStats.quizCompleted}</p>
                <p>Độ chính xác: {profileStats.accuracy}%</p>
              </div>
            </div>
          )}
        </aside>

        <section className="app-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">Phân quyền</p>
              <h2 className="mt-1 text-2xl font-black">Quyền hiện tại</h2>
            </div>
            <div className="success-soft grid h-12 w-12 place-items-center rounded-2xl text-emerald-600 dark:text-emerald-200">
              <Crown size={24} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {capabilities.map((capability) => (
              <div className="soft-panel rounded-2xl p-4" key={capability}>
                <p className="font-black text-foreground">{capability}</p>
              </div>
            ))}
          </div>

          <div className="soft-panel mt-6 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-black text-foreground">Trạng thái phiên</p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
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
