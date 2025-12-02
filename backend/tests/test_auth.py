import json

def test_register_and_login(client):
    # register
    resp = client.post("/auth/register", json={"username": "alice", "password": "pw"})
    assert resp.status_code == 201
    # login
    resp = client.post("/auth/login", json={"username": "alice", "password": "pw"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert "access_token" in data

def test_bad_login(client):
    resp = client.post("/auth/login", json={"username": "noone", "password": "x"})
    assert resp.status_code == 401 or resp.status_code == 400
