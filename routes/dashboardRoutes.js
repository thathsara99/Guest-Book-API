import express from 'express';
const router = express.Router();

import dashboardController from '../controller/dashboardController.js';
import authMiddleware from '../middleware/auth.js';

router.get('/stats', authMiddleware.verifyToken, authMiddleware.checkRole(['System Admin']), dashboardController.getDashboardStats);
router.get('/posts', authMiddleware.verifyToken, authMiddleware.checkRole(['System Admin']), dashboardController.getAllPosts);
router.get('/comments', authMiddleware.verifyToken, authMiddleware.checkRole(['System Admin']),dashboardController.getAllComments);
router.delete('/posts/:postId', authMiddleware.verifyToken, authMiddleware.checkRole(['System Admin']), dashboardController.deletePost);
router.delete('/posts/:postId/comments/:commentId', authMiddleware.verifyToken, authMiddleware.checkRole(['System Admin']), dashboardController.deleteComment);
router.patch('/posts/:postId/status', authMiddleware.verifyToken, authMiddleware.checkRole(['System Admin']), dashboardController.updatePostStatus);
router.patch('/posts/:postId/comments/:commentId/status', authMiddleware.verifyToken, authMiddleware.checkRole(['System Admin']), dashboardController.updateCommentStatus);

export default router; 