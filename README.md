# 📚 Goodreads Clone – Docker Setup Guide

This project consists of a **frontend**, **backend**, and **PostgreSQL database**, all orchestrated using Docker Compose.

---

## 🧱 Project Structure

```
.
├── frontend/        # Frontend (e.g., Vite + React)
├── backend/         # Backend (Node.js + Express)
├── init-scripts/    # SQL initialization scripts for PostgreSQL
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Prerequisites

* Docker
* Docker Compose (or Docker Desktop which includes it)
* Git

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repo-url>
cd <repo-folder>
```

---

### 2. Set Environment Variables

Create a local `.env` file from the template:

```bash
cp .env.example .env
```

Then update values in `.env` (Docker Compose reads this automatically):

* `DATABASE_URL`
* `JWT_ACCESS_SECRET`
* `JWT_REFRESH_SECRET`
* `POSTGRES_PASSWORD`
* `GOOGLE_BOOKS_API_KEY`

Example:

```
DATABASE_URL=postgresql://postgres:password@db:5432/goodreads
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
GOOGLE_BOOKS_API_KEY=your_google_books_api_key
```

---

### 3. Build and Run Containers

```bash
docker-compose up --build
```

This will:

* Build frontend and backend images
* Start PostgreSQL database
* Run all services together

---

### 4. Access the Application

* Frontend: [http://localhost:5173](http://localhost:5173)
* Backend API: [http://localhost:8080](http://localhost:8080)
* PostgreSQL: localhost:5433

---

## 🛑 Stopping the Containers

```bash
docker-compose down
```

---

## 🔄 Rebuilding Containers (After Changes)

```bash
docker-compose up --build
```

---

## 💾 Persistent Data

Database data is stored in a Docker volume:

```
db_data
```

To remove all data:

```bash
docker-compose down -v
```

---

## 🔁 Git Workflow (Fetch & Pull)

### Fetch latest changes (without merging)

```bash
git fetch origin
```

### View differences

```bash
git log HEAD..origin/main --oneline
```

### Pull latest changes (fetch + merge)

```bash
git pull origin main
```

---

## ⚠️ Common Issues & Fixes

### Port already in use

* Change ports in `docker-compose.yml`

### Database connection issues

* Ensure backend uses `db` as hostname (not localhost)

Correct format:

```
postgresql://postgres:password@db:5432/goodreads
```

### Node modules issues

* Remove volumes and rebuild:

```bash
docker-compose down -v
docker-compose up --build
```

---

## 📌 Notes

* `depends_on` ensures backend waits for DB container start (not readiness)
* Initialization scripts run automatically from `init-scripts/`
* Hot reload is enabled via volume mounting

---

## 👨‍💻 Development Tips

* Use `docker logs <container_name>` to debug
* Use `docker exec -it goodreads-backend sh` to enter backend container

---

## ✅ Done!

The full-stack app should now be running using Docker 🚀
