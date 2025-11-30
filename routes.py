from flask import Blueprint, render_template, jsonify, request
from models import db, User, Doctor, Patient, Appointment, Department
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, date, timedelta
import json
from tasks import export_patient_history

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    return render_template('index.html')


# --- Auth ---
@bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()
    if user and check_password_hash(user.password, data.get('password')):
        access_token = create_access_token(identity=str(user.id), additional_claims={'role': user.role})
        return jsonify(access_token=access_token, role=user.role, username=user.username), 200
    return jsonify({"msg": "Bad username or password"}), 401

@bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({"msg": "Username already exists"}), 400
    
    hashed_password = generate_password_hash(data.get('password'))
    new_user = User(username=data.get('username'), email=data.get('email'), password=hashed_password, role='patient')
    db.session.add(new_user)
    db.session.commit()
    
    # Create Patient Profile
    new_patient = Patient(user_id=new_user.id)
    db.session.add(new_patient)
    db.session.commit()
    
    return jsonify({"msg": "User created successfully"}), 201

# --- Admin ---
@bp.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def admin_stats():
    claims = get_jwt()
    if claims['role'] != 'admin':
        return jsonify({"msg": "Admins only"}), 403
    
    total_doctors = Doctor.query.count()
    total_patients = Patient.query.count()
    total_appointments = Appointment.query.count()
    today_appointments = Appointment.query.filter(
        db.func.date(Appointment.date_time) == date.today()
    ).count()
    completed_appointments = Appointment.query.filter_by(status='Completed').count()
    
    return jsonify({
        'total_doctors': total_doctors,
        'total_patients': total_patients,
        'total_appointments': total_appointments,
        'today_appointments': today_appointments,
        'completed_appointments': completed_appointments
    }), 200

@bp.route('/api/admin/doctors', methods=['GET', 'POST'])
@jwt_required()
def manage_doctors():
    claims = get_jwt()
    if claims['role'] != 'admin':
        return jsonify({"msg": "Admins only"}), 403
        
    if request.method == 'POST':
        data = request.get_json()
        if User.query.filter_by(username=data.get('username')).first():
             return jsonify({"msg": "Username already exists"}), 400
             
        hashed_password = generate_password_hash(data.get('password'))
        new_user = User(username=data.get('username'), email=data.get('email'), password=hashed_password, role='doctor')
        db.session.add(new_user)
        db.session.commit()
        
        new_doctor = Doctor(user_id=new_user.id, specialization=data.get('specialization'))
        db.session.add(new_doctor)
        db.session.commit()
        return jsonify({"msg": "Doctor added"}), 201
        
    doctors = Doctor.query.all()
    result = []
    for d in doctors:
        result.append({
            "id": d.id,
            "username": d.user.username,
            "email": d.user.email,
            "specialization": d.specialization,
            "is_approved": d.is_approved
        })
    return jsonify(result), 200

@bp.route('/api/admin/doctor/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_doctor(id):
    claims = get_jwt()
    if claims['role'] != 'admin':
        return jsonify({"msg": "Admins only"}), 403
    doctor = Doctor.query.get_or_404(id)
    user = User.query.get(doctor.user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"msg": "Doctor deleted"}), 200

@bp.route('/api/admin/appointments', methods=['GET'])
@jwt_required()
def admin_appointments():
    claims = get_jwt()
    if claims['role'] != 'admin':
        return jsonify({"msg": "Admins only"}), 403
    appointments = Appointment.query.all()
    result = []
    for a in appointments:
        result.append({
            "id": a.id,
            "doctor_name": a.doctor.user.username,
            "patient_name": a.patient.user.username,
            "date_time": a.date_time.isoformat(),
            "status": a.status
        })
    return jsonify(result), 200

# Search endpoints
@bp.route('/api/admin/search/doctors', methods=['GET'])
@jwt_required()
def search_doctors_admin():
    claims = get_jwt()
    if claims['role'] != 'admin':
        return jsonify({"msg": "Admins only"}), 403
    
    query = request.args.get('q', '').lower()
    specialization = request.args.get('specialization', '').lower()
    
    doctors = Doctor.query.join(User).filter(
        (User.username.ilike(f'%{query}%')) |
        (Doctor.specialization.ilike(f'%{specialization}%'))
    ).all()
    
    result = []
    for d in doctors:
        result.append({
            "id": d.id,
            "username": d.user.username,
            "email": d.user.email,
            "specialization": d.specialization,
            "is_approved": d.is_approved
        })
    return jsonify(result), 200

