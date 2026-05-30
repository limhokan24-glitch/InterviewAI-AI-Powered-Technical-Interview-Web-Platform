import { useAuth } from "@/features/auth/store";
import { InterviewerDashboard } from "./InterviewerDashboard";
import { CandidateDashboard } from "./CandidateDashboard";

/** Routes to the correct dashboard based on the signed-in user's role. */
export function DashboardPage() {
  const user = useAuth((s) => s.user);
  const firstName = user?.name?.split(" ")[0];

  return user?.role === "interviewer" ? (
    <InterviewerDashboard firstName={firstName} />
  ) : (
    <CandidateDashboard firstName={firstName} />
  );
}
