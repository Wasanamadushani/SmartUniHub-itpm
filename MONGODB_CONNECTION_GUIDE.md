# MongoDB Connection Guide

## Current Status

### ✅ Backend Server
- **Status:** Running
- **Port:** 5001 (updated from 5000)
- **Socket.IO:** Enabled

### ⚠️ MongoDB Connection
- **Status:** Connection Error
- **Error:** `querySrv ENOTFOUND _mongodb._tcp.cluster0.x2fjb2f.mongodb.net`
- **Impact:** Database features won't work until connection is established

### ✅ Frontend
- **Status:** Running
- **URL:** http://localhost:5173/
- **API Endpoint:** Updated to http://localhost:5001

---

## Connection Error Explanation

The error `querySrv ENOTFOUND` means the server cannot resolve the MongoDB Atlas hostname. This is typically caused by:

1. **Network/DNS Issues**
   - Firewall blocking MongoDB Atlas
   - DNS resolution problems
   - Network connectivity issues

2. **MongoDB Atlas Configuration**
   - Cluster might be paused
   - IP whitelist restrictions
   - Incorrect connection string

3. **Local Environment**
   - VPN interference
   - Corporate firewall
   - ISP restrictions

---

## Troubleshooting Steps

### 1. Check MongoDB Atlas Cluster

**Visit:** https://cloud.mongodb.com/

**Verify:**
- [ ] Cluster is running (not paused)
- [ ] Cluster name is correct: `cluster0`
- [ ] Database name is correct: `sliit_transport`

### 2. Check Network Access (IP Whitelist)

**In MongoDB Atlas:**
1. Go to **Network Access**
2. Check if your IP is whitelisted
3. **Option A:** Add your current IP
4. **Option B:** Allow access from anywhere (0.0.0.0/0) for testing

**Steps:**
```
MongoDB Atlas Dashboard
→ Network Access
→ Add IP Address
→ Add Current IP Address (or 0.0.0.0/0)
→ Confirm
```

### 3. Test Connection String

**Current Connection String:**
```
mongodb+srv://ominduayoda_db_user:uuIWjiXLLDt0idM7@cluster0.x2fjb2f.mongodb.net/sliit_transport?retryWrites=true&w=majority
```

**Verify:**
- [ ] Username: `ominduayoda_db_user`
- [ ] Password: `uuIWjiXLLDt0idM7`
- [ ] Cluster: `cluster0.x2fjb2f.mongodb.net`
- [ ] Database: `sliit_transport`

### 4. Test DNS Resolution

**Windows Command:**
```bash
nslookup cluster0.x2fjb2f.mongodb.net
```

**Expected:** Should return IP addresses
**If fails:** DNS issue - try changing DNS servers

### 5. Check Firewall

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Check if Node.js is allowed
3. Temporarily disable to test (not recommended for production)

**Antivirus:**
- Some antivirus software blocks MongoDB connections
- Temporarily disable to test

### 6. Try Alternative Connection String

**Standard Connection (without SRV):**
```
mongodb://ominduayoda_db_user:uuIWjiXLLDt0idM7@cluster0-shard-00-00.x2fjb2f.mongodb.net:27017,cluster0-shard-00-01.x2fjb2f.mongodb.net:27017,cluster0-shard-00-02.x2fjb2f.mongodb.net:27017/sliit_transport?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

**Note:** Get the exact connection string from MongoDB Atlas dashboard.

---

## Quick Fixes

### Fix 1: Whitelist All IPs (Testing Only)

**In MongoDB Atlas:**
```
Network Access → Add IP Address → 0.0.0.0/0 → Confirm
```

⚠️ **Warning:** This allows access from anywhere. Only use for testing!

### Fix 2: Change DNS Servers

**Windows:**
1. Open Network Settings
2. Change DNS to Google DNS:
   - Primary: 8.8.8.8
   - Secondary: 8.8.4.4
3. Restart network adapter

### Fix 3: Use VPN

If your ISP blocks MongoDB Atlas:
- Try using a VPN
- Connect to a different network

### Fix 4: Check MongoDB Atlas Status

**Visit:** https://status.mongodb.com/

Check if there are any ongoing issues with MongoDB Atlas.

---

## Alternative: Local MongoDB

If you can't connect to MongoDB Atlas, use local MongoDB:

### Install MongoDB Locally

**Windows:**
1. Download MongoDB Community Server
2. Install with default settings
3. Start MongoDB service

**Update .env:**
```env
MONGO_URI=mongodb://localhost:27017/sliit_transport
PORT=5001
```

**Restart backend:**
```bash
npm start
```

---

## Current Configuration

### Backend (.env)
```env
MONGO_URI=mongodb+srv://ominduayoda_db_user:uuIWjiXLLDt0idM7@cluster0.x2fjb2f.mongodb.net/sliit_transport?retryWrites=true&w=majority
PORT=5001
JWT_SECRET=sliit_transport_secret_key_2024
```

### Frontend (api.js)
```javascript
const API_BASE_URL = 'http://localhost:5001'
```

---

## Testing Connection

### Method 1: MongoDB Compass

1. Download MongoDB Compass
2. Use the connection string
3. Try to connect
4. If successful, issue is with Node.js/Mongoose

### Method 2: Node.js Test Script

Create `test-connection.js`:
```javascript
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://ominduayoda_db_user:uuIWjiXLLDt0idM7@cluster0.x2fjb2f.mongodb.net/sliit_transport?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });
```

Run:
```bash
node test-connection.js
```

---

## What Works Without Database

Even without MongoDB connection, these features work:
- ✅ Frontend UI
- ✅ Navigation
- ✅ Static pages
- ✅ Client-side routing

**What doesn't work:**
- ❌ User authentication
- ❌ Data fetching (events, bookings, etc.)
- ❌ Form submissions
- ❌ Real-time features

---

## Recommended Actions

### Immediate (Do Now):
1. **Check MongoDB Atlas Dashboard**
   - Verify cluster is running
   - Check network access settings

2. **Whitelist Your IP**
   - Add current IP to MongoDB Atlas
   - Or use 0.0.0.0/0 for testing

3. **Test DNS Resolution**
   - Run: `nslookup cluster0.x2fjb2f.mongodb.net`
   - If fails, change DNS servers

### Short-term:
1. **Use MongoDB Compass** to test connection
2. **Check firewall settings**
3. **Try different network** (mobile hotspot, etc.)

### Long-term:
1. **Set up local MongoDB** for development
2. **Configure proper IP whitelist** for production
3. **Use environment-specific connection strings**

---

## Contact MongoDB Support

If issue persists:
1. Go to MongoDB Atlas Dashboard
2. Click "Support" in top-right
3. Create a support ticket
4. Provide:
   - Cluster name
   - Connection string (without password)
   - Error message
   - Your IP address

---

## Summary

### Current State:
- ✅ Backend running on port 5001
- ✅ Frontend running on port 5173
- ✅ Frontend configured to use port 5001
- ⚠️ MongoDB connection failing (DNS/Network issue)

### Next Steps:
1. Check MongoDB Atlas cluster status
2. Whitelist your IP address
3. Test DNS resolution
4. Try alternative connection methods

### Workaround:
Use local MongoDB for development until Atlas connection is resolved.

---

## Need Help?

The application will work once the MongoDB connection is established. The issue is network/configuration related, not code related.

**The backend is running and ready to connect once network access is configured!**
