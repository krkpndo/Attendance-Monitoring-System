import { NextFunction, Request, Response } from 'express';
import AuthService from '../services/auth.service';
import { generateTokenPair, verifyAccessToken, verifyRefreshToken } from '../utils/token_utils';


export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
        const { identifier, password } = req.body;

        const result = await AuthService.login({ identifier, password }, meta);

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

        const tokens = await AuthService.refreshSession(refreshToken);

        return res.status(200).json({
            success: true,
            message: 'Tokens refreshed successfully',
            data: tokens
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        await AuthService.logout(req.user!.userId);

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
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

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {

        await AuthService.forgotPassword(req.body.email);

        return res.status(200).json({
            success: true,
            message: 'A reset link has been sent. Please, check your email.'
        });

    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {

        await AuthService.resetPassword(req.body.token, req.body.newPassword);

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully. Please, log in.'
        });

    } catch (error) {
        next(error);
    }
};