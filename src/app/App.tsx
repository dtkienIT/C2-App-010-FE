import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AppLayout } from "../layouts/AppLayout";
import { AuthPage } from "../pages/AuthPage";
import { Buddy3DPage } from "../pages/Buddy3DPage";
import { BuddyRoomPage } from "../pages/BuddyRoomPage";
import { BuddySelectionPage } from "../pages/BuddySelectionPage";
import { DashboardPage } from "../pages/DashboardPage";
import { MissionsPage } from "../pages/MissionsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ProgressPage } from "../pages/ProgressPage";
import { QuizPage } from "../pages/QuizPage";
import { QuizResultPage } from "../pages/QuizResultPage";
import { RewardsPage } from "../pages/RewardsPage";

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

  return <AppLayout />;
}

export function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
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
  );
}
