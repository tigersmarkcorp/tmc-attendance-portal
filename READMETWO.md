# Workforce Management System API Documentation

## Overview

This document provides comprehensive API documentation for connecting your mobile app to the Workforce Management System backend.

**Backend:** Lovable Cloud (Supabase)  
**Project ID:** 36084af0-46d9-4244-85a7-f221bf58a092  
**Supabase URL:** https://xxywxhfalqzcttlwrkwg.supabase.co  
**Auth Type:** JWT-based with Row Level Security (RLS)

---

## Authentication

### Sign Up
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe',
      role: 'employee' // admin | employee | site_admin_officer | encoder
    }
  }
});
```

### Sign In
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword'
});
```

### Get Current Session
```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

### Sign Out
```javascript
await supabase.auth.signOut();
```

### Role-Based Access
After login, check user role:
```javascript
const { data: roles } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .single();
```

**Roles:** `admin`, `employee`, `site_admin_officer`, `encoder`

---

## Database Tables & APIs

### 1. Employees Table

**Purpose:** Store employee records and personal information

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| employee_id | text | No | Unique employee code |
| email | text | No | Employee email |
| first_name | text | No | First name |
| last_name | text | No | Last name |
| phone | text | Yes | Contact number |
| department | text | Yes | Department name |
| position | text | Yes | Job position |
| sex | text | Yes | Gender |
| date_of_birth | date | Yes | Birth date |
| age | integer | Yes | Calculated age |
| civil_status | text | Yes | Marital status |
| citizenship | text | Yes | Nationality |
| city_address | text | Yes | City address |
| provincial_address | text | Yes | Provincial address |
| emergency_contact_name | text | Yes | Emergency contact |
| emergency_contact_phone | text | Yes | Emergency phone |
| sss_number | text | Yes | SSS ID |
| tin_id | text | Yes | TIN ID |
| pagibig_id | text | Yes | Pag-IBIG ID |
| philhealth_id | text | Yes | PhilHealth ID |
| nbi_id | text | Yes | NBI Clearance ID |
| hourly_rate | numeric | No | Hourly wage (default: 0) |
| hire_date | date | No | Employment start date |
| photo_url | text | Yes | Profile photo URL |
| assigned_location_id | uuid | Yes | Assigned work location |
| status | enum | No | active/inactive/on_leave |
| user_id | uuid | Yes | Link to auth user |
| created_at | timestamp | No | Creation time |
| updated_at | timestamp | No | Last update |

**RLS Policies:**
- Admins: Full access to all employees
- Employees: Can only view their own record
- Encoders: Can insert/update/view all employees

**API Examples:**
```javascript
// Get all employees (admin/encoder only)
const { data, error } = await supabase
  .from('employees')
  .select('*')
  .eq('status', 'active');

// Get my employee record
const { data, error } = await supabase
  .from('employees')
  .select('*')
  .eq('user_id', currentUserId)
  .single();

// Create new employee
const { data, error } = await supabase
  .from('employees')
  .insert({
    employee_id: 'EMP001',
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe',
    department: 'IT',
    position: 'Developer',
    hourly_rate: 250.00,
    sss_number: '1234567890',
    tin_id: '123-456-789',
    pagibig_id: '1234-5678-9012',
    philhealth_id: '12-345678901-2',
    nbi_id: 'NBI-2024-123456'
  })
  .select()
  .single();

// Update employee
const { error } = await supabase
  .from('employees')
  .update({
    phone: '09123456789',
    sss_number: '0987654321'
  })
  .eq('id', employeeId);
