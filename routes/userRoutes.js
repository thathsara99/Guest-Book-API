import express from 'express';
const router = express.Router();
import authMiddleware from '../middleware/auth.js';

import userController from '../controller/userController.js';

router.post('/', userController.registerUser);
router.post('/profile/:id/picture', authMiddleware.verifyToken, userController.uploadProfilePic.single('profilePic'), userController.uploadUserProfilePicture);
router.put('/:id', authMiddleware.verifyToken, userController.updateUser);
router.patch('/:id/status', authMiddleware.verifyToken, userController.updateUserStatus);
router.delete('/:id', authMiddleware.verifyToken, userController.deleteUser);
router.get('/:id/profile-picture', authMiddleware.verifyToken, userController.getUserProfilePicture);
router.get('/:id', authMiddleware.verifyToken, userController.getUserById);

export default router;