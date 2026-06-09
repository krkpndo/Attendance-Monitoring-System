import { apiClient } from "@/api/client";
import { loginResponseSchema, sessionUserSchema, type LoginRequest, type LoginResponse, type SessionUser } from "./auth.schema";

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