import z from "zod";

export const loginParamSchema = z.object({
    identifier: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required')
});

export const forgotPasswordSchema = z.object({
    email: z.email('A valid email is required')
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters')
});