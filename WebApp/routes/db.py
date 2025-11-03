from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

class ClientData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userid = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    name = db.Column(db.String(120), nullable=False)
    mode = db.Column(db.Integer, nullable=False, default=1)  # 1: student, 2: teacher
    avatarUrl = db.Column(db.String(250), nullable=True)

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
        db.session.commit()
