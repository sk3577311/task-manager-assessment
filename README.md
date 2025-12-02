# Task Manager API + Frontend (Flask + Playwright)

A complete Task Manager application built with **Flask (Python)** backend and a **vanilla HTML/CSS/JS frontend**, supporting:

- User registration & login (JWT)
- Admin & regular user roles
- Task CRUD (Create/Read/Update/Delete)
- Pagination & filtering
- CORS-enabled API
- Swagger API documentation
- Frontend with toast notifications
- Automated Playwright tests (API + UI)

---

# 🚀 Features

### 🔐 Authentication
- JWT-based login
- Registration
- Auto-seeding of an **admin** user at startup:
  - **username:** `admin`
  - **password:** `admin123`
  - **role:** `admin`

### ✔ Authorization
- Admins can see, update, delete **all tasks**
- Regular users can only manage **their own tasks**

### 📝 Tasks API
- GET /tasks (with pagination + filtering)
- POST /tasks
- PUT /tasks/{id}
- DELETE /tasks/{id}

### 💻 Frontend
- Pure HTML + CSS + JS (no frameworks)
- Login / Register pages
- Tasks dashboard with:
  - Task creation
  - Pagination
  - Filters
  - Edit/Delete buttons
  - Toast notifications

### 🧪 Tests
- Playwright **API tests**
- Playwright **UI end-to-end tests**
- Registered under `tests/`

---

# 📦 Project Structure

---

# 🛠 Installation & Setup

## 1️⃣ Clone the repository
```bash
git clone https://github.com/<your-username>/<repo>.git
cd <repo>
```

2️⃣ Install Python dependencies
pip install -r requirements.txt

3️⃣ Install Playwright dependencies
npx playwright install

4️⃣ Start the Flask backend
python app.py

Backend runs at:
http://localhost:5000

Swagger documentation:
http://localhost:5000/apidocs

5️⃣ Open the frontend

Serve the frontend folder using any static server:

Option A: VSCode Live Server

Right-click → "Open with Live Server"

Option B: Python simple HTTP server
cd frontend
python -m http.server 3000


Frontend will open at:

http://localhost:3000

🔐 Admin Seeder

On app startup, an admin account is auto-created if not present:

username: admin
password: admin123
role: admin


This is handled in create_app() inside app.py.

🧪 Running Tests
Run all Playwright tests:
npx playwright test

Run only API tests:
npx playwright test tests/api

Run only UI tests (headless):
npx playwright test tests/e2e

Run UI tests with browser visible:
npx playwright test tests/e2e --headed