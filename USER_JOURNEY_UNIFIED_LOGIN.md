# User Journey - Unified Login System

## 📍 Complete User Journey Map

### 1. New User Registration Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    New User Arrives                          │
│                   (Home Page - /)                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Clicks "Register" Button                        │
│                  (Navbar - Top Right)                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Registration Page (/register)                   │
│                                                              │
│  Fills in:                                                   │
│  - Name                                                      │
│  - Student ID                                                │
│  - Email                                                     │
│  - Password                                                  │
│  - Phone                                                     │
│  - Security Question & Answer                               │
│  - Role (optional, defaults to 'rider')                      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Submits Registration Form                       │
│                                                              │
│  Backend:                                                    │
│  - Validates input                                           │
│  - Checks for duplicates                                     │
│  - Creates user in database                                  │
│  - Returns user object                                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Account Created Successfully                    │
│                                                              │
│  User can now:                                               │
│  - Log in with credentials                                   │
│  - Access all modules                                        │
│  - View dashboard                                            │
└─────────────────────────────────────────────────────────────┘
```

### 2. Existing User Login Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    User Arrives                              │
│                   (Home Page - /)                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Clicks "Login" Button                           │
│                  (Navbar - Top Right)                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                Login Page (/login)                           │
│                                                              │
│  Sees:                                                       │
│  - Email input field                                         │
│  - Password input field                                      │
│  - "Remember me" checkbox                                    │
│  - "Forgot password?" link                                   │
│  - "Register" link                                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Enters Credentials                              │
│                                                              │
│  User enters:                                                │
│  - Email: student@sliit.lk                                   │
│  - Password: ••••••••                                        │
│  - Optionally checks "Remember me"                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Clicks "Login" Button                           │
│                                                              │
│  Frontend:                                                   │
│  - Validates input                                           │
│  - Shows loading state                                       │
│  - Sends POST /api/users/login                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Validates                               │
│                                                              │
│  Backend:                                                    │
│  - Finds user by email                                       │
│  - Verifies password                                         │
│  - Checks account active                                     │
│  - Returns user object with role                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Login Successful                                │
│                                                              │
│  Frontend:                                                   │
│  - Stores user in localStorage                               │
│  - Updates AuthContext                                       │
│  - Shows success message                                     │
│  - Redirects to /dashboard                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Dashboard Page (/dashboard)                     │
│                                                              │
│  User sees:                                                  │
│  - Welcome message with name                                 │
│  - Available modules based on role                           │
│  - Account information                                       │
│  - Module cards with descriptions                            │
└─────────────────────────────────────────────────────────────┘
```

### 3. Module Access Journey

```
┌─────────────────────────────────────────────────────────────┐
│              User on Dashboard                               │
│                                                              │
│  Sees modules:                                               │
│  - 🎉 Events & Community                                     │
│  - 🍽️ Canteen Services                                      │
│  - 📚 Study Area                                             │
│  - ⚠️ My Fines                                               │
│  - 🚗 Transport (if applicable)                              │
│  - ⚙️ Admin Panels (if admin)                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Clicks Module Card                              │
│                                                              │
│  Example: Clicks "Events & Community"                        │
│  - Card shows hover effect                                   │
│  - User clicks on card                                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Navigates to Module                             │
│                                                              │
│  Frontend:                                                   │
│  - Checks authentication (ProtectedRoute)                    │
│  - Verifies user role (if required)                          │
│  - Loads module page                                         │
│  - Updates navbar                                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Module Page Loads (/events)                     │
│                                                              │
│  User sees:                                                  │
│  - Module content                                            │
│  - Navbar with current page highlighted                      │
│  - Account menu still available                              │
│  - No need to log in again                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              User Interacts with Module                      │
│                                                              │
│  User can:                                                   │
│  - Browse events                                             │
│  - Book events                                               │
│  - View details                                              │
│  - Perform module-specific actions                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Switch to Another Module                        │
│                                                              │
│  User can:                                                   │
│  - Click navbar link (e.g., "Canteen")                       │
│  - Click account menu option                                 │
│  - Go back to dashboard                                      │
│  - No need to log in again                                   │
└─────────────────────────────────────────────────────────────┘
```

