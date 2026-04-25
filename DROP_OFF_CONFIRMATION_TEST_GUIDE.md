# Drop-off Confirmation Feature - Testing Guide

## Prerequisites
1. Backend server must be restarted after code changes
2. Have at least one rider account and one driver account
3. Driver must be approved by admin

## Step-by-Step Testing

### Step 1: Restart Backend Server
```bash
cd backend
npm start
# Or use the restart script:
# .\restart.ps1
```

### Step 2: Complete a Ride

#### As Rider:
1. Login as a rider
2. Go to "Book a Ride" tab
3. Fill in ride details:
   - Pickup: "SLIIT Campus"
   - Drop: "Colombo Fort"
   - Date: Today's date
   - Time: Current time + 1 hour
   - Passengers: 1
   - Payment Method: Select "Cash on Delivery" or "Card Payment"
4. Click "Book Ride Now"
5. Go to "My Bookings" tab
6. Wait for driver to send quote

#### As Driver:
1. Login as a driver
2. Go to "Ride Requests" tab
3. Find the pending ride
4. Enter a fare amount (e.g., 500)
5. Click "📤 Send Quote"

#### As Rider (Accept Quote):
1. Refresh "My Bookings" tab
2. See the quote card with price
3. If Cash Payment:
   - Click "✅ Accept Quote"
4. If Card Payment:
   - Fill in card details
   - Upload a receipt image
   - Click "✅ Accept Quote & Pay"

#### As Driver (Complete Ride):
1. Go to "Current Ride" tab
2. Click "🚀 Start Ride" button
3. Wait a moment
4. Click "✓ Complete Ride" button

### Step 3: Test Drop-off Confirmation

#### As Rider (Confirm Drop-off):
1. Go to "Current Ride" tab (or it should already be there)
2. **VERIFY**: You should see a large green section with:
   - ✅ Icon
   - "Confirm Your Drop-off" heading
   - Explanation text
   - "✅ Confirm Drop-off" button
3. Click the "✅ Confirm Drop-off" button
4. **VERIFY**: Success message appears
5. **VERIFY**: Green confirmation banner shows with timestamp
6. Refresh the page
7. **VERIFY**: Confirmation status still shows (persists)

#### As Driver (Test Blocking):
1. Go to "Ride Requests" tab
2. **VERIFY**: You should see an orange/amber warning banner:
   - ⏳ Icon
   - "Waiting for Rider Confirmation" heading
   - Explanation that you cannot accept new requests
3. **VERIFY**: No ride requests are shown
4. Try to refresh the page
5. **VERIFY**: Warning still appears

### Step 4: Test Unblocking

#### As Rider:
1. If you haven't already, click "✅ Confirm Drop-off"
2. Wait for confirmation

#### As Driver:
1. Refresh "Ride Requests" tab
2. **VERIFY**: Warning banner is gone
3. **VERIFY**: Pending ride requests are now visible
4. **VERIFY**: You can enter fare amounts
5. **VERIFY**: "📤 Send Quote" button is enabled

### Step 5: Test Multiple Unconfirmed Rides

#### Setup:
1. Complete 2-3 rides without rider confirmation
2. As driver, try to view requests

#### Expected Result:
- Driver should be blocked
- Error message should mention "completed rides" (plural)
- Driver cannot see any requests

#### Unblock:
1. As rider, confirm all completed rides one by one
2. As driver, refresh after each confirmation
3. After last confirmation, driver should see requests

## Test Scenarios

### Scenario 1: Normal Flow
✅ Rider confirms immediately after ride completion
✅ Driver can accept new requests right away

### Scenario 2: Delayed Confirmation
✅ Rider doesn't confirm for several minutes
✅ Driver remains blocked during this time
✅ Driver sees clear explanation
✅ Once confirmed, driver can proceed

### Scenario 3: Page Refresh
✅ Rider refreshes before confirming - button still shows
✅ Rider refreshes after confirming - status still shows
✅ Driver refreshes while blocked - warning still shows
✅ Driver refreshes after unblock - requests show

### Scenario 4: Multiple Rides
✅ Driver completes multiple rides
✅ Driver is blocked until ALL are confirmed
✅ Partial confirmations don't unblock driver
✅ Last confirmation unblocks driver

### Scenario 5: Different Payment Methods
✅ Works with Cash on Delivery
✅ Works with Card Payment
✅ Confirmation required regardless of payment method

## Visual Verification Checklist

### Rider UI:
- [ ] Large green confirmation section is prominent
- [ ] Button has clear label and icon
- [ ] Explanation text is easy to read
- [ ] Success message appears after clicking
- [ ] Confirmation status shows timestamp
- [ ] Status persists after refresh

### Driver UI:
- [ ] Orange warning banner is noticeable
- [ ] Hourglass icon (⏳) is visible
- [ ] Heading is bold and clear
- [ ] Explanation text is detailed
- [ ] No ride requests show when blocked
- [ ] Requests appear immediately after unblock

## Common Issues and Solutions

### Issue 1: Button doesn't appear
**Solution**: 
- Verify ride status is 'completed'
- Check backend server is running
- Verify ride was completed (not cancelled)

### Issue 2: Driver not blocked
**Solution**:
- Restart backend server
- Verify driverId is being passed in API call
- Check browser console for errors

### Issue 3: Confirmation doesn't persist
**Solution**:
- Check database connection
- Verify API call succeeded (check Network tab)
- Ensure ride is being reloaded after confirmation

### Issue 4: Error messages not showing
**Solution**:
- Check API error response format
- Verify error handling in frontend
- Look for console errors

## API Testing (Optional)

### Test Confirm Drop-off Endpoint:
```bash
# Replace {rideId} with actual ride ID
curl -X PATCH http://localhost:5000/api/rides/{rideId}/confirm-dropoff \
  -H "Content-Type: application/json"
```

**Expected Response (Success)**:
```json
{
  "_id": "...",
  "status": "completed",
  "droppedOffConfirmed": true,
  "droppedOffConfirmedAt": "2026-04-25T...",
  ...
}
```

### Test Pending Rides with Blocking:
```bash
# Replace {driverId} with actual driver ID
curl http://localhost:5000/api/rides/pending?driverId={driverId}
```

**Expected Response (Blocked)**:
```json
{
  "message": "You have completed rides waiting for rider confirmation. Cannot accept new requests until riders confirm drop-off.",
  "unconfirmedRides": 1
}
```

## Success Criteria

✅ Rider can confirm drop-off after ride completion
✅ Confirmation button is clearly visible and prominent
✅ Confirmation status persists across page refreshes
✅ Driver is blocked from accepting new requests
✅ Driver sees clear explanation of why they're blocked
✅ Driver is immediately unblocked after confirmation
✅ System works with both payment methods
✅ Multiple unconfirmed rides are handled correctly
✅ Error messages are clear and helpful
✅ UI is user-friendly and intuitive

## Reporting Issues

If you find any issues during testing:
1. Note the exact steps to reproduce
2. Take screenshots of the issue
3. Check browser console for errors
4. Check backend server logs
5. Document expected vs actual behavior
