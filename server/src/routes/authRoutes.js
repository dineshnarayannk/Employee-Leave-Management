import { Router } from 'express';
import { handleGoogleLogin, getCurrentUser, handleLogout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public auth endpoints
router.post('/google', handleGoogleLogin);
router.post('/logout', handleLogout);

// Protected auth endpoints
router.get('/me', requireAuth, getCurrentUser);

export default router;
