const mongoose = require('mongoose');
const dns = require('dns');

console.log('🔍 Testing MongoDB Connection...\n');

// Test DNS resolution first
const hostname = 'cluster0.x2fjb2f.mongodb.net';
console.log(`1️⃣ Testing DNS resolution for ${hostname}...`);

dns.resolve4(hostname, (err, addresses) => {
  if (err) {
    console.error('❌ DNS Resolution Failed:', err.message);
    console.log('\n💡 Possible solutions:');
    console.log('   - Check your internet connection');
    console.log('   - Try changing DNS servers to 8.8.8.8 (Google DNS)');
    console.log('   - Check if firewall is blocking MongoDB');
    console.log('   - Verify MongoDB Atlas cluster is running');
  } else {
    console.log('✅ DNS Resolution Successful:', addresses);
  }
  
  console.log('\n2️⃣ Testing MongoDB Connection...');
  
  const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ominduayoda_db_user:uuIWjiXLLDt0idM7@cluster0.x2fjb2f.mongodb.net/sliit_transport?retryWrites=true&w=majority&appName=Cluster0';
  
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
    .then(() => {
      console.log('✅ MongoDB Connected Successfully!');
      console.log('📊 Database:', mongoose.connection.name);
      console.log('🌐 Host:', mongoose.connection.host);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ MongoDB Connection Failed:', err.message);
      console.log('\n💡 Next steps:');
      console.log('   1. Go to https://cloud.mongodb.com/');
      console.log('   2. Check Network Access → Add your IP address');
      console.log('   3. Verify cluster is running (not paused)');
      console.log('   4. Try using a VPN or different network');
      process.exit(1);
    });
});
