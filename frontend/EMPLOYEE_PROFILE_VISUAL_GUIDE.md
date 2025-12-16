# Employee Profile Frontend - Visual Architecture Guide

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Login                           │
│              (Stores role in AuthContext)                    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    useRole() & useCanAccess()               │
│              (Check permissions based on role)               │
└────────────────────────────┬────────────────────────────────┘
                             │
                 ┌───────────┼───────────┐
                 ↓           ↓           ↓
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │  RoleChecks  │ │  Permission  │ │  Access      │
        │              │ │  Groups      │ │  Levels      │
        └──────────────┘ └──────────────┘ └──────────────┘
                 │
                 ↓
        ┌──────────────────────────────┐
        │  Component Rendering Logic   │
        │  (RoleBasedAccess Wrapper)   │
        └────────────┬─────────────────┘
                     │
        ┌────────────┴──────────────┐
        ↓                           ↓
   ┌─────────────┐        ┌────────────────┐
   │ Authorized  │        │ Unauthorized   │
   │ (Show)      │        │ (Hide/Fallback)│
   └─────────────┘        └────────────────┘
```

## 👥 Role Hierarchy

```
                    All Authenticated Users
                            │
                ┌───────────┬┴┬───────────┐
                │           │ │           │
                ↓           ↓ ↓           ↓
            ┌─────────┐  ┌──────┐  ┌──────────┐
            │EMPLOYEES│  │MANGER│  │ HR/ADMIN │
            └─────────┘  └──────┘  └──────────┘
                │           │           │
        Self-Service   +Manager   +Employee
        Features       Features   Management
                │           │           │
                └───────────┴───────────┘
                        │
                    ↓   ↓   ↓
                Features Available
```

## 📊 Role-Permission Matrix

```
┌─────────────────────┬──────────┬─────────┬──────────┐
│ Feature             │ Employee │ Manager │ HR/Admin │
├─────────────────────┼──────────┼─────────┼──────────┤
│ View My Profile     │    ✓     │    ✓    │    ✓     │
│ Update Contact      │    ✓     │    ✓    │    ✓     │
│ Upload Picture      │    ✓     │    ✓    │    ✓     │
│ Request Changes     │    ✓     │    ✓    │    ✓     │
├─────────────────────┼──────────┼─────────┼──────────┤
│ View Team           │    ✗     │    ✓    │    ✓     │
│ Team Summary        │    ✗     │    ✓    │    ✓     │
├─────────────────────┼──────────┼─────────┼──────────┤
│ Search Employees    │    ✗     │    ✗    │    ✓     │
│ View Details        │    ✗     │    ✗    │    ✓     │
│ Edit Employee       │    ✗     │    ✗    │    ✓     │
│ Assign Roles        │    ✗     │    ✗    │    ✓     │
│ Review Changes      │    ✗     │    ✓    │    ✓     │
│ Deactivate          │    ✗     │    ✗    │    ✓     │
└─────────────────────┴──────────┴─────────┴──────────┘
```

## 🎯 Component Dependency Tree

```
Main Dashboard
├── SelfService Section
│   ├── SelfServiceContactInfo
│   │   └── useCanAccess() → canUpdateMyContact
│   ├── SelfServiceProfilePicture
│   │   └── useCanAccess() → canUploadProfilePicture
│   └── SelfServiceChangeRequests
│       └── useCanAccess() → canRequestDataCorrection
├── Manager Section
│   └── ManagerTeamView
│       ├── useCanAccess() → canViewTeamMembers
│       └── useCanAccess() → canViewTeamSummary
└── HR/Admin Section
    ├── HREmployeeSearch
    │   └── useCanAccess() → canSearchEmployees
    ├── HRChangeRequestReview
    │   ├── useCanAccess() → canListChangeRequests
    │   └── useCanAccess() → canReviewChangeRequests
    └── HRRoleAssignment
        └── useCanAccess() → canAssignRoles
```

## 🔄 Data Flow Diagram

```
┌─────────────┐
│ User Login  │
└──────┬──────┘
       │
       ↓ (with role)
