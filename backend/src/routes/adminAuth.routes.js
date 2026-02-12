import express from 'express';
import { adminLogin } from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * POST /auth/admin/login
 */
router.post('/login', adminLogin);

export default router;
