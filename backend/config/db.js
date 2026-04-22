const mongoose = require('mongoose');
const dns = require('dns');

// Try to use Google's DNS servers to bypass network DNS issues
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    console.log('🌐 Using custom DNS servers: 8.8.8.8, 8.8.4.4, 1.1.1.1');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.warn('⚠️  Server will continue running without database connection.');
    console.warn('⚠️  Possible causes:');
    console.warn('   1. Network/Firewall blocking MongoDB Atlas (port 27017)');
    console.warn('   2. Your IP not whitelisted in MongoDB Atlas Network Access');
    console.warn('   3. SLIIT network may be blocking external database connections');
    console.warn('   4. Try using mobile hotspot or different network');
    throw error;
  }
};

module.exports = connectDB;
