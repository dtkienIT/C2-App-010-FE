import { isAxiosError } from "axios";
import { ArrowLeft, MailCheck, RefreshCcw, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { StudyBuddyLogo } from "../components/StudyBuddyLogo";
import { ThemeToggle } from "../components/ThemeToggle";
import { resendVerificationOtpWithApi } from "../services/authApi";

const VERIFY_SESSION_KEY = "study_learn_email_verification";
const RESEND_COOLDOWN_SECONDS = 60;

type StoredVerificationSession = {
  email: string;
  verificationSessionId: string;
};

export function saveVerificationSession(session: StoredVerificationSession) {
  sessionStorage.setItem(VERIFY_SESSION_KEY, JSON.stringify(session));
}

function readVerificationSession(): StoredVerificationSession | null {
  const raw = sessionStorage.getItem(VERIFY_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredVerificationSession;
  } catch {
    sessionStorage.removeItem(VERIFY_SESSION_KEY);
    return null;
  }
}

function clearVerificationSession() {
  sessionStorage.removeItem(VERIFY_SESSION_KEY);
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

function errorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
  }
  if (error instanceof Error) return error.message;
  return "Khong ket noi duoc may chu. Vui long thu lai.";
}

export function VerifyEmailPage() {
  const { mode, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<StoredVerificationSession | null>(() => readVerificationSession());
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const maskedEmail = useMemo(() => maskEmail(session?.email ?? ""), [session?.email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  if (mode !== "signed_out") {
    return <Navigate replace to="/dashboard" />;
  }

  if (!session) {
    return <Navigate replace to="/auth" />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || otp.length !== 6 || isSubmitting) return;
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      await verifyEmail(session.verificationSessionId, otp);
      clearVerificationSession();
      navigate("/dashboard", { replace: true });
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (!session || cooldown > 0 || isResending) return;
    setError("");
    setMessage("");
    setIsResending(true);
    try {
      const result = await resendVerificationOtpWithApi(session.verificationSessionId);
      const nextSession = { email: result.email, verificationSessionId: result.verification_session_id };
      saveVerificationSession(nextSession);
      setSession(nextSession);
      setOtp("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setMessage("Ma moi da duoc gui. Hay kiem tra email cua ban.");
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className="auth-shell min-h-screen px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-xl items-center">
        <section className="auth-form-panel w-full">
          <div className="mb-7 flex items-center justify-between gap-3">
            <StudyBuddyLogo />
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase text-accent">Bao mat tai khoan</p>
              <h1 className="mt-2 text-3xl font-black text-foreground">Xac nhan email</h1>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-accent">
              <MailCheck size={24} />
            </div>
          </div>

          <p className="mt-5 rounded-2xl bg-muted px-4 py-3 text-sm font-bold leading-6 text-muted-foreground">
            Chung toi da gui ma gom 6 chu so den <span className="text-foreground">{maskedEmail}</span>. Ma co hieu luc trong 5 phut.
          </p>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-black text-foreground" htmlFor="otp">
                Ma OTP
              </label>
              <input
                autoComplete="one-time-code"
                className="auth-input text-center text-2xl font-black tracking-[0.45em]"
                id="otp"
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
            </div>

            {error ? <p className="rounded-xl border border-rose-300/60 bg-rose-100/70 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}
            {message ? <p className="rounded-xl border border-emerald-300/60 bg-emerald-100/70 px-4 py-3 text-sm font-bold text-emerald-700">{message}</p> : null}

            <button className="primary-button w-full rounded-xl py-3.5" disabled={otp.length !== 6 || isSubmitting} type="submit">
              <ShieldCheck size={18} />
              {isSubmitting ? "Dang xac nhan..." : "Xac nhan"}
            </button>

            <button className="secondary-button w-full rounded-xl py-3" disabled={cooldown > 0 || isResending} onClick={handleResend} type="button">
              <RefreshCcw size={18} />
              {isResending ? "Dang gui..." : cooldown > 0 ? `Gui lai ma sau ${cooldown}s` : "Gui lai ma"}
            </button>

            <Link className="secondary-button w-full rounded-xl py-3" to="/auth">
              <ArrowLeft size={18} />
              Quay lai dang nhap
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}
