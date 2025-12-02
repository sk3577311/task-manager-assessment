from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import db, jwt, swagger
from resources.auth import bp as auth_bp
from resources.tasks import bp as tasks_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    jwt.init_app(app)
    swagger.init_app(app)

    CORS(app,
         resources={r"/*": {"origins": "*"}},
         supports_credentials=True,
         allow_headers=["Authorization", "Content-Type"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

    @app.after_request
    def apply_cors(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        return response

    app.register_blueprint(auth_bp)
    app.register_blueprint(tasks_bp)

    @app.route("/")
    def index():
        return jsonify({"msg": "Task Manager API running"}), 200

    with app.app_context():
        db.create_all()
        from models import User

        admin = User.query.filter_by(username="admin").first()
        if not admin:
            admin = User(username="admin", role="admin")
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()
            print("🌟 Admin user created: admin / admin123")
        else:
            print("✔ Admin user exists")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
