const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use MONGO_URI from environment, fallback to localhost for development
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unihub';
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check if using cloud database
    const isCloud = mongoUri.includes('mongodb+srv://');
    
    if (isCloud) {
      console.log('MongoDB Connected - Cloud Database');
    } else {
      console.log(`MongoDB Connected - Local Database: ${conn.connection.host}`);
    }
    
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Make sure your MONGO_URI is set correctly in .env file');
    console.error('For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/unihub');
    process.exit(1);
  }
};

module.exports = connectDB;

