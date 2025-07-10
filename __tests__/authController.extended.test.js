import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Mock models and services
jest.mock('../model/User.js');
jest.mock('../model/Role.js');
jest.mock('../services/email.js');
jest.mock('../templates/emailTemplates.js');
jest.mock('../utils/logger.js');

import User from '../model/User.js';
import emailService from '../services/email.js';
import emailTemplates from '../templates/emailTemplates.js';
import authController from '../auth/authController.js';


const app = express();
app.use(express.json());

// Testing Routes
app.post('/login', authController.login);
app.get('/activate', authController.activateUser);
app.post('/forgot-password', authController.forgotPassword);
app.post('/reset-password/:token', authController.resetPassword);

// Error Handling
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    message: err.message,
    statusCode: err.statusCode || 500
  });
});

describe('Auth Controller - Extended Tests', () => {
  let mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'John',
      lastName: 'Doe',
      email: 'tcroos@gmail.com',
      password: 'password',
      status: true,
      isLocked: false,
      loginAttempts: 0,
      isFirstTime: true,
      isEmailNotification: true,
      save: jest.fn().mockResolvedValue(true)
    };

    // Mock User.findOne
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

  describe('POST /login - Edge Cases', () => {
    it('should return 400 when user account is inactive', async () => {
      const inactiveUser = { ...mockUser, status: false };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(inactiveUser)
      });

      const response = await request(app)
        .post('/login')
        .send({
          username: 'tcroos@gmail.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Your account has been inactivated.');
    });

    it('should return 400 when user account is locked', async () => {
      const lockedUser = { ...mockUser, isLocked: true };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(lockedUser)
      });

      const response = await request(app)
        .post('/login')
        .send({
          username: 'tcroos@gmail.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Your account has been locked.');
    });

    it('should increment login attempts and lock account after 5 failed attempts', async () => {
      const userWithAttempts = { ...mockUser, loginAttempts: 4 };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithAttempts)
      });
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/login')
        .send({
          username: 'tcroos@gmail.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Your account has been locked.');
      expect(userWithAttempts.isLocked).toBe(true);
      expect(userWithAttempts.save).toHaveBeenCalled();
    });

    it('should return remaining attempts message for failed login', async () => {
      const userWithAttempts = { ...mockUser, loginAttempts: 2 };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(userWithAttempts)
      });
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/login')
        .send({
          username: 'tcroos@gmail.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid email or password - 2 Attempts Remaining.');
      expect(userWithAttempts.loginAttempts).toBe(3);
      expect(userWithAttempts.save).toHaveBeenCalled();
    });

    it('should handle user role not found', async () => {
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');
      
      User.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/login')
        .send({
          username: 'tcroos@gmail.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User role not found');
    });
  });

  describe('GET /activate - Edge Cases', () => {
    it('should return 404 when user is not found', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/activate')
        .query({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should return message when user is already active', async () => {
      const activeUser = { ...mockUser, status: true };
      User.findOne.mockResolvedValue(activeUser);

      const response = await request(app)
        .get('/activate')
        .query({ email: 'tcroos@gmail.com' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('User is already active.');
    });
  });

  describe('POST /forgot-password - Edge Cases', () => {
    it('should return 404 when user is not found', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('No user found with that email.');
    });

    it('should handle email service errors gracefully', async () => {
      jwt.sign.mockReturnValue('mock-reset-token');
      emailService.sendEmail.mockRejectedValue(new Error('Email service error'));

      const response = await request(app)
        .post('/forgot-password')
        .send({ email: 'tcroos@gmail.com' });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /reset-password/:token - Edge Cases', () => {
    it('should return 400 when password or confirmPassword is missing', async () => {
      const response = await request(app)
        .post('/reset-password/valid-token')
        .send({ password: 'newpassword123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Password and confirm password are required.');
    });

    it('should return 400 when token is invalid or expired', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/reset-password/invalid-token')
        .send({
          password: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Token is invalid or has expired.');
    });

    it('should return 404 when user is not found', async () => {
      const payload = {
        userId: mockUser._id,
        email: mockUser.email
      };

      jwt.verify.mockReturnValue(payload);
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/reset-password/valid-token')
        .send({
          password: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found.');
    });

    it('should handle password hashing errors', async () => {
      const payload = {
        userId: mockUser._id,
        email: mockUser.email
      };

      jwt.verify.mockReturnValue(payload);
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.hash.mockRejectedValue(new Error('Hashing error'));

      const response = await request(app)
        .post('/reset-password/valid-token')
        .send({
          password: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(response.status).toBe(500);
    });
  });
}); 