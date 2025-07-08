import express from 'express';
const router = express.Router();

import postController from '../controller/postController.js';
import authMiddleware from '../middleware/auth.js';

router.post('/', authMiddleware.verifyToken, postController.upload.single('image'), postController.publishPost);
router.post('/:postId', authMiddleware.verifyToken, postController.upload.none(), postController.addComment);
router.get('/approved', postController.getApprovedPosts);

export default router;    