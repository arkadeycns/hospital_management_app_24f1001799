from celery import Celery
from config import Config
from datetime import date, timedelta
import time
import csv
from io import StringIO

def make_celery(app_name=__name__):
    return Celery(app_name, broker=Config.CELERY_BROKER_URL, backend=Config.CELERY_RESULT_BACKEND)

celery = make_celery()

@celery.task
def send_daily_reminders():
    """Send daily reminders to patients with appointments tomorrow"""
    from app import app
    from models import db, Appointment, Patient
    
    with app.app_context():
        tomorrow = date.today() + timedelta(days=1)
        appointments = Appointment.query.filter(
            db.func.date(Appointment.date_time) == tomorrow,
            Appointment.status == 'Booked'
        ).all()
        
        reminders_sent = 0
        for appt in appointments:
            patient_email = appt.patient.user.email
            doctor_name = appt.doctor.user.username
            appt_time = appt.date_time.strftime('%I:%M %p')
            
            # In production, use actual email service
            message = f"""
            Dear {appt.patient.user.username},
            
            This is a reminder for your appointment tomorrow.
            
            Doctor: Dr. {doctor_name}
            Time: {appt_time}
            
            Please arrive 15 minutes early.
            
            Best regards,
            Hospital Management System
            """
            
            print(f"[REMINDER] Sending to {patient_email}: {message}")
            # TODO: Replace with actual email/SMS sending
            # send_email(patient_email, "Appointment Reminder", message)
            reminders_sent += 1
        
        print(f"Daily reminders sent: {reminders_sent}")
        return f"Sent {reminders_sent} reminders"

@celery.task
def generate_monthly_report(doctor_id):
    """Generate monthly activity report for a doctor"""
    from app import app
    from models import db, Appointment, Doctor
    from datetime import datetime
    
    with app.app_context():
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return "Doctor not found"
        
        # Get last month's data
        today = date.today()
        first_day_last_month = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
        last_day_last_month = today.replace(day=1) - timedelta(days=1)
        
        appointments = Appointment.query.filter(
            Appointment.doctor_id == doctor_id,
            Appointment.date_time >= first_day_last_month,
            Appointment.date_time <= last_day_last_month
        ).all()
        
        total_appts = len(appointments)
        completed = len([a for a in appointments if a.status == 'Completed'])
        cancelled = len([a for a in appointments if a.status == 'Cancelled'])
        
        # Create HTML report
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1 {{ color: #333; }}
                table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
                th {{ background-color: #4CAF50; color: white; }}
                .summary {{ background-color: #f2f2f2; padding: 15px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <h1>Monthly Activity Report - Dr. {doctor.user.username}</h1>
            <p><strong>Period:</strong> {first_day_last_month.strftime('%B %Y')}</p>
            
            <div class="summary">
                <h2>Summary</h2>
                <p>Total Appointments: {total_appts}</p>
                <p>Completed: {completed}</p>
                <p>Cancelled: {cancelled}</p>
            </div>
            
            <h2>Appointment Details</h2>
            <table>
                <tr>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Status</th>
                    <th>Diagnosis</th>
                </tr>
        """
        
        for appt in appointments:
            html_content += f"""
                <tr>
                    <td>{appt.date_time.strftime('%Y-%m-%d %H:%M')}</td>
                    <td>{appt.patient.user.username}</td>
                    <td>{appt.status}</td>
                    <td>{appt.diagnosis or 'N/A'}</td>
                </tr>
            """
        
        html_content += """
            </table>
        </body>
        </html>
        """
        
        # Save report
        filename = f"monthly_report_doctor_{doctor_id}_{first_day_last_month.strftime('%Y_%m')}.html"
        with open(filename, 'w') as f:
            f.write(html_content)
        
        print(f"[REPORT] Generated: {filename}")
        # TODO: Send email with report
        # send_email(doctor.user.email, "Monthly Activity Report", html_content)
        
        return f"Report generated: {filename}"

@celery.task
def export_patient_history(patient_id):
    """Export patient treatment history as CSV"""
    from app import app
    from models import db, Appointment, Patient
    
    with app.app_context():
        patient = Patient.query.get(patient_id)
        if not patient:
            return "Patient not found"
        
        appointments = Appointment.query.filter_by(
            patient_id=patient_id,
            status='Completed'
        ).all()
        
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'Appointment ID',
            'Date',
            'Doctor',
            'Specialization',
            'Diagnosis',
            'Prescription',
            'Notes'
        ])
        
        for appt in appointments:
            writer.writerow([
                appt.id,
                appt.date_time.strftime('%Y-%m-%d %H:%M'),
                appt.doctor.user.username,
                appt.doctor.specialization,
                appt.diagnosis or '',
                appt.prescription or '',
                appt.notes or ''
            ])
        
        # Save CSV file
        filename = f"patient_{patient_id}_history.csv"
        with open(filename, 'w', newline='') as f:
            f.write(output.getvalue())
        
        print(f"[EXPORT] CSV created: {filename}")
        # TODO: Send email with CSV attachment
        # send_email(patient.user.email, "Your Treatment History", attachment=filename)
        
        return f"CSV exported: {filename}"
