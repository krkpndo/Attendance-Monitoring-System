// Session State

import { createContext, useContext } from "react";
import type { LoginResponse, SessionUser } from "./auth.schema";

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// This defines the "shape" of the data that will be shared across your application
export type AuthContextValue = {
    user: SessionUser | null; // Holds the user data if logged in, or null if they are logged out
    isAuthenticated: boolean; // A convenient boolean flag to check if someone is logged in
    setSession: (session: LoginResponse) => void;
    clearSession: () => void;
};

// This creates the actual React Context object

// Initialize it with undefined because at the exact moment this line runs, the AuthProvider hasn't mounted yet, so the context values don't exist. We will use this undefined state later as a safety check to ensure developers don't try to access the context improperly
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);


/** Typed accessor. Throws if used outside the provider — fail loud, fail early. */

// The Custom Hook (The "Fail Fast" Pattern)

// this is a custom hook that other components will use to grab the auth data (e.g., const { user, clearSession } = useAuth();).
export function useAuth() {
    const ctx = useContext(AuthContext);

    if (ctx === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    };

    return ctx;
}