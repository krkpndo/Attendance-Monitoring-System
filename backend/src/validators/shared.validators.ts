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

export const attachmentIdParamSchema = z.object({
    attachmentId: z.uuid('Invalid attachment ID')
});

// Excuse review is shared by admin (oversight) and professor (own classes)
export const reviewExcuseLetterSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED'], {
        message: 'Status must be APPROVED or REJECTED'
    }),
    rejectionReason: z.string().max(500).optional()
});

// Reusable page/limit fragment. `z.coerce` because query params arrive as
// strings; the validate middleware writes the coerced values back onto
// req.query, so controllers receive real numbers with defaults applied.
export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
});