@bp.route('/api/admin/search/patients', methods=['GET'])
@jwt_required()
def search_patients():
    claims = get_jwt()
    if claims['role'] != 'admin':
        return jsonify({"msg": "Admins only"}), 403
    
    query = request.args.get('q', '').lower()
    
    patients = Patient.query.join(User).filter(
        User.username.ilike(f'%{query}%') |
        User.email.ilike(f'%{query}%')
    ).all()
    
    result = []
    for p in patients:
        result.append({
            "id": p.id,
            "username": p.user.username,
            "email": p.user.email,
            "address": p.address
        })
    return jsonify(result), 200

# --- Doctor ---
@bp.route('/api/doctor/appointments', methods=['GET'])
@jwt_required()
def doctor_appointments():
    current_user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(user_id=current_user_id).first()
    if not doctor:
        return jsonify({"msg": "Doctor profile not found"}), 404
        
    appointments = Appointment.query.filter_by(doctor_id=doctor.id).all()
    result = []
    for a in appointments:
        result.append({
            "id": a.id,
            "patient_name": a.patient.user.username,
            "patient_id": a.patient.id,
            "date_time": a.date_time.isoformat(),
            "status": a.status,
            "diagnosis": a.diagnosis,
            "prescription": a.prescription
        })
    return jsonify(result), 200

@bp.route('/api/doctor/appointment/<int:id>', methods=['PUT'])
@jwt_required()
def update_appointment(id):
    current_user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(user_id=current_user_id).first()
    appt = Appointment.query.filter_by(id=id, doctor_id=doctor.id).first_or_404()
    
    data = request.get_json()
    if 'status' in data:
        appt.status = data['status']
    if 'diagnosis' in data:
        appt.diagnosis = data['diagnosis']
    if 'prescription' in data:
        appt.prescription = data['prescription']
    if 'notes' in data:
        appt.notes = data['notes']
        
    db.session.commit()
    return jsonify({"msg": "Appointment updated"}), 200

@bp.route('/api/doctor/patient/<int:patient_id>/history', methods=['GET'])
@jwt_required()
def doctor_view_patient_history(patient_id):
    current_user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(user_id=current_user_id).first()
    if not doctor:
        return jsonify({"msg": "Doctor profile not found"}), 404
    
    appointments = Appointment.query.filter_by(
        patient_id=patient_id,
        doctor_id=doctor.id,
        status='Completed'
    ).all()
    
    result = []
    for a in appointments:
        result.append({
            "id": a.id,
            "date": a.date_time.isoformat(),
            "diagnosis": a.diagnosis,
            "prescription": a.prescription,
            "notes": a.notes
        })
    return jsonify(result), 200

# --- Patient ---
@bp.route('/api/patient/doctors', methods=['GET'])
def get_doctors():
    """Get all approved doctors"""
    doctors = Doctor.query.filter_by(is_approved=True).all()
    result = []
    for d in doctors:
        result.append({
            "id": d.id,
            "name": d.user.username,
            "specialization": d.specialization
        })
    return jsonify(result), 200

@bp.route('/api/patient/search/doctors', methods=['GET'])
def search_doctors_patient():
    """Search doctors by name or specialization"""
    query = request.args.get('q', '').lower()
    specialization = request.args.get('specialization', '').lower()
    
    doctors_query = Doctor.query.filter_by(is_approved=True).join(User)
    
    if query:
        doctors_query = doctors_query.filter(User.username.ilike(f'%{query}%'))
    if specialization:
        doctors_query = doctors_query.filter(Doctor.specialization.ilike(f'%{specialization}%'))
    
    doctors = doctors_query.all()
    result = []
    for d in doctors:
        result.append({
            "id": d.id,
            "name": d.user.username,
            "specialization": d.specialization
        })
    return jsonify(result), 200

@bp.route('/api/patient/book', methods=['POST'])
@jwt_required()
def book_appointment():
    current_user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=current_user_id).first()
    
    if not patient:
        return jsonify({"msg": "Patient profile not found"}), 404
    
    data = request.get_json()
    date_time = datetime.fromisoformat(data.get('date_time'))
    doctor_id = data.get('doctor_id')
    
    # CRITICAL: Check for appointment conflicts
    existing_appointment = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.date_time == date_time,
        Appointment.status == 'Booked'
    ).first()
    
    if existing_appointment:
        return jsonify({"msg": "This time slot is already booked. Please choose another time."}), 400
    
    # Validate date is in the future
    if date_time < datetime.now():
        return jsonify({"msg": "Cannot book appointments in the past"}), 400
    
    new_appt = Appointment(
        patient_id=patient.id,
        doctor_id=doctor_id,
        date_time=date_time
    )
    db.session.add(new_appt)
    db.session.commit()
    return jsonify({"msg": "Appointment booked successfully"}), 201

@bp.route('/api/patient/appointments', methods=['GET'])
@jwt_required()
def patient_appointments():
    current_user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=current_user_id).first()
    if not patient:
        return jsonify({"msg": "Patient profile not found"}), 404
        
    appointments = Appointment.query.filter_by(patient_id=patient.id).all()
    result = []
    for a in appointments:
        result.append({
            "id": a.id,
            "doctor_name": a.doctor.user.username,
            "date_time": a.date_time.isoformat(),
            "status": a.status
        })
    return jsonify(result), 200

