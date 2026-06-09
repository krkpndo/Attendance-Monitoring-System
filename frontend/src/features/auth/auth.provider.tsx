import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { tokenStorage } from "@/lib/token-storage";
import type { LoginResponse, SessionUser } from "./auth.schema";
import { AuthContext, type AuthContextValue, type AuthStatus } from "./auth.context";
import { getMe } from "./auth.api";

// This is a wrapper component. Any component placed inside it (the children) will have access to the authentication data
export function AuthProvider({ children }: { children: ReactNode }) {


    // We initialize the local React state for the user to null (meaning no one is logged in when the app first loads)
    const [user, setUser ] = useState<SessionUser | null>(null);

    const [status, setStatus] = useState<AuthStatus>(
        tokenStorage.getAccessToken() ? 'loading' : 'unauthenticated'
    );

    useEffect(() => {
        if (!tokenStorage.getAccessToken()) return;

        let cancelled = false;

        const rehydrate = async () => {
            try {

                const restored = await getMe();

                if (cancelled) return;

                setUser(restored);
                setStatus('authenticated');

            } catch {
                if (cancelled) return;

                tokenStorage.clear();
                setUser(null);
                setStatus('unauthenticated');
            };
        };

        rehydrate();

        return () => {
            cancelled = true;
        };
    }, []);

    // Tokens → localStorage (for the interceptor); user → React state (for the UI).
    // Wrapping this function in useCallback with an empty dependency array [] ensures that React creates this function exactly once in memory. If we didn't do this, React would create a brand new setSession function every time AuthProvider re-renders, which could cause unnecessary re-renders in child components
    const setSession = useCallback((session: LoginResponse) => {
         
        tokenStorage.setTokens(session.tokens);
        setUser(session.user);
    }, []);

    const clearSession = useCallback(() => {

        tokenStorage.clear();
        setUser(null);
    }, []);

    // Memoize so consumers don't re-render on every parent render. The value object
    // is only a new reference when user / the callbacks actually change

    // This packages up the state and functions into the single AuthContextValue object we defined earlier. Notice how isAuthenticated is dynamically calculated based on whether user is null

    // This is a critical performance optimization. Every component that consumes this context will re-render whenever this value object changes. By wrapping it in useMemo, we tell React: "Only create a new value object if the user, setSession, or clearSession actually change." Without this, every single child component listening to auth would re-render every time the provider re-renders, even if the auth state didn't change
    const value = useMemo<AuthContextValue>(() => ({
        user,
        isAuthenticated: user !== null,
        setSession,
        clearSession
    }), [user, setSession, clearSession]);

    // This returns the actual Provider component. It passes the optimized value object down to all of the children nested inside it.
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}