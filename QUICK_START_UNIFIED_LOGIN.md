# Quick Start - Unified Login System

## 🚀 Get Started in 5 Minutes

### Step 1: Access the Application
```
Frontend: http://localhost:5173
Backend: http://localhost:5001
```

### Step 2: Go to Login Page
```
URL: http://localhost:5173/login
```

### Step 3: Login with Test Credentials
```
Email: admin@sliit.lk (or any existing user email)
Password: admin123 (or the user's password)
```

### Step 4: You're Redirected to Dashboard
```
URL: http://localhost:5173/dashboard
```

### Step 5: Click Any Module to Access It
- 🎉 Events & Community
- 🍽️ Canteen Services
- 📚 Study Area
- ⚠️ My Fines
- 🚗 Transport (if applicable)
- ⚙️ Admin Panels (if admin)

## 📍 Key URLs

| Page | URL |
|------|-----|
| Home | `/` |
| Login | `/login` |
| Dashboard | `/dashboard` |
| Events | `/events` |
| Canteen | `/canteen` |
| Study Area | `/study-area` |
| My Fines | `/student-fines` |
| Rider Dashboard | `/rider-dashboard` |
| Driver Dashboard | `/driver-dashboard` |
| Admin Panel | `/admin` |

## 🎯 What's New

### Before (Old System)
- Multiple login pages (transport login, admin login, etc.)
- Users had to log in for each module
- No central dashboard
- Confusing navigation

### After (New System)
- ✅ Single login page
- ✅ One session for all modules
- ✅ Central dashboard with all modules
- ✅ Role-based module visibility
- ✅ Clear navigation
- ✅ Better user experience

## 👥 User Roles & Access

### Admin
- Access all modules
- Admin panels for managing system
- Can manage users, events, canteen, study areas

### Student/Rider
- Access events, canteen, study area, fines
- Can book rides (transport)
- Can view personal information

### Driver
- Access events, canteen, study area, fines
- Driver dashboard for managing rides
- Can view ride history

### Staff
- Access events, canteen, study area, fines
- Limited access to system

## 🔑 Key Features

1. **Single Login**
   - One login page for everyone
   - Email + password authentication
   - Automatic redirect to dashboard

2. **Unified Dashboard**
   - See all available modules
   - Click to access any module
   - View your account info

3. **Role-Based Access**
   - Different modules for different roles
   - Admin sees admin panels
   - Drivers see driver dashboard
   - Students see student modules

4. **Persistent Session**
   - Log in once
   - Access all modules
   - Session persists on page refresh
   - No need to log in again

5. **Enhanced Navigation**
   - See your name and role
   - Quick access to all modules
   - Easy logout

## 🧪 Quick Test

### Test 1: Login
1. Go to `/login`
2. Enter email and password
3. Click "Login"
4. Should redirect to `/dashboard`

### Test 2: Module Access
1. From dashboard, click any module
2. Should load the module
3. Navbar should show current page
4. Should not need to log in again

### Test 3: Session Persistence
1. Log in and go to a module
2. Refresh the page (F5)
3. Should still be logged in
4. Should still see the module

### Test 4: Logout
1. Click account menu (top right)
2. Click "Logout"
3. Should redirect to login page
4. Should not be able to access dashboard

### Test 5: Protected Routes
1. Open browser console
2. Try accessing `/dashboard` without login
3. Should redirect to `/login`
4. Try accessing `/admin` as non-admin
5. Should redirect to `/dashboard`

## 📱 Mobile Testing

The system is fully responsive:
- Dashboard works on mobile
- Navigation menu collapses on small screens
- Module cards stack vertically
- Touch-friendly buttons

## 🐛 Common Issues

### Issue: Not redirected to dashboard
**Solution**: Check browser console for errors, verify backend is running

### Issue: Modules not showing
**Solution**: Verify user role in database, clear localStorage

### Issue: Session lost on refresh
**Solution**: Check browser privacy settings, try incognito mode

### Issue: Can't access admin routes
**Solution**: Verify you're logged in as admin, check user role

## 📚 Documentation

For more details, see:
- `UNIFIED_LOGIN_SYSTEM.md` - Complete documentation
- `UNIFIED_LOGIN_SETUP_GUIDE.md` - Setup and testing
- `UNIFIED_LOGIN_ARCHITECTURE.md` - Architecture details
- `UNIFIED_LOGIN_IMPLEMENTATION_SUMMARY.md` - Implementation overview

## 🎓 For Developers

### Access User Data
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated && <p>Hello, {user.name}!</p>}
    </div>
  );
}
```

### Protect a Route
```javascript
import ProtectedRoute from '../components/ProtectedRoute';

<Route 
  path="/dashboard" 
  element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} 
/>
```

### Protect Admin Routes
```javascript
<Route 
  path="/admin" 
  element={<ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>} 
/>
```

## 🔐 Security Notes

- Passwords should be hashed on backend
- Use HTTPS in production
- Consider implementing JWT tokens
- Add session timeout for security
- Implement rate limiting on login

## 🚀 Next Steps

1. Test the system thoroughly
2. Create test users with different roles
3. Verify all modules are accessible
4. Test on different browsers
5. Test on mobile devices
6. Check performance
7. Deploy to production

## 📞 Need Help?

1. Check the documentation files
2. Review browser console for errors
3. Check backend logs
4. Verify database connection
5. Test with different user roles

---

**Version**: 1.0.0
**Last Updated**: April 23, 2026
**Status**: ✅ Ready to Use
