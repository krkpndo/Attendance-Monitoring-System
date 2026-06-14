import z from "zod";

export const loginParamSchema = z.object({
    identifier: z.string().min(8).max(50)
});

export const updateProfileSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    email: z.email('Invalid email format').max(50).optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').max(50).optional(),
    password: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').optional()
});