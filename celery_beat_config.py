from celery import Celery
from celery.schedules import crontab
from config import Config

def make_celery(app_name=__name__()):
    celery_app = Celery(
        app_name,
        broker=Config.CELERY_BROKER_URL,
        backend=Config.CELERY_RESULT_BACKEND
    )
    return celery_app

celery = make_celery()

# Celery Beat Schedule Configuration
celery.conf.beat_schedule = {
    # Send daily reminders every day at 8:00 AM
    'send-daily-reminders': {
        'task': 'tasks.send_daily_reminders',
        'schedule': crontab(hour=8, minute=0),  # 8:00 AM every day
    },
    # Generate monthly reports on the 1st of every month at 9:00 AM  
    'generate-monthly-reports': {
        'task': 'tasks.generate_all_monthly_reports',
        'schedule': crontab(day_of_month=1, hour=9, minute=0),  # 1st day of month at 9:00 AM
    },
}

celery.conf.timezone = 'Asia/Kolkata'  # Set to Indian timezone
