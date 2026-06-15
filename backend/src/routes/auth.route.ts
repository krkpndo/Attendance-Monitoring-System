import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { forgotPasswordSchema, loginParamSchema, refreshTokenSchema, resetPasswordSchema } from '../validators/auth.validator';

const router = Router();

router.post('/login', validate(loginParamSchema), AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.post('/refresh-token', validate(refreshTokenSchema), AuthController.refreshToken);
router.get('/me', authenticate, AuthController.me);
router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

export default router;