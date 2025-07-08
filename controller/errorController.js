import AppError from "../utils/AppError.js";
import logger from "../utils/Logger.js";

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid Token, please log in again', 401);
const handleJWTExpiredError = () => new AppError('Token expired, please log in again', 401);

const handleCryptoError = () => {
    const message = 'Invalid private key or unsupported cryptographic operation in Google Service Account JSON.';
    return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
    logger.error('Error', err)

    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    //Operational, trusted error: send message to client
    if (err.isOperational) {
        logger.error('Error', err)
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });

        //Programming or other unknown error: don't leak error details
    } else {
        // 1. log error
        console.error('Error', err);

        // 2. Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Server Error'
        });
    }
};

const errorHandler = (err, req, res, next) => {
    //console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err, message: err.message, name: err.name };
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(err);
        if (error.name === 'ValidationError') error = handleValidationErrorDB(err);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();


        if (err.message.includes('DECODER routines::unsupported')) {
            error = handleCryptoError();
        }

        sendErrorProd(error, res);
    }
};

export default errorHandler;
