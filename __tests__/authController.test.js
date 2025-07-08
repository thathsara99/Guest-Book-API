import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Mock dependencies
jest.mock('../model/User.js');
jest.mock('../model/Role.js');
jest.mock('../services/email.js');
jest.mock('../templates/emailTemplates.js');
jest.mock('../utils/logger.js');

import User from '../model/User.js';
import emailService from '../services/email.js';
import emailTemplates from '../templates/emailTemplates.js';
import authController from '../auth/authController.js';

// Create Express app for testing
const app = express();
app.use(express.json());

// Add routes for testing
app.post('/login', authController.login);
app.get('/activate', authController.activateUser);
app.post('/forgot-password', authController.forgotPassword);
app.post('/reset-password/:token', authController.resetPassword);

// Add error handling middleware
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    message: err.message,
    statusCode: err.statusCode || 500
  });
});

describe('Auth Controller', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
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

    // Mock User.findOne to return an object with select method
    User.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });
    
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
  });

  describe('POST /login', () => {
    it('should login successfully with valid credentials', async () => {
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');
      
      const populatedUser = { ...mockUser, roleId: { name: 'User' } };
      User.findById.mockResolvedValue(populatedUser);

      const response = await request(app)
        .post('/login')
        .send({
          username: 'john@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged in successfully.');
      expect(response.body.token).toBe('mock-jwt-token');
    });

    it('should return 400 when username or password is missing', async () => {
      const response = await request(app)
        .post('/login')
        .send({ username: 'john@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username and password are required.');
    });

    it('should return 400 when user is not found', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .post('/login')
        .send({
          username: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid email or password.');
    });
  });

  describe('GET /activate', () => {
    it('should activate user account successfully', async () => {
      const inactiveUser = { ...mockUser, status: false };
      User.findOne.mockResolvedValue(inactiveUser);

      const response = await request(app)
        .get('/activate')
        .query({ email: 'john@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User account has been activated successfully.');
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .get('/activate');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email is required.');
    });
  });

  describe('POST /forgot-password', () => {
    it('should send password reset email successfully', async () => {
      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock-reset-token');

      const response = await request(app)
        .post('/forgot-password')
        .send({ email: 'john@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password reset link sent to your email.');
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/forgot-password')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email is required.');
    });
  });

  describe('POST /reset-password/:token', () => {
    it('should reset password successfully with valid token', async () => {
      const payload = {
        userId: mockUser._id,
        email: mockUser.email
      };

      jwt.verify.mockReturnValue(payload);
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.hash.mockResolvedValue('hashedNewPassword');

      const response = await request(app)
        .post('/reset-password/valid-token')
        .send({
          password: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Password has been reset successfully.');
    });

    it('should return 400 when passwords do not match', async () => {
      const response = await request(app)
        .post('/reset-password/valid-token')
        .send({
          password: 'newpassword123',
          confirmPassword: 'differentpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Passwords do not match.');
    });
  });
}); 