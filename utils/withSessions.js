import mongoose from 'mongoose';
import loggerUtil from "./logger.js";


const withSession = (fn, fnName) => {
  return async (req, res, next) => {
    const session = await mongoose.startSession();
    loggerUtil.info('Session start');
    session.startTransaction();
    try {
      await fn(req, res, next, session);
      await session.commitTransaction();
      loggerUtil.info('Transaction committed successfully');
    } catch (err) {
      await session.abortTransaction();
      loggerUtil.error('Transaction aborted due to error:');
      loggerUtil.error(`Error in ${fnName} Controller:`, err);
      next(err); // Pass the error to the global error handler
    } finally {
      await session.endSession();
      loggerUtil.info('Session ended');
    }
  };
};

export default withSession;