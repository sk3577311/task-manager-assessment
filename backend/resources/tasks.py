from flask import Blueprint, request, jsonify
from extensions import db
from models import Task
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from flasgger import swag_from

bp = Blueprint("tasks", __name__, url_prefix="/tasks")

def task_to_dict(task):
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
        "user_id": task.user_id,
    }

@bp.route("", methods=["GET"])
@jwt_required()
def list_tasks():
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))
    completed = request.args.get("completed", None)

    if role == "admin":
        q = Task.query
    else:
        q = Task.query.filter_by(user_id=user_id)

    if completed is not None:
        if completed.lower() in ("true", "1"):
            q = q.filter_by(completed=True)
        elif completed.lower() in ("false", "0"):
            q = q.filter_by(completed=False)

    pagination = q.order_by(Task.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    items = [task_to_dict(t) for t in pagination.items]

    return jsonify({
        "tasks": items,
        "page": page,
        "per_page": per_page,
        "total": pagination.total,
        "pages": pagination.pages
    }), 200


@bp.route("/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    task = Task.query.get_or_404(task_id)

    if role != "admin" and task.user_id != user_id:
        return jsonify({"msg": "forbidden"}), 403

    return jsonify(task_to_dict(task)), 200

@bp.route("", methods=["POST"])
@jwt_required()
def create_task():
    print("📌 RAW JSON RECEIVED:", request.data)   # <--- ADD THIS
    print("📌 PARSED JSON:", request.get_json())  # <--- AND THIS
    user_id = int(get_jwt_identity())

    data = request.get_json() or {}
    title = data.get("title")
    description = data.get("description", "")
    completed = bool(data.get("completed", False))

    if not title:
        return jsonify({"msg": "title is required"}), 400

    task = Task(
        title=title,
        description=description,
        completed=completed,
        user_id=user_id
    )

    db.session.add(task)
    db.session.commit()

    return jsonify(task_to_dict(task)), 201

@bp.route("/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    task = Task.query.get_or_404(task_id)

    if role != "admin" and task.user_id != user_id:
        return jsonify({"msg": "forbidden"}), 403

    data = request.get_json() or {}

    if "title" in data:
        task.title = data["title"]
    if "description" in data:
        task.description = data["description"]
    if "completed" in data:
        task.completed = bool(data["completed"])

    db.session.commit()
    return jsonify(task_to_dict(task)), 200

@bp.route("/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")

    task = Task.query.get_or_404(task_id)

    if role != "admin" and task.user_id != user_id:
        return jsonify({"msg": "forbidden"}), 403

    db.session.delete(task)
    db.session.commit()

    return jsonify({"msg": "deleted"}), 200
