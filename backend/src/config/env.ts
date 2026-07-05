import z from "zod";


// Parse and validate process.env ONCE at startup. Anything required and
// missing/malformed stops the process here with a readable message —
// instead of a mysterious 500 the first time login signs a token or the
// first password reset tries to construct the mail client.
const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    ACCESS_TOKEN_SECRET: z.string().min(1),
    REFRESH_TOKEN_SECRET: z.string().min(1),
    ACCESS_TOKEN_EXPIRY: z.string().default('1d'),
    REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
    PORT: z.coerce.number().int().positive().default(3000),
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().min(1),
    FRONTEND_URL: z.url(),
    // The bug from finding #3 lives here: coerced to a number, defaulted,
    // and constrained. A non-numeric value now fails at boot instead of
    // silently becoming NaN and marking every tap LATE.
    ATTENDANCE_LATE_THRESHOLD_MINUTES: z.coerce.number().int().min(0).default(15)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid or missing environment variables:');

    for (const issue of parsed.error.issues) {
        console.error(` - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
}

export const env = parsed.data;