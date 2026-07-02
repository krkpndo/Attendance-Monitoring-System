import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { changePasswordSchema, forgotPasswordSchema, loginParamSchema, refreshTokenSchema, resetPasswordSchema } from '../validators/auth.validators';
import { loginRateLimiter, passwordResetRateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

router.post('/login', loginRateLimiter, validate(loginParamSchema), AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);
router.get('/me', authenticate, AuthController.me);
router.post('/forgot-password', passwordResetRateLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);

export default router;