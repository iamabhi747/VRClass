from flask import Blueprint, request, jsonify
from .db import db, User, ClientData, Class, Lecture, class_user_association
from datetime import datetime, timedelta, timezone
import jwt

api = Blueprint("api", __name__)

SECRET_KEY = "ifguwifgwbd756763ygihqvdwES$%$ghwbvdcyw8"
ALGORITHM = "HS256"
SERVER_NAME = "VRClass S1"

def create_jwt_token(data: dict, minutes_to_expire: int = 60 * 24 * 365) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=minutes_to_expire)
    data.update({"exp": expire})
    encoded_jwt = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(auth_token: str):
    try:
        return jwt.decode(auth_token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        return {"error": "Token has expired"}
    except jwt.InvalidTokenError:
        return {"error": "Invalid token"}

@api.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username, password=password).first()
    clientdata = ClientData.query.filter_by(userid=user.id).first() if user else None
    if user:
        return jsonify({
            "authToken": create_jwt_token({
                "clientId": user.username,
                "name": clientdata.name,
                "serverName": SERVER_NAME,
                "avatarUrl": clientdata.avatarUrl if clientdata.avatarUrl else "",
                "mode": clientdata.mode,
                "positionIndex": -1
            }),
            "clientId": user.username
        }), 200
    return jsonify({"error": "Invalid credentials"}), 200


@api.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    name = data.get('name', "Nick" + str(int(datetime.now().timestamp())))
    mode = data.get('mode', 1)
    avatarUrl = data.get('avatarUrl', "")

    if mode == 1:
        rollno = data.get('rollno', "00")
        division = data.get('division', "A")
        department = data.get('department', "XX")
    
    elif mode == 2:
        designation = data.get('designation', "Staff")
        employeeid = data.get('employeeid', "00")
        department = data.get('department', "XX")

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 200

    new_user = User(username=username, password=password)
    db.session.add(new_user)
    db.session.commit()

    new_clientdata = ClientData(userid=new_user.id, name=name, mode=mode, avatarUrl=avatarUrl,
                                rollno=rollno if mode == 1 else None,
                                division=division if mode == 1 else None,
                                department=department,
                                employeeid=employeeid if mode == 2 else None,
                                designation=designation if mode == 2 else None
                                )
    db.session.add(new_clientdata)
    db.session.commit()

    return jsonify({
        "authToken": create_jwt_token({
            "clientId": new_user.username,
            "name": new_clientdata.name,
            "serverName": SERVER_NAME,
            "avatarUrl": new_clientdata.avatarUrl,
            "mode": new_clientdata.mode,
            "positionIndex": -1
        }),
        "clientId": new_user.username
    }), 200

