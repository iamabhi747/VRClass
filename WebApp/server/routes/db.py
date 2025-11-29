from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Association table for many-to-many relationship between users and classes.
# role: 1 = student, 2 = teacher (optional usage; you can ignore if not needed)
class_user_association = db.Table(
    'class_user_association',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('class_id', db.Integer, db.ForeignKey('class.id'), primary_key=True),
    db.Column('role', db.Integer, nullable=False, default=1)
)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    # Classes this user is enrolled in / associated with
    classes = db.relationship(
        'Class',
        secondary='class_user_association',
        back_populates='users'
    )

class ClientData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    userid = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    name = db.Column(db.String(120), nullable=False)
    mode = db.Column(db.Integer, nullable=False, default=1)  # 1: student, 2: teacher
    avatarUrl = db.Column(db.String(250), nullable=True)

    rollno = db.Column(db.String(20), nullable=True)
    division = db.Column(db.String(20), nullable=True)
    department = db.Column(db.String(50), nullable=True)
    employeeid = db.Column(db.String(20), nullable=True)
    designation = db.Column(db.String(50), nullable=True)

    user = db.relationship('User', backref=db.backref('clientdata', uselist=False))

class Class(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    classid = db.Column(db.String(50), unique=True, nullable=False)
    classname = db.Column(db.String(120), nullable=False)
    teacherid = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    # Users enrolled / associated with this class
    users = db.relationship(
        'User',
        secondary='class_user_association',
        back_populates='classes'
    )

class Lecture(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey('class.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    teacherid = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=True)  # set when lecture ends

    clazz = db.relationship('Class', backref=db.backref('lectures', lazy=True))
    teacher = db.relationship('User', foreign_keys=[teacherid])


def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
        db.session.commit()