### 4. Logout Journey

```
┌─────────────────────────────────────────────────────────────┐
│              User on Any Page                                │
│                                                              │
│  User is logged in and can see:                              │
│  - Navbar with user name                                     │
│  - Account menu button                                       │
│  - All modules accessible                                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Clicks Account Menu                             │
│                                                              │
│  Navbar (Top Right):                                         │
│  - Shows user avatar (👤)                                    │
│  - Shows first name                                          │
│  - Shows dropdown arrow (▾)                                  │
│  - User clicks to open menu                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Account Dropdown Opens                          │
│                                                              │
│  Dropdown shows:                                             │
│  - User name (bold)                                          │
│  - User role (small text)                                    │
│  - Divider line                                              │
│  - Role-specific options                                     │
│  - Messages link                                             │
│  - Divider line                                              │
│  - 🚪 Logout button (red)                                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Clicks "Logout" Button                          │
│                                                              │
│  User clicks red "Logout" button                             │
│  - Dropdown closes                                           │
│  - handleLogout() function called                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Session Cleared                                 │
│                                                              │
│  Frontend:                                                   │
│  - Calls clearAuthenticatedUser()                            │
│  - Removes user from localStorage                            │
│  - Dispatches 'auth-changed' event                           │
│  - Updates AuthContext (user = null)                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Redirected to Login Page                        │
│                                                              │
│  Frontend:                                                   │
│  - Navigates to /login                                       │
│  - Shows login form                                          │
│  - Form is empty                                             │
│  - Ready for new login                                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              User Logged Out                                 │
│                                                              │
│  User can:                                                   │
│  - Log in again                                              │
│  - Register new account                                      │
│  - Browse public pages                                       │
│  - Cannot access protected pages                             │
└─────────────────────────────────────────────────────────────┘
```

### 5. Admin User Journey

```
┌─────────────────────────────────────────────────────────────┐
│              Admin User Logs In                              │
│                                                              │
│  Admin enters credentials:                                   │
│  - Email: admin@sliit.lk                                     │
│  - Password: admin123                                        │
│  - Role in database: "admin"                                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Redirected to Dashboard                         │
│                                                              │
│  Dashboard shows:                                            │
│  - All user modules                                          │
│  - ⚙️ Admin Overview                                         │
│  - 🍳 Canteen Management                                     │
│  - 📋 Event Management                                       │
│  - 🏢 Study Area Management                                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Admin Clicks Admin Panel                        │
│                                                              │
│  Admin can click:                                            │
│  - Admin Overview card                                       │
│  - Or use navbar dropdown                                    │
│  - Or use admin topbar                                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Admin Panel Loads (/admin)                      │
│                                                              │
│  Admin sees:                                                 │
│  - Admin topbar (instead of navbar)                          │
│  - Admin navigation links                                    │
│  - System overview                                           │
│  - User management                                           │
│  - Statistics                                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Admin Manages System                            │
│                                                              │
│  Admin can:                                                  │
│  - View all users                                            │
│  - Manage events                                             │
│  - Manage canteen                                            │
│  - Manage study areas                                        │
│  - View statistics                                           │
│  - Configure settings                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Admin Switches to User Module                   │
│                                                              │
│  Admin can:                                                  │
│  - Click navbar link (e.g., "Events")                        │
│  - Go back to dashboard                                      │
│  - Access any module                                         │
│  - Still has admin access                                    │
└─────────────────────────────────────────────────────────────┘
```

### 6. Driver User Journey

