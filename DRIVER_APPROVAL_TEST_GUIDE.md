# Driver Approval System - Testing Guide

## Prerequisites
- Backend server running on port 5000
- Frontend running on port 5173
- MongoDB connected
- At least one admin account
- At least one driver account (or ability to create one)

## Test Scenario 1: New Driver Registration & Approval

### Step 1: Register as Driver
1. Open browser and navigate to the app
2. Login with a regular user account (not admin)
3. Navigate to `/become-driver` page
4. Fill in driver registration form:
   - Vehicle Type: Select any (e.g., "Sedan")
   - Vehicle Number: Enter (e.g., "ABC-1234")
   - Vehicle Model: Enter (e.g., "Toyota Corolla")
   - License Number: Enter (e.g., "B1234567")
   - Capacity: Enter number (e.g., 4)
5. Submit the form
6. **Expected**: Driver profile created with `isApproved: false`

### Step 2: Check Driver Dashboard
1. Navigate to Driver Dashboard
2. Click on "Ride Requests" tab
3. **Expected**: See message "⏳ Your driver account is pending approval"
4. **Expected**: Message explains admin review is required
5. **Expected**: No ride requests are shown
6. **Expected**: "Accept Request" buttons are disabled

### Step 3: Admin Approves Driver
1. Logout from driver account
2. Login with admin account
3. Navigate to Admin Dashboard
4. Click on "Transport Control" tab
5. Scroll down to "Driver Management" section
6. **Expected**: See the newly registered driver with "⏳ Pending" badge
7. Click "Approve" button for the driver
8. **Expected**: Success notification appears
9. **Expected**: Badge changes to "✅ Approved"
10. **Expected**: Button changes to "Suspend"

### Step 4: Verify Driver Can Accept Rides
1. Logout from admin account
2. Login with the driver account
3. Navigate to Driver Dashboard
4. Click on "Ride Requests" tab
5. **Expected**: No "Pending Approval" message
6. **Expected**: Can see pending ride requests (if any exist)
7. **Expected**: "Accept Request" buttons are enabled
8. Try accepting a ride request (if available)
9. **Expected**: Ride is accepted successfully

## Test Scenario 2: Suspend Approved Driver

### Step 1: Admin Suspends Driver
1. Login with admin account
2. Navigate to Admin Dashboard → Transport Control
3. Find an approved driver in "Driver Management" section
4. Click "Suspend" button
5. **Expected**: Confirmation dialog appears
6. Click "OK" to confirm
7. **Expected**: Success notification appears
8. **Expected**: Badge changes to "⏳ Pending"
9. **Expected**: Button changes to "Approve"

### Step 2: Verify Driver Cannot Accept Rides
1. Logout from admin account
2. Login with the suspended driver account
3. Navigate to Driver Dashboard → Ride Requests
4. **Expected**: See "⏳ Pending Approval" message again
5. **Expected**: Cannot see or accept ride requests
6. **Expected**: "Accept Request" buttons are disabled

## Test Scenario 3: Multiple Drivers Management

### Step 1: Create Multiple Drivers
1. Register 3-5 different driver accounts
2. Some should be approved, some pending

### Step 2: Admin View
1. Login as admin
2. Navigate to Transport Control → Driver Management
3. **Expected**: See all drivers listed
4. **Expected**: Each driver shows correct approval status
5. **Expected**: Driver details visible (name, email, phone, vehicle info, rating)

### Step 3: Bulk Status Changes
1. Approve all pending drivers one by one
2. **Expected**: Each approval updates immediately
3. **Expected**: Notifications appear for each action
4. Suspend one approved driver
5. **Expected**: Confirmation required
6. **Expected**: Status updates correctly

## Test Scenario 4: Edge Cases

### Test 4.1: Driver Without Profile
1. Login with a user who has role="driver" but no driver profile
2. Navigate to Driver Dashboard
3. **Expected**: See "No driver profile found" error
4. **Expected**: Button to "Complete Driver Registration"
5. Click the button
6. **Expected**: Redirected to `/become-driver` page

### Test 4.2: Rapid Status Changes
1. As admin, quickly approve and suspend the same driver multiple times
2. **Expected**: Each action completes successfully
3. **Expected**: Final status is correct
4. **Expected**: No race conditions or errors

### Test 4.3: Network Errors
1. Disconnect network
2. Try to approve/suspend a driver
3. **Expected**: Error notification appears
4. **Expected**: UI doesn't break
5. Reconnect network
6. Try again
7. **Expected**: Works correctly

## Verification Checklist

### Backend Verification:
- [ ] `PATCH /api/drivers/:id/approve` endpoint works
- [ ] `PATCH /api/drivers/:id/reject` endpoint works
- [ ] Driver `isApproved` field updates in database
- [ ] User `isVerified` field updates when driver approved
- [ ] Endpoints return proper error messages for invalid IDs

### Frontend Verification:
- [ ] Admin sees all drivers in Transport Control
- [ ] Approval status badges display correctly
- [ ] Approve button works for pending drivers
- [ ] Suspend button works for approved drivers
- [ ] Confirmation dialog appears before suspension
- [ ] Success/error notifications appear
- [ ] Driver list refreshes after status change
- [ ] Unapproved drivers see pending message
- [ ] Unapproved drivers cannot accept rides
- [ ] Approved drivers can accept rides
- [ ] Accept button disabled state works correctly

### Database Verification:
```javascript
// Check driver approval status in MongoDB
db.drivers.find({ isApproved: false }) // Pending drivers
db.drivers.find({ isApproved: true })  // Approved drivers

// Check specific driver
db.drivers.findOne({ _id: ObjectId("driver_id_here") })
```

## Common Issues & Solutions

### Issue 1: Driver still sees ride requests after suspension
**Solution**: Refresh the page or logout/login again. The frontend caches driver profile.

### Issue 2: Approve button doesn't work
**Solution**: 
- Check backend server is running
- Check browser console for errors
- Verify driver ID is correct
- Restart backend server if routes were just added

### Issue 3: Notifications don't appear
**Solution**: Check that `addNotification` function is working in AdminPage.jsx

### Issue 4: Driver profile not found
**Solution**: 
- Ensure driver completed registration via `/become-driver`
- Check database for driver document
- Verify user ID matches driver.user field

## Success Criteria

✅ Admin can approve pending drivers
✅ Admin can suspend approved drivers  
✅ Unapproved drivers cannot accept rides
✅ Approved drivers can accept rides
✅ Status changes reflect immediately in UI
✅ Notifications appear for all actions
✅ No errors in browser console
✅ No errors in backend logs
✅ Database updates correctly

## Notes

- Backend server must be restarted after adding new routes
- Clear browser cache if seeing stale data
- Use different browsers/incognito for testing multiple accounts simultaneously
- Check MongoDB directly to verify data persistence