@bp.route('/api/patient/treatment-history', methods=['GET'])
@jwt_required()
def patient_treatment_history():
    """Get detailed treatment history for patient"""
    current_user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=current_user_id).first()
    if not patient:
        return jsonify({"msg": "Patient profile not found"}), 404
    
    appointments = Appointment.query.filter_by(
        patient_id=patient.id,
        status='Completed'
    ).all()
    
    result = []
    for a in appointments:
        result.append({
            "id": a.id,
            "doctor": a.doctor.user.username,
            "specialization": a.doctor.specialization,
            "date": a.date_time.isoformat(),
            "diagnosis": a.diagnosis,
            "prescription": a.prescription,
            "notes": a.notes
        })
    return jsonify(result), 200

@bp.route('/api/patient/appointment/<int:id>', methods=['DELETE'])
@jwt_required()
def cancel_appointment(id):
    current_user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=current_user_id).first()
    appt = Appointment.query.filter_by(id=id, patient_id=patient.id).first_or_404()
    
    appt.status = 'Cancelled'
    db.session.commit()
    return jsonify({"msg": "Appointment cancelled"}), 200

@bp.route('/api/patient/profile', methods=['GET', 'PUT'])
@jwt_required()
def patient_profile():
    """Get or update patient profile"""
    current_user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=current_user_id).first()
    
    if not patient:
        return jsonify({"msg": "Patient profile not found"}), 404
    
    if request.method == 'PUT':
        data = request.get_json()
        if 'username' in data:
            patient.user.username = data['username']
        if 'email' in data:
            patient.user.email = data['email']
        if 'address' in data:
            patient.address = data['address']
        db.session.commit()
        return jsonify({"msg": "Profile updated successfully"}), 200
    
    return jsonify({
        'username': patient.user.username,
        'email': patient.user.email,
        'address': patient.address
    }), 200

@bp.route('/api/patient/export', methods=['POST'])
@jwt_required()
def export_data():
    current_user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=current_user_id).first()
    task = export_patient_history.delay(patient.id)
    return jsonify({"msg": "Export started", "task_id": task.id}), 202

# ============= NEWLY ADDED MISSING ENDPOINTS =============

# --- Admin: Update Doctor ---
@bp.route('/api/admin/doctor/<int:id>', methods=['PUT'])
@jwt_required()
def update_doctor(id):
    """Update doctor profile (username, email, specialization)"""
    claims = get_jwt()
    if claims['role'] != 'admin':
        return jsonify({"msg": "Admins only"}), 403
    
    doctor = Doctor.query.get_or_404(id)
    data = request.get_json()
    
    # Update user fields
    if 'username' in data:
        doctor.user.username = data['username']
    if 'email' in data:
        doctor.user.email = data['email']
    
    # Update doctor fields
    if 'specialization' in data:
        doctor.specialization = data['specialization']
    
    db.session.commit()
    return jsonify({"msg": "Doctor updated successfully"}), 200

# --- Admin: Patient Management ---
@bp.route('/api/admin/patients', methods=['GET'])
@jwt_required()
def admin_list_patients():
    """List all patients"""
    claims = get_jwt()
    if claims['role'] != 'admin':
        return jsonify({"msg": "Admins only"}), 403
    
    patients = Patient.query.all()
    result = []
    for p in patients:
        result.append({
            "id": p.id,
            "user_id": p.user_id,
            "username": p.user.username,
            "email": p.user.email,
            "address": p.address
        })
    return jsonify(result), 200

@bp.route('/api/admin/patient/<int:id>', methods=['DELETE'])
@jwt_required()
def admin_delete_patient(id):
    """Delete a patient"""
    claims = get_jwt()
    if claims['role'] != 'admin':
        return jsonify({"msg": "Admins only"}), 403
    
    patient = Patient.query.get_or_404(id)
    
    # Check if patient has any active appointments
    active_appointments = Appointment.query.filter_by(
        patient_id=patient.id,
        status='Booked'
    ).count()
    
    if active_appointments > 0:
        return jsonify({
            "msg": f"Cannot delete patient. They have {active_appointments} active appointment(s). Please cancel them first."
        }), 400
    
    # Delete all appointments for this patient
    Appointment.query.filter_by(patient_id=patient.id).delete()
    
    # Delete user (cascades to patient)
    user = User.query.get(patient.user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"msg": "Patient deleted successfully"}), 200

