import { z } from 'zod';
// Enums now live in the shared module (a second feature needed them), and are
// re-exported below so existing `auth.schema` imports keep working.
import { userTypeSchema, userStatusSchema } from '@/lib/enums';

/**
 * Request — what the LoginPage form produces and we send to POST /auth/login.
 * `identifier` resolves to studentNumber | employeeNumber | username on the backend.
 *
 * Validation here is intentionally light: a login form should only assert
 * "you typed something", not enforce password rules. Complexity checks belong
 * on registration, not on the door you're trying to walk back through.
 */
export const loginRequestSchema = z.object({
    identifier: z.string().trim().min(1, 'Identifier is required'),
    password: z.string().min(1, 'Password is required')
});

/**
 * Forgot-password — just an email. The backend intentionally returns 200 even
 * for unknown emails (no account enumeration), so the UI must not reveal whether
 * the address existed; it always shows the same neutral confirmation.
 */
export const forgotPasswordSchema = z.object({
    email: z.string().trim().email('Enter a valid email address')
});

/**
 * Reset-password FORM schema. `confirmPassword` is client-only (never sent) — it
 * exists purely to catch typos before we commit a new password the user then
 * can't log in with. The request body is just { token, newPassword }.
 * Min length mirrors the backend (8).
 */
export const resetPasswordFormSchema = z
    .object({
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(1, 'Re-enter your new password')
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
        path: ['confirmPassword'],
        message: 'Passwords do not match'
    });

export const sessionUserSchema = z.object({
    id: z.string(),
    type: userTypeSchema,
    status: userStatusSchema
});

/**
 * Response — the shape of `res.data.data` from a 200 login.
 * Note: `user` carries only id/type/status — NO name/email. Full profile is
 * fetched separately from the role's /profile endpoint after login.
 */
export const loginResponseSchema = z.object({
    tokens: z.object({
        accessToken: z.string(),
        refreshToken: z.string()
    }),
    user: sessionUserSchema
});

// Inferred types (your "Entities") — derived from the schemas, never hand-written.
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type UserType = z.infer<typeof userTypeSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;