@api.route('/profile', methods=['GET', 'POST'])
def profile():
    data = request.json
    authToken = data.get('authToken')

    try:
        decoded_token = jwt.decode(authToken, SECRET_KEY, algorithms=[ALGORITHM])
        clientId = decoded_token.get("clientId")
        user = User.query.filter_by(username=clientId).first()
        clientdata = ClientData.query.filter_by(userid=user.id).first() if user else None

        if user and clientdata and request.method == 'GET':
            return jsonify({
                "clientId": user.username,
                "name": clientdata.name,
                "serverName": SERVER_NAME,
                "avatarUrl": clientdata.avatarUrl,
                "mode": clientdata.mode,
                "positionIndex": -1
            }), 200
        elif user and clientdata and request.method == 'POST':
            name = data.get('name', clientdata.name)
            avatarUrl = data.get('avatarUrl', clientdata.avatarUrl)

            clientdata.name = name
            clientdata.avatarUrl = avatarUrl
            db.session.commit()

            return jsonify({
                "authToken": create_jwt_token({
                    "clientId": user.username,
                    "name": clientdata.name,
                    "serverName": SERVER_NAME,
                    "avatarUrl": clientdata.avatarUrl,
                    "mode": clientdata.mode,
                    "positionIndex": -1
                }),
                "clientId": user.username
            }), 200
        else:
            return jsonify({"error": "User not found"}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 200
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 200
    

@api.route('/generalprofile', methods=['POST'])
def generalprofile():
    data = request.json
    authToken = data.get('authToken')

    try:
        decoded_token = jwt.decode(authToken, SECRET_KEY, algorithms=[ALGORITHM])
        clientId = decoded_token.get("clientId")
        user = User.query.filter_by(username=clientId).first()
        clientdata = ClientData.query.filter_by(userid=user.id).first() if user else None

        if user and clientdata:
            out = {
                "clientId": user.username,
                "name": clientdata.name,
                "avatarUrl": clientdata.avatarUrl,
                "mode": clientdata.mode,
            }
            if clientdata.mode == 1:
                out.update({
                    "rollno": clientdata.rollno,
                    "division": clientdata.division,
                    "department": clientdata.department
                })
            elif clientdata.mode == 2:
                out.update({
                    "designation": clientdata.designation,
                    "employeeid": clientdata.employeeid,
                    "department": clientdata.department
                })
            return jsonify(out), 200
        else:
            return jsonify({"error": "User not found"}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 200
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 200

@api.route('/verifytoken', methods=['POST'])
def verifytoken():
    data = request.json
    authtoken = data.get('authToken')
    clientId = data.get('clientId')

    try:
        decoded_token = jwt.decode(authtoken, SECRET_KEY, algorithms=[ALGORITHM])
        if decoded_token.get("clientId") == clientId:
            return jsonify({
                "success": True,
                "message": "Token is valid"
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Client ID does not match"
            }), 200
    except jwt.ExpiredSignatureError:
        return jsonify({
            "success": False,
            "message": "Token has expired"
        }), 200
    except jwt.InvalidTokenError:
        return jsonify({
            "success": False,
            "message": "Invalid token"
        }), 200


# -------- Class Management Endpoints --------

@api.route('/class/create', methods=['POST'])
def class_create():
    data = request.json
    auth_token = data.get('authToken')
    classid = data.get('classid', 'XYZ-' + str(int(datetime.now().timestamp())))
    classname = data.get('classname')

    if not all([auth_token, classid, classname]):
        return jsonify({"error": "authToken, classid, classname required"}), 200

    decoded = decode_token(auth_token)
    if 'error' in decoded:
        return jsonify(decoded), 200

    clientId = decoded.get('clientId')
    user = User.query.filter_by(username=clientId).first()
    if not user:
        return jsonify({"error": "User not found"}), 200

    if Class.query.filter_by(classid=classid).first():
        return jsonify({"error": "Class already exists"}), 200

    new_class = Class(classid=classid, classname=classname, teacherid=user.id)
    db.session.add(new_class)
    db.session.commit()
    # Automatically associate creator as teacher (role=2)
    db.session.execute(
        class_user_association.insert().values(user_id=user.id, class_id=new_class.id, role=2)
    )
    db.session.commit()
    return jsonify({"success": True, "classid": classid, "classname": classname}), 200


@api.route('/class/join', methods=['POST'])
def class_join():
    data = request.json
    auth_token = data.get('authToken')
    classid = data.get('classid')
    role = data.get('role', 1)  # default student

    if not all([auth_token, classid]):
        return jsonify({"error": "authToken and classid required"}), 200

    decoded = decode_token(auth_token)
    if 'error' in decoded:
        return jsonify(decoded), 200

    clientId = decoded.get('clientId')
    user = User.query.filter_by(username=clientId).first()
    cls = Class.query.filter_by(classid=classid).first()
    if not user or not cls:
        return jsonify({"error": "User or Class not found"}), 200

    # Check if already associated
    existing = db.session.execute(
        class_user_association.select().where(
            (class_user_association.c.user_id == user.id) & (class_user_association.c.class_id == cls.id)
        )
    ).first()
    if existing:
        return jsonify({"error": "Already joined"}), 200

    db.session.execute(
        class_user_association.insert().values(user_id=user.id, class_id=cls.id, role=role)
    )
    db.session.commit()
    return jsonify({"success": True, "message": "Joined class", "classid": classid}), 200


@api.route('/class/leave', methods=['POST'])
def class_leave():
    data = request.json
    auth_token = data.get('authToken')
    classid = data.get('classid')

    if not all([auth_token, classid]):
        return jsonify({"error": "authToken and classid required"}), 200

    decoded = decode_token(auth_token)
    if 'error' in decoded:
        return jsonify(decoded), 200

    clientId = decoded.get('clientId')
    user = User.query.filter_by(username=clientId).first()
    cls = Class.query.filter_by(classid=classid).first()
    if not user or not cls:
        return jsonify({"error": "User or Class not found"}), 200

    db.session.execute(
        class_user_association.delete().where(
            (class_user_association.c.user_id == user.id) & (class_user_association.c.class_id == cls.id)
        )
    )
    db.session.commit()
    return jsonify({"success": True, "message": "Left class", "classid": classid}), 200


@api.route('/class/<classid>/users', methods=['GET'])
def class_users(classid):
    cls = Class.query.filter_by(classid=classid).first()
    if not cls:
        return jsonify({"error": "Class not found"}), 200
    students = db.session.execute(
        class_user_association.select().where(
            (class_user_association.c.class_id == cls.id) & (class_user_association.c.role == 1)
        )
    ).fetchall()
    teachers = db.session.execute(
        class_user_association.select().where(
            (class_user_association.c.class_id == cls.id) & (class_user_association.c.role == 2)
        )
    ).fetchall()
    return jsonify({"classid": classid, "students": students, "teachers": teachers}), 200


@api.route('/user/<username>/classes', methods=['GET'])
def user_classes(username):
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "User not found"}), 200
    classes = [{
        "classid": c.classid,
        "classname": c.classname
    } for c in user.classes]
    return jsonify({"username": username, "classes": classes}), 200


