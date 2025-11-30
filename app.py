from flask import Flask
from config import Config
from models import db, User
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_caching import Cache
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(app)
cache = Cache(app)

from routes import bp as main_bp
app.register_blueprint(main_bp)

def create_admin():
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(role='admin').first():
            print("Creating Admin User...")
            hashed_password = generate_password_hash('admin123')
            admin = User(username='admin', email='admin@hospital.com', role='admin', password=hashed_password)
            db.session.add(admin)
            db.session.commit()
            print("Admin User Created.")

if __name__ == '__main__':
    create_admin()
    app.run(debug=True)
