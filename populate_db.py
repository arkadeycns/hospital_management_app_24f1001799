from app import app, db
from models import User, Doctor, Patient, Appointment, Department
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

def populate():
    with app.app_context():
        print("Populating data...")
        
        # Create Departments (Specializations)
        specs = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology']
        
        # Create Doctors
        doctors = []
        for i, spec in enumerate(specs):
            username = f'dr_{spec.lower()}'
            if not User.query.filter_by(username=username).first():
                user = User(
                    username=username, 
                    email=f'{username}@hospital.com', 
                    password=generate_password_hash('password'), 
                    role='doctor'
                )
                db.session.add(user)
                db.session.commit()
                
                doc = Doctor(user_id=user.id, specialization=spec, is_approved=True)
                db.session.add(doc)
                db.session.commit()
                doctors.append(doc)
                print(f"Created Doctor: {username}")

        # Create Patients
        patients = []
        for i in range(5):
            username = f'patient_{i+1}'
            if not User.query.filter_by(username=username).first():
                user = User(
                    username=username, 
                    email=f'{username}@test.com', 
                    password=generate_password_hash('password'), 
                    role='patient'
                )
                db.session.add(user)
                db.session.commit()
                
                pat = Patient(user_id=user.id, address=f'Street {i+1}, City')
                db.session.add(pat)
                db.session.commit()
                patients.append(pat)
                print(f"Created Patient: {username}")

        # Create Appointments
        # Reload doctors and patients to ensure we have IDs
        doctors = Doctor.query.all()
        patients = Patient.query.all()
        
        if doctors and patients:
            # Past appointments
            for i in range(5):
                doc = random.choice(doctors)
                pat = random.choice(patients)
                date = datetime.now() - timedelta(days=random.randint(1, 30))
                appt = Appointment(
                    doctor_id=doc.id,
                    patient_id=pat.id,
                    date_time=date,
                    status='Completed',
                    diagnosis='Routine checkup',
                    prescription='Vitamins',
                    notes='Patient is healthy'
                )
                db.session.add(appt)
            
            # Future appointments
            for i in range(5):
                doc = random.choice(doctors)
                pat = random.choice(patients)
                date = datetime.now() + timedelta(days=random.randint(1, 14))
                appt = Appointment(
                    doctor_id=doc.id,
                    patient_id=pat.id,
                    date_time=date,
                    status='Booked'
                )
                db.session.add(appt)
            
            db.session.commit()
            print("Created 10 Appointments")

if __name__ == '__main__':
    populate()