```

---

### 2. Workers Table

**Purpose:** Store worker records (managed by SAOs)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| worker_id | text | No | Unique worker code |
| first_name | text | No | First name |
| last_name | text | No | Last name |
| email | text | Yes | Email address |
| phone | text | Yes | Contact number |
| sex | text | Yes | Gender |
| date_of_birth | date | Yes | Birth date |
| civil_status | text | Yes | Marital status |
| city_address | text | Yes | City address |
| provincial_address | text | Yes | Provincial address |
| emergency_contact_name | text | Yes | Emergency contact |
| emergency_contact_phone | text | Yes | Emergency phone |
| position | text | Yes | Job position |
| department | text | Yes | Department |
| employee_type | text | Yes | Employment type |
| hourly_rate | numeric | Yes | Hourly wage |
| assigned_sao_id | uuid | Yes | Assigned Site Admin Officer |
| assigned_location_id | uuid | Yes | Assigned work location |
| sss_number | text | Yes | SSS ID |
| tin_id | text | Yes | TIN ID |
| pagibig_id | text | Yes | Pag-IBIG ID |
| philhealth_id | text | Yes | PhilHealth ID |
| nbi_id | text | Yes | NBI Clearance ID |
| status | text | No | active/inactive |
| photo_url | text | Yes | Profile photo URL |
| created_at | timestamp | No | Creation time |
| updated_at | timestamp | No | Last update |

**RLS Policies:**
- Admins: Full access
- Encoders: Can insert/update/view
- SAOs: Can only view their assigned workers

**API Examples:**
```javascript
// Get workers assigned to SAO
const { data } = await supabase
  .from('workers')
  .select('*')
  .eq('assigned_sao_id', saoEmployeeId);

// Create worker
const { data } = await supabase
  .from('workers')
  .insert({
    worker_id: 'WRK001',
    first_name: 'Jane',
    last_name: 'Smith',
    assigned_sao_id: saoId,
    hourly_rate: 200.00
  })
  .select()
  .single();
```

---

### 3. Time Entries Table

**Purpose:** Clock in/out records for employees

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| employee_id | uuid | No | Employee reference |
| entry_type | enum | No | clock_in/break_start/break_end/clock_out |
| timestamp | timestamp | No | Entry time (PST/UTC+8) |
| selfie_url | text | Yes | Verification photo URL |
| location | text | Yes | GPS coordinates |
| notes | text | Yes | Additional notes |
| created_at | timestamp | No | Creation time |

**RLS Policies:**
- Admins: Full access
- Employees: Can only insert/view their own entries
- SAOs: Can only insert/view their own entries

**API Examples:**
```javascript
// Clock In
const { data } = await supabase
  .from('time_entries')
  .insert({
    employee_id: employeeId,
    entry_type: 'clock_in',
    timestamp: new Date().toISOString(),
    selfie_url: 'https://...selfie.jpg',
    location: '14.5995,120.9842',
    notes: 'Started shift'
  })
  .select()
  .single();

// Get today's time entries for employee
const today = new Date().toISOString().split('T')[0];
const { data } = await supabase
  .from('time_entries')
  .select('*')
  .eq('employee_id', employeeId)
  .gte('timestamp', today)
  .order('timestamp', { ascending: true });

// Get last entry (to determine if clocked in)
const { data } = await supabase
  .from('time_entries')
  .select('*')
  .eq('employee_id', employeeId)
  .order('timestamp', { ascending: false })
  .limit(1)
  .single();

const isClockedIn = data?.entry_type === 'clock_in' || data?.entry_type === 'break_end';
```

---

### 4. Worker Time Entries Table

**Purpose:** Clock in/out records for workers (recorded by SAOs)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| worker_id | uuid | No | Worker reference |
| recorded_by | uuid | No | SAO who recorded |
| entry_type | text | No | clock_in/clock_out |
| timestamp | timestamp | No | Entry time |
| selfie_url | text | Yes | Verification photo |
| location | text | Yes | GPS coordinates |
| notes | text | Yes | Additional notes |
| created_at | timestamp | No | Creation time |

**RLS Policies:**
- Admins: Full access
- SAOs: Can only manage time entries for their assigned workers

**API Examples:**
```javascript
// Clock in worker
const { data } = await supabase
  .from('worker_time_entries')
  .insert({
    worker_id: workerId,
    recorded_by: saoEmployeeId,
    entry_type: 'clock_in',
    timestamp: new Date().toISOString(),
    selfie_url: 'https://...selfie.jpg',
    location: '14.5995,120.9842'
  })
  .select()
  .single();
