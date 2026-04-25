# "Route not found" Error Fix

## Problem
"Route not found" error appears at the top of the `/book-event` page.

## Root Cause
The error is coming from the backend's 404 handler when an API call fails. This happens because:

1. **Events in database are missing required fields** (eventType, totalSeats, ticketPrice)
2. When the page tries to fetch booking summary for these events, the backend may return errors
3. The events are not properly configured as "bookable"

## Quick Fix Steps

### Step 1: Check Current Event Status
```bash
cd SmartUniHub-itpm/backend
node checkEventStatus.js
```

This will show you:
- Which events are bookable
- Which events have issues
- What fields are missing

### Step 2: Fix Existing Events
```bash
cd SmartUniHub-itpm/backend
node fixExistingEvents.js
```

This will automatically:
- Update all approved events to be bookable
- Set eventType='indoor', totalSeats=100, ticketPrice=500
- Show you what was fixed

### Step 3: Restart Backend Server
```bash
cd SmartUniHub-itpm/backend
# Stop the current server (Ctrl+C)
npm start
```

### Step 4: Clear Browser Cache and Reload
1. Open browser DevTools (F12)
2. Right-click the reload button
3. Select "Empty Cache and Hard Reload"
4. Or just press Ctrl+Shift+R

### Step 5: Verify Fix
1. Go to `/book-event` page
2. "Route not found" error should be gone
3. Events should display properly
4. "Proceed to Payment" button should be enabled

## Alternative: Create Fresh Events

If fixing doesn't work, create fresh events:

```bash
cd SmartUniHub-itpm/backend

# First, delete all existing events (optional)
# Open MongoDB Compass or mongo shell and run:
# db.events.deleteMany({})

# Then seed new events
node seedEvents.js
```

## Debugging Steps

If the error persists:

### 1. Check Backend Logs
Look at your backend terminal for error messages when the page loads.

### 2. Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for failed API calls (red errors)
4. Check what URL is failing

### 3. Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Look for requests with status 404
5. Click on the failed request to see details

### 4. Verify Backend is Running
```bash
# Check if backend is running on port 5001
curl http://localhost:5001/
# Should return: {"message":"SLIIT Student Transport API is running"}

# Check if events endpoint works
curl http://localhost:5001/api/events
# Should return array of events
```

### 5. Check Database Connection
```bash
cd SmartUniHub-itpm/backend
node testConnection.js
```

## Common Causes & Solutions

### Cause 1: Backend Not Running
**Solution**: Start the backend server
```bash
cd SmartUniHub-itpm/backend
npm start
```

### Cause 2: Wrong Port
**Solution**: Check `.env` files match
- Backend `.env`: `PORT=5001`
- Frontend `.env`: `VITE_NODE_API_URL=http://localhost:5001/api`

### Cause 3: Events Missing Required Fields
**Solution**: Run `fixExistingEvents.js` script

### Cause 4: No Events in Database
**Solution**: Run `seedEvents.js` script

### Cause 5: CORS Issues
**Solution**: Backend `server.js` already has CORS configured for localhost:5173

## Technical Details

### Backend 404 Handler
Located in `backend/server.js`:
```javascript
// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});
```

This catches any API request that doesn't match a registered route.

### Event Routes
Registered in `backend/server.js`:
```javascript
app.use('/api/events', eventRoutes);
```

### Bookable Event Requirements
From `backend/routes/eventRoutes.js`:
```javascript
const isBookable = event.status === 'approved' 
                && event.eventType === 'indoor' 
                && totalSeats > 0;
```

## Prevention

To prevent this issue in the future:

1. **Always create events with all required fields**:
   - title, description, location
   - startDate, endDate
   - eventType ('indoor' or 'outdoor')
   - For indoor events: totalSeats, ticketPrice
   - status ('pending' initially, then 'approved' by admin)

2. **Use Admin Dashboard** to create/edit events properly

3. **Run validation** before approving events

## Still Having Issues?

If the error persists after trying all steps:

1. Share the backend terminal output
2. Share browser console errors
3. Share Network tab failed requests
4. Run `checkEventStatus.js` and share output

## Files Modified

- `react-frontend/src/pages/BookEventPage.jsx` - Added console logging for debugging
- `backend/seedEvents.js` - Updated to create proper bookable events
- `backend/fixExistingEvents.js` - Created to fix existing events
- `backend/checkEventStatus.js` - Created to diagnose event issues
