import express from 'express';
import mongoose from 'mongoose';
import os from 'os';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
    /*
    #swagger.tags = ['Health']
    #swagger.description = 'Health Check'
  */
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState
      },
      system: {
        memory: {
          used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024) + ' MB',
          total: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
          free: Math.round(os.freemem() / 1024 / 1024) + ' MB'
        },
        cpu: os.cpus().length,
        platform: os.platform(),
        nodeVersion: process.version
      },
      process: {
        pid: process.pid,
        memoryUsage: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        }
      }
    };

    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      healthCheck.status = 'WARNING';
      healthCheck.database.status = 'disconnected';
    }

    res.status(200).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Simple ping endpoint
router.get('/ping', (req, res) => { 
  res.status(200).json({ 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Detailed system info (for debugging)
router.get('/system', (req, res) => {
  const systemInfo = {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    },
    cpu: os.cpus(),
    network: os.networkInterfaces(),
    uptime: os.uptime(),
    loadAverage: os.loadavg()
  };
  
  res.status(200).json(systemInfo);
});

 
export default router; 