```

---

### 5. Timesheets Table

**Purpose:** Daily work summary with payroll calculations

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| employee_id | uuid | No | Employee reference |
| date | date | No | Work date |
| clock_in_time | timestamp | Yes | First clock in |
| clock_out_time | timestamp | Yes | Last clock out |
| total_work_minutes | integer | Yes | Total minutes worked |
| total_break_minutes | integer | Yes | Total break time |
| regular_hours | numeric | Yes | Regular hours (max 8) |
| overtime_hours | numeric | Yes | OT hours (8-12 hrs) |
| double_overtime_hours | numeric | Yes | Double OT (12+ hrs) |
| hourly_rate | numeric | Yes | Rate at time of work |
| regular_pay | numeric | Yes | Regular pay amount |
| overtime_pay | numeric | Yes | OT pay amount |
| status | text | Yes | pending/approved |
| approved_by | uuid | Yes | Approver ID |
| approved_at | timestamp | Yes | Approval timestamp |
| created_at | timestamp | No | Creation time |
| updated_at | timestamp | No | Last update |

**RLS Policies:**
- Admins: Full access
- Employees: Can only view their own timesheets
- SAOs: Can only view their own timesheets

**API Examples:**
```javascript
// Get timesheets for date range
const { data } = await supabase
  .from('timesheets')
  .select('*')
  .eq('employee_id', employeeId)
  .gte('date', '2024-01-01')
  .lte('date', '2024-01-31')
  .order('date', { ascending: false });

// Get today's timesheet
const today = new Date().toISOString().split('T')[0];
const { data } = await supabase
  .from('timesheets')
  .select('*')
  .eq('employee_id', employeeId)
  .eq('date', today)
  .single();
```

---

### 6. Worker Timesheets Table

**Purpose:** Daily work summary for workers

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| worker_id | uuid | No | Worker reference |
| date | date | No | Work date |
| clock_in_time | timestamp | Yes | Clock in time |
| clock_out_time | timestamp | Yes | Clock out time |
| total_work_minutes | integer | Yes | Minutes worked |
| regular_hours | numeric | Yes | Regular hours |
| overtime_hours | numeric | Yes | OT hours |
| hourly_rate | numeric | Yes | Hourly rate |
| regular_pay | numeric | Yes | Regular pay |
| overtime_pay | numeric | Yes | OT pay |
| total_pay | numeric | Yes | Total pay |
| status | text | Yes | pending/approved |
| approved_by | uuid | Yes | Approver ID |
| approved_at | timestamp | Yes | Approval timestamp |
| created_at | timestamp | No | Creation time |

**RLS Policies:**
- Admins: Full access
- SAOs: Can only view timesheets for their assigned workers

---

### 7. Work Locations Table

**Purpose:** Geofenced work locations

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| name | text | No | Location name |
| address | text | Yes | Full address |
| latitude | numeric | No | GPS latitude |
| longitude | numeric | No | GPS longitude |
| radius_meters | integer | No | Geofence radius (default: 100m) |
| image_url | text | Yes | Location photo |
| notes | text | Yes | Additional info |
| is_active | boolean | No | Active status |
| created_at | timestamp | No | Creation time |
| updated_at | timestamp | No | Last update |

**RLS Policies:**
- Admins: Full access
- Authenticated users: Can only view active locations

**API Examples:**
```javascript
// Get all active locations
const { data } = await supabase
  .from('work_locations')
  .select('*')
  .eq('is_active', true);

// Create location (admin only)
const { data } = await supabase
  .from('work_locations')
  .insert({
    name: 'Main Office',
    address: '123 Main St, Manila',
    latitude: 14.5995,
    longitude: 120.9842,
    radius_meters: 150,
    image_url: 'https://...location.jpg',
    is_active: true
  })
  .select()
  .single();
```

**Geofencing Check:**
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const distance = calculateDistance(
  userLat, userLon,
  location.latitude, location.longitude
);
const isWithinGeofence = distance <= location.radius_meters;
```

---

### 8. Employee Location Assignments Table

**Purpose:** Assign multiple locations to employees

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| employee_id | uuid | No | Employee reference |
| location_id | uuid | No | Location reference |
| created_at | timestamp | No | Creation time |

