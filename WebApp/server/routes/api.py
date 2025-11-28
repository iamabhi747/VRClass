from flask import Blueprint, request, jsonify
from .db import db, User, ClientData
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
                "avatarUrl": clientdata.avatar_url if clientdata.avatar_url else "",
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

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 200

    new_user = User(username=username, password=password)
    db.session.add(new_user)
    db.session.commit()

    new_clientdata = ClientData(userid=new_user.id, name=name, mode=mode, avatarUrl=avatarUrl)
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