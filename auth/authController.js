import loggerUtil from '../utils/logger.js';
import User from '../model/User.js';
import Role from '../model/Role.js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import CatchAsync from '../utils/CatchAsync.js';
import AppError from '../utils/AppError.js';
import emailService from '../services/email.js';
import emailTemplates from '../templates/emailTemplates.js';
import crypto from 'crypto';

//Login Api
const login = CatchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError('Username and password are required.', 400));
  }

  const user = await User.findOne({ email: username }).select('+password');
  if (!user) {
    return next(new AppError("Invalid email or password.", 400));
  }

  // Check if the user's status is active
  if (!user.status) {
    return next(new AppError('Your account has been inactivated.', 400))
  }

  if (user.isLocked) {
    return next(new AppError('Your account has been locked.', 400))
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    user.loginAttempts++;

    if (user.loginAttempts >= 5) {
      user.isLocked = true;
      await user.save();
      return next(new AppError('Your account has been locked.', 400));
    }

    const remainingAttempts = 5 - user.loginAttempts;
    await user.save();

    return next(
      new AppError(
        `Invalid email or password - ${remainingAttempts} ${remainingAttempts > 1 ? 'Attempts' : 'Attempt'} Remaining.`,
        400
      )
    );
  }

  // Reset login attempts on successful login
  user.loginAttempts = 0;
  user.isLocked = false;
  await user.save();
  const userWithRole = await User.findById(user._id).populate("roleId").lean(); 

  if (!userWithRole || !userWithRole.roleId) {
    return next(new AppError("User role not found", 400));
  }

  // Prepare JWT payload
  const payload = {
    userId: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: userWithRole.roleId.name, 
    isFirstTime: user.isFirstTime,
    isEmailNotification: user.isEmailNotification
  };
  // Sign JWT with expiration time of 4 hours
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '4h' }); //4h
  res.status(200).header('Authorization', `Bearer ${token}`).send({
    message: 'Logged in successfully.',
    token,
  });
}, 'AuthController - Login');

// Active User
const activateUser = CatchAsync(async (req, res, next) => {
  const { email } = req.query;

  if (!email) {
    return next(new AppError('Email is required.', 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.status === true) {
    return res.status(200).send({ message: 'User is already active.' });
  }

  user.status = true;
  await user.save();

  return res.status(200).send({ message: 'User account has been activated successfully.' });
}, 'AuthController - activateUser');

// Forgot Password API (JWT-based)
const forgotPassword = CatchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Email is required.', 400));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('No user found with that email.', 404));
  }
  // Generate JWT token for password reset
  const resetToken = jwt.sign(
    {
      userId: user._id,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  const resetLink = `${process.env.PASSWORD_RESET_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  const { subject, message } = emailTemplates.generateForgotPasswordEmailTemplate({ firstName: user.firstName, resetLink });
  await emailService.sendEmail(
    process.env.EMAIL_USERNAME,
    user.email,
    subject,
    message
  );
  return res.status(200).send({ message: 'Password reset link sent to your email.' });
}, 'AuthController - forgotPassword');

// Reset Password API 
const resetPassword = CatchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  if (!password || !confirmPassword) {
    return next(new AppError('Password and confirm password are required.', 400));
  }
  if (password !== confirmPassword) {
    return next(new AppError('Passwords do not match.', 400));
  }
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Token is invalid or has expired.', 400));
  }
  const user = await User.findOne({ _id: payload.userId, email: payload.email });
  if (!user) {
    return next(new AppError('User not found.', 404));
  }
  user.password = await bcrypt.hash(password, 12);
  await user.save();
  return res.status(200).send({ message: 'Password has been reset successfully.' });
}, 'AuthController - resetPassword');

const authController = {
  login,
  activateUser,
  forgotPassword,
  resetPassword
};
export default authController;