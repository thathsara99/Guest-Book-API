import loggerUtil from "./logger.js";

const asyncHandler = (fn, conName) => {
    return (req, res, next) => {
        fn(req, res, next).catch(err => {
            loggerUtil.error(`Error in ${conName} Controller:`, err);
            next(err); // Pass the error to the next middleware
        });

    };
};

export default asyncHandler;