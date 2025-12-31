const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter on server start
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('Email transporter is ready to send emails');
  } catch (error) {
    console.error('Email transporter verification failed:', error.message);
    console.error('Please check your email configuration in .env file');
  }
};

module.exports = { transporter, verifyTransporter };

