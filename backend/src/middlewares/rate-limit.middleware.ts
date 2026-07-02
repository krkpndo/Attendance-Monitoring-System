import rateLimit from "express-rate-limit";
import { Request, Response } from 'express';

const jsonHandler = (message: string) => (_req: Request, res: Response) => {
    res.status(409).json({ success: false, message: 'RATE_LIMITED' });
};

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: jsonHandler('Too many login attempts. Please try again in a few minutes.')
});

export const passwordResetRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: jsonHandler('Too many password reset requests. Please try again later.')
});