**RLS Policies:**
- Admins: Full access
- Employees: Can only view their own assignments
- SAOs: Can only view their own assignments

**API Examples:**
```javascript
// Get employee's assigned locations
const { data } = await supabase
  .from('employee_location_assignments')
  .select(`
    *,
    location:work_locations(*)
  `)
  .eq('employee_id', employeeId);
```

---

### 9. Worker Location Assignments Table

**Purpose:** Assign multiple locations to workers

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| worker_id | uuid | No | Worker reference |
| location_id | uuid | No | Location reference |
| created_at | timestamp | No | Creation time |

**RLS Policies:**
- Admins: Full access
- SAOs: Can only view assignments for their assigned workers

---

### 10. Leave Requests Table

**Purpose:** Employee leave/undertime requests

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| employee_id | uuid | No | Employee reference |
| leave_type | enum | No | annual/sick/personal/unpaid/maternity/paternity |
| start_date | date | No | Leave start |
| end_date | date | No | Leave end |
| reason | text | Yes | Request reason |
| status | enum | No | pending/approved/rejected/cancelled |
| undertime_hours | numeric | Yes | Undertime hours |
| reviewed_by | uuid | Yes | Approver ID |
| reviewed_at | timestamp | Yes | Review timestamp |
| review_notes | text | Yes | Approver notes |
| created_at | timestamp | No | Creation time |
| updated_at | timestamp | No | Last update |

**RLS Policies:**
- Admins: Full access
- Employees/SAOs: Can only manage their own requests

**API Examples:**
```javascript
// Submit leave request
const { data } = await supabase
  .from('leave_requests')
  .insert({
    employee_id: employeeId,
    leave_type: 'annual',
    start_date: '2024-01-15',
    end_date: '2024-01-17',
    reason: 'Family vacation'
  })
  .select()
  .single();

// Get my leave requests
const { data } = await supabase
  .from('leave_requests')
  .select('*')
  .eq('employee_id', employeeId)
  .order('created_at', { ascending: false });

// Approve leave (admin only)
const { error } = await supabase
  .from('leave_requests')
  .update({
    status: 'approved',
    reviewed_by: adminId,
    reviewed_at: new Date().toISOString(),
    review_notes: 'Approved for 3 days'
  })
  .eq('id', leaveRequestId);
```

---

### 11. Payroll Reports Table

**Purpose:** Monthly payroll summaries

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| report_period_start | date | No | Period start |
| report_period_end | date | No | Period end |
| generated_by | uuid | Yes | Generator ID |
| total_regular_hours | numeric | No | Total regular hours |
| total_overtime_hours | numeric | No | Total OT hours |
| total_regular_pay | numeric | No | Total regular pay |
| total_overtime_pay | numeric | No | Total OT pay |
| total_gross_pay | numeric | No | Total gross pay |
| employee_count | integer | No | Employee count |
| status | text | No | draft/completed |
| notes | text | Yes | Additional notes |
| created_at | timestamp | No | Creation time |
| updated_at | timestamp | No | Last update |

**RLS Policies:**
- Admins: Full access

---

### 12. Payroll Report Items Table

**Purpose:** Individual employee payroll breakdown

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| report_id | uuid | No | Parent report |
| employee_id | uuid | No | Employee reference |
| days_worked | integer | No | Days worked |
| regular_hours | numeric | No | Regular hours |
| overtime_hours | numeric | No | OT hours |
| double_overtime_hours | numeric | No | Double OT hours |
| hourly_rate | numeric | No | Hourly rate |
| regular_pay | numeric | No | Regular pay |
| overtime_pay | numeric | No | OT pay |
| double_overtime_pay | numeric | No | Double OT pay |
| gross_pay | numeric | No | Gross pay |
| created_at | timestamp | No | Creation time |

**RLS Policies:**
- Admins: Full access
- Employees: Can only view their own items
- SAOs: Can only view their own items

---

### 13. Overtime Settings Table