# --- Patient: Reschedule Appointment ---
@bp.route('/api/patient/appointment/<int:id>', methods=['PUT'])
@jwt_required()
def reschedule_appointment(id):
    """Reschedule an appointment to a new date/time"""
    current_user_id = get_jwt_identity()
    patient = Patient.query.filter_by(user_id=current_user_id).first()
    
    if not patient:
        return jsonify({"msg": "Patient profile not found"}), 404
    
    appt = Appointment.query.filter_by(id=id, patient_id=patient.id).first_or_404()
    
    # Only allow rescheduling of booked appointments
    if appt.status != 'Booked':
        return jsonify({"msg": "Can only reschedule booked appointments"}), 400
    
    data = request.get_json()
    new_date_time = datetime.fromisoformat(data.get('date_time'))
    
    # Validate date is in the future
    if new_date_time < datetime.now():
        return jsonify({"msg": "Cannot reschedule to a past date"}), 400
    
    # Check for conflicts
    existing_appointment = Appointment.query.filter(
        Appointment.doctor_id == appt.doctor_id,
        Appointment.date_time == new_date_time,
        Appointment.status == 'Booked',
        Appointment.id != id  # Exclude current appointment
    ).first()
    
    if existing_appointment:
        return jsonify({"msg": "This time slot is already booked. Please choose another time."}), 400
    
    appt.date_time = new_date_time
    db.session.commit()
    return jsonify({"msg": "Appointment rescheduled successfully"}), 200

# --- Specializations List ---
@bp.route('/api/specializations', methods=['GET'])
def get_specializations():
    """Get all unique specializations/departments"""
    specializations = db.session.query(Doctor.specialization).distinct().all()
    result = [s[0] for s in specializations if s[0]]
    return jsonify(result), 200

# --- Doctor: Availability Management ---
@bp.route('/api/doctor/availability', methods=['GET', 'POST'])
@jwt_required()
def doctor_availability():
    """Get or set doctor availability for next 7 days"""
    current_user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(user_id=current_user_id).first()
    
    if not doctor:
        return jsonify({"msg": "Doctor profile not found"}), 404
    
    if request.method == 'POST':
        # Set availability (JSON format: {"2024-01-15": ["09:00", "10:00", "14:00"], ...})
        data = request.get_json()
        doctor.availability = json.dumps(data)
        db.session.commit()
        return jsonify({"msg": "Availability updated"}), 200
    
    # GET - Return availability
    if doctor.availability:
        availability_data = json.loads(doctor.availability)
    else:
        availability_data = {}
    
    return jsonify(availability_data), 200

@bp.route('/api/doctor/<int:doctor_id>/availability', methods=['GET'])
def get_doctor_availability(doctor_id):
    """Get availability for a specific doctor (for patients)"""
    doctor = Doctor.query.get_or_404(doctor_id)
    
    if doctor.availability:
        availability_data = json.loads(doctor.availability)
    else:
        availability_data = {}
    
    return jsonify(availability_data), 200

# --- Doctor: Enhanced Dashboard Features ---
@bp.route('/api/doctor/appointments/upcoming', methods=['GET'])
@jwt_required()
def doctor_upcoming_appointments():
    """Get upcoming appointments for doctor (next 7 days)"""
    current_user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(user_id=current_user_id).first()
    
    if not doctor:
        return jsonify({"msg": "Doctor profile not found"}), 404
    
    # Get appointments for next 7 days
    today = datetime.now()
    next_week = today + timedelta(days=7)
    
    appointments = Appointment.query.filter(
        Appointment.doctor_id == doctor.id,
        Appointment.status == 'Booked',
        Appointment.date_time >= today,
        Appointment.date_time <= next_week
    ).order_by(Appointment.date_time).all()
    
    result = []
    for a in appointments:
        result.append({
            "id": a.id,
            "patient_name": a.patient.user.username,
            "patient_id": a.patient.id,
            "date_time": a.date_time.isoformat(),
            "status": a.status
        })
    return jsonify(result), 200

@bp.route('/api/doctor/patients', methods=['GET'])
@jwt_required()
def doctor_patients():
    """Get list of unique patients assigned to this doctor"""
    current_user_id = get_jwt_identity()
    doctor = Doctor.query.filter_by(user_id=current_user_id).first()
    
    if not doctor:
        return jsonify({"msg": "Doctor profile not found"}), 404
    
    # Get unique patients who have appointments with this doctor
    patient_ids = db.session.query(Appointment.patient_id).filter(
        Appointment.doctor_id == doctor.id
    ).distinct().all()
    
    result = []
    for pid_tuple in patient_ids:
        patient = Patient.query.get(pid_tuple[0])
        if patient:
            # Count appointments for this patient
            appt_count = Appointment.query.filter_by(
                doctor_id=doctor.id,
                patient_id=patient.id
            ).count()
            
            result.append({
                "id": patient.id,
                "username": patient.user.username,
                "email": patient.user.email,
                "total_appointments": appt_count
            })
    
    return jsonify(result), 200
