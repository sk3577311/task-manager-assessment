import json
import pytest

def get_token(client, username="testuser", password="password"):
    r = client.post("/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200
    return r.get_json()["access_token"]

def test_create_task_requires_auth(client):
    r = client.post("/tasks", json={"title": "My Task"})
    assert r.status_code == 401  # no token

def test_create_and_get_task(client):
    token = get_token(client)
    r = client.post("/tasks", json={"title": "My Task", "description": "desc"}, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201
    data = r.get_json()
    task_id = data["id"]

    r = client.get(f"/tasks/{task_id}")
    assert r.status_code == 200
    data = r.get_json()
    assert data["title"] == "My Task"

def test_update_task_owner_only(client):
    token = get_token(client)
    r = client.post("/tasks", json={"title": "To Update"}, headers={"Authorization": f"Bearer {token}"})
    task_id = r.get_json()["id"]

    # attempt update with another user (admin user exists)
    admin_token = get_token(client, "adminuser", "adminpass")
    # admin should be allowed (because role admin)
    r2 = client.put(f"/tasks/{task_id}", json={"title": "Updated by admin"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert r2.status_code == 200
    assert r2.get_json()["title"] == "Updated by admin"

def test_delete_permission(client):
    token = get_token(client)
    r = client.post("/tasks", json={"title": "To Delete"}, headers={"Authorization": f"Bearer {token}"})
    task_id = r.get_json()["id"]

    # deletion by other non-admin should fail: create other user
    client.post("/auth/register", json={"username": "bob", "password": "b"})
    bob_token = client.post("/auth/login", json={"username": "bob", "password": "b"}).get_json()["access_token"]
    r2 = client.delete(f"/tasks/{task_id}", headers={"Authorization": f"Bearer {bob_token}"})
    assert r2.status_code == 403

    # admin can delete
    admin_token = get_token(client, "adminuser", "adminpass")
    r3 = client.delete(f"/tasks/{task_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert r3.status_code == 200

def test_list_pagination_and_filter(client):
    token = get_token(client)
    # create 15 tasks, alternate completed
    for i in range(15):
        client.post("/tasks", json={"title": f"T{i}", "completed": bool(i % 2)}, headers={"Authorization": f"Bearer {token}"})
    r = client.get("/tasks?page=1&per_page=5")
    assert r.status_code == 200
    data = r.get_json()
    assert data["per_page"] == 5
    assert len(data["tasks"]) == 5

    r = client.get("/tasks?completed=true")
    assert r.status_code == 200
    data = r.get_json()
    for t in data["tasks"]:
        assert t["completed"] == True
