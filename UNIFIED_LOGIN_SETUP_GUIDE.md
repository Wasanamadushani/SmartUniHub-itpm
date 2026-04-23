# Unified Login System - Setup & Testing Guide

## Quick Start

### 1. Verify Servers Are Running
- **Backend**: Running on `http://localhost:5001`
- **Frontend**: Running on `http://localhost:5173` (or similar)

### 2. Access the Application
1. Open your browser and go to `http://localhost:5173`
2. You'll see the home page with a navigation bar
3. Click "Login" in the top right

### 3. Login Flow

#### Test Credentials
Use any existing user credentials from your database. If you need to create test users:

**Admin User**
```
Email: admin@sliit.lk
Password: admin123
Role: admin
```

**Student User**
```
Email: student@sliit.lk
Password: student123
Role: student
```

**Driver User**
```
Email: driver@sliit.lk
Password: driver123
Role: driver
```

### 4. After Login
1. You'll be automatically redirected to `/dashboard`
2. The dashboard shows all available modules based on your role
3. Click any module card to access it
4. Use the navigation bar to switch between modules
5. Your session persists across all modules

## Key URLs

| Page | URL | Access |
|------|-----|--------|
| Home | `/` | Public |
| Login | `/login` | Public |
| Register | `/register` | Public |
| Dashboard | `/dashboard` | Authenticated |
| Events | `/events` | Authenticated |
| Canteen | `/canteen` | Authenticated |
| Study Area | `/study-area` | Authenticated |
| My Fines | `/student-fines` | Authenticated |
| Rider Dashboard | `/rider-dashboard` | Authenticated (Rider/Driver/Admin) |
| Driver Dashboard | `/driver-dashboard` | Authenticated (Driver/Admin) |
| Admin Panel | `/admin` | Admin Only |
| Canteen Admin | `/admin-canteen` | Admin Only |
| Event Admin | `/admin-events` | Admin Only |
| Study Area Admin | `/admin-study-area` | Admin Only |

## Features to Test

### 1. Single Login System
- [ ] Login with valid credentials
- [ ] Verify redirect to dashboard
- [ ] Check that user info is displayed
- [ ] Verify session persists on page refresh

### 2. Role-Based Access
- [ ] Login as Admin - verify admin modules appear
- [ ] Login as Student - verify student modules appear
- [ ] Login as Driver - verify driver modules appear
- [ ] Try accessing admin routes as non-admin - should redirect to dashboard

### 3. Navigation
- [ ] Check navbar shows correct user name
- [ ] Click account menu - verify dropdown shows user info
- [ ] Verify role is displayed in dropdown
- [ ] Check that role-specific options appear in dropdown

### 4. Module Access
- [ ] Click on module cards from dashboard
- [ ] Verify you can navigate between modules
- [ ] Check that navbar updates to show current page
- [ ] Verify you don't need to log in again for each module

### 5. Logout
- [ ] Click account menu
- [ ] Click "Logout"
- [ ] Verify redirect to login page
- [ ] Try accessing dashboard - should redirect to login

### 6. Protected Routes
- [ ] Open browser console
- [ ] Try accessing `/dashboard` directly without login
- [ ] Should redirect to login page
- [ ] Try accessing `/admin` as non-admin user
- [ ] Should redirect to dashboard

## Dashboard Module Display

### Admin Dashboard Shows:
- ⚙️ Admin Overview
- 🍳 Canteen Management
- 📋 Event Management
- 🏢 Study Area Management
- Plus all user modules

### Student/Rider Dashboard Shows:
- 🎉 Events & Community
- 🍽️ Canteen Services
- 📚 Study Area
- ⚠️ My Fines
- 🚗 Transport (if applicable)

### Driver Dashboard Shows:
- 🎉 Events & Community
- 🍽️ Canteen Services
- 📚 Study Area
- ⚠️ My Fines
- 🚗 Transport (Driver Dashboard)

## Browser Developer Tools

### Check Authentication State
1. Open Developer Tools (F12)
2. Go to Application > Local Storage
3. Look for `user` or `currentUser` key
4. Should contain user object with name, email, role, etc.

### Check Console for Errors
1. Open Developer Tools (F12)
2. Go to Console tab
3. Should not see any authentication-related errors
4. Check for API response errors

