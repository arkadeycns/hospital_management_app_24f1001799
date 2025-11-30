# ✅ Testing Checklist - Hospital Management System

Use this checklist to verify all features are working correctly.

---

## 🎯 Pre-Test Setup

- [ ] Redis is installed and running (`redis-cli ping` returns PONG)
- [ ] Flask app is running (`python app.py`)
- [ ] Sample data created (`python create_sample_data.py`)
- [ ] Browser opened to `http://localhost:5000`

---

## 🔐 Authentication Tests

### Admin Login
- [ ] Login as admin (admin/admin123)
- [ ] Verify redirect to `/admin` dashboard
- [ ] See statistics displayed (doctors, patients, appointments)

### Doctor Login
- [ ] Logout and login as `dr_smith` (doctor123)
- [ ] Verify redirect to `/doctor` dashboard
- [ ] See appointments list

### Patient Login
- [ ] Logout and login as `john_doe` (patient123)
- [ ] Verify redirect to `/patient` dashboard
- [ ] See booking form

### Patient Registration
- [ ] Logout and click "Register"
- [ ] Create new patient account
- [ ] Successfully login with new credentials

---

## 👨‍⚕️ Admin Features Tests

Login as admin first, then test:

### Dashboard Statistics
- [ ] Total doctors count is correct
- [ ] Total patients count is correct
- [ ] Total appointments shown
- [ ] Today's appointments count

### Doctor Management
- [ ] **ADD:** Add a new doctor
  - Fill username, email, password, specialization
  - Click "+" button
  - Verify doctor appears in table

- [ ] **UPDATE:** Edit doctor (NEW FEATURE!)
  - Will require frontend update
  - Verify email/specialization can be changed

- [ ] **DELETE:** Remove a doctor
  - Click "Remove" button
  - If doctor has active appointments, see error message
  - If no active appointments, confirm deletion

### Patient Management (NEW FEATURE!)
- [ ] View patients list (needs frontend update)
- [ ] Search patients by name/email
- [ ] Delete patient (if no active appointments)

### Appointments View
- [ ] See all system appointments
- [ ] View doctor names
- [ ] View patient names
- [ ] See appointment status badges

### Search Functionality
- [ ] Search doctors by name
- [ ] Search doctors by specialization
- [ ] Search patients by name/email

---

## 👨‍⚕️ Doctor Features Tests

Login as `dr_smith` (doctor123), then test:

### Dashboard
- [ ] View all appointments
- [ ] See patient names
- [ ] See appointment dates/times
- [ ] See status badges

### Upcoming Appointments (NEW FEATURE!)
- [ ] Filter appointments for next 7 days
  - Requires frontend update to call `/api/doctor/appointments/upcoming`

### Manage Appointments
- [ ] Click "Manage" on an appointment
- [ ] Update status (Booked → Completed)
- [ ] Add diagnosis text
- [ ] Add prescription notes
- [ ] Save changes
- [ ] Verify updates saved

### Patient History
- [ ] View patient history
- [ ] See previous diagnoses
- [ ] See prescriptions

### Assigned Patients List (NEW FEATURE!)
- [ ] View unique patients list
  - Requires frontend update to call `/api/doctor/patients`
  - Should show patient names and total appointment count

### Set Availability (NEW FEATURE!)
- [ ] Set availability for next 7 days
  - Requires frontend update
  - Should allow selecting time slots

---

## 🧑 Patient Features Tests

Login as `john_doe` (patient123), then test:

### View Doctors
- [ ] See list of all approved doctors
- [ ] See doctor names and specializations
- [ ] List should load from cache (fast on second load)

### Search Doctors
- [ ] Search by doctor name
- [ ] Search by specialization
- [ ] Filter results displayed

### Book Appointment
- [ ] Select a doctor from dropdown
- [ ] Choose date and time
- [ ] Click "Confirm Booking"
- [ ] See success message
- [ ] Appointment appears in history

### Reschedule Appointment (NEW FEATURE!)
- [ ] Find a booked appointment
- [ ] Click reschedule button (needs frontend update)
- [ ] Select new date/time
- [ ] Confirm reschedule
- [ ] Verify time updated
- [ ] Test conflict detection (try booking same doctor/time)

### Cancel Appointment
- [ ] Find a booked appointment
- [ ] Click "Cancel" button
- [ ] Confirm cancellation
- [ ] Status changes to "Cancelled"

### View Appointment History
- [ ] See all appointments (past and future)
- [ ] See doctor names
- [ ] See dates and statuses
- [ ] Color-coded status badges

### View Treatment History
- [ ] See completed appointments only
- [ ] View diagnosis for each
- [ ] View prescriptions
- [ ] See doctor specializations

