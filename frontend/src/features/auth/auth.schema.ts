import { z } from 'zod';

/**
 * Domain enums (mirror the backend Postgres enums).
 *
 * These live here for now because only auth uses them. The moment a second
 * feature needs UserType/UserStatus (e.g. the profile feature), lift these two
 * lines into a shared module — don't copy-paste them. (See note below.)
 */
const userTypeSchema = z.enum(['STUDENT', 'PROFESSOR', 'ADMIN']);
const userStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

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
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type UserType = z.infer<typeof userTypeSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;