# -------- Lecture Endpoints --------

def serialize_lecture(lec: Lecture):
    return {
        "id": lec.id,
        "classid": lec.clazz.classid if lec.clazz else None,
        "title": lec.title,
        "teacher": lec.teacher.username if lec.teacher else None,
        "startTime": lec.start_time.isoformat() if lec.start_time else None,
        "endTime": lec.end_time.isoformat() if lec.end_time else None
    }


@api.route('/lectures/live', methods=['POST'])
def lectures_live():
    data = request.json
    auth_token = data.get('authToken')
    if not auth_token:
        return jsonify({"error": "authToken required"}), 200

    decoded = decode_token(auth_token)
    if 'error' in decoded:
        return jsonify(decoded), 200

    clientId = decoded.get('clientId')
    user = User.query.filter_by(username=clientId).first()
    if not user:
        return jsonify({"error": "User not found"}), 200

    q = (
        Lecture.query
        .join(Class, Lecture.class_id == Class.id)
        .join(class_user_association, class_user_association.c.class_id == Class.id)
        .filter(class_user_association.c.user_id == user.id)
        .filter(Lecture.end_time.is_(None))
        .order_by(Lecture.start_time.asc())
    )

    lectures = [serialize_lecture(l) for l in q.all()]
    return jsonify({"lectures": lectures}), 200


@api.route('/lectures/past', methods=['POST'])
def lectures_past():
    data = request.json
    auth_token = data.get('authToken')
    limit = int(data.get('limit', 10))
    if not auth_token:
        return jsonify({"error": "authToken required"}), 200

    decoded = decode_token(auth_token)
    if 'error' in decoded:
        return jsonify(decoded), 200

    clientId = decoded.get('clientId')
    user = User.query.filter_by(username=clientId).first()
    if not user:
        return jsonify({"error": "User not found"}), 200

    q = (
        Lecture.query
        .join(Class, Lecture.class_id == Class.id)
        .join(class_user_association, class_user_association.c.class_id == Class.id)
        .filter(class_user_association.c.user_id == user.id)
        .filter(Lecture.end_time.is_not(None))
        .order_by(Lecture.end_time.desc())
        .limit(limit)
    )

    lectures = [serialize_lecture(l) for l in q.all()]
    return jsonify({"lectures": lectures}), 200