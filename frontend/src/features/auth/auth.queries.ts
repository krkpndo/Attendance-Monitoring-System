import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth.context";
import type { ForgotPasswordRequest, LoginRequest, LoginResponse } from "./auth.schema";
import type { ApiError } from "@/lib/api-error";
import { forgotPassword, login, logout, resetPassword } from "./auth.api";

export function useLogin() {
    const { setSession } = useAuth();

    return useMutation<LoginResponse, ApiError, LoginRequest>({
        mutationFn: login,
        onSuccess: (data) => {
            setSession(data)
        }
    });
}

/**
 * Logout as a mutation. It calls the server, then ALWAYS clears local auth
 * regardless of the network result (`onSettled`) — if the server call fails,
 * the access token expires on its own anyway, and we don't want a failed request
 * to trap the user in a logged-in-looking UI. `queryClient.clear()` wipes cached
 * server data so the next user doesn't briefly see the previous one's data.
 */
export function useLogout() {
    const { clearSession } = useAuth();
    const queryClient = useQueryClient();

    return useMutation<void, ApiError, void>({
        mutationFn: logout,
        onSettled: () => {
            clearSession();
            queryClient.clear();
        }
    });
}

/** Request a reset email. No session side effects — just fire and confirm. */
export function useForgotPassword() {
    return useMutation<void, ApiError, ForgotPasswordRequest>({
        mutationFn: forgotPassword
    });
}

/** Set a new password from an emailed token. */
export function useResetPassword() {
    return useMutation<void, ApiError, { token: string; newPassword: string }>({
        mutationFn: resetPassword
    });
}