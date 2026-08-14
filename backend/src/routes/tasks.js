const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

/**
 * GET /api/tasks
 * Filter tasks by priority or search query
 * Demonstrates REQUIRED QUERY #2 when filtering by priority
 */
router.get('/', (req, res, next) => {
  try {
    const { priority, search, board_id } = req.query;
    const boardId = board_id ? parseInt(board_id, 10) : 1;

    if (priority && !VALID_PRIORITIES.includes(priority) && priority !== 'All') {
      return res.status(400).json({
        error: `Invalid priority '${priority}'. Allowed values: ${VALID_PRIORITIES.join(', ')} or 'All'.`
      });
    }

    // When priority is specified and no other search is active, we can leverage Query #2 directly
    if (priority && priority !== 'All' && (!search || !search.trim())) {
      const tasks = db.getTasksByPriority(priority);
      return res.json(tasks);
    }

    // Otherwise use general filtered query
    const tasks = db.getFilteredTasks({ priority, search, boardId });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tasks/:id
 * Retrieve single task by ID
 */
router.get('/:id', (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID. Must be an integer.' });
    }

    const task = db.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: `Task with ID ${taskId} not found.` });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks
 * Create a new task with strict server-side validation
 */
router.post('/', (req, res, next) => {
  try {
    const { column_id, title, description, priority = 'Medium' } = req.body;

    // 1. Validate title (Strict requirement: empty title must fail on backend)
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Task title is required and cannot be empty.' });
    }

    // 2. Validate column_id
    const colId = parseInt(column_id, 10);
    if (isNaN(colId)) {
      return res.status(400).json({ error: 'Valid column_id is required.' });
    }

    const column = db.getColumnById(colId);
    if (!column) {
      return res.status(400).json({ error: `Column with ID ${colId} does not exist.` });
    }

    // 3. Validate priority
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        error: `Invalid priority '${priority}'. Allowed values: ${VALID_PRIORITIES.join(', ')}.`
      });
    }

    const newTask = db.createTask({
      column_id: colId,
      title: title.trim(),
      description: description ? description.trim() : null,
      priority
    });

    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/tasks/:id
 * Update an existing task (title, description, priority)
 */
router.put('/:id', (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID. Must be an integer.' });
    }

    const existingTask = db.getTaskById(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: `Task with ID ${taskId} not found.` });
    }

    const { title, description, priority } = req.body;

    // Validate title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: 'Task title cannot be empty.' });
      }
    }

    // Validate priority if provided
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        error: `Invalid priority '${priority}'. Allowed values: ${VALID_PRIORITIES.join(', ')}.`
      });
    }

    const updatedTask = db.updateTask(taskId, {
      title: title !== undefined ? title.trim() : undefined,
      description: description !== undefined ? (description ? description.trim() : null) : undefined,
      priority
    });

    res.json(updatedTask);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tasks/:id/move
 * Move a task from one column to another
 */
router.patch('/:id/move', (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID. Must be an integer.' });
    }

    const existingTask = db.getTaskById(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: `Task with ID ${taskId} not found.` });
    }

    const { column_id } = req.body;
    const targetColId = parseInt(column_id, 10);
    if (isNaN(targetColId)) {
      return res.status(400).json({ error: 'Valid target column_id is required.' });
    }

    const targetColumn = db.getColumnById(targetColId);
    if (!targetColumn) {
      return res.status(400).json({ error: `Target column with ID ${targetColId} does not exist.` });
    }

    const movedTask = db.moveTask(taskId, targetColId);
    res.json(movedTask);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID. Must be an integer.' });
    }

    const existingTask = db.getTaskById(taskId);
    if (!existingTask) {
      return res.status(404).json({ error: `Task with ID ${taskId} not found.` });
    }

    db.deleteTask(taskId);
    res.json({ message: 'Task deleted successfully.', id: taskId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
