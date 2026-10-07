import { Navigate } from "react-router";
import { useAuth } from "@/features/auth/auth.context";
import { landingPathFor } from "./landing";

/*
 * RootRedirect — what "/" resolves to. It has no UI of its own; it just points
 * the user at the right place based on auth status:
 *   - still rehydrating → show a spinner (don't decide yet, or we'd flash /login)
 *   - logged in         → their role's landing page
 *   - logged out        → /login
 */
export function RootRedirect() {
  const { status, user } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={landingPathFor(user.type)} replace />;
  }

  return <Navigate to="/login" replace />;
}