### Update Profile
- [ ] Update username
- [ ] Update email
- [ ] Update address  
- [ ] Save changes
- [ ] Verify updates persisted

### Export CSV (Async Job)
- [ ] Click "Export CSV" button
- [ ] See "Export started" message
- [ ] Check terminal for task completion
- [ ] Verify CSV file created

---

## 🚀 API Endpoint Tests

Test new endpoints using browser/Postman/curl:

### New Admin Endpoints
- [ ] `PUT /api/admin/doctor/<id>` - Update doctor
- [ ] `GET /api/admin/patients` - List patients
- [ ] `DELETE /api/admin/patient/<id>` - Delete patient

### New Doctor Endpoints
- [ ] `GET /api/doctor/appointments/upcoming` - Next 7 days
- [ ] `GET /api/doctor/patients` - Assigned patients
- [ ] `GET /api/doctor/availability` - Get availability
- [ ] `POST /api/doctor/availability` - Set availability

### New Patient Endpoints
- [ ] `PUT /api/patient/appointment/<id>` - Reschedule

### New General Endpoints
- [ ] `GET /api/specializations` - List all (cached)
- [ ] `GET /api/doctor/<id>/availability` - Doctor availability

---

## ⚡ Caching Tests

### Test Cache Performance
- [ ] First load of `/api/patient/doctors` (slower)
- [ ] Second load of `/api/patient/doctors` (faster - from cache)
- [ ] Add a new doctor
- [ ] Reload doctors list (cache cleared, fresh data)

### Test Cache Expiry
- [ ] Load specializations list
- [ ] Wait 10+ minutes
- [ ] Reload (should re-fetch from database)

---

## 🤖 Celery Tests (Optional)

Only if you want to test scheduled tasks:

### Setup
- [ ] Redis is running
- [ ] Celery worker is running
- [ ] Celery beat is running

### Manual Trigger Tests
Run in Python console:
```python
from tasks import send_daily_reminders, generate_monthly_report

# Test daily reminder
result = send_daily_reminders.delay()
print(result.get())

# Test monthly report for doctor ID 1
result = generate_monthly_report.delay(1)
print(result.get())
```

- [ ] Daily reminders task executes
- [ ] Monthly report generates HTML file
- [ ] Export CSV creates file

### Scheduler Tests
- [ ] Check Celery Beat logs
- [ ] Verify schedule is configured (8 AM daily, 1st of month)

---

## 🔒 Validation Tests

### Duplicate Appointment Prevention
- [ ] Book appointment (Dr. Smith, tomorrow 10 AM)
- [ ] Try booking same doctor/time
- [ ] See error: "Time slot already booked"

### Past Date Prevention
- [ ] Try booking appointment yesterday
- [ ] See error: "Cannot book in the past"

### Active Appointment Protection
- [ ] Create appointment for a doctor
- [ ] Try deleting that doctor
- [ ] See error: "Doctor has X active appointments"
- [ ] Cancel/complete appointment
- [ ] Try deleting again (should work)

### Reschedule Validation (NEW!)
- [ ] Try rescheduling to past date
- [ ] See error message
- [ ] Try rescheduling to conflicting time
- [ ] See error message

---

## 📊 Summary Checklist

### Core Functionality
- [ ] All authentication working
- [ ] All CRUD operations working
- [ ] All search features working
- [ ] All validations working

### New Features (Implemented Today)
- [ ] Admin can update doctors
- [ ] Admin can delete patients
- [ ] Patients can reschedule
- [ ] Specializations list available
- [ ] Caching is active

### Backend Jobs
- [ ] CSV export works
- [ ] Daily reminder task exists
- [ ] Monthly report task exists
- [ ] (Optional) Celery Beat scheduled

---

## 🎯 Expected Results

After completing this checklist:
- ✅ All 30+ API endpoints respond correctly
- ✅ All roles (admin, doctor, patient) function properly
- ✅ All CRUD operations work
- ✅ All validations prevent invalid data
- ✅ Caching improves performance
- ✅ Background tasks execute

---

## 🐛 If Something Doesn't Work

1. **Check Flask logs** in terminal for errors
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Hard refresh** page (Ctrl+F5)
4. **Check Redis** is running (`redis-cli ping`)
5. **Verify sample data** exists in database
6. **Review error messages** for specific issues

---

## 📝 Notes

- Some NEW features (reschedule UI, availability UI) may need frontend updates
- Backend APIs are 100% ready
- Frontend can be enhanced to expose all features
- Celery is optional for basic functionality

---

**Testing Date:** ___________  
**Tester:** ___________  
**Result:** ☐ All Pass  ☐ Issues Found  

**Issues:**
- 
- 
- 

---

**Happy Testing!** 🎉
