import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { OnboardingProvider } from "../features/onboarding";
import { UserStatsProvider } from "../features/user-stats/UserStatsProvider";
import { AppLayout } from "../layouts/AppLayout";
import { AuthPage } from "../pages/AuthPage";
import { BuddySelectionPage } from "../pages/BuddySelectionPage";
import { DashboardPage } from "../pages/DashboardPage";
import { MissionsPage } from "../pages/MissionsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ProgressPage } from "../pages/ProgressPage";
import { QuizPage } from "../pages/QuizPage";
import { QuizResultPage } from "../pages/QuizResultPage";
import { RewardsPage } from "../pages/RewardsPage";
import { VerifyEmailPage } from "../pages/VerifyEmailPage";

const Buddy3DPage = lazy(() => import("../pages/Buddy3DPage").then((module) => ({ default: module.Buddy3DPage })));
const BuddyRoomPage = lazy(() => import("../pages/BuddyRoomPage").then((module) => ({ default: module.BuddyRoomPage })));

function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f7f8fc] px-4">
      <div className="app-card p-6 text-center">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Buddy Study</p>
        <p className="mt-2 text-xl font-black">Đang tải trải nghiệm 3D...</p>
      </div>
    </div>
  );
}

type NavigatorConnection = {
  saveData?: boolean;
};

function ProtectedApp() {
  const { mode, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f8fc] px-4">
        <div className="app-card p-6 text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Buddy Study</p>
          <p className="mt-2 text-xl font-black">Đang kiểm tra phiên học...</p>
        </div>
      </div>
    );
  }

  if (mode === "signed_out") {
    return <Navigate replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} to="/auth" />;
  }

  return (
    <UserStatsProvider>
      <OnboardingProvider>
        <AppLayout />
      </OnboardingProvider>
    </UserStatsProvider>
  );
}

export function App() {
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const has3DEnabled = window.localStorage.getItem("study-buddy-3d-enabled") === "true";
    const hasEquippedModel = Boolean(window.localStorage.getItem("study-buddy-equipped-room-model"));
    const shouldPreloadPrimaryModel = has3DEnabled || hasEquippedModel;
    const connection = (navigator as Navigator & { connection?: NavigatorConnection }).connection;

    if (!shouldPreloadPrimaryModel || connection?.saveData) {
      return undefined;
    }

    const preloadTask = async () => {
      const equippedModelId = window.localStorage.getItem("study-buddy-equipped-room-model");
      const [{ preloadVRMModel }, { DEFAULT_VRM_URL, MODEL_URLS_BY_ID }] = await Promise.all([
        import("../components/buddy/utils/loadVRMModel"),
        import("../components/buddy/config/buddyModels"),
      ]);
      const primaryModelUrl = (equippedModelId && (MODEL_URLS_BY_ID as Record<string, string>)[equippedModelId]) || DEFAULT_VRM_URL;

      await preloadVRMModel(primaryModelUrl);
    };

    let timeoutId = 0;
    let idleCallbackId = 0;

    if (typeof window.requestIdleCallback === "function") {
      idleCallbackId = window.requestIdleCallback(() => {
        void preloadTask();
      }, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(() => {
        void preloadTask();
      }, 2200);
    }

    return () => {
      if (idleCallbackId) {
        window.cancelIdleCallback?.(idleCallbackId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route element={<ProtectedApp />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/buddies" element={<BuddySelectionPage />} />
          <Route path="/buddy-room" element={<BuddyRoomPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/quiz-result" element={<QuizResultPage />} />
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/achievements" element={<RewardsPage />} />
          <Route path="/buddy-3d" element={<Buddy3DPage />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/dashboard" />} />
      </Routes>
    </Suspense>
  );
}
