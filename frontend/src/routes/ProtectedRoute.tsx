import { useAuth } from "@/features/auth/auth.context";
import type { UserType } from "@/features/auth/auth.schema";
import { Navigate, Outlet } from "react-router";
import { landingPathFor } from "./landing";

type ProtectedRouteProps = {
    allow?: UserType[];
};

export function ProtectedRoute({ allow }: ProtectedRouteProps) {

    const { status, user } = useAuth();

    // Still rehydrating (we have a token, asking the server who we are).
    // Don't decide yet — deciding now would flash the login page on every refresh.
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-content">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    // Definitely logged out → bounce to login.
    if (status === 'unauthenticated' || !user) {
        return <Navigate to='/login' replace/>
    }

    // Logged in, but this section isn't for their role → send to their own landing.
    if (allow && !allow.includes(user.type)) {
        return <Navigate to={landingPathFor(user.type)} replace/>
    }

    // Authenticated and authorized.
    return <Outlet />
}