┌──────────────────────────┐
│  AuthContext.login()     │
│  Stores: user, role      │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│  Component Mounts        │
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│  Call useCanAccess()             │
│  Check: user.role against rules  │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────┐
│ RoleBasedAccess Wrapper  │
│ Decide: Show/Hide        │
└──────┬───────────────────┘
       │
   ┌───┴────┐
   ↓        ↓
┌────────┐ ┌──────────────┐
│ Show   │ │ Hide/Fallback│
│ Content│ │ or Message   │
└────────┘ └──────────────┘
   │             │
   ↓             ↓
┌──────────────────────────┐
│ API Calls (if auth)      │
│ Render Features          │
└──────────────────────────┘
```

## 📁 File Organization

```
frontend/
│
├── app/
│   ├── hooks/
│   │   └── useRole.ts ........................ Authorization logic
│   │
│   ├── components/
│   │   ├── Auth/
│   │   │   └── RoleBasedAccess.tsx ........ RBAC wrappers
│   │   │
│   │   └── EmployeeProfile/
│   │       ├── SelfService/
│   │       │   ├── SelfServiceContactInfo.tsx
│   │       │   ├── SelfServiceProfilePicture.tsx
│   │       │   └── SelfServiceChangeRequests.tsx
│   │       ├── Manager/
│   │       │   └── ManagerTeamView.tsx
│   │       ├── HR/
│   │       │   ├── HREmployeeSearch.tsx
│   │       │   ├── HRChangeRequestReview.tsx
│   │       │   └── HRRoleAssignment.tsx
│   │       └── index.ts ................... Export all
│   │
│   └── dashboard/
│       └── employee-profile/
│           ├── page.tsx ................... Main dashboard
│           ├── my-contact/page.tsx
│           ├── profile-picture/page.tsx
│           ├── change-requests/page.tsx
│           ├── team/page.tsx
│           ├── search/page.tsx
│           └── review-requests/page.tsx
│
└── DOCUMENTATION FILES
    ├── EMPLOYEE_PROFILE_FRONTEND_DOCS.md
    ├── EMPLOYEE_PROFILE_IMPLEMENTATION_SUMMARY.md
    ├── EMPLOYEE_PROFILE_QUICK_REFERENCE.md
    └── FILES_CREATED_LIST.md
```

## 🎨 UI Flow - Employee Journey

```
User Logs In as DEPARTMENT_EMPLOYEE
        ↓
   Go to /dashboard/employee-profile
        ↓
   ┌────────────────────────────────┐
   │   MAIN DASHBOARD (visible)     │
   ├────────────────────────────────┤
   │ ✓ My Profile Section           │
   │   ├── Contact Info             │
   │   ├── Profile Picture          │
   │   └── Change Requests          │
   │                                │
   │ ✗ Team Management Section      │ (hidden)
   │ ✗ HR Administration Section    │ (hidden)
   └────────────────────────────────┘
        ↓
   User clicks "Update Contact"
        ↓
   /dashboard/employee-profile/my-contact
        ↓
   ┌────────────────────────────────┐
   │ Contact Info Page              │
   ├────────────────────────────────┤
   │ Phone: [___________]           │
   │ Address: [_________]           │
   │ Email: [___________]           │
   │ [Save] [Cancel]                │
   └────────────────────────────────┘
        ↓
   Click Save → API Call
        ↓
   Update successful → Back to dashboard
```

## 🎨 UI Flow - Manager Journey

```
User Logs In as DEPARTMENT_HEAD
        ↓
   Go to /dashboard/employee-profile
        ↓
   ┌────────────────────────────────┐
   │   MAIN DASHBOARD (visible)     │
   ├────────────────────────────────┤
   │ ✓ My Profile Section           │
   │ ✓ Team Management Section      │
   │   ├── Team Members Table       │
   │   └── Summary Stats            │
   │ ✗ HR Administration Section    │ (hidden)
   └────────────────────────────────┘
        ↓
   User clicks "Team Management"
        ↓
   /dashboard/employee-profile/team
        ↓
   ┌────────────────────────────────┐
   │ Team View Page                 │
   ├────────────────────────────────┤
   │ [Members] [Summary]            │
   │ ┌──────────────────────────┐   │
   │ │ Name  | Position | Dept  │   │
   │ ├──────────────────────────┤   │
   │ │ John  | Developer| IT    │   │
   │ │ Jane  | Designer | Design│   │
   │ └──────────────────────────┘   │
   └────────────────────────────────┘
