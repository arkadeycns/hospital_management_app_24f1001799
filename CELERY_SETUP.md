# Celery & Celery Beat Setup Guide

## Prerequisites

Make sure Redis is installed and running on your system.

### Install Redis (if not already installed)

**Windows:**
1. Download Redis from: https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`

OR use WSL (Windows Subsystem for Linux):
```bash
sudo apt-get install redis-server
sudo service redis-server start
```

**Check if Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

---

## Running Celery Workers & Beat Scheduler

You need to run **3 separate terminals** for full functionality:

### Terminal 1: Flask App
```bash
python app.py
```

### Terminal 2: Celery Worker
This processes background tasks (CSV export, report generation, etc.)

```bash
celery -A tasks.celery worker --loglevel=info --pool=solo
```

**Note:** Use `--pool=solo` on Windows. On Linux/Mac, you can use default pool.

### Terminal 3: Celery Beat Scheduler
This runs scheduled tasks (daily reminders at 8AM, monthly reports on 1st of month)

```bash
celery -A celery_beat_config.celery beat --loglevel=info
```

---

## Scheduled Tasks Configuration

### 1. Daily Reminders
- **Schedule:** Every day at 8:00 AM
- **Task:** `send_daily_reminders`
- **Function:** Sends reminders to patients with appointments tomorrow

### 2. Monthly Reports
- **Schedule:** 1st day of every month at 9:00 AM
- **Task:** `generate_all_monthly_reports`
- **Function:** Generates activity reports for all doctors for the previous month

---

## Testing Scheduled Tasks Manually

You can trigger tasks manually for testing:

### Test Daily Reminders:
```python
from tasks import send_daily_reminders
result = send_daily_reminders.delay()
print(result.get())
```

### Test Monthly Report for a Specific Doctor:
```python
from tasks import generate_monthly_report
result = generate_monthly_report.delay(doctor_id=1)
print(result.get())
```

### Test All Monthly Reports:
```python
from tasks import generate_all_monthly_reports
result = generate_all_monthly_reports.delay()
print(result.get())
```

---

## Troubleshooting

### Redis Connection Error
**Error:** `ConnectionError: Error 10061 connecting to localhost:6379`

**Solution:**
1. Make sure Redis server is running
2. Check `config.py` has correct Redis settings:
   ```python
   CELERY_BROKER_URL = 'redis://localhost:6379/0'
   CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
   ```

### Celery Worker Not Starting
**Windows users:** Must use `--pool=solo` flag:
```bash
celery -A tasks.celery worker --loglevel=info --pool=solo
```

### Tasks Not Executing
1. Check all 3 processes are running (Flask, Celery Worker, Celery Beat)
2. Check Redis is running: `redis-cli ping`
3. Check Celery Beat logs for schedule execution

---

## Production Deployment

For production, use a process manager like **Supervisor** (Linux) or **PM2** (cross-platform).

### Using PM2:
```bash
npm install -g pm2

# Start Flask
pm2 start "python app.py" --name hospital-app

# Start Celery Worker
pm2 start "celery -A tasks.celery worker --loglevel=info" --name celery-worker

# Start Celery Beat
pm2 start "celery -A celery_beat_config.celery beat --loglevel=info" --name celery-beat

# View all processes
pm2 list

# View logs
pm2 logs
```

---

## Monitoring

View Celery tasks in real-time:

```bash
# In a separate terminal
celery -A tasks.celery events
```

Or use Flower (Celery monitoring tool):
```bash
pip install flower
celery -A tasks.celery flower
# Access at http://localhost:5555
```

---

## Summary

**Quick Start (3 Terminals):**

1. `python app.py`
2. `celery -A tasks.celery worker --loglevel=info --pool=solo`  
3. `celery -A celery_beat_config.celery beat --loglevel=info`

**All done!** 🎉 Your scheduled tasks will now run automatically.
