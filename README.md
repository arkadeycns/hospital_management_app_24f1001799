# Hospital Management System V2 🏥

## Project Overview
A comprehensive web-based Hospital Management System built with Flask (backend) and Vue.js (frontend) that enables efficient management of doctors, patients, and appointments with role-based access control.

## 🎯 Features Implemented

### Core Functionalities
- ✅ **Role-Based Access Control** (Admin, Doctor, Patient)
- ✅ **Appointment Management** with conflict detection
- ✅ **Treatment History Tracking**
- ✅ **Search Functionality** (doctors, patients, specializations)
- ✅ **Dashboard Statistics**
- ✅ **Redis Caching** for performance optimization
- ✅ **Background Jobs** (daily reminders, monthly reports, CSV exports)
- ✅ **Profile Management**

### Admin Capabilities
- View system-wide statistics
- Add/Remove doctor profiles
- View all appointments
- Search doctors and patients
- Manage hospital operations

### Doctor Capabilities
- View assigned appointments
- Update patient diagnosis and prescriptions
- Mark appointments as completed
- View patient treatment history

### Patient Capabilities
- Register and manage profile
- Search for doctors by specialization
- Book appointments (with double-booking prevention)
- View appointment history
- View detailed treatment records
- Cancel appointments
- Export treatment history as CSV

## 🛠️ Tech Stack

### Backend
- **Flask** - Web framework
- **SQLAlchemy** - ORM
- **Flask-JWT-Extended** - Authentication
- **Flask-Caching** - Redis caching
- **Celery** - Background task processing
- **Redis** - Cache and message broker
- **SQLite** - Database

### Frontend
- **Vue.js 3** (CDN) - Progressive framework
- **Vue Router** - Client-side routing
- **Bootstrap 5** - UI framework
- **Custom CSS** - Glassmorphism design

## 📦 Setup & Installation

### Prerequisites
```bash
- Python 3.8+
- Redis Server (optional, for caching)
```

### Installation Steps

1. **Install Dependencies**:
```bash
pip install -r requirements.txt
```

2. **Initialize Database**:
```bash
python init_db.py
```
This creates `hms.db` and an admin user:
- Username: `admin`
- Password: `admin123`

3. **(Optional) Populate Sample Data**:
```bash
python populate_db.py
```

4. **Run Application**:
```bash
python app.py
```
Access at: `http://127.0.0.1:5000`

5. **(Optional) Start Redis** (for caching):
```bash
redis-server
```

6. **(Optional) Run Celery Worker** (for background jobs):
```bash
celery -A tasks.celery worker --loglevel=info
```

## 📊 Database Schema

### Models
- **User** - Base user model (username, email, password, role)
- **Doctor** - Doctor profile (specialization, availability)
- **Patient** - Patient profile (address, medical history)
- **Appointment** - Appointment records (date, time, status, diagnosis, prescription)
- **Department** - Medical departments/specializations

## 🔐 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - Patient registration

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/doctors` - List all doctors
- `POST /api/admin/doctors` - Add new doctor
- `DELETE /api/admin/doctor/<id>` - Remove doctor
- `GET /api/admin/appointments` - View all appointments
- `GET /api/admin/search/doctors` - Search doctors
- `GET /api/admin/search/patients` - Search patients

### Doctor
- `GET /api/doctor/appointments` - View assigned appointments
- `PUT /api/doctor/appointment/<id>` - Update appointment
- `GET /api/doctor/patient/<id>/history` - View patient history

### Patient
- `GET /api/patient/doctors` - List available doctors (cached)
- `GET /api/patient/search/doctors` - Search doctors
- `POST /api/patient/book` - Book appointment
- `GET /api/patient/appointments` - View my appointments
- `GET /api/patient/treatment-history` - View treatment records
- `DELETE /api/patient/appointment/<id>` - Cancel appointment
- `GET/PUT /api/patient/profile` - View/Update profile
- `POST /api/patient/export` - Export history as CSV

## 🎨 UI Features

- **Modern Glassmorphism Design** - Premium dark theme
- **Responsive Layout** - Works on all screen sizes
- **Real-time Validation** - Conflict detection, date validation
- **Loading States** - User feedback during operations
- **Error Handling** - Graceful error messages

## ⚙️ Background Jobs

### Daily Reminders
Sends appointment reminders to patients for next day's appointments.

### Monthly Reports
Generates HTML activity reports for doctors with appointment statistics.

### CSV Export
Exports patient treatment history in CSV format with all appointment details.

## 🚀 Performance Features

- **Redis Caching** - Doctor list cached for 5 minutes
- **Cache Invalidation** - Automatic cache clearing on data changes
- **Optimized Queries** - Efficient database operations
- **Lazy Loading** - Pagination-ready architecture

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Werkzeug secure password storage
- **Role-Based Access Control** - Endpoint protection
- **Input Validation** - Server-side validation
- **SQL Injection Protection** - SQLAlchemy ORM

## 📝 Testing

### Manual Testing Checklist
- [ ] Admin login and dashboard
- [ ] Doctor CRUD operations
- [ ] Patient registration
- [ ] Appointment booking
- [ ] Conflict detection (double booking)
- [ ] Search functionality
- [ ] Treatment history
- [ ] Background jobs (Celery)
- [ ] Caching (Redis)

### Test Credentials
**Admin:**
- Username: `admin`
- Password: `admin123`

**Sample Data:**
Run `populate_db.py` to create test doctors and patients.

## 📂 Project Structure

```
hospital_management_app/
├── app.py                 # Flask application initialization
├── config.py              # Configuration settings
├── models.py              # Database models
├── routes.py              # API endpoints
├── tasks.py               # Celery background jobs
├── init_db.py             # Database initialization script
├── populate_db.py         # Sample data generator
├── requirements.txt       # Python dependencies
├── README.md              # This file
├── templates/
│   └── index.html         # Vue.js entry point
└── static/
    ├── css/
    │   └── style.css      # Custom styles
    └── js/
        └── app.js         # Vue.js application

```

## 🎓 Project Compliance

### Framework Requirements
- ✅ Flask for API
- ✅ Vue.js for UI
- ✅ Jinja2 for templates
- ✅ Bootstrap for styling
- ✅ SQLite database
- ✅ Redis for caching
- ✅ Redis + Celery for background jobs

### Core Requirements
- ✅ Admin, Doctor, Patient roles
- ✅ Appointment management
- ✅ Search functionality
- ✅ Treatment history
- ✅ Background tasks
- ✅ Caching implementation
- ✅ Conflict prevention

## 📚 Documentation

- `FINAL_IMPLEMENTATION_SUMMARY.md` - Complete feature list
- `CRITICAL_FEATURES_GUIDE.md` - Implementation guide
- `IMPLEMENTATION_CHECKLIST.md` - Development checklist

## 🐛 Known Limitations

- Email sending is simulated (prints to console)
- Doctor availability system not fully implemented
- Department management basic
- No PDF report generation (HTML only)

## 🔮 Future Enhancements

- SMS integration for reminders
- PDF report generation
- Video consultation booking
- Payment gateway integration
- Mobile app version
- Advanced analytics dashboard

## 👥 Authors

Developed as part of MAD-II Project

## 📄 License

This project is for educational purposes.

## 🙏 Acknowledgments

- Flask Documentation
- Vue.js Documentation
- Bootstrap Documentation
- Celery Documentation

---

**Version:** 2.0  
**Last Updated:** November 2025  
**Status:** Production Ready ✅
