-- TaskFlow Seed Data

-- 1. Insert Default Board
INSERT INTO boards (id, name) VALUES (1, 'TaskFlow Development Board');

-- 2. Insert Default Columns
INSERT INTO columns (id, board_id, name, position) VALUES 
(1, 1, 'To Do', 0),
(2, 1, 'In Progress', 1),
(3, 1, 'Done', 2);

-- 3. Insert Initial Tasks with varying priorities
INSERT INTO tasks (column_id, title, description, priority, created_at) VALUES
(1, 'Implement user authentication', 'Add JWT-based auth or session management for users.', 'High', datetime('now', '-3 days')),
(1, 'Setup dark mode theme', 'Create CSS variables and toggler for dark mode support.', 'Low', datetime('now', '-2 days')),
(2, 'Design database schema', 'Define tables for boards, columns, and tasks with foreign keys.', 'High', datetime('now', '-1 day')),
(2, 'Build REST API endpoints', 'Implement CRUD endpoints for tasks and board retrieval.', 'Medium', datetime('now', '-12 hours')),
(3, 'Initialize project repository', 'Setup monorepo folder structure for frontend and backend.', 'Medium', datetime('now', '-4 days')),
(3, 'Install core dependencies', 'Install Express, SQLite, React, and Vite libraries.', 'Low', datetime('now', '-4 days'));
