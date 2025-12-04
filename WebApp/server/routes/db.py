from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta

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
    gender = db.Column(db.String(1), nullable=False, default='M')  # 'M' or 'F'

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

        # Seed initial testing data (only if empty)
        if not db.session.execute(db.select(User)).first():
            # Create teachers
            teachers = []
            for i in range(1, 2 + 1):
                gender = 'M' if i % 2 == 1 else 'F'
                u = User(username=f"t{i}@abc.edu", password="testpass", gender=gender)
                db.session.add(u)
                db.session.flush()
                cd = ClientData(
                    userid=u.id,
                    name=f"Teacher {i}",
                    mode=2,
                    avatarUrl="https://models.readyplayer.me/68cfbcc1621c04ac67af90cf.glb",
                    employeeid=f"T{i:03d}",
                    designation="Lecturer",
                    department="CS"
                )
                db.session.add(cd)
                teachers.append(u)

            # Create students
            students = []
            for i in range(1, 5 + 1):
                gender = 'M' if i % 2 == 1 else 'F'
                u = User(username=f"s{i}@abc.edu", password="testpass", gender=gender)
                db.session.add(u)
                db.session.flush()
                cd = ClientData(
                    userid=u.id,
                    name=f"Student {i}",
                    mode=1,
                    avatarUrl="https://models.readyplayer.me/68cfbcc1621c04ac67af90cf.glb",
                    rollno=f"S{i:03d}",
                    division="A",
                    department="CS"
                )
                db.session.add(cd)
                students.append(u)

            db.session.flush()

            # Create classes
            classes = []
            c1 = Class(classid="C101", classname="Intro to Programming", teacherid=teachers[0].id)
            c2 = Class(classid="C102", classname="Data Structures", teacherid=teachers[1].id)
            db.session.add_all([c1, c2])
            db.session.flush()
            classes.extend([c1, c2])

            # Enroll students
            c1.users.extend(students[:3])  # s1, s2, s3
            c2.users.extend(students[2:])  # s3, s4, s5

            # Past lectures (ended)
            now = datetime.utcnow()
            past1_start = now - timedelta(days=7, hours=2)
            past1_end = past1_start + timedelta(hours=2)
            past2_start = now - timedelta(days=3, hours=1, minutes=30)
            past2_end = past2_start + timedelta(hours=1, minutes=30)

            db.session.add_all([
                Lecture(
                    class_id=c1.id,
                    title="Variables and Control Flow",
                    teacherid=teachers[0].id,
                    start_time=past1_start,
                    end_time=past1_end
                ),
                Lecture(
                    class_id=c2.id,
                    title="Arrays and Linked Lists",
                    teacherid=teachers[1].id,
                    start_time=past2_start,
                    end_time=past2_end
                ),
            ])

            # Live lecture (started, not ended)
            live_start = now - timedelta(minutes=10)
            db.session.add(
                Lecture(
                    class_id=c1.id,
                    title="Functions Deep Dive",
                    teacherid=teachers[0].id,
                    start_time=live_start,
                    end_time=None
                )
            )

            # Scheduled upcoming lectures (not started yet)
            upcoming1_start = now + timedelta(hours=2)
            upcoming2_start = now + timedelta(days=1, hours=1)

            db.session.add_all([
                Lecture(
                    class_id=c2.id,
                    title="Stacks and Queues",
                    teacherid=teachers[1].id,
                    start_time=upcoming1_start,
                    end_time=None
                ),
                Lecture(
                    class_id=c1.id,
                    title="Recursion Basics",
                    teacherid=teachers[0].id,
                    start_time=upcoming2_start,
                    end_time=None
                ),
            ])

            db.session.commit()
