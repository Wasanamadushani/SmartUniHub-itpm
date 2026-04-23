# 🔄 How to Restart Servers After Code Changes

## The Issue

You're seeing "Route not found" because the backend server needs to be restarted to load the new ticket download endpoint we added.

## Solution: Restart Both Servers

### Step 1: Stop Current Servers

If servers are running, stop them:
- Press `Ctrl + C` in each terminal window

### Step 2: Restart Backend Server

```bash
# Navigate to backend directory
cd SmartUniHub-itpm/backend

# Start the server
npm start
```

You should see:
```
Server running on port 5000
MongoDB connected successfully
```

### Step 3: Restart Frontend Server

Open a **new terminal** window:

```bash
# Navigate to frontend directory
cd SmartUniHub-itpm/react-frontend

# Start the server
npm start
```

You should see:
```
Local:   http://localhost:3000
```

### Step 4: Test the Feature

1. Open browser: `http://localhost:3000`
2. Login as a student
3. Navigate to an approved booking
4. You should see the payment success page without errors
5. If payment is approved, you'll see the "Download Tickets" button

## Quick Troubleshooting

### Backend Not Starting?

```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# If something is using it, kill the process or use a different port
```

### Frontend Not Starting?

```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Clear npm cache if needed
npm cache clean --force
npm install
npm start
```

### Still Seeing "Route not found"?

1. **Check backend console** - Look for any errors
2. **Check browser console** (F12) - Look for network errors
3. **Verify API URL** - Should be `http://localhost:5000/api/events/bookings/...`
4. **Check MongoDB** - Make sure it's running

### Database Connection Issues?

```bash
# Check if MongoDB is running
# Windows: Check Services for "MongoDB"
# Or start it manually:
mongod
```

## Verify Everything is Working

### Test Backend API

Open browser or use curl:
```bash
# Test if backend is responding
curl http://localhost:5000/api/events

# Should return a list of events (or empty array)
```

### Test Frontend

1. Open `http://localhost:3000`
2. Should see the homepage
3. No console errors

### Test Ticket Feature

1. Login as admin
2. Approve a pending booking
3. Login as the student who made the booking
4. Navigate to payment success page
5. Should see "Download Tickets" button
6. Click it - tickets should download

## Common Issues

### Issue: "Cannot GET /api/events/bookings/..."

**Cause**: Backend not running or route not registered

**Fix**:
1. Restart backend server
2. Check `backend/server.js` has: `app.use('/api/events', eventRoutes);`
3. Check `backend/routes/eventRoutes.js` has the tickets endpoint

### Issue: "Network Error"

**Cause**: Backend not accessible

**Fix**:
1. Check backend is running on port 5000
2. Check CORS is enabled
3. Check firewall settings

### Issue: "Invalid booking ID"

**Cause**: Booking ID not passed correctly

**Fix**:
1. Check URL has `?bookingId=...` parameter
2. Check booking ID is valid MongoDB ObjectId
3. Check booking exists in database

## Success Indicators

✅ Backend console shows: "Server running on port 5000"
✅ Frontend console shows no errors
✅ Payment success page loads without "Route not found"
✅ Download button appears for approved bookings
✅ Clicking download generates HTML files

## Need More Help?

1. Check browser console (F12) for errors
2. Check backend terminal for errors
3. Check MongoDB is running
4. Verify all npm packages are installed
5. Try clearing browser cache

---

**After restarting both servers, the ticket download feature should work perfectly!** 🎫✨
