
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const API_URL = process.env.API_URL || 'http://107.172.143.48:5500';
const LOG_FILE = path.join(process.cwd(), 'health-logs.json');

async function checkHealth() {
  const timestamp = new Date().toISOString();
  
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    
    const logEntry = {
      timestamp,
      status: response.status,
      responseTime: response.headers.get('x-response-time') || 'N/A',
      data: {
        status: data.status,
        uptime: data.uptime,
        database: data.database?.status,
        memory: data.process?.memoryUsage?.heapUsed
      }
    };
    
    // Save to log file
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    }
    
    logs.push(logEntry);
    
    // Keep only last 1000 entries
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    
    // Console output
    const status = data.status === 'OK' ? '✅' : '⚠️';
    console.log(`${status} ${timestamp} - Status: ${data.status}, DB: ${data.database?.status}, Memory: ${data.process?.memoryUsage?.heapUsed}`);
    
    return data.status === 'OK';
  } catch (error) {
    const logEntry = {
      timestamp,
      error: error.message,
      status: 'ERROR'
    };
    
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
    }
    
    logs.push(logEntry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    
    console.log(`${timestamp} - Error: ${error.message}`);
    return false;
  }
}

// Run health check
checkHealth().then(success => {
  process.exit(success ? 0 : 1);
}); 