```

## 🎨 UI Flow - HR Admin Journey

```
User Logs In as HR_ADMIN
        ↓
   Go to /dashboard/employee-profile
        ↓
   ┌────────────────────────────────┐
   │   MAIN DASHBOARD (visible)     │
   ├────────────────────────────────┤
   │ ✓ My Profile Section           │
   │ ✓ Team Management Section      │
   │ ✓ HR Administration Section    │
   │   ├── Employee Search          │
   │   └── Change Request Review    │
   └────────────────────────────────┘
        ↓
   User clicks "Employee Search"
        ↓
   /dashboard/employee-profile/search
        ↓
   ┌────────────────────────────────┐
   │ Employee Search Page           │
   ├────────────────────────────────┤
   │ [Search] [Dept Filter]         │
   │ [Status Filter] [Search Btn]   │
   │ ┌──────────────────────────┐   │
   │ │ Name | Email | Dept|Pos  │   │
   │ ├──────────────────────────┤   │
   │ │ ... | ...   | ...  | ... │   │
   │ └──────────────────────────┘   │
   │ [Edit] [Roles] [Deactivate]    │
   └────────────────────────────────┘
```

## 🔐 Authorization Check Flow

```
┌─────────────────────────────────┐
│ Component Renders               │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│ <RoleBasedAccess>               │
│  requiredAccess={canViewTeam}   │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│ Call: useCanAccess()            │
│ Get: canViewTeam function       │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│ Call: useRole()                 │
│ Get: user.role                  │
└────────────┬────────────────────┘
             │
             ↓
┌─────────────────────────────────┐
│ Check: MANAGERS.includes(role)  │
│ Result: true/false              │
└────────────┬────────────────────┘
             │
        ┌────┴────┐
        │          │
        ↓          ↓
    ┌────────┐ ┌──────────┐
    │ true   │ │ false    │
    ├────────┤ ├──────────┤
    │ Render │ │ Fallback │
    │Content │ │ or Hide  │
    └────────┘ └──────────┘
```

## 📊 API Integration Points

```
┌──────────────────────────────────────────────┐
│       FRONTEND COMPONENT                     │
└────────────────┬─────────────────────────────┘
                 │
    ┌────────────┼────────────┬─────────────┐
    ↓            ↓            ↓             ↓
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│  GET   │  │ PATCH  │  │  POST  │  │  PUT   │
├────────┤  ├────────┤  ├────────┤  ├────────┤
│/me     │  │/me/c.. │  │/pic    │  │/:id    │
│/my-tm  │  │/:id/r..│  │/change │  └────────┘
│/searchs│  │/:id/d..│  │/req    │
│/chngs  │  └────────┘  └────────┘
└────────┘
    │
    └────────────────┬─────────────────────┐
                     ↓                     ↓
            ┌──────────────────┐  ┌──────────────┐
            │ BACKEND API      │  │ MongoDB      │
            │ (NestJS)         │  │ Database     │
            └──────────────────┘  └──────────────┘
```

## 🎯 Feature Availability Chart

```
DEPARTMENT_EMPLOYEE
├── Self Service
│   ├── ✓ View Profile
│   ├── ✓ Update Contact
│   ├── ✓ Upload Picture
│   └── ✓ Request Change
└── Others
    └── ✗ (All blocked)

DEPARTMENT_HEAD
├── Self Service (All)
├── Manager
│   ├── ✓ View Team
│   ├── ✓ Team Summary
│   └── ✓ Review Changes
└── HR Admin (Blocked)

HR_ADMIN
├── Self Service (All)
├── Manager (All)
└── HR Admin
    ├── ✓ Search Employees
    ├── ✓ Edit Employee
    ├── ✓ Assign Roles
    ├── ✓ View Details
    ├── ✓ Deactivate
    └── ✓ Review Changes

SYSTEM_ADMIN
└── ALL FEATURES AVAILABLE
```

---

**Created:** December 13, 2025
**Version:** 1.0
