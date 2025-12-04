from flask import Blueprint, request, jsonify
from urllib.parse import unquote
from .db import db, User, ClientData, Class, Lecture, class_user_association
from datetime import datetime, timedelta, timezone
import jwt
import os
import hashlib
import pdf2image

api = Blueprint("api", __name__)

SECRET_KEY = "debug-secret--------------------"
ALGORITHM = "HS256"
SERVER_NAME = "VRClass S1"
UPLOAD_FOLDER = 'uploads'
RESOURCE_FOLDER = 'static/pdfresources'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESOURCE_FOLDER, exist_ok=True)

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
    gender = data.get('gender', 'M')
    if isinstance(gender, str):
        gender = gender.strip().upper()[:1]
    if gender not in ('M', 'F'):
        return jsonify({"error": "Invalid gender. Use 'M' or 'F'."}), 200
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

    new_user = User(username=username, password=password, gender=gender)
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

            # Optional gender update (validate 'M' or 'F')
            if 'gender' in data:
                g = data.get('gender')
                if isinstance(g, str):
                    g = g.strip().upper()[:1]
                if g not in ('M', 'F'):
                    return jsonify({"error": "Invalid gender. Use 'M' or 'F'."}), 200
                user.gender = g

            if clientdata.mode == 1:
                rollno = data.get('rollno', clientdata.rollno)
                division = data.get('division', clientdata.division)
                department = data.get('department', clientdata.department)

                clientdata.rollno = rollno
                clientdata.division = division
                clientdata.department = department
            
            elif clientdata.mode == 2:
                designation = data.get('designation', clientdata.designation)
                employeeid = data.get('employeeid', clientdata.employeeid)
                department = data.get('department', clientdata.department)

                clientdata.designation = designation
                clientdata.employeeid = employeeid
                clientdata.department = department

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
                "gender": {"M": "Male", "F": "Female"}.get(user.gender, '-'),
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
    decoded_classid = unquote(classid) if classid else classid
    cls = Class.query.filter_by(classid=decoded_classid).first()
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
    return jsonify({"classid": decoded_classid, "students": students, "teachers": teachers}), 200


@api.route('/user/classes', methods=['POST'])
def user_classes_by_token():
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

    classes = [{
        "classid": c.classid,
        "classname": c.classname
    } for c in user.classes]

    return jsonify({"username": clientId, "classes": classes}), 200


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


# -------- Lecture Scheduling --------

@api.route('/lecture/schedule', methods=['POST'])
def lecture_schedule():
    data = request.json
    auth_token = data.get('authToken')
    classid = data.get('classid')
    title = data.get('title')
    start_time_str = data.get('startTime')  # ISO8601 string optional

    if not all([auth_token, classid, title]):
        return jsonify({"error": "authToken, classid, title required"}), 200

    decoded = decode_token(auth_token)
    if 'error' in decoded:
        return jsonify(decoded), 200

    clientId = decoded.get('clientId')
    user = User.query.filter_by(username=clientId).first()
    if not user:
        return jsonify({"error": "User not found"}), 200

    # Ensure user is teacher (mode == 2) via ClientData
    clientdata = ClientData.query.filter_by(userid=user.id).first()
    if not clientdata or clientdata.mode != 2:
        return jsonify({"error": "Only teachers can schedule lectures"}), 200

    cls = Class.query.filter_by(classid=classid).first()
    if not cls:
        return jsonify({"error": "Class not found"}), 200

    # Optional: verify teacher is associated with class as role=2 or is class teacher
    association = db.session.execute(
        class_user_association.select().where(
            (class_user_association.c.user_id == user.id) & (class_user_association.c.class_id == cls.id) & (class_user_association.c.role == 2)
        )
    ).first()
    if not association and cls.teacherid != user.id:
        return jsonify({"error": "Teacher not associated with class"}), 200

    # Parse start time; default now (UTC naive to match existing seed data style)
    if start_time_str:
        try:
            # Accept both with and without timezone; store naive UTC if tz-aware
            dt = datetime.fromisoformat(start_time_str)
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            start_time = dt
        except Exception:
            return jsonify({"error": "Invalid startTime format. Use ISO8601."}), 200
    else:
        start_time = datetime.utcnow()

    new_lec = Lecture(
        class_id=cls.id,
        title=title,
        teacherid=user.id,
        start_time=start_time,
        end_time=None
    )
    db.session.add(new_lec)
    db.session.commit()

    return jsonify({"success": True, "lecture": serialize_lecture(new_lec)}), 200


@api.route('/lecture/end', methods=['POST'])
def lecture_end():
    data = request.json
    auth_token = data.get('authToken')
    lecture_id = data.get('lectureId')  # numeric id
    # We now always use current UTC time; ignore any provided endTime.

    if not all([auth_token, lecture_id]):
        return jsonify({"error": "authToken and lectureId required"}), 200

    decoded = decode_token(auth_token)
    if 'error' in decoded:
        return jsonify(decoded), 200

    clientId = decoded.get('clientId')
    user = User.query.filter_by(username=clientId).first()
    if not user:
        return jsonify({"error": "User not found"}), 200

    lecture = Lecture.query.filter_by(id=lecture_id).first()
    if not lecture:
        return jsonify({"error": "Lecture not found"}), 200

    # Verify teacher privileges and ownership
    clientdata = ClientData.query.filter_by(userid=user.id).first()
    if not clientdata or clientdata.mode != 2:
        return jsonify({"error": "Only teachers can end lectures"}), 200
    if lecture.teacherid != user.id:
        return jsonify({"error": "You are not the lecture's teacher"}), 200

    if lecture.end_time is not None:
        return jsonify({"error": "Lecture already ended"}), 200

    end_time = datetime.utcnow()

    # Ensure end_time is not before start_time
    if end_time < lecture.start_time:
        return jsonify({"error": "endTime cannot be before startTime"}), 200

    lecture.end_time = end_time
    db.session.commit()

    return jsonify({"success": True, "lecture": serialize_lecture(lecture)}), 200


# --------- File Upload Endpoint ---------

@api.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        hasher = hashlib.sha256()
        for chunk in iter(lambda: file.stream.read(8192), b''):
            hasher.update(chunk)
        file.stream.seek(0)
        filename = hasher.hexdigest()
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        
        # Flask saves the file automatically
        file.save(save_path)
        
        return jsonify({
            "message": "File uploaded successfully",
            "filehash": filename,
        }), 200
    
    return jsonify({"error": "File upload failed"}), 500


@api.route('/processPDF', methods=['POST'])
def process_pdf():
    data = request.json
    filename = data.get('filehash')
    if not filename:
        return jsonify({"error": "filename required"}), 400
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404
    
    images = pdf2image.convert_from_path(filepath)
    outpath = os.path.join(RESOURCE_FOLDER, filename)
    os.makedirs(outpath, exist_ok=True)

    for i, img in enumerate(images):
        img_path = os.path.join(outpath, f"{i+1}.png")
        img.save(img_path, 'PNG')

    return jsonify({
        "success": True,
        "message": "PDF processed successfully",
        "imageCount": len(images),
        "resourcePath": outpath
    }), 200