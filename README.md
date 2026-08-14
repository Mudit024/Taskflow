# ⚡ TaskFlow — Lightweight Full-Stack Task Board

A responsive, full-stack task management board (inspired by Trello) built with **React**, **Node.js (Express)**, and **SQLite**.

---

## 🚀 Quick Start (Fresh Clone Setup)

### Prerequisites
- **Node.js**: `v18+` or `v20+`
- **npm**: `v9+` or `v10+`

---

### 1. Clone the Repository
```bash
git clone https://github.com/Mudit024/Taskflow.git
cd Taskflow
```

---

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Initialize and seed the SQLite database
npm run seed

# Start the backend server (runs on http://localhost:5000)
npm run dev
```

---

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server (runs on http://localhost:5173)
npm run dev
```

Open your browser at **`http://localhost:5173`** to interact with TaskFlow!

---

### 4. Running Backend Automated Tests
In the `backend` directory:
```bash
cd backend
npm test
```

---

## 🗄️ Database Architecture & SQL Schema

TaskFlow uses **SQLite** with strict foreign keys (`PRAGMA foreign_keys = ON;`), primary keys, and field validation constraints.

### Schema Definition (`backend/src/db/schema.sql`)
```sql
PRAGMA foreign_keys = ON;

-- 1. Boards Table
CREATE TABLE boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Columns Table
CREATE TABLE columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

-- 3. Tasks Table
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    column_id INTEGER NOT NULL,
    title TEXT NOT NULL CHECK(length(trim(title)) > 0),
    description TEXT,
    priority TEXT NOT NULL CHECK(priority IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
```

---

## 🔍 Required Non-Trivial SQL Queries

TaskFlow implements custom, handwritten SQL queries rather than relying on default ORM abstractions:

### 1. Count of tasks per column on a board (`getTaskCountPerColumn`)
```sql
SELECT 
  c.id AS column_id, 
  c.name AS column_name, 
  c.position, 
  COUNT(t.id) AS task_count
FROM columns c
LEFT JOIN tasks t ON c.id = t.column_id
WHERE c.board_id = ?
GROUP BY c.id
ORDER BY c.position ASC;
```

### 2. Tasks with a given priority, sorted newest first (`getTasksByPriority`)
```sql
SELECT 
  t.id, 
  t.column_id, 
  t.title, 
  t.description, 
  t.priority, 
  t.created_at,
  c.name AS column_name
FROM tasks t
JOIN columns c ON t.column_id = c.id
WHERE t.priority = ?
ORDER BY t.created_at DESC;
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Server health check | `200` |
| `GET` | `/api/boards/:id` | Fetch board, columns, and nested tasks | `200`, `404` |
| `GET` | `/api/boards/:id/stats` | Task count per column (**Query #1**) | `200`, `404` |
| `GET` | `/api/tasks` | Filter tasks by priority (**Query #2**) / search | `200`, `400` |
| `POST` | `/api/tasks` | Create task (`title` required, `priority`, `column_id`) | `201`, `400` |
| `PUT` | `/api/tasks/:id` | Update task title, description, or priority | `200`, `400`, `404` |
| `PATCH` | `/api/tasks/:id/move` | Move task to target column (`column_id`) | `200`, `400`, `404` |
| `DELETE` | `/api/tasks/:id` | Delete task by ID | `200`, `404` |

---

## 🧪 Test Suite Coverage

The backend test suite (`backend/tests/api.test.js`) verifies 10 automated test cases with isolated database lifecycle management:

- **Validation Guards**: Verifies rejection of empty strings, whitespace-only titles, missing title keys, and non-existent `column_id` with `400 Bad Request`.
- **Task Lifecycle & Movement**: Verifies creation, updating, deleting, and moving across columns with persistent state updates.
- **Direct Database Layer Verification**: Directly executes SQL query functions against seed data to verify exact counts and descending timestamp order.

Run via:
```bash
cd backend && npm test
```

---

## 📝 Design Decisions & Reflection

### 1. Decisions & Assumptions
- **SQLite for Relational Persistence**: Chosen for zero-setup local evaluation while offering full SQL support (indexes, foreign keys with cascading deletes, and `CHECK` constraints).
- **Dual Column Movement**: Implemented both native **HTML5 Drag-and-Drop** and an accessible **Dropdown Select** on each card. This guarantees a seamless visual experience while providing a fallback on touch devices or accessibility tools.
- **Optimistic UI Updates**: Task moves and deletions update the UI immediately and roll back with an error banner if the server request fails.
- **Strict Server-Side Validation**: Empty or whitespace-only titles are rejected by Express middleware and SQLite `CHECK` constraints alike.

### 2. What I would improve with more time
- **Column Reordering & In-Column Sorting**: Add a numeric/fractional `order_index` on tasks for arbitrary vertical sorting within columns.
- **Real-Time Collaboration**: Integrate WebSockets (`socket.io`) or Server-Sent Events (SSE) to sync task moves across browser tabs without manual reload.
- **User Authentication**: Add JWT/Session authentication with team workspaces and role-based permissions.
- **Custom Columns**: Allow users to dynamically add, rename, and delete columns.

### 3. Approximate Time Spent
- **Total Time**: ~3.5 hours
  - Architecture & Database Schema: 45 mins
  - Backend API, Validation & Test Suite: 1 hour
  - Frontend UI, State Management & Drag-and-Drop: 1 hour 15 mins
  - Testing, Error Handling Polish & Documentation: 30 mins

### 4. Interesting Discovery / Learning
- Configuring SQLite's `CHECK(length(trim(title)) > 0)` in conjunction with `better-sqlite3`'s synchronous execution allowed creating a resilient relational layer where data integrity is enforced natively at the database level, preventing any subtle white-space pollution before API validation even occurs.