```
┌─────────────────────────────────────────────────────────────┐
│              Driver User Logs In                             │
│                                                              │
│  Driver enters credentials:                                  │
│  - Email: driver@sliit.lk                                    │
│  - Password: driver123                                       │
│  - Role in database: "driver"                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Redirected to Dashboard                         │
│                                                              │
│  Dashboard shows:                                            │
│  - 🎉 Events & Community                                     │
│  - 🍽️ Canteen Services                                      │
│  - 📚 Study Area                                             │
│  - ⚠️ My Fines                                               │
│  - 🚗 Transport (Driver Dashboard)                           │
│  - No admin panels                                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Driver Clicks Transport                         │
│                                                              │
│  Driver can:                                                 │
│  - Click Transport card                                      │
│  - Or use navbar dropdown                                    │
│  - Or use navbar link                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Driver Dashboard Loads                          │
│                                                              │
│  Driver sees:                                                │
│  - My Rides section                                          │
│  - Ride history                                              │
│  - Earnings                                                  │
│  - Driver settings                                           │
│  - Ride requests                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Driver Manages Rides                            │
│                                                              │
│  Driver can:                                                 │
│  - Accept ride requests                                      │
│  - View ride details                                         │
│  - Track passengers                                          │
│  - Complete rides                                            │
│  - View earnings                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7. Student User Journey

```
┌─────────────────────────────────────────────────────────────┐
│              Student User Logs In                            │
│                                                              │
│  Student enters credentials:                                 │
│  - Email: student@sliit.lk                                   │
│  - Password: student123                                      │
│  - Role in database: "student"                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Redirected to Dashboard                         │
│                                                              │
│  Dashboard shows:                                            │
│  - 🎉 Events & Community                                     │
│  - 🍽️ Canteen Services                                      │
│  - 📚 Study Area                                             │
│  - ⚠️ My Fines                                               │
│  - 🚗 Transport (if rider)                                   │
│  - No admin panels                                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Student Explores Modules                        │
│                                                              │
│  Student can:                                                │
│  - Browse events                                             │
│  - Order food from canteen                                   │
│  - Book study areas                                          │
│  - View fines                                                │
│  - Book rides (if rider)                                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Student Uses Multiple Modules                   │
│                                                              │
│  Student can:                                                │
│  - Switch between modules                                    │
│  - No need to log in again                                   │
│  - Session persists                                          │
│  - All data accessible                                       │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Journey Points

### Entry Points
1. **Home Page** → Click "Login" or "Register"
2. **Direct URL** → `/login` or `/register`
3. **Existing Session** → Redirected to `/dashboard`

### Decision Points
1. **New User?** → Register → Login → Dashboard
2. **Existing User?** → Login → Dashboard
3. **Forgot Password?** → Reset → Login → Dashboard
4. **Admin User?** → Dashboard shows admin panels
5. **Driver User?** → Dashboard shows driver dashboard

### Exit Points
1. **Logout** → Redirected to `/login`
2. **Session Timeout** → Redirected to `/login` (future)
3. **Browser Close** → Session cleared (optional)

## 📊 User Flow Statistics

| Journey | Steps | Time | Modules |
|---------|-------|------|---------|
| Registration | 7 | 5-10 min | N/A |
| Login | 5 | 30 sec | All |
| Module Access | 3 | 5 sec | 1 |
| Switch Module | 2 | 2 sec | 1 |
| Logout | 3 | 5 sec | N/A |

## 🎨 Visual States

### Login Page States
- [ ] Empty form
- [ ] Filled form
- [ ] Loading state
- [ ] Success state
- [ ] Error state
- [ ] Password reset state

### Dashboard States
- [ ] Loading state
- [ ] Loaded state
- [ ] Empty state (no modules)
- [ ] Error state

### Module States
- [ ] Loading state
- [ ] Loaded state
- [ ] Empty state (no data)
- [ ] Error state

### Navigation States
- [ ] Logged out (Login/Register buttons)
- [ ] Logged in (User menu)
- [ ] Mobile menu open
- [ ] Mobile menu closed

## 🔄 Session States

| State | User | Session | Modules | Navigation |
|-------|------|---------|---------|------------|
| Not Logged In | null | None | Blocked | Login/Register |
| Logging In | Loading | Creating | Blocked | Loading |
| Logged In | User | Active | Accessible | User Menu |
| Logging Out | User | Clearing | Blocked | Loading |
| Logged Out | null | None | Blocked | Login/Register |

---

**Version**: 1.0.0
**Last Updated**: April 23, 2026
**Status**: ✅ Complete
