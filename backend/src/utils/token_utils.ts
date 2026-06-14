import jwt from 'jsonwebtoken';
import { TokenPayload } from '../interfaces/token.interface';
import crypto from 'crypto';
import { UserType } from '@prisma/client';

export const generateAccessToken = (userId: string, role: UserType): string => {

    const data: TokenPayload = { userId, type: 'access', role };

    const options =  {
        expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || '1d') as jwt.SignOptions['expiresIn']
    };

    return jwt.sign(
        data,
        process.env.ACCESS_TOKEN_SECRET as string,
        options
    );
};

export const generateRefreshToken = (userId: string, role: UserType): string => {
    const data: TokenPayload = { userId, type: 'refresh', role, jti: crypto.randomUUID()  };

    const options =  {
        expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || '7d') as jwt.SignOptions['expiresIn']
    };

    return jwt.sign(
        data,
        process.env.REFRESH_TOKEN_SECRET as string,
        options
    );
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as TokenPayload;
};

export const generateTokenPair = (userId: string, role: UserType) => {

    return {
        accessToken: generateAccessToken(userId, role),
        refreshToken: generateRefreshToken(userId, role)
    };
};

export const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex');

export const getTokenExpiry = (token: string): Date => {

    const decoded = jwt.decode(token) as { exp?: number } | null;

    const seconds = decoded?.exp ?? Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

    return new Date(seconds * 1000);
}