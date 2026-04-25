# Payment Receipt Troubleshooting Guide

## Issue
Driver cannot see the payment receipt after rider uploads it.

## Possible Causes & Solutions

### 1. Backend Not Restarted ⚠️
**Most Common Issue!**

After updating the Ride model and controller, you MUST restart the backend:

```bash
# Stop the backend (Ctrl+C)
cd SmartUniHub-itpm/backend
npm start
```

### 2. Old Ride Data
If you're testing with a ride that was created BEFORE the code changes, it won't have the receipt data.

**Solution:** Create a NEW ride after restarting the backend.

### 3. Check Browser Console
Open browser console (F12) and check for errors when:
- Uploading the receipt
- Clicking "Accept Quote & Pay"

### 4. Verify Receipt Upload
Check if the receipt file is being selected:

**In Rider Dashboard:**
1. Upload receipt file
2. Look for green checkmark: `✓ payment.png`
3. If you don't see it, the file isn't being selected

### 5. Check Network Request
**In Rider Dashboard:**
1. Open DevTools (F12) → Network tab
2. Click "Accept Quote & Pay"
3. Find the PATCH request to `/api/rides/{id}/accept-quote`
4. Click on it → Payload/Request tab
5. Check if `cardPayment` object exists with `receiptUrl`

Should look like:
```json
{
  "cardPayment": {
    "cardHolderName": "John Doe",
    "cardLast4": "1234",
    "cardExpiry": "12/25",
    "receiptUrl": "data:image/png;base64,iVBORw0KGgo...",
    "receiptFileName": "payment.png"
  }
}
```

### 6. Check Database
If using MongoDB Compass or similar:

```javascript
// Find the ride
db.rides.findOne({ _id: ObjectId("...") })

// Check if cardPayment exists
{
  paymentMethod: "card",
  cardPayment: {
    cardHolderName: "...",
    cardLast4: "...",
    receiptUrl: "data:image/png;base64,...",
    receiptFileName: "..."
  }
}
```

### 7. Updated Driver Dashboard
The driver dashboard now shows:
- **If receipt exists:** Full receipt details with download button
- **If no receipt:** Message saying "Waiting for payment confirmation..."

This helps identify if the receipt data is missing.

## Step-by-Step Testing

### Test 1: Fresh Start
```bash
# 1. Stop backend
Ctrl+C

# 2. Restart backend
cd SmartUniHub-itpm/backend
npm start

# 3. Refresh frontend
Ctrl+Shift+R in browser
```

### Test 2: New Ride
```
1. Rider: Book NEW ride with "Card Payment"
2. Driver: Send price quote
3. Rider: Fill card details
4. Rider: Upload receipt (see ✓ payment.png)
5. Rider: Click "Accept Quote & Pay"
6. Driver: Go to "Current Ride"
7. Driver: Should see "Payment Receipt" section
```

### Test 3: Check Receipt Section
**Driver Dashboard should show:**

**If receipt uploaded:**
```
┌───────────────────────────────┐
│ 🧾 Payment Receipt            │
│                               │
│ Card: •••• 1234               │
│ Holder: John Doe              │
│ File: payment.png             │
│ Paid: 4/25/2026, 10:40 PM    │
│                               │
│ [📥 Download Receipt]         │
│                               │
│ [Receipt Image Preview]       │
└───────────────────────────────┘
```

**If no receipt:**
```
┌───────────────────────────────┐
│ 🧾 Payment Receipt            │
│                               │
│ Waiting for payment           │
│ confirmation...               │
└───────────────────────────────┘
```

## Common Errors

### Error 1: "Cannot read property 'receiptUrl' of undefined"
**Cause:** `cardPayment` object doesn't exist
**Solution:** Backend not restarted or old ride data

### Error 2: Receipt shows but no image
**Cause:** Receipt URL is not a data URL
**Solution:** Check if file was properly converted to base64

### Error 3: "Failed to load resource"
**Cause:** Invalid base64 data
**Solution:** Check file size (should be < 5MB)

## Debug Checklist

- [ ] Backend restarted after code changes
- [ ] Testing with NEW ride (not old data)
- [ ] Receipt file selected (see green checkmark)
- [ ] Browser console shows no errors
- [ ] Network request includes cardPayment object
- [ ] Database has cardPayment data
- [ ] Driver dashboard shows receipt section
- [ ] Frontend refreshed (Ctrl+Shift+R)

## Quick Fix Commands

```bash
# Backend restart
cd SmartUniHub-itpm/backend
npm start

# Check if backend is running
# Should see: "✅ MongoDB Connected"
# Should see: "Server running on port 5001"

# Frontend refresh
# In browser: Ctrl+Shift+R (hard refresh)
```

## Still Not Working?

### Check File Size
Large files might cause issues:
```javascript
// In browser console
console.log(cardPaymentForm.receiptFile.size); // Should be < 5MB
```

### Check File Type
```javascript
// In browser console
console.log(cardPaymentForm.receiptFile.type); // Should be image/* or application/pdf
```

### Manual Test
Try uploading a small test image (< 100KB) to rule out file size issues.

## Expected Behavior

### Rider Side:
1. Select receipt file → See `✓ filename`
2. Click "Accept Quote & Pay" → See "Processing..."
3. Success → See "✅ Payment successful!"

### Driver Side:
1. Refresh page or navigate to "Current Ride"
2. See "Payment Receipt" section
3. See card details and receipt info
4. Click "Download Receipt" → File downloads
5. If image, see preview

## Files to Check

1. `backend/models/Ride.js` - Has `cardPayment` field?
2. `backend/controllers/rideController.js` - Saves `cardPayment`?
3. `react-frontend/src/pages/RiderDashboardPage.jsx` - Converts to base64?
4. `react-frontend/src/pages/DriverDashboardPage.jsx` - Displays receipt?

## Contact Points

If still not working, check:
1. Backend console for errors
2. Frontend console for errors
3. Network tab for failed requests
4. Database for missing data
