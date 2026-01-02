const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Health check endpoint
router.get('/health', (req, res) => {
  // Get mongoose connection state
  const connectionState = mongoose.connection.readyState;
  
  // Map connection states to strings
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  const dbStatus = stateMap[connectionState] || 'unknown';
  
  // Calculate uptime in seconds
  const uptimeSeconds = Math.floor(process.uptime());
  
  // Prepare response
  const response = {
    success: true,
    service: 'UniHub Backend',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT,
    db: dbStatus,
    uptime_seconds: uptimeSeconds,
    timestamp: new Date().toISOString()
  };
  
  res.status(200).json(response);
});

module.exports = router;

