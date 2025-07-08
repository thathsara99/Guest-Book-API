import jwt from 'jsonwebtoken';
import loggerUtil from '../utils/logger.js';
import CatchAsync from '../utils/CatchAsync.js'
import AppError from '../utils/AppError.js';
import User from '../model/User.js';
import Role from '../model/Role.js';

// Middleware to validate token
const verifyToken = CatchAsync(async (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    loggerUtil.info('Access denied. No token provided.');
    return next(new AppError('Access denied. No token provided.', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.userId);
  if (!user) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  if (!user.status) {
    return next(new AppError('User is not an active user.', 401));
  }
  if (user.isLocked) {
    return next(new AppError('User is locked.', 401));
  }

  req.decodedToken = decoded;

  next();

}, 'Auth Middleware - verifyToken');


const checkRole = (requiredRoles) => async (req, res, next) => {
  try {
    // Decode the user ID from the token (assuming the token is already validated)
    const userId = req.decodedToken.userId;
    // Retrieve the UserRole based on the user's ID
    const userWithRole = await User.findById(userId).populate("roleId").lean(); 
    if (!userWithRole) {
      loggerUtil.info("Unauthorized: User role not found");
      return res.status(403).send("Unauthorized");
    }

    // Check if the user's role matches one of the required roles
    const hasRequiredRole = requiredRoles.includes(userWithRole.roleId.name);
    if (!hasRequiredRole) {
      loggerUtil.info("Unauthorized: Insufficient permissions");
      return res.status(403).send("Unauthorized");
    }

    next();
  } catch (err) {
    loggerUtil.error(`checkRole Middleware Error: ${err.message}`);
    res.status(500).send("Server error");
  }
};

const authMiddleware = { verifyToken, checkRole};
export default authMiddleware;