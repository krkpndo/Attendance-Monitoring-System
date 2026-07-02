import argon2 from 'argon2';
import prisma from '../config/prisma';
import { generateTokenPair, getTokenExpiry, hashToken, verifyRefreshToken } from '../utils/token_utils';
import { AppError } from '../utils/app_error';
import { LoginParam, LoginResponse } from '../interfaces/auth.interface';
import { TokenPayload } from '../interfaces/token.interface';
import crypto from 'crypto';
import MailService from './mail.service';

type SessionMeta = { userAgent?: string; ipAddress?: string; };

class AuthService {

    private static async issueSession(
        user: LoginResponse['user'],
        meta?: SessionMeta
    ): Promise<LoginResponse> {
        const tokens = generateTokenPair(user.id, user.type);

        const sessionData = {
            tokenHash: hashToken(tokens.refreshToken),
            expiresAt: getTokenExpiry(tokens.refreshToken),
            userAgent: meta?.userAgent,
            ipAddress: meta?.ipAddress
        };

        const [, updatedUser ] = await prisma.$transaction([
            prisma.session.upsert({
                where: { userId: user.id },
                create: { userId: user.id, ...sessionData },
                update: sessionData
            }),
            prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date(), lastLoginIp: meta?.ipAddress },
                select: { lastLoginAt: true  }
            })
        ]);

        return {
            tokens,
            user: {
                id: user.id,
                type: user.type,
                status: user.status,
                lastLoginAt: updatedUser.lastLoginAt,
                mustChangePassword: user.mustChangePassword
            }
        };
    }

    static async login(param: LoginParam, meta?: SessionMeta): Promise<LoginResponse> {
        const student = await prisma.student.findUnique({
            where: { studentNumber: param.identifier },
            include: { user: true }
        });
    
        if (student) {
            const validPassword = await argon2.verify(student.user.password, param.password);
    
            if (!validPassword) {
                throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
            }
    
            if (student.user.status === 'INACTIVE') {
                throw new AppError('Account is currently deactivated', 403, 'ACCOUNT_DEACTIVATED');
            }
    
            return this.issueSession(student.user, meta);
        }
    
        const professor = await prisma.professor.findUnique({
            where: { employeeNumber: param.identifier },
            include: { user: true }
        });
    
        if (professor) {
            const validPassword = await argon2.verify(professor.user.password, param.password);
    
            if (!validPassword) {
                throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
            }
    
            if (professor.user.status === 'INACTIVE') {
                throw new AppError('Account is currently deactivated', 403, 'ACCOUNT_DEACTIVATED');
            }

            return this.issueSession(professor.user, meta);
        }
    
        const user = await prisma.user.findUnique({
            where: { username: param.identifier }
        });
    
        if (user && user.type === 'ADMIN') {
            const validPassword = await argon2.verify(user.password, param.password);
    
            if (!validPassword) {
                throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
            }
    
            if (user.status === 'INACTIVE') {
                throw new AppError('Account is currently deactivated', 403, 'ACCOUNT_DEACTIVATED');
            }
    
            return this.issueSession(user, meta);
        }
    
        throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    static async refreshSession(refreshToken: string): Promise<LoginResponse['tokens']> {
        
        let payload: TokenPayload;

        try {
            payload = verifyRefreshToken(refreshToken);
        } catch {
            throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
        }

        if (payload.type !== 'refresh') {
            throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
        }

        const session = await prisma.session.findUnique({
            where: { userId: payload.userId },
            include: { user: { select: { status: true } } }
        });

        if (!session || session.tokenHash !== hashToken(refreshToken)) {
            throw new AppError('Session expired. Please log in again.', 401, 'SESSION_INVALID');
        }

        if (session.tokenHash !== hashToken(refreshToken)) {
            await prisma.session.delete({ where: { userId: payload.userId } });

            throw new AppError('Session invalidated for security reasons. Please log in again.', 401, 'TOKEN_REUSE_DETECTED');
        }

        if (session.user.status === 'INACTIVE') {
            await prisma.session.delete({ where: { userId: payload.userId } });
            
            throw new AppError('Account is currently deactivated', 403, 'ACCOUNT_DEACTIVATED');
        }

        const tokens = generateTokenPair(payload.userId, payload.role);

        await prisma.session.update({
            where: { userId: payload.userId },
            data: {
                tokenHash: hashToken(tokens.refreshToken),
                expiresAt: getTokenExpiry(tokens.refreshToken)
            }
        });
        
        return tokens;
    }

    static async getMe(userId: string): Promise<LoginResponse['user']> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, type: true, status: true, lastLoginAt: true, mustChangePassword: true }
        });

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        return user;
    }

    static async logout(userId: string): Promise<void> {

        await prisma.session.deleteMany({ where: { userId } });
    }

    static async forgotPassword(email: string): Promise<void> {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return;

        await prisma.passwordReset.deleteMany({ where: { userId: user.id, usedAt: null } });

        const rawToken = crypto.randomBytes(32).toString('hex');

        await prisma.passwordReset.create({
            data: {
                userId: user.id,
                tokenHash: hashToken(rawToken),
                expiresAt: new Date(Date.now() + 30 * 60 * 1000)
            }
        });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

        try {
            await MailService.sendPasswordReset(user.email, resetLink, user.name);
        } catch (err) {
            console.error("Password reset email failed:", err);
        }
    }

    static async resetPassword(token: string, newPassword: string): Promise<void> {

        const reset = await prisma.passwordReset.findUnique({
            where: { tokenHash: hashToken(token) }
        });

        if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
            throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
        }

        const hashedPassword = await argon2.hash(newPassword);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: reset.userId },
                data: { password: hashedPassword }
            }),
            prisma.passwordReset.update({
                where: { id: reset.id },
                data: { usedAt: new Date() }
            }),
            prisma.session.deleteMany({
                where: { userId: reset.userId },
            })
        ]);
    }

    static async changePassword(userId: string, newPassword: string, currentPassword?: string): Promise<void> {

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true, mustChangePassword: true }
        });

        if (!user) {
            throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }

        if (!user.mustChangePassword) {
            if (!currentPassword) {
                throw new AppError('Current password is required', 400, 'CURRENT_PASSWORD_REQUIRED');
            }

            const validPassword = await argon2.verify(user.password, currentPassword);

            if (!validPassword) {
                throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS');
            }
        }

        const samePassword = await argon2.verify(user.password, newPassword);

        if (samePassword) {
            throw new AppError('New password must be different from the current password', 400, 'PASSWORD_UNCHANGED');
        }

        const hashedPassword = await argon2.hash(newPassword);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword, mustChangePassword: false }
            }),
            prisma.session.deleteMany({
                where: { userId }
            })
        ]);
    }
}

export default AuthService;