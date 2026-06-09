import { NextFunction, Request, Response } from 'express';
import AuthService from '../services/auth.service';
import { generateTokenPair, verifyAccessToken, verifyRefreshToken } from '../utils/token_utils';
import { AppError } from '../utils/app-error';


export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Identification number and password are requried'
            });
        }

        const result = await AuthService.login({ identifier, password });

        return res.status(200).json({
            success: true,
            message: 'Login Success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const payload = verifyRefreshToken(refreshToken);

        if (payload.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token type'
            });
        }

        const tokens = generateTokenPair(payload.userId, payload.role);
        
        return res.status(200).json({
            success: true,
            message: 'Tokens refreshed successfully',
            data: tokens
        });
    } catch (error) {
        next(error);
    }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await AuthService.getMe(req.user!.userId);

        return res.status(200).json({
            success: true,
            message: 'Current user retrieved',
            data: user
        });
        
    } catch (error) {
        next(error);
    }
}

// Change Password
export const changePassword = async (req: Request, res: Response) => {
    // Will be implementing soon
};