## Common Issues & Solutions

### Issue: Not Redirected to Dashboard After Login
**Solution:**
1. Check browser console for errors
2. Verify backend login endpoint is working
3. Check that user data is in localStorage
4. Clear cache and try again

### Issue: Modules Not Showing on Dashboard
**Solution:**
1. Verify user role in database
2. Check that role matches module's allowed roles
3. Clear localStorage and log in again
4. Check browser console for errors

### Issue: Session Lost on Page Refresh
**Solution:**
1. Check that localStorage is not being cleared
2. Verify AuthContext is properly initialized
3. Check browser privacy settings
4. Try in incognito/private mode

### Issue: Can Access Admin Routes Without Admin Role
**Solution:**
1. Verify ProtectedRoute is wrapping the route
2. Check that requiredRole prop is set correctly
3. Verify user role is correctly stored
4. Clear cache and log in again

## Testing Checklist

### Authentication
- [ ] Can log in with valid credentials
- [ ] Cannot log in with invalid credentials
- [ ] Redirected to dashboard after login
- [ ] Can log out successfully
- [ ] Session persists on page refresh

### Authorization
- [ ] Admin can access admin routes
- [ ] Non-admin cannot access admin routes
- [ ] Correct modules show for each role
- [ ] Protected routes redirect to login when not authenticated

### Navigation
- [ ] Navbar shows correct user name
- [ ] Navbar shows correct role
- [ ] Can navigate between modules
- [ ] Account menu shows all correct options
- [ ] Logout button works

### User Experience
- [ ] Dashboard is visually appealing
- [ ] Module cards are clickable
- [ ] Responsive design works on mobile
- [ ] No console errors
- [ ] Fast page transitions

## Performance Tips

1. **Clear Cache**: If experiencing issues, clear browser cache
2. **Check Network**: Open DevTools Network tab to see API calls
3. **Monitor Console**: Watch for any JavaScript errors
4. **Test Different Roles**: Try with different user roles
5. **Test Different Browsers**: Ensure compatibility

## Next Steps

After testing the unified login system:

1. **Customize Dashboard**: Add more modules or customize module cards
2. **Add User Profile**: Create a user profile page for editing info
3. **Implement JWT**: Replace localStorage with JWT tokens for better security
4. **Add Notifications**: Show notifications for important events
5. **Implement 2FA**: Add two-factor authentication for security
6. **Add Audit Logging**: Track user actions for security

## Support

For issues or questions:
1. Check the UNIFIED_LOGIN_SYSTEM.md documentation
2. Review browser console for error messages
3. Check backend logs for API errors
4. Verify database connection
5. Test with different user roles

## Files Modified/Created

### New Files
- `react-frontend/src/context/AuthContext.jsx`
- `react-frontend/src/components/ProtectedRoute.jsx`
- `react-frontend/src/pages/DashboardPage.jsx`
- `react-frontend/src/styles/dashboard-unified.css`
- `UNIFIED_LOGIN_SYSTEM.md`
- `UNIFIED_LOGIN_SETUP_GUIDE.md`

### Modified Files
- `react-frontend/src/App.jsx`
- `react-frontend/src/components/Navbar.jsx`
- `react-frontend/src/pages/LoginPage.jsx`
- `react-frontend/src/styles.css`

## Deployment Considerations

Before deploying to production:

1. **Environment Variables**: Set correct API endpoints
2. **HTTPS**: Ensure all connections use HTTPS
3. **CORS**: Configure CORS properly
4. **Password Hashing**: Verify passwords are hashed on backend
5. **Session Security**: Consider implementing JWT tokens
6. **Rate Limiting**: Add rate limiting to login endpoint
7. **Error Messages**: Don't expose sensitive information in errors
8. **Logging**: Implement proper logging for debugging

## Rollback Instructions

If you need to revert to the old system:

1. Restore original `App.jsx` (remove AuthProvider wrapper)
2. Restore original `Navbar.jsx` (remove role-based logic)
3. Restore original `LoginPage.jsx` (remove dashboard redirect)
4. Delete new files (AuthContext, ProtectedRoute, DashboardPage)
5. Clear browser localStorage
6. Restart frontend server

---

**Last Updated**: April 23, 2026
**Version**: 1.0.0
