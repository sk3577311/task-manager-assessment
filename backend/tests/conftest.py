import pytest
from app import create_app
from extensions import db
from config import TestConfig
from models import User

@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        # create a test user
        user = User(username="testuser")
        user.set_password("password")
        db.session.add(user)
        admin = User(username="adminuser", role="admin")
        admin.set_password("adminpass")
        db.session.add(admin)
        db.session.commit()
    yield app
    with app.app_context():
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()
