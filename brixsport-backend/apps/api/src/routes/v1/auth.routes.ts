import { Router } from 'express';
import {
  signup,
  login,
  refreshTokens,
  logout,
  logoutAllSessions,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  enableMFA,
  disableMFA,
  listSessions,
  revokeSession
} from '../../controllers/auth.controller';
import {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  validate
} from '../../validation/user.validation';
import { authRateLimiter, passwordResetRateLimiter, credentialRateLimiter, mfaRateLimiter } from '../../middleware/rateLimit.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Public routes with rate limiting
// Note: No rate limiter on signup to support mass student registrations from shared school networks
// Email uniqueness is enforced at the database level to prevent duplicate accounts
router.post('/signup', validate(signupSchema), signup);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refreshTokens);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', credentialRateLimiter, resendVerification);
router.post('/forgot-password', passwordResetRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', passwordResetRateLimiter, validate(resetPasswordSchema), resetPassword);

// Protected routes requiring authentication
router.use(authenticate);

router.post('/logout', logout);
router.post('/logout-all', logoutAllSessions);
router.post('/change-password', credentialRateLimiter, validate(changePasswordSchema), changePassword);
router.post('/enable-mfa', mfaRateLimiter, enableMFA);
router.post('/disable-mfa', mfaRateLimiter, disableMFA);
router.get('/sessions', listSessions);
router.delete('/sessions/:id', revokeSession);

export default router;