import type { Session, User } from "@supabase/supabase-js";
import { createContext, startTransition, useContext, useEffect, useState, type ReactNode } from "react";
import { AUTH_TOKEN_KEY, AUTH_UNAUTHORIZED_EVENT } from "../services/apiClient";
import { getMeWithApi, loginWithApi, registerWithApi, verifyEmailWithApi, type RegisterResponse } from "../services/authApi";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";

type Role = "student" | "teacher" | "admin" | "guest";
type SessionMode = "authenticated" | "guest" | "signed_out";

export type AuthUser = {
  id: number | string | null;
  email: string;
  role: Role;
  name: string;
  avatar: string;
};

type BackendTokenResponse = {
  access_token: string;
  user: {
    id: number | string;
    email: string;
    role: Exclude<Role, "guest">;
    displayName?: string;
    display_name?: string;
    name?: string;
    avatar?: string;
  };
};

type AuthProviderMode = "supabase" | "api";

type AuthContextValue = {
  user: AuthUser | null;
  mode: SessionMode;
  isLoading: boolean;
  authProvider: AuthProviderMode;
  isSupabaseReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<RegisterResponse | void>;
  verifyEmail: (verificationSessionId: string, otp: string) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
};

const AUTH_USER_KEY = "study_learn_user";
const AUTH_MODE_KEY = "study_learn_session_mode";

const guestUser: AuthUser = {
  id: null,
  email: "guest@study.local",
  role: "guest",
  name: "Guest Pass",
  avatar: "GP",
};

const AuthContext = createContext<AuthContextValue | null>(null);

function buildDisplayName(email: string) {
  const localName = email.split("@")[0]?.replace(/[._-]+/g, " ") || "Study Learner";
  return localName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ");
}

function buildAvatar(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "SL";
}

function toBackendAuthUser(user: BackendTokenResponse["user"]): AuthUser {
  const displayName = user.displayName ?? user.display_name ?? user.name ?? buildDisplayName(user.email);
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: displayName,
    avatar: user.avatar ?? buildAvatar(displayName),
  };
}

function toSupabaseAuthUser(user: User): AuthUser {
  const metadataRole = user.user_metadata?.role;
  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : buildDisplayName(user.email ?? "study-learner");

  return {
    id: user.id,
    email: user.email ?? "unknown@supabase.local",
    role: metadataRole === "teacher" || metadataRole === "admin" ? metadataRole : "student",
    name: metadataName,
    avatar: buildAvatar(metadataName),
  };
}

async function buildSupabaseAuthUser(user: User): Promise<AuthUser> {
  const fallbackUser = toSupabaseAuthUser(user);

  if (!supabase) {
    return fallbackUser;
  }

  try {
    const [appUserResult, profileResult] = await Promise.all([
      supabase.from("users").select("email, role").eq("id", user.id).maybeSingle(),
      supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
    ]);

    const appUser = appUserResult.data;
    const profile = profileResult.data;
    const role = appUser?.role === "teacher" || appUser?.role === "admin" ? appUser.role : "student";
    const name =
      typeof profile?.display_name === "string" && profile.display_name.trim()
        ? profile.display_name
        : fallbackUser.name;

    return {
      ...fallbackUser,
      email: typeof appUser?.email === "string" ? appUser.email : fallbackUser.email,
      role,
      name,
      avatar: buildAvatar(name),
    };
  } catch {
    return fallbackUser;
  }
}

function readStoredUser(): AuthUser | null {
  const mode = localStorage.getItem(AUTH_MODE_KEY);
  if (mode === "guest") {
    return guestUser;
  }

  const rawUser = localStorage.getItem(AUTH_USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

function setStoredUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_MODE_KEY, "authenticated");
}

function clearStoredAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_MODE_KEY);
}

