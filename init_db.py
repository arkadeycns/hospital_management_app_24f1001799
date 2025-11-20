import os
from app import app, db

with app.app_context():
    if os.path.exists('hms.db'):
        print("Database already exists.")
    else:
        print("Creating database...")
        db.create_all()
        print("Database created.")
        
    from app import create_admin
    create_admin()
