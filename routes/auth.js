import express from 'express';
const router = express.Router();

import authController from '../auth/authController.js';

router.post('/login', authController.login);
router.get('/activate', authController.activateUser);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

export default router;