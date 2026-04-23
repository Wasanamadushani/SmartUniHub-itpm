# Quick Start Testing Guide - Unified Login System

**Last Updated**: April 23, 2026

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Backend running on `http://localhost:5001`
- Frontend running on `http://localhost:5173`
- MongoDB connected

### Step 1: Access the Application
```
Open browser: http://localhost:5173
```

### Step 2: Test Login
```
URL: http://localhost:5173/login

Test Credentials (use any existing user in database):
- Email: student@my.sliit.lk
- Password: Password123!

Expected Result:
✅ Redirects to /dashboard
✅ Shows user name and role in navbar
✅ Dashboard displays available modules
```

### Step 3: Test Role-Based Access
```
After login, check navbar dropdown:
- Click user name in top-right
- Should show role-specific options
- Admin users see: Admin Overview, Canteen Admin, Event Admin, Study Area Admin
- Rider users see: My Rides, Become a Driver
- Driver users see: Driver Dashboard, Driver Settings
```

### Step 4: Test Module Access
```
From Dashboard:
1. Click on any module card
2. Should navigate to that module
3. Should NOT show 404 errors
4. Should load data correctly

Example:
- Click "Events & Community" → /events
- Click "Canteen Services" → /canteen
- Click "Study Area" → /study-area
```

### Step 5: Test Logout
```
1. Click user name in navbar (top-right)
2. Click "Logout"
3. Should redirect to /login
4. Navbar should show "Login" and "Register" buttons
5. Accessing /dashboard should redirect to /login
```

---

## 🧪 Detailed Test Cases

### Test Case 1: Registration
```
URL: http://localhost:5173/register

Steps:
1. Fill in all fields:
   - Name: Test User
   - Student ID: IT21234567
   - Email: testuser@my.sliit.lk
   - Phone: 0712345678
   - Role: rider
   - Security Question: What is your favorite school subject?
   - Security Answer: Mathematics
   - Password: TestPassword123!
   - Confirm Password: TestPassword123!

2. Check "I accept the terms and privacy policy"
3. Click "Create Account"

Expected Result:
✅ Account created successfully
✅ Redirected to /dashboard
✅ User name and role displayed in navbar
```

### Test Case 2: Login with Invalid Credentials
```
URL: http://localhost:5173/login

Steps:
1. Enter email: invalid@my.sliit.lk
2. Enter password: WrongPassword123!
3. Click "Login"

Expected Result:
❌ Error message displayed
❌ NOT redirected to dashboard
❌ Stays on login page
```

### Test Case 3: Password Recovery
```
URL: http://localhost:5173/login

Steps:
1. Click "Forgot password?"
2. Enter email: student@my.sliit.lk
3. Click "Load Security Question"
4. Answer security question
5. Enter new password: NewPassword123!
6. Confirm new password: NewPassword123!
7. Click "Reset Password"

Expected Result:
✅ Password reset successfully
✅ Can login with new password
```

### Test Case 4: Protected Routes
```
Test 1: Access /dashboard without login
- URL: http://localhost:5173/dashboard
- Expected: Redirected to /login

Test 2: Access /admin as non-admin user
- Login as rider
- URL: http://localhost:5173/admin
- Expected: Redirected to /dashboard

Test 3: Access /admin as admin user
- Login as admin
- URL: http://localhost:5173/admin
- Expected: Admin page loads successfully
```

### Test Case 5: API Endpoints
```
Test Login Endpoint:
POST http://localhost:5001/api/users/login
Content-Type: application/json

{
  "email": "student@my.sliit.lk",
  "password": "Password123!"
}

Expected Response (200 OK):
{
  "user": {
    "_id": "...",
    "name": "Student Name",
    "email": "student@my.sliit.lk",
    "role": "rider",
    "studentId": "IT21234567"
  }
}

Test Register Endpoint:
POST http://localhost:5001/api/users/register
Content-Type: application/json

{
  "name": "New User",
  "studentId": "IT21234568",
  "email": "newuser@my.sliit.lk",
  "phone": "0712345679",
  "role": "rider",
  "securityQuestion": "What is your favorite school subject?",
  "securityAnswer": "Mathematics",
  "password": "Password123!"
}

Expected Response (201 Created):
{
  "user": {
    "_id": "...",
    "name": "New User",
    "email": "newuser@my.sliit.lk",
    "role": "rider",
    "studentId": "IT21234568"
  }
}
```

---

## 🔍 Troubleshooting

### Issue: "Cannot GET /api/users/login" (404 Error)
**Cause**: Double `/api` prefix in API call  
**Solution**: Verify `apiRequest()` calls don't include `/api` prefix
```javascript
// ❌ WRONG
apiRequest('/api/users/login', ...)

// ✅ CORRECT
apiRequest('/users/login', ...)
```

### Issue: CORS Error
**Cause**: Frontend origin not in CORS whitelist  
**Solution**: Check `backend/server.js` CORS configuration
```javascript
origin: [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
]
```

### Issue: "Cannot read property 'name' of null"
**Cause**: User not authenticated  
**Solution**: Check localStorage for user data
```javascript
// In browser console:
localStorage.getItem('user')
// Should return user object, not null
```

### Issue: Redirects to login after every page refresh
**Cause**: User data not persisting in localStorage  
**Solution**: Check browser's localStorage is enabled
```javascript
// In browser console:
localStorage.setItem('test', 'value')
localStorage.getItem('test') // Should return 'value'
```

### Issue: Navbar not showing user name
**Cause**: AuthContext not properly initialized  
**Solution**: Check App.jsx has AuthProvider wrapper
```javascript
// ✅ CORRECT
<AuthProvider>
  <CanteenProvider>
    <div className="app-shell">
      {/* Routes */}
    </div>
  </CanteenProvider>
</AuthProvider>
```

---

## 📊 Test Results Template

```
Test Date: _______________
Tester: ___________________
Environment: localhost:5173

Test Case 1: Registration
Status: ☐ PASS ☐ FAIL
Notes: _____________________

Test Case 2: Login
Status: ☐ PASS ☐ FAIL
Notes: _____________________

Test Case 3: Dashboard
Status: ☐ PASS ☐ FAIL
Notes: _____________________

Test Case 4: Role-Based Access
Status: ☐ PASS ☐ FAIL
Notes: _____________________

Test Case 5: Logout
Status: ☐ PASS ☐ FAIL
Notes: _____________________

Test Case 6: Protected Routes
Status: ☐ PASS ☐ FAIL
Notes: _____________________

Test Case 7: API Endpoints
Status: ☐ PASS ☐ FAIL
Notes: _____________________

Overall Status: ☐ PASS ☐ FAIL
Issues Found: _____________________
```

---

## 🎯 Key Verification Points

- ✅ Single login page works for all roles
- ✅ Dashboard shows only accessible modules
- ✅ Navbar displays user name and role
- ✅ Role-based navigation works correctly
- ✅ Protected routes redirect unauthorized users
- ✅ Logout clears session and redirects to login
- ✅ API endpoints return correct responses
- ✅ CORS allows frontend to communicate with backend
- ✅ User data persists across page refreshes
- ✅ No 404 errors for API calls

---

## 📞 Support Contacts

**Backend Issues**: Check `backend/server.js` logs  
**Frontend Issues**: Check browser console (F12)  
**Database Issues**: Check MongoDB connection string  
**CORS Issues**: Check `backend/server.js` CORS configuration  

---

## ✅ Sign-Off

**System Ready for Testing**: YES ✅

All components are in place and ready for comprehensive testing. Follow the test cases above to verify the unified login system is working correctly.

