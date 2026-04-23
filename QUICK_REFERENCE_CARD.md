# Quick Reference Card - Unified Login System

**SLIIT Campus Hub - Authentication & Authorization**

---

## 🚀 Quick Start

```bash
# Start Backend
cd backend
npm start
# Runs on http://localhost:5001

# Start Frontend
cd react-frontend
npm run dev
# Runs on http://localhost:5173
```

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `AuthContext.jsx` | Global auth state |
| `ProtectedRoute.jsx` | Route protection |
| `LoginPage.jsx` | Login form |
| `RegisterPage.jsx` | Registration form |
| `DashboardPage.jsx` | Unified dashboard |
| `Navbar.jsx` | Navigation bar |
| `api.js` | API handler |
| `auth.js` | Auth utilities |

---

## 👥 User Roles

| Role | Modules | Access |
|------|---------|--------|
| **Admin** | All modules + Admin panels | Full system access |
| **Rider** | Transport, Events, Canteen, Study Area, Fines | Book rides |
| **Driver** | Transport, Events, Canteen, Study Area, Fines | Manage rides |
| **Student** | Events, Canteen, Study Area, Fines | Basic access |
| **Staff** | Events, Canteen, Study Area, Fines | Basic access |

---

## 🔗 API Endpoints

```
POST /users/login
POST /users/register
POST /users/forgot-password/security-question
POST /users/forgot-password/security-reset
```

---

## 📍 Routes

| Route | Component | Protected | Role |
|-------|-----------|-----------|------|
| `/` | HomePage | No | - |
| `/login` | LoginPage | No | - |
| `/register` | RegisterPage | No | - |
| `/dashboard` | DashboardPage | Yes | All |
| `/admin` | AdminPage | Yes | Admin |
| `/rider-dashboard` | RiderDashboardPage | Yes | Rider |
| `/driver-dashboard` | DriverDashboardPage | Yes | Driver |

---

## 🧪 Test Credentials

```
Email: test@my.sliit.lk
Password: TestPassword123!
Role: rider
```

---

## 🔍 Debugging

### Check User Data
```javascript
// Browser console
localStorage.getItem('user')
```

### Check Auth State
```javascript
// Browser console
localStorage.getItem('currentUser')
```

### Check API Calls
```javascript
// Browser console - Network tab
// Look for requests to http://localhost:5001/api/...
```

### Check Errors
```javascript
// Browser console - Console tab
// Look for error messages
```

---

## ⚙️ Configuration

### Frontend (.env)
```
VITE_NODE_API_URL=http://localhost:5001/api
VITE_API_BASE_URL=http://localhost:5001/api
```

### Backend (server.js)
```javascript
CORS: ['http://localhost:5173', 'http://localhost:5174', ...]
PORT: 5001
```

---

## 🔐 Security

- ✅ Passwords hashed with bcrypt
- ✅ CORS restricted to specific origins
- ✅ Input validation on frontend and backend
- ✅ Session stored in localStorage
- ✅ Auth state in React Context

---

## 📊 Common Tasks

### Add New Role
1. Update User model with new role
2. Add role to role enum
3. Update DashboardPage module visibility
4. Update Navbar navigation links
5. Create role-specific dashboard page

### Add New Module
1. Create new page component
2. Add route in App.jsx
3. Add to DashboardPage modules
4. Add to Navbar navigation
5. Protect route with ProtectedRoute

### Fix API Errors
1. Check API_BASE_URL in .env
2. Verify endpoint format (no `/api` prefix)
3. Check backend is running
4. Check CORS configuration
5. Check browser console for errors

---

## 🎯 Verification

- [ ] Login works
- [ ] Dashboard shows modules
- [ ] Navbar shows user info
- [ ] Logout works
- [ ] Protected routes work
- [ ] Role-based access works
- [ ] No console errors
- [ ] No 404 errors

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 on login | Check API endpoint format |
| CORS error | Check CORS config in backend |
| User not persisting | Check localStorage enabled |
| Redirect loop | Check ProtectedRoute logic |
| Navbar not updating | Check AuthContext initialization |

---

## 🚀 Deployment

```bash
# Build frontend
cd react-frontend
npm run build

# Start backend
cd backend
npm start

# Frontend will be served from dist/
```

---

## 📚 Documentation

- `UNIFIED_LOGIN_SYSTEM_VERIFICATION.md` - Complete verification
- `QUICK_START_TESTING_GUIDE.md` - Testing guide
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `SYSTEM_OVERVIEW_DIAGRAM.md` - Architecture diagrams
- `FINAL_STATUS_REPORT.md` - Project status

---

## ✅ Status

**System**: ✅ PRODUCTION READY  
**Last Updated**: April 23, 2026  
**Version**: 1.0.0

---

## 🎓 Key Concepts

### AuthContext
Global state management for authentication. Provides user data and auth functions to entire app.

### ProtectedRoute
Wrapper component that checks authentication and role before rendering protected pages.

### localStorage
Browser storage for persisting user data across page refreshes.

### CORS
Cross-Origin Resource Sharing - allows frontend to communicate with backend.

### Role-Based Access Control
Different users see different modules based on their role.

---

## 💡 Tips

1. Always check browser console for errors
2. Use Network tab to debug API calls
3. Check localStorage for user data
4. Verify CORS headers in API responses
5. Test with different user roles
6. Clear localStorage if session issues
7. Check backend logs for errors
8. Verify environment variables

---

## 🔗 Useful Links

- React Docs: https://react.dev
- React Router: https://reactrouter.com
- Express.js: https://expressjs.com
- MongoDB: https://www.mongodb.com
- Vite: https://vitejs.dev

---

**Quick Reference Card v1.0**  
**SLIIT Campus Hub - Unified Login System**  
**April 23, 2026**