**Purpose:** Configure overtime calculation rules

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| regular_hours_per_day | numeric | No | Regular hours (default: 8) |
| overtime_multiplier | numeric | No | OT multiplier (default: 1.5) |
| double_overtime_multiplier | numeric | No | Double OT multiplier (default: 2.0) |
| double_overtime_threshold_hours | numeric | No | Double OT threshold (default: 12) |
| created_at | timestamp | No | Creation time |
| updated_at | timestamp | No | Last update |

**RLS Policies:**
- Admins: Full access
- All authenticated users: Can view settings

---

### 14. Chat Messages Table

**Purpose:** Internal messaging system

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | uuid | No | Primary key |
| sender_id | uuid | No | Sender user ID |
| sender_name | text | No | Sender display name |
| sender_role | text | No | Sender role |
| recipient_id | uuid | No | Recipient user ID |
| message | text | No | Message content |
| created_at | timestamp | No | Creation time |

**RLS Policies:**
- Admins: Full access to their messages
- SAOs: Can send/view their own messages

---

## Storage Buckets

### 1. employee-photos
- **Public:** Yes
- **Purpose:** Employee and worker profile photos
- **Path pattern:** `{employee_id}/profile.jpg`

**Upload:**
```javascript
const { data, error } = await supabase
  .storage
  .from('employee-photos')
  .upload(`${employeeId}/profile.jpg`, file, {
    contentType: 'image/jpeg',
    upsert: true
  });

const photoUrl = `${supabaseUrl}/storage/v1/object/public/employee-photos/${employeeId}/profile.jpg`;
```

### 2. selfies
- **Public:** Yes
- **Purpose:** Clock in/out verification photos
- **Path pattern:** `{employee_id}/{timestamp}.jpg`

**Upload:**
```javascript
const timestamp = Date.now();
const { data, error } = await supabase
  .storage
  .from('selfies')
  .upload(`${employeeId}/${timestamp}.jpg`, file, {
    contentType: 'image/jpeg'
  });
```

### 3. location-images
- **Public:** Yes
- **Purpose:** Work location photos
- **Path pattern:** `{location_id}.jpg`

---

## Edge Functions

### admin-reset-password
**URL:** `https://xxywxhfalqzcttlwrkwg.supabase.co/functions/v1/admin-reset-password`

**Purpose:** Allow admins to reset user passwords

**Method:** POST

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

## Realtime Subscriptions

Subscribe to database changes in real-time:

```javascript
// Subscribe to time entries
const channel = supabase
  .channel('time-entries')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'time_entries'
  }, (payload) => {
    console.log('New time entry:', payload.new);
  })
  .subscribe();

// Subscribe to leave requests
const leaveChannel = supabase
  .channel('leave-requests')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'leave_requests',
    filter: `employee_id=eq.${employeeId}`
  }, (payload) => {
    console.log('Leave request updated:', payload.new);
  })
  .subscribe();

// Unsubscribe
supabase.removeChannel(channel);
```

---

## Database Functions

### has_role(user_id, role)
Check if user has specific role
```sql
SELECT has_role('user-uuid', 'admin');
```

### get_employee_id(user_id)
Get employee ID from auth user ID
```sql
SELECT get_employee_id('auth-user-uuid');
```

---

## Enums

### app_role
- `admin` - Full system access
- `employee` - Can clock in/out, view own data
- `site_admin_officer` - Manages workers, can clock in/out
- `encoder` - Can add/edit employees and workers

### employee_status
- `active` - Currently employed
- `inactive` - Not employed
- `on_leave` - On approved leave

### leave_status
- `pending` - Awaiting approval
- `approved` - Approved
- `rejected` - Rejected
- `cancelled` - Cancelled by employee

### leave_type
- `annual` - Vacation leave
- `sick` - Sick leave
- `personal` - Personal leave
- `unpaid` - Unpaid leave
- `maternity` - Maternity leave
- `paternity` - Paternity leave

### time_entry_type
- `clock_in` - Start of work
- `break_start` - Start of break
- `break_end` - End of break
- `clock_out` - End of work

---

## Mobile App Integration Guide

### 1. Initialize Supabase Client
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xxywxhfalqzcttlwrkwg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eXd4aGZhbHF6Y3R0bHdya3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MTU5MjAsImV4cCI6MjA4MTE5MTkyMH0.Fj5YFAzI9NAjnutmG6ZkuZkhl1vB8rUSPNOM2Gb1eRQ';

