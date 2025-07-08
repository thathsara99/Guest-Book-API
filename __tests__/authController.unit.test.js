import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Mocks
jest.mock('../model/User.js');
jest.mock('../model/Role.js');
jest.mock('../services/email.js');
jest.mock('../templates/emailTemplates.js');
jest.mock('../utils/logger.js');

import User from '../model/User.js';
import emailService from '../services/email.js';
import emailTemplates from '../templates/emailTemplates.js';
import authController from '../auth/authController.js';

// Helper to mock User.findOne().select()
function mockFindOneSelect(result) {
  User.findOne = jest.fn(() => ({
    select: jest.fn().mockImplementation(async () => result)
  }));
}

describe('Auth Controller (unit)', () => {
  let user;
  let req;
  let res;
  let next;

  beforeEach(() => {
    user = {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'hashedPassword123',
      status: true,
      isLocked: false,
      loginAttempts: 0,
      isFirstTime: true,
      isEmailNotification: true,
      save: jest.fn().mockResolvedValue(true)
    };
    req = { body: {}, query: {}, params: {}, headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    User.findById = jest.fn();
    bcrypt.compare = jest.fn();
    jwt.sign = jest.fn();
    jwt.verify = jest.fn();
    bcrypt.hash = jest.fn();
    emailService.sendEmail = jest.fn().mockResolvedValue(true);
    emailTemplates.generateForgotPasswordEmailTemplate = jest.fn().mockReturnValue({
      subject: 'Reset Password',
      message: '<html>Reset your password</html>'
    });
    // Default: login finds user
    mockFindOneSelect(user);
  });

  describe('login', () => {
    it('logs in with correct credentials', async () => {
      req.body = { username: user.email, password: 'password123' };
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token123');
      User.findById.mockResolvedValue({ ...user, roleId: { name: 'User' } });
      await authController.login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.header).toHaveBeenCalledWith('Authorization', 'Bearer token123');
      expect(res.send).toHaveBeenCalledWith({ message: 'Logged in successfully.', token: 'token123' });
      expect(user.loginAttempts).toBe(0);
      expect(user.isLocked).toBe(false);
      expect(user.save).toHaveBeenCalled();
    });

    it('fails if username or password missing', async () => {
      req.body = { username: user.email };
      await authController.login(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Username and password are required.', statusCode: 400 }));
    });

    it('fails if user not found', async () => {
      mockFindOneSelect(null);
      req.body = { username: 'nobody@example.com', password: 'pw' };
      await authController.login(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid email or password.', statusCode: 400 }));
    });

    it('fails if user is inactive', async () => {
      mockFindOneSelect({ ...user, status: false });
      req.body = { username: user.email, password: 'pw' };
      await authController.login(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Your account has been inactivated.', statusCode: 400 }));
    });

    it('fails if user is locked', async () => {
      mockFindOneSelect({ ...user, isLocked: true });
      req.body = { username: user.email, password: 'pw' };
      await authController.login(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Your account has been locked.', statusCode: 400 }));
    });
  });

  describe('activateUser', () => {
    it('activates an inactive user', async () => {
      const inactive = { ...user, status: false };
      User.findOne.mockResolvedValue(inactive);
      req.query = { email: user.email };
      await authController.activateUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ message: 'User account has been activated successfully.' });
      expect(inactive.status).toBe(true);
      expect(inactive.save).toHaveBeenCalled();
    });
    it('errors if email missing', async () => {
      req.query = {};
      await authController.activateUser(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Email is required.', statusCode: 400 }));
    });
    it('errors if user not found', async () => {
      User.findOne.mockResolvedValue(null);
      req.query = { email: 'nobody@example.com' };
      await authController.activateUser(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found', statusCode: 404 }));
    });
  });

  describe('forgotPassword', () => {
    it('sends reset email if user exists', async () => {
      req.body = { email: user.email };
      User.findOne.mockResolvedValue(user);
      jwt.sign.mockReturnValue('reset-token');
      await authController.forgotPassword(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ message: 'Password reset link sent to your email.' });
      expect(jwt.sign).toHaveBeenCalledWith({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      expect(emailService.sendEmail).toHaveBeenCalled();
    });
    it('errors if email missing', async () => {
      req.body = {};
      await authController.forgotPassword(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Email is required.', statusCode: 400 }));
    });
    it('errors if user not found', async () => {
      User.findOne.mockResolvedValue(null);
      req.body = { email: 'nobody@example.com' };
      await authController.forgotPassword(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'No user found with that email.', statusCode: 404 }));
    });
  });

  describe('resetPassword', () => {
    it('resets password with valid token', async () => {
      const payload = { userId: user._id, email: user.email };
      req.params = { token: 'valid-token' };
      req.body = { password: 'newpass', confirmPassword: 'newpass' };
      jwt.verify.mockReturnValue(payload);
      User.findOne.mockResolvedValue(user);
      bcrypt.hash.mockResolvedValue('hashedNew');
      await authController.resetPassword(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({ message: 'Password has been reset successfully.' });
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 12);
      expect(user.password).toBe('hashedNew');
      expect(user.save).toHaveBeenCalled();
    });
    it('errors if password or confirmPassword missing', async () => {
      req.params = { token: 'valid-token' };
      req.body = { password: 'newpass' };
      await authController.resetPassword(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Password and confirm password are required.', statusCode: 400 }));
    });
    it('errors if passwords do not match', async () => {
      req.params = { token: 'valid-token' };
      req.body = { password: 'a', confirmPassword: 'b' };
      await authController.resetPassword(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Passwords do not match.', statusCode: 400 }));
    });
    it('errors if token is invalid', async () => {
      req.params = { token: 'bad-token' };
      req.body = { password: 'a', confirmPassword: 'a' };
      jwt.verify.mockImplementation(() => { throw new Error('bad'); });
      await authController.resetPassword(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Token is invalid or has expired.', statusCode: 400 }));
    });
  });
}); 