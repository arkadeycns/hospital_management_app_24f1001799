"""
Sample Data Generator for Hospital Management System
Run this script to populate the database with test data
"""

from app import app
from models import db, User, Doctor, Patient, Appointment
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

def create_sample_data():
    with app.app_context():
        print("Creating sample data...")
        
        # Reset Database
        print("Resetting database...")
        db.drop_all()
        db.create_all()
        
        # Create Admin
        print("Creating Admin User...")
        hashed_password = generate_password_hash('admin123')
        admin = User(username='admin', email='admin@hospital.com', role='admin', password=hashed_password)
        db.session.add(admin)
        db.session.commit()
        print("Admin User Created.")
        
        # Create sample doctors
        print("\nCreating doctors...")
        doctors_data = [
            {'username': 'dr_smith', 'email': 'smith@hospital.com', 'password': 'doctor123', 'specialization': 'Cardiology'},
            {'username': 'dr_johnson', 'email': 'johnson@hospital.com', 'password': 'doctor123', 'specialization': 'Neurology'},
            {'username': 'dr_williams', 'email': 'williams@hospital.com', 'password': 'doctor123', 'specialization': 'Orthopedics'},
            {'username': 'dr_brown', 'email': 'brown@hospital.com', 'password': 'doctor123', 'specialization': 'Pediatrics'},
            {'username': 'dr_davis', 'email': 'davis@hospital.com', 'password': 'doctor123', 'specialization': 'Dermatology'},
        ]
        
        doctors = []
        for data in doctors_data:
            hashed_pw = generate_password_hash(data['password'])
            user = User(username=data['username'], email=data['email'], password=hashed_pw, role='doctor')
            db.session.add(user)
            db.session.flush()
            
            doctor = Doctor(user_id=user.id, specialization=data['specialization'], is_approved=True)
            db.session.add(doctor)
            db.session.flush()
            doctors.append(doctor)
            print(f"  ✓ Created doctor: {data['username']} ({data['specialization']})")
        
        db.session.commit()
        
        # Create sample patients
        print("\nCreating patients...")
        patients_data = [
            {'username': 'john_doe', 'email': 'john@example.com', 'password': 'patient123', 'address': '123 Main St'},
            {'username': 'jane_smith', 'email': 'jane@example.com', 'password': 'patient123', 'address': '456 Oak Ave'},
            {'username': 'bob_wilson', 'email': 'bob@example.com', 'password': 'patient123', 'address': '789 Pine Rd'},
            {'username': 'alice_brown', 'email': 'alice@example.com', 'password': 'patient123', 'address': '321 Elm St'},
            {'username': 'charlie_davis', 'email': 'charlie@example.com', 'password': 'patient123', 'address': '654 Maple Dr'},
        ]
        
        patients = []
        for data in patients_data:
            hashed_pw = generate_password_hash(data['password'])
            user = User(username=data['username'], email=data['email'], password=hashed_pw, role='patient')
            db.session.add(user)
            db.session.flush()
            
            patient = Patient(user_id=user.id, address=data['address'])
            db.session.add(patient)
            db.session.flush()
            patients.append(patient)
            print(f"  ✓ Created patient: {data['username']}")
        
        db.session.commit()
        
        # Create sample appointments
        print("\nCreating appointments...")
        statuses = ['Booked', 'Completed', 'Cancelled']
        diagnoses = ['Common Cold', 'Hypertension', 'Diabetes', 'Migraine', 'Back Pain', None]
        prescriptions = [
            'Take rest and drink fluids',
            'Blood pressure medication - 1 tablet daily',
            'Insulin - as per doctor instructions',
            'Pain reliever - 2 tablets when needed',
            None
        ]
        
        appointment_count = 0
        for i in range(20):  # Create 20 appointments
            patient = random.choice(patients)
            doctor = random.choice(doctors)
            
            # Random date within last 30 days or next 30 days
            days_offset = random.randint(-30, 30)
            appt_date = datetime.now() + timedelta(days=days_offset, hours=random.randint(9, 17))
            
            status = random.choice(statuses)
            
            # Only completed appointments have diagnosis/prescription
            if status == 'Completed':
                diagnosis = random.choice([d for d in diagnoses if d is not None])
                prescription = random.choice([p for p in prescriptions if p is not None])
            else:
                diagnosis = None
                prescription = None
            
            appointment = Appointment(
                patient_id=patient.id,
                doctor_id=doctor.id,
                date_time=appt_date,
                status=status,
                diagnosis=diagnosis,
                prescription=prescription
            )
            db.session.add(appointment)
            appointment_count += 1
        
        db.session.commit()
        print(f"  ✓ Created {appointment_count} appointments")
        
        print("\n" + "="*60)
        print("Sample data created successfully!")
        print("="*60)
        print("\n📋 TEST CREDENTIALS:\n")
        print("ADMIN:")
        print("  Username: admin")
        print("  Password: admin123\n")
        print("DOCTORS (all use password: doctor123):")
        for data in doctors_data:
            print(f"  Username: {data['username']} ({data['specialization']})")
        print("\nPATIENTS (all use password: patient123):")
        for data in patients_data:
            print(f"  Username: {data['username']}")
        print("\n" + "="*60)

if __name__ == '__main__':
    create_sample_data()
