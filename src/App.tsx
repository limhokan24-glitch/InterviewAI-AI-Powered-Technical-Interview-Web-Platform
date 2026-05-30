import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

// Heavy routes (Recharts / Monaco) are split into their own chunks so the
// initial load stays light and they download only when first visited.
const AnalyticsPage = lazy(() =>
  import("@/features/analytics/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage }))
);
const InterviewListPage = lazy(() =>
  import("@/features/interview/InterviewListPage").then((m) => ({ default: m.InterviewListPage }))
);
const InterviewRoomPage = lazy(() =>
  import("@/features/interview/InterviewRoomPage").then((m) => ({ default: m.InterviewRoomPage }))
);

function PublicOnly({ children }: { children: React.ReactNode }) {
  const user = useAuth((s) => s.user);
  return user ? <Navigate to="/app" replace /> : <>{children}</>;
}

function PageFallback() {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center text-muted-foreground">
      <Loader2 className="mr-2 size-5 animate-spin" /> Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route
              path="interviews"
              element={<Suspense fallback={<PageFallback />}><InterviewListPage /></Suspense>}
            />
            <Route
              path="interviews/:id"
              element={<Suspense fallback={<PageFallback />}><InterviewRoomPage /></Suspense>}
            />
            <Route
              path="analytics"
              element={<Suspense fallback={<PageFallback />}><AnalyticsPage /></Suspense>}
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
