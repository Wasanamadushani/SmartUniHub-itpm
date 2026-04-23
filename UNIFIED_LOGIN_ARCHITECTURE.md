# Unified Login System - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Browser                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              App.jsx (with AuthProvider)                 │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │         AuthContext (Global State)                 │  │   │
│  │  │  - user: Current user object                       │  │   │
│  │  │  - loading: Auth state loading                     │  │   │
│  │  │  - login(): Store user & dispatch auth-changed    │  │   │
│  │  │  - logout(): Clear user & dispatch auth-changed   │  │   │
│  │  │  - isAuthenticated: Boolean flag                  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                            │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │         Route Protection Layer                     │  │   │
│  │  │  ┌──────────────────────────────────────────────┐  │  │   │
│  │  │  │  ProtectedRoute Component                    │  │  │   │
│  │  │  │  - Checks authentication status              │  │  │   │
│  │  │  │  - Verifies user role (if required)          │  │  │   │
│  │  │  │  - Redirects to /login if not authenticated  │  │  │   │
│  │  │  │  - Redirects to /dashboard if unauthorized   │  │  │   │
│  │  │  └──────────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  │                                                            │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │         Navigation & UI Components                │  │   │
│  │  │  ┌──────────────────────────────────────────────┐  │  │   │
│  │  │  │  Navbar (Role-Based)                         │  │  │   │
│  │  │  │  - Shows user name & role                    │  │  │   │
│  │  │  │  - Dynamic nav links based on role           │  │  │   │
│  │  │  │  - Account dropdown menu                     │  │  │   │
│  │  │  │  - Logout functionality                      │  │  │   │
│  │  │  └──────────────────────────────────────────────┘  │  │   │
│  │  │  ┌──────────────────────────────────────────────┐  │  │   │
│  │  │  │  DashboardPage (Central Hub)                 │  │  │   │
│  │  │  │  - Displays available modules                │  │  │   │
│  │  │  │  - Filters modules by user role              │  │  │   │
│  │  │  │  - Shows user information                    │  │  │   │
│  │  │  │  - Provides quick access to all modules      │  │  │   │
│  │  │  └──────────────────────────────────────────────┘  │  │   │
│  │  │  ┌──────────────────────────────────────────────┐  │  │   │
│  │  │  │  LoginPage                                   │  │  │   │
│  │  │  │  - Email & password input                    │  │  │   │
│  │  │  │  - Calls /api/users/login                    │  │  │   │
│  │  │  │  - Stores user in AuthContext                │  │  │   │
│  │  │  │  - Redirects to /dashboard                   │  │  │   │
│  │  │  └──────────────────────────────────────────────┘  │  │   │
│  │  │  ┌──────────────────────────────────────────────┐  │  │   │
│  │  │  │  Module Pages (Protected)                    │  │  │   │
│  │  │  │  - Events, Canteen, Study Area, etc.         │  │  │   │
│  │  │  │  - All wrapped with ProtectedRoute           │  │  │   │
│  │  │  │  - Access user via useAuth() hook            │  │  │   │
│  │  │  └──────────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Local Storage (Session Persistence)              │   │
│  │  - user: { _id, name, email, role, studentId, ... }     │   │
│  │  - currentUser: (duplicate for compatibility)            │   │
│  │  - Cleared on logout                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Node.js)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Authentication Endpoints                         │   │
│  │  POST /api/users/login                                   │   │
│  │  - Validates email & password                            │   │
│  │  - Returns user object with role                         │   │
│  │  - No session/token (client-side storage)                │   │
│  │                                                           │   │
│  │  POST /api/users/register                                │   │
│  │  - Creates new user with default role                    │   │
│  │  - Returns user object                                   │   │
│  │                                                           │   │
│  │  GET /api/users/:id                                      │   │
│  │  - Returns user profile                                  │   │
│  │  - Used for profile updates                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         User Model                                       │   │
│  │  - _id: ObjectId                                         │   │
│  │  - name: String                                          │   │
│  │  - email: String (unique)                                │   │
│  │  - password: String (should be hashed)                   │   │
│  │  - studentId: String (unique)                            │   │
│  │  - role: Enum [rider, driver, admin, student]            │   │
│  │  - phone: String                                         │   │
│  │  - isActive: Boolean                                     │   │
│  │  - isVerified: Boolean                                   │   │
│  │  - createdAt, updatedAt: Timestamps                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Other Module Endpoints                           │   │
│  │  - /api/events/* (Events module)                         │   │
│  │  - /api/canteen/* (Canteen module)                       │   │
│  │  - /api/rides/* (Transport module)                       │   │
│  │  - /api/study-area/* (Study area module)                 │   │
│  │  - /api/fines/* (Fines module)                           │   │
│  │  - /api/admin/* (Admin endpoints)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB Database                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Collections:                                            │   │
│  │  - users (with role field)                               │   │
│  │  - events                                                │   │
│  │  - rides                                                 │   │
│  │  - canteen items                                         │   │
│  │  - study areas                                           │   │
│  │  - fines                                                 │   │
│  │  - etc.                                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Login Flow
```
User Input (Email, Password)
         │
         ▼
   LoginPage Component
         │
         ├─ Validate input
         │
         ▼
   POST /api/users/login
         │
         ▼
   Backend Validation
         │
         ├─ Check email exists
         ├─ Verify password
         ├─ Check account active
         │
         ▼
   Return User Object
   { _id, name, email, role, ... }
         │
         ▼
   storeAuthenticatedUser()
         │
         ├─ Save to localStorage
         ├─ Dispatch 'auth-changed' event
         │
         ▼
   AuthContext Updates
         │
         ├─ user state updated
         ├─ isAuthenticated = true
         │
         ▼
   Navigate to /dashboard
         │
         ▼
   DashboardPage Renders
         │
         ├─ Get user from AuthContext
         ├─ Filter modules by role
         ├─ Display available modules
         │
         ▼
   User Sees Dashboard
```

### Module Access Flow
```
User on Dashboard
         │
         ▼
   Click Module Card
         │
         ▼
   Navigate to Module Route
         │
         ▼
   ProtectedRoute Component
         │
         ├─ Check useAuth()
         ├─ Verify user exists
         ├─ Check role (if required)
         │
         ▼
   Route Allowed?
         │
    ┌────┴────┐
    │          │
   YES        NO
    │          │
    ▼          ▼
 Render    Redirect to
 Module    /dashboard
    │
    ▼
 Module Page
    │
    ├─ Access user via useAuth()
    ├─ Fetch module data
    ├─ Render module UI
    │
    ▼
 User Interacts
 with Module
```

### Logout Flow
```
User Clicks Account Menu
         │
         ▼
   Account Dropdown Opens
         │
         ▼
   User Clicks Logout
         │
         ▼
   handleLogout() Called
         │
         ▼
   clearAuthenticatedUser()
         │
         ├─ Remove from localStorage
         ├─ Dispatch 'auth-changed' event
         │
         ▼
   AuthContext Updates
         │
         ├─ user state = null
         ├─ isAuthenticated = false
         │
         ▼
   Navigate to /login
         │
         ▼
   LoginPage Renders
         │
         ├─ Form cleared
         ├─ Ready for new login
         │
         ▼
   User Logged Out
```

## Role-Based Module Access Matrix

```
┌──────────────────┬────────┬────────┬────────┬────────┬────────┐
│ Module           │ Admin  │ Driver │ Rider  │ Student│ Staff  │
├──────────────────┼────────┼────────┼────────┼────────┼────────┤
│ Dashboard        │   ✓    │   ✓    │   ✓    │   ✓    │   ✓    │
│ Events           │   ✓    │   ✓    │   ✓    │   ✓    │   ✓    │
│ Canteen          │   ✓    │   ✓    │   ✓    │   ✓    │   ✓    │
│ Study Area       │   ✓    │   ✓    │   ✓    │   ✓    │   ✓    │
│ My Fines         │   ✓    │   ✓    │   ✓    │   ✓    │   ✓    │
│ Transport        │   ✓    │   ✓    │   ✓    │   ✓    │   ✗    │
│ Admin Overview   │   ✓    │   ✗    │   ✗    │   ✗    │   ✗    │
│ Canteen Admin    │   ✓    │   ✗    │   ✗    │   ✗    │   ✗    │
│ Event Admin      │   ✓    │   ✗    │   ✗    │   ✗    │   ✗    │
│ Study Area Admin │   ✓    │   ✗    │   ✗    │   ✗    │   ✗    │
└──────────────────┴────────┴────────┴────────┴────────┴────────┘
```

## Component Hierarchy

```
App (with AuthProvider)
│
├─ Navbar (or Admin Topbar)
│  │
│  └─ Account Menu (uses useAuth)
│     ├─ User Name
│     ├─ User Role
│     └─ Logout Button
│
├─ Routes
│  │
│  ├─ / (HomePage)
│  │
│  ├─ /login (LoginPage)
│  │  └─ Uses storeAuthenticatedUser()
│  │
│  ├─ /register (RegisterPage)
│  │
│  ├─ /dashboard (ProtectedRoute)
│  │  └─ DashboardPage
│  │     ├─ Uses useAuth()
│  │     ├─ Module Cards
│  │     └─ User Info Display
│  │
│  ├─ /events (EventsPage)
│  │  └─ ProtectedRoute
│  │
│  ├─ /canteen (CanteenPage)
│  │  └─ ProtectedRoute
│  │
│  ├─ /study-area (StudyAreaPage)
│  │  └─ ProtectedRoute
│  │
│  ├─ /student-fines (StudentFinesPage)
│  │  └─ ProtectedRoute
│  │
│  ├─ /rider-dashboard (RiderDashboardPage)
│  │  └─ ProtectedRoute
│  │
│  ├─ /driver-dashboard (DriverDashboardPage)
│  │  └─ ProtectedRoute
│  │
│  ├─ /admin (AdminPage)
│  │  └─ ProtectedRoute (requiredRole="admin")
│  │
│  ├─ /admin-canteen (CanteenAdminPage)
│  │  └─ ProtectedRoute (requiredRole="admin")
│  │
│  ├─ /admin-events (AdminEventsPage)
│  │  └─ ProtectedRoute (requiredRole="admin")
│  │
│  ├─ /admin-study-area (AdminStudyAreaPage)
│  │  └─ ProtectedRoute (requiredRole="admin")
│  │
│  └─ * (NotFoundPage)
│
└─ Footer
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AuthContext                              │
│                                                              │
│  State:                                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ user: {                                              │   │
│  │   _id: string                                        │   │
│  │   name: string                                       │   │
│  │   email: string                                      │   │
│  │   role: 'admin' | 'driver' | 'rider' | 'student'    │   │
│  │   studentId: string                                  │   │
│  │   phone: string                                      │   │
│  │   isVerified: boolean                                │   │
│  │   ... other fields                                   │   │
│  │ } | null                                             │   │
│  │                                                       │   │
│  │ loading: boolean                                     │   │
│  │ isAuthenticated: boolean                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Methods:                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ login(userData)                                      │   │
│  │ - Stores user in localStorage                        │   │
│  │ - Updates user state                                 │   │
│  │ - Dispatches 'auth-changed' event                    │   │
│  │                                                       │   │
│  │ logout()                                             │   │
│  │ - Clears localStorage                                │   │
│  │ - Sets user to null                                  │   │
│  │ - Dispatches 'auth-changed' event                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Effects:                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ On Mount:                                            │   │
│  │ - Load user from localStorage                        │   │
│  │ - Listen for 'auth-changed' events                   │   │
│  │ - Update state when auth changes                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │
         │ Provides via useAuth()
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Components Using useAuth()                      │
│                                                              │
│  - Navbar (display user info)                               │
│  - DashboardPage (filter modules)                            │
│  - ProtectedRoute (check authentication)                     │
│  - Any module page (access user data)                        │
└─────────────────────────────────────────────────────────────┘
```

## Security Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                  Security Layers                             │
│                                                              │
│  1. Frontend Validation                                      │
│     ├─ Email format validation                               │
│     ├─ Password strength validation                          │
│     └─ Form input sanitization                               │
│                                                              │
│  2. API Communication                                        │
│     ├─ HTTPS only (in production)                            │
│     ├─ CORS configuration                                    │
│     └─ Request validation                                    │
│                                                              │
│  3. Backend Validation                                       │
│     ├─ Email/password verification                           │
│     ├─ Account status check                                  │
│     └─ Role verification                                     │
│                                                              │
│  4. Session Management                                       │
│     ├─ localStorage for client-side storage                  │
│     ├─ Event-based state synchronization                     │
│     └─ Logout clears all data                                │
│                                                              │
│  5. Route Protection                                         │
│     ├─ ProtectedRoute checks authentication                  │
│     ├─ Role-based access control                             │
│     └─ Unauthorized redirects to dashboard                   │
│                                                              │
│  6. Future Enhancements                                      │
│     ├─ JWT tokens (replace localStorage)                     │
│     ├─ Refresh tokens                                        │
│     ├─ Session timeout                                       │
│     ├─ Two-factor authentication                             │
│     └─ Audit logging                                         │
└─────────────────────────────────────────────────────────────┘
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────┐
│              Performance Optimizations                       │
│                                                              │
│  1. Lazy Loading                                             │
│     ├─ Module pages loaded on demand                         │
│     ├─ Admin pages only loaded for admins                    │
│     └─ Reduces initial bundle size                           │
│                                                              │
│  2. Caching                                                  │
│     ├─ User data cached in localStorage                      │
│     ├─ Reduces API calls on page refresh                     │
│     └─ Improves perceived performance                        │
│                                                              │
│  3. State Management                                         │
│     ├─ AuthContext prevents prop drilling                    │
│     ├─ useAuth() hook for easy access                        │
│     └─ Minimal re-renders                                    │
│                                                              │
│  4. Route Optimization                                       │
│     ├─ Protected routes prevent unnecessary renders          │
│     ├─ Early redirects save processing                       │
│     └─ Role-based filtering reduces DOM elements             │
│                                                              │
│  5. CSS Optimization                                         │
│     ├─ Separate CSS files for modules                        │
│     ├─ CSS Grid for responsive layout                        │
│     └─ Minimal animations for performance                    │
└─────────────────────────────────────────────────────────────┘
```

---

**Last Updated**: April 23, 2026
**Version**: 1.0.0
