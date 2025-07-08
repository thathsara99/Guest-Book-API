import express from 'express';
const router = express.Router();

import userRoutes from '../routes/userRoutes.js';
import authRoutes from '../routes/auth.js';
import postRoutes from '../routes/postRoutes.js';
import dashboardRoutes from '../routes/dashboardRoutes.js';

router.use('/user', userRoutes);
router.use('/auth', authRoutes);
router.use('/post', postRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;