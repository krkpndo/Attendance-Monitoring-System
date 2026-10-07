import { apiClient } from "@/api/client";
import { loginResponseSchema, sessionUserSchema, type ForgotPasswordRequest, type LoginRequest, type LoginResponse, type SessionUser } from "./auth.schema";

/**
 * Calls POST /auth/login and returns a validated LoginResponse.
 *
 * Two boundaries are crossed here, and only here:
 *  1. Network    — apiClient does the HTTP. Its response interceptor has already
 *                  turned any failure into an ApiError before we get here, so we
 *                  only deal with the happy path.
 *  2. Trust      — res.data.data is `unknown` as far as we're concerned. We run it
 *                  through .parse() so everything above this line gets a real,
 *                  schema-checked LoginResponse (or a loud throw if the backend drifts).
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
    
    const res = await apiClient.post('/auth/login', credentials);

    return loginResponseSchema.parse(res.data.data);
};

export async function getMe(): Promise<SessionUser> {

    const res = await apiClient.get('/auth/me');

    return sessionUserSchema.parse(res.data.data);
}

/**
 * Calls POST /auth/logout, which deletes the server-side refresh session so the
 * refresh token can't be reused. There's no response body worth parsing — the
 * meaningful cleanup (clearing local tokens + cache) happens in the useLogout hook.
 */
export async function logout(): Promise<void> {
    await apiClient.post('/auth/logout');
}

/**
 * Requests a password-reset email. Resolves on 200 regardless of whether the
 * email matched an account — the backend deliberately doesn't disclose that, and
 * neither should we (the caller shows one neutral "if it exists, we sent it" msg).
 */
export async function forgotPassword(body: ForgotPasswordRequest): Promise<void> {
    await apiClient.post('/auth/forgot-password', body);
}

/**
 * Consumes the emailed token to set a new password. On success the backend
 * invalidates all existing sessions, so the user must sign in again afterward.
 */
export async function resetPassword(body: { token: string; newPassword: string }): Promise<void> {
    await apiClient.post('/auth/reset-password', body);
}