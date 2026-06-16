import { isAxiosError } from "axios";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles, Ticket, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { StudyBuddyLogo } from "../components/StudyBuddyLogo";
import { ThemeToggle } from "../components/ThemeToggle";
import { saveVerificationSession } from "./VerifyEmailPage";

type AuthMode = "login" | "register";

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  if (error instanceof Error) return error.message;
  return "Chưa kết nối được máy chủ. Hãy thử lại sau.";
}

const authTabs: { id: AuthMode; label: string }[] = [
  { id: "login", label: "Đăng nhập" },
  { id: "register", label: "Tạo tài khoản" },
];

function getRedirectTarget(state: unknown) {
  const from = (state as { from?: unknown } | null)?.from;
  return typeof from === "string" && from.startsWith("/") ? from : "/dashboard";
}

export function AuthPage() {
  const { login, register, continueAsGuest, mode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (mode !== "signed_out") {
    return <Navigate replace to={getRedirectTarget(location.state)} />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (authMode === "login") {
        await login(email, password);
      } else {
        const result = await register(email, password);
        if (result && result.verification_required) {
          saveVerificationSession({ email: result.email, verificationSessionId: result.verification_session_id });
          navigate("/verify-email", { replace: true });
          return;
        }
      }
      navigate(getRedirectTarget(location.state), { replace: true });
    } catch (nextError) {
      if (isAxiosError(nextError)) {
        const details = nextError.response?.data?.details;
        if (details?.code === "EMAIL_NOT_VERIFIED" && typeof details.verification_session_id === "string") {
          saveVerificationSession({ email: details.email ?? email, verificationSessionId: details.verification_session_id });
          navigate("/verify-email", { replace: true });
          return;
        }
      }
      setError(getErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGuest() {
    continueAsGuest();
    navigate(getRedirectTarget(location.state), { replace: true });
  }

  return (
    <main className="auth-shell min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1fr]">
        <section className="hidden lg:block">
          <div className="auth-story-panel">
            <div className="flex items-center justify-between gap-4">
              <StudyBuddyLogo />
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-black text-accent">Lv. 12</span>
              </div>
            </div>

            <div className="mt-12">
              <p className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-sm font-black text-accent shadow-sm">
                <Sparkles size={16} />
                Phiên học hôm nay
              </p>
              <h1 className="mt-5 max-w-md text-5xl font-black leading-[1.02] text-foreground">Vào học nhanh, lưu tiến độ gọn.</h1>
              <p className="mt-4 max-w-md text-base font-semibold leading-7 text-muted-foreground">
                Đăng nhập để đồng bộ nhiệm vụ, quiz, buddy và profile học tập trên cùng một tài khoản.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3">
              <div className="auth-metric">
                <p>XP</p>
                <strong>2.450</strong>
              </div>
              <div className="auth-metric">
                <p>Streak</p>
                <strong>9 ngày</strong>
              </div>
              <div className="auth-metric">
                <p>Quiz</p>
                <strong>84%</strong>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="auth-form-panel mx-auto w-full max-w-[470px]">
            <div className="mb-7 flex items-center justify-between gap-3 lg:hidden">
              <StudyBuddyLogo />
              <ThemeToggle />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase text-accent">{authMode === "login" ? "Chào mừng trở lại" : "Tạo hồ sơ học tập"}</p>
                <h2 className="mt-2 text-3xl font-black text-foreground">{authMode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-accent">
                <ShieldCheck size={24} />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              {authTabs.map((item) => (
                <button
                  className={`rounded-lg px-4 py-3 text-sm font-black transition ${
                    authMode === item.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                  key={item.id}
                  onClick={() => {
                    setAuthMode(item.id);
                    setError("");
                  }}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-black text-foreground" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-[1.15rem] text-muted-foreground" size={18} />
                  <input
                    className="auth-input pl-11"
                    id="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@buddystudy.vn"
                    required
                    type="email"
                    value={email}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-foreground" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-[1.15rem] text-muted-foreground" size={18} />
                  <input
                    className="auth-input pl-11"
                    id="password"
                    minLength={8}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    type="password"
                    value={password}
                  />
                </div>
              </div>

              {error ? <p className="rounded-xl border border-rose-300/60 bg-rose-100/70 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}

              <button className="primary-button w-full rounded-xl py-3.5" disabled={isSubmitting} type="submit">
                <UserRound size={18} />
                {isSubmitting ? "Đang xử lý..." : authMode === "login" ? "Đăng nhập ngay" : "Tạo tài khoản"}
              </button>

              <button className="secondary-button w-full rounded-xl py-3" onClick={handleGuest} type="button">
                <Ticket size={18} />
                Vào thử với Guest Pass
                <ArrowRight size={17} />
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