async function applySupabaseSession(session: Session | null): Promise<AuthUser | null> {
  if (!session?.user) {
    clearStoredAuth();
    return null;
  }

  const nextUser = await buildSupabaseAuthUser(session.user);
  localStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
  setStoredUser(nextUser);
  return nextUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [mode, setMode] = useState<SessionMode>(() => {
    const storedMode = localStorage.getItem(AUTH_MODE_KEY);
    if (storedMode === "guest") return "guest";
    return localStorage.getItem(AUTH_TOKEN_KEY) ? "authenticated" : "signed_out";
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      if (mode === "guest") {
        if (!isMounted) return;
        startTransition(() => {
          setUser(guestUser);
          setIsLoading(false);
        });
        return;
      }

      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        const nextUser = await applySupabaseSession(data.session);
        if (!isMounted) return;
        startTransition(() => {
          setUser(nextUser);
          setMode(nextUser ? "authenticated" : "signed_out");
          setIsLoading(false);
        });
        return;
      }

      if (mode !== "authenticated" || !localStorage.getItem(AUTH_TOKEN_KEY)) {
        if (!isMounted) return;
        setIsLoading(false);
        return;
      }

      try {
        const data = await getMeWithApi();
        if (!isMounted) return;
        const nextUser = toBackendAuthUser(data);
        setStoredUser(nextUser);
        startTransition(() => {
          setUser(nextUser);
          setMode("authenticated");
          setIsLoading(false);
        });
      } catch {
        if (!isMounted) return;
        clearStoredAuth();
        startTransition(() => {
          setUser(null);
          setMode("signed_out");
          setIsLoading(false);
        });
      }
    }

    bootstrap();

    if (mode !== "guest" && isSupabaseConfigured && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        void applySupabaseSession(session).then((nextUser) => {
          if (!isMounted) return;
          startTransition(() => {
            setUser(nextUser);
            setMode(nextUser ? "authenticated" : "signed_out");
            setIsLoading(false);
          });
        });
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [mode]);

  useEffect(() => {
    function handleUnauthorized() {
      if (mode === "guest") return;
      clearStoredAuth();
      setUser(null);
      setMode("signed_out");
      setIsLoading(false);
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [mode]);

  async function login(email: string, password: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const nextUser = await applySupabaseSession(data.session);
      if (!nextUser) {
        throw new Error("Đăng nhập chưa hoàn tất. Vui lòng thử lại.");
      }
      setUser(nextUser);
      setMode("authenticated");
      return;
    }

    const data = await loginWithApi(email, password);
    const nextUser = toBackendAuthUser(data.user);
    localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
    setStoredUser(nextUser);
    setUser(nextUser);
    setMode("authenticated");
  }

  async function register(email: string, password: string) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: buildDisplayName(email),
            role: "student",
          },
        },
      });
      if (error) throw error;

      const nextUser = await applySupabaseSession(data.session);
      if (nextUser) {
        setUser(nextUser);
        setMode("authenticated");
        return;
      }

      clearStoredAuth();
      throw new Error("Tài khoản đã được tạo. Hãy xác nhận email trước khi đăng nhập nếu Supabase yêu cầu.");
    }

    return registerWithApi(email, password);
  }

  async function verifyEmail(verificationSessionId: string, otp: string) {
    const data = await verifyEmailWithApi(verificationSessionId, otp);
    const nextUser = toBackendAuthUser(data.user);
    localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
    setStoredUser(nextUser);
    setUser(nextUser);
    setMode("authenticated");
  }

  function continueAsGuest() {
    clearStoredAuth();
    localStorage.setItem(AUTH_MODE_KEY, "guest");
    setUser(guestUser);
    setMode("guest");
    setIsLoading(false);
  }

  async function logout() {
    if (isSupabaseConfigured && supabase && mode !== "guest") {
      await supabase.auth.signOut();
    }
    clearStoredAuth();
    setUser(null);
    setMode("signed_out");
    setIsLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        mode,
        isLoading,
        authProvider: isSupabaseConfigured ? "supabase" : "api",
        isSupabaseReady: isSupabaseConfigured,
        login,
        register,
        verifyEmail,
        continueAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
