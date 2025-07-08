import dotenv from 'dotenv';

// Load environment variables for testing
dotenv.config({ path: '.env.test' });

// Set default test environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.EMAIL_USERNAME = process.env.EMAIL_USERNAME || 'test@example.com';
process.env.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'test-password';
process.env.PASSWORD_RESET_URL = process.env.PASSWORD_RESET_URL || 'http://localhost:4200';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://tcroos:8V5F63OCoc0gPLQl@cluster0.fvbgik0.mongodb.net/grade_book?retryWrites=true&w=majority&appName=Cluster0';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 