const supabase = createClient(supabaseUrl, supabaseKey);
```

### 2. Authentication Flow
```javascript
// Check existing session
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  // User is logged in
  const user = session.user;
  // Get user role
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();
}

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

if (error) {
  console.error('Login failed:', error.message);
}
```

### 3. Clock In/Out Flow
```javascript
async function clockIn(employeeId, selfieFile, latitude, longitude) {
  // 1. Check if already clocked in
  const { data: lastEntry } = await supabase
    .from('time_entries')
    .select('*')
    .eq('employee_id', employeeId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();
  
  if (lastEntry && (lastEntry.entry_type === 'clock_in' || lastEntry.entry_type === 'break_end')) {
    return { error: 'Already clocked in' };
  }
  
  // 2. Verify location
  const { data: locations } = await supabase
    .from('work_locations')
    .select('*')
    .eq('is_active', true);
  
  const isWithinGeofence = locations.some(loc => {
    const distance = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);
    return distance <= loc.radius_meters;
  });
  
  if (!isWithinGeofence) {
    return { error: 'Not within work location geofence' };
  }
  
  // 3. Upload selfie
  const timestamp = Date.now();
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('selfies')
    .upload(`${employeeId}/${timestamp}.jpg`, selfieFile, {
      contentType: 'image/jpeg'
    });
  
  if (uploadError) {
    return { error: 'Failed to upload selfie' };
  }
  
  const selfieUrl = `${supabaseUrl}/storage/v1/object/public/selfies/${employeeId}/${timestamp}.jpg`;
  
  // 4. Create time entry
  const { data: entry, error: entryError } = await supabase
    .from('time_entries')
    .insert({
      employee_id: employeeId,
      entry_type: 'clock_in',
      timestamp: new Date().toISOString(),
      selfie_url: selfieUrl,
      location: `${latitude},${longitude}`,
      notes: `Clock in at ${locationName}`
    })
    .select()
    .single();
  
  return { data: entry, error: entryError };
}
```

### 4. Get Attendance Status
```javascript
async function getAttendanceStatus(employeeId) {
  // Get today's entries
  const today = new Date().toISOString().split('T')[0];
  const { data: entries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('timestamp', today)
    .order('timestamp', { ascending: true });
  
  // Get timesheet summary
  const { data: timesheet } = await supabase
    .from('timesheets')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', today)
    .single();
  
  return {
    entries: entries || [],
    timesheet: timesheet,
    isClockedIn: entries?.some(e => e.entry_type === 'clock_in' && !entries.some(x => x.entry_type === 'clock_out' && x.timestamp > e.timestamp)),
    currentStatus: entries?.length > 0 ? entries[entries.length - 1].entry_type : 'not_started'
  };
}
```

### 5. Subscribe to Real-time Updates
```javascript
function subscribeToAttendanceUpdates(employeeId, onUpdate) {
  const channel = supabase
    .channel(`attendance-${employeeId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'time_entries',
      filter: `employee_id=eq.${employeeId}`
    }, (payload) => {
      onUpdate(payload.new);
    })
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}
```

---

## Important Notes

1. **Time Zone:** All timestamps are stored in Philippine Standard Time (PST/UTC+8)

2. **Geofencing:** Location validation requires GPS coordinates within 100-150 meters of work location

3. **Selfie Verification:** Clock in/out requires photo verification

4. **Offline Support:** Implement local caching for offline clock in/out, sync when online

5. **Rate Limiting:** Supabase has default rate limits. Implement exponential backoff for retries

6. **Security:** Never expose service_role_key in mobile apps. Use anon_key only.

7. **Image Uploads:** Compress images before upload (max 5MB recommended)

8. **Pagination:** Use pagination for large datasets (limit/offset)

---

## Support

For technical issues or questions about this API documentation, refer to:
- Supabase Documentation: https://supabase.com/docs
- Project URL: https://lovable.dev/projects/36084af0-46d9-4244-85a7-f221bf58a092
