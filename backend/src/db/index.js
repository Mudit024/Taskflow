const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'taskflow.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

// Initialize database instance
const db = new Database(DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? console.log : null });

// Ensure foreign keys are strictly enforced in SQLite
db.pragma('foreign_keys = ON');

/**
 * Initializes database schema if tables do not exist
 */
function initSchema() {
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='boards'").get();
  if (!tableCheck) {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schemaSql);
    console.log('Database initialized from schema.sql');
  }
}

/**
 * Seeds the database from seed.sql
 */
function seedDatabase() {
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const seedSql = fs.readFileSync(SEED_PATH, 'utf-8');
  db.exec(schemaSql);
  db.exec(seedSql);
  console.log('Database successfully re-seeded from seed.sql');
}

// Auto-run schema check
initSchema();

// -------------------------------------------------------------
// REQUIRED ASSIGNMENT SQL QUERIES (Handcrafted raw SQL)
// -------------------------------------------------------------

/**
 * Required Query 1: Count of tasks per column on a given board
 * Returns column info alongside the task count using LEFT JOIN and GROUP BY
 */
function getTaskCountPerColumn(boardId = 1) {
  const stmt = db.prepare(`
    SELECT 
      c.id AS column_id, 
      c.name AS column_name, 
      c.position, 
      COUNT(t.id) AS task_count
    FROM columns c
    LEFT JOIN tasks t ON c.id = t.column_id
    WHERE c.board_id = ?
    GROUP BY c.id
    ORDER BY c.position ASC
  `);
  return stmt.all(boardId);
}

/**
 * Required Query 2: Tasks filtered by a given priority, sorted newest first
 */
function getTasksByPriority(priority) {
  const stmt = db.prepare(`
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
    ORDER BY t.created_at DESC
  `);
  return stmt.all(priority);
}

// -------------------------------------------------------------
// CORE REPOSITORY FUNCTIONS
// -------------------------------------------------------------

function getBoard(boardId = 1) {
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(boardId);
  if (!board) return null;

  const columns = db.prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position ASC').all(boardId);
  const tasks = db.prepare(`
    SELECT t.* 
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    WHERE c.board_id = ?
    ORDER BY t.created_at ASC
  `).all(boardId);

  // Group tasks by column
  const columnsWithTasks = columns.map(col => ({
    ...col,
    tasks: tasks.filter(task => task.column_id === col.id)
  }));

  return {
    ...board,
    columns: columnsWithTasks
  };
}

function getTaskById(taskId) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
}

function createTask({ column_id, title, description, priority = 'Medium' }) {
  const stmt = db.prepare(`
    INSERT INTO tasks (column_id, title, description, priority)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(column_id, title.trim(), description || null, priority);
  return getTaskById(result.lastInsertRowid);
}

function updateTask(taskId, { title, description, priority }) {
  const existing = getTaskById(taskId);
  if (!existing) return null;

  const newTitle = title !== undefined ? title.trim() : existing.title;
  const newDescription = description !== undefined ? description : existing.description;
  const newPriority = priority !== undefined ? priority : existing.priority;

  const stmt = db.prepare(`
    UPDATE tasks 
    SET title = ?, description = ?, priority = ?
    WHERE id = ?
  `);
  stmt.run(newTitle, newDescription, newPriority, taskId);
  return getTaskById(taskId);
}

function moveTask(taskId, targetColumnId) {
  const existing = getTaskById(taskId);
  if (!existing) return null;

  const stmt = db.prepare(`
    UPDATE tasks 
    SET column_id = ?
    WHERE id = ?
  `);
  stmt.run(targetColumnId, taskId);
  return getTaskById(taskId);
}

function deleteTask(taskId) {
  const existing = getTaskById(taskId);
  if (!existing) return false;

  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  stmt.run(taskId);
  return true;
}

function getFilteredTasks({ priority, search, boardId = 1 }) {
  let query = `
    SELECT t.*, c.name as column_name
    FROM tasks t
    JOIN columns c ON t.column_id = c.id
    WHERE c.board_id = ?
  `;
  const params = [boardId];

  if (priority && priority !== 'All') {
    query += ' AND t.priority = ?';
    params.push(priority);
  }

  if (search && search.trim()) {
    query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  query += ' ORDER BY t.created_at DESC';

  return db.prepare(query).all(...params);
}

module.exports = {
  db,
  initSchema,
  seedDatabase,
  getTaskCountPerColumn,
  getTasksByPriority,
  getBoard,
  getTaskById,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  getFilteredTasks
};
