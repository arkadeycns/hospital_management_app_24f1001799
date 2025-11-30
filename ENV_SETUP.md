# Environment Setup Guide

## Creating Your .env File

The `.env` file contains sensitive configuration and is gitignored for security. Follow these steps:

### 1. Copy the Example File
```bash
cp .env.example .env
```

### 2. Edit the .env File
Open `.env` and update the values:

#### Required Changes for Production:
```env
SECRET_KEY=<generate-a-random-secret-key>
JWT_SECRET_KEY=<generate-another-random-secret-key>
```

To generate secure keys in Python:
```python
import secrets
print(secrets.token_hex(32))
```

#### Email Configuration (Optional - for background jobs):
```env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password
MAIL_DEFAULT_SENDER=your-email@gmail.com
```

**Note:** For Gmail, you need to:
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password (not your regular password)

### 3. Redis Configuration
If Redis is not on localhost:
```env
REDIS_HOST=your-redis-host
REDIS_PORT=6379
```

### 4. Database
Default SQLite works out of the box:
```env
DATABASE_URL=sqlite:///hms.db
```

For production, consider PostgreSQL:
```env
DATABASE_URL=postgresql://user:password@localhost/hms_db
```

---

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask session encryption | (required) |
| `JWT_SECRET_KEY` | JWT token signing | (required) |
| `DATABASE_URL` | Database connection | `sqlite:///hms.db` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `CELERY_BROKER_URL` | Celery message broker | `redis://localhost:6379/0` |
| `MAIL_SERVER` | SMTP server | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USERNAME` | Email username | (empty) |
| `MAIL_PASSWORD` | Email password | (empty) |
| `ADMIN_USERNAME` | Default admin username | `admin` |
| `ADMIN_PASSWORD` | Default admin password | `admin123` |

---

## Security Best Practices

1. ✅ **Never commit `.env` to Git** (already in .gitignore)
2. ✅ **Use strong, random keys** for SECRET_KEY and JWT_SECRET_KEY
3. ✅ **Change default admin password** in production
4. ✅ **Use environment-specific .env files** (.env.development, .env.production)
5. ✅ **Store production secrets securely** (use secret managers in cloud)

---

## Quick Start

```bash
# 1. Copy example
cp .env.example .env

# 2. Edit .env with your values
nano .env

# 3. Run application
python app.py
```

The application will automatically load variables from `.env` on startup.
