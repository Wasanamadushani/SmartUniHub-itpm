# Backend Restart Guide

## The Error: EADDRINUSE

```
Error: listen EADDRINUSE: address already in use :::5001
```

This means port 5001 is already being used by another process (usually your backend server that's already running).

## ✅ FIXED! The Process Has Been Stopped

I've killed the process (PID 20120) that was using port 5001.

## How to Start Backend Now

### Option 1: Simple Start
```bash
cd SmartUniHub-itpm/backend
npm start
```

### Option 2: Use Restart Script (Recommended)
```powershell
cd SmartUniHub-itpm/backend
.\restart.ps1
```

This script will:
1. Check if port 5001 is in use
2. Stop any existing process
3. Start the backend server

## Helper Scripts Created

### 1. `restart.ps1` - Restart Backend
Stops existing process and starts fresh:
```powershell
.\restart.ps1
```

### 2. `stop.ps1` - Stop Backend Only
Just stops the backend without restarting:
```powershell
.\stop.ps1
```

## Manual Fix (If Scripts Don't Work)

### Step 1: Find Process Using Port 5001
```powershell
netstat -ano | findstr :5001
```

Output example:
```
TCP    0.0.0.0:5001    0.0.0.0:0    LISTENING    20120
                                                  ^^^^^ This is the PID
```

### Step 2: Kill the Process
```powershell
taskkill /PID 20120 /F
```
Replace `20120` with your actual PID.

### Step 3: Start Backend
```bash
npm start
```

## Complete Setup Steps

Now that the backend is stopped, here's what to do:

### 1. Fix Event Seats
```bash
cd SmartUniHub-itpm/backend
node quickFix.js
```

### 2. Start Backend
```bash
npm start
```

### 3. Restart Frontend
```bash
cd SmartUniHub-itpm/react-frontend
npm run dev
```

### 4. Refresh Browser
Press `Ctrl + Shift + R`

## Preventing This Issue

### Option 1: Always Use Ctrl+C
When stopping the backend, use `Ctrl+C` in the terminal instead of closing the terminal window.

### Option 2: Use the Stop Script
Before starting backend:
```powershell
.\stop.ps1
npm start
```

### Option 3: Use the Restart Script
```powershell
.\restart.ps1
```

## Troubleshooting

### "Cannot run scripts" Error

If you get:
```
.\restart.ps1 : File cannot be loaded because running scripts is disabled
```

Run this once (as Administrator):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try again:
```powershell
.\restart.ps1
```

### Port Still in Use

If port is still in use after killing process:
1. Wait 5-10 seconds
2. Try killing again
3. Restart your computer (last resort)

### Different Port

If you want to use a different port, edit `backend/.env`:
```env
PORT=5002
```

Then update frontend `.env`:
```env
VITE_PROXY_TARGET=http://localhost:5002
VITE_NODE_API_URL=http://localhost:5002/api
```

## Summary

✅ **Process 20120 has been killed**
✅ **Port 5001 is now free**
✅ **Helper scripts created** (`restart.ps1`, `stop.ps1`)

**Next Steps:**
1. Run `node quickFix.js` to fix event seats
2. Run `npm start` to start backend
3. Restart frontend with `npm run dev`
4. Refresh browser

You're ready to go! 🚀
