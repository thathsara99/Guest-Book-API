import User from '../model/User.js';
import loggerUtil from "../utils/logger.js";
import userService from "../services/userService.js";
import objectUtils from '../utils/objectUtils.js';
import CatchAsync from '../utils/CatchAsync.js';
import AppError from '../utils/AppError.js';
import WithSession from '../utils/withSessions.js';
import Role from '../model/Role.js';
import multer from 'multer';
import fs from 'fs';

//Register Any User
const registerUser = WithSession(async (req, res, next, session) => {
  const {
    firstName,
    lastName,
    email,
    roleId,
    password,
    status
  } = req.body;

  await userService.registerUser(
    { firstName, lastName, email, password, roleId, status },
    session
  );

  return res.status(200).send({ message: "The user has been created successfully." });

}, 'UserController - registerUser');


//Update User
const updateUser = CatchAsync(async (req, res, next) => {
  
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = objectUtils.filterObj(req.body, 'firstName', 'lastName');
  

  const updateUser = await User.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true
  });

  return res.status(200).send({ message: "The user details have been updated successfully.", data: updateUser });

}, 'UserController - updateUser');

// Update User Status
const updateUserStatus = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (typeof status !== 'boolean') {
    return next(new AppError('Status must be a boolean value.', 400));
  }

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  user.status = status;
  await user.save();

  return res.status(200).send({
    message: `User status has been updated to ${status ? 'active' : 'inactive'}.`,
    data: user
  });
}, 'UserController - updateUserStatus');

const deleteUser = CatchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  await User.findByIdAndDelete(id);

  return res.status(200).send({
    message: 'User has been deleted successfully.'
  });
}, 'UserController - deleteUser');

const getUserProfilePicture = CatchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id).select('profilePicture');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  return res.status(200).send({
    message: 'User profile picture fetched successfully.',
    profilePicture: user.profilePicture
  });
}, 'UserController - getUserProfilePicture');

// Multer setup for profile picture upload
const uploadProfilePic = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed.', 400), false);
    }
  }
});

const uploadUserProfilePicture = CatchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!req.file) {
    return next(new AppError('Image file is required.', 400));
  }
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  // Convert image to base64 data URL
  const imageBuffer = req.file.buffer;
  const mimeType = req.file.mimetype;
  const base64Image = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  user.profilePicture = base64Image;
  await user.save();
  return res.status(200).send({
    message: 'Profile picture uploaded successfully.',
    profilePicture: user.profilePicture
  });
}, 'UserController - uploadUserProfilePicture');

const getUserById = CatchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id).select('-password -__v');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  return res.status(200).send({
    message: 'User details fetched successfully.',
    data: user
  });
}, 'UserController - getUserById');


const userController = {
registerUser,
updateUser,
updateUserStatus,
deleteUser,
getUserProfilePicture,
getUserById,
uploadUserProfilePicture,
uploadProfilePic
};
export default userController;