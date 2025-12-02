from flask import Blueprint, request, jsonify
from extensions import db
from models import User
from flask_jwt_extended import create_access_token
from flasgger import swag_from

bp = Blueprint("auth", __name__, url_prefix="/auth")

@bp.route("/register", methods=["POST"])
@swag_from({
    'tags': ['Auth'],
    'parameters': [
        {'name': 'body', 'in': 'body', 'schema': {
            'properties': {
                'username': {'type': 'string'},
                'password': {'type': 'string'},
                'role': {'type': 'string'}
            },
            'required': ['username', 'password']
        }}
    ],
    'responses': {'201': {'description': 'User created'}}
})
def register():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "user")

    if not username or not password:
        return jsonify({"msg": "username and password required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "username already taken"}), 400

    user = User(username=username, role=role)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "user created", "id": user.id}), 201


@bp.route("/login", methods=["POST"])
@swag_from({
    'tags': ['Auth'],
    'parameters': [
        {'name': 'body', 'in': 'body', 'schema': {
            'properties': {
                'username': {'type': 'string'},
                'password': {'type': 'string'}
            },
            'required': ['username', 'password']
        }}
    ],
    'responses': {'200': {'description': 'Login success'}}
})
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"msg": "username and password required"}), 400

    user = User.query.filter_by(username=username).first()

    if not user or not user.check_password(password):
        return jsonify({"msg": "bad username or password"}), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )

    return jsonify(access_token=access_token), 200
