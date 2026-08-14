const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/boards/:id
 * Retrieve a full board, including all its columns and nested tasks
 */
router.get('/:id', (req, res, next) => {
  try {
    const boardId = parseInt(req.params.id, 10);
    if (isNaN(boardId)) {
      return res.status(400).json({ error: 'Invalid board ID. Must be an integer.' });
    }

    const board = db.getBoard(boardId);
    if (!board) {
      return res.status(404).json({ error: `Board with ID ${boardId} not found.` });
    }

    res.json(board);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/boards/:id/stats
 * REQUIRED QUERY #1: Returns count of tasks per column on a given board
 */
router.get('/:id/stats', (req, res, next) => {
  try {
    const boardId = parseInt(req.params.id, 10);
    if (isNaN(boardId)) {
      return res.status(400).json({ error: 'Invalid board ID. Must be an integer.' });
    }

    const board = db.getBoard(boardId);
    if (!board) {
      return res.status(404).json({ error: `Board with ID ${boardId} not found.` });
    }

    const stats = db.getTaskCountPerColumn(boardId);
    res.json({
      board_id: boardId,
      stats
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/boards/:id/columns
 * Retrieve just the columns for a board
 */
router.get('/:id/columns', (req, res, next) => {
  try {
    const boardId = parseInt(req.params.id, 10);
    if (isNaN(boardId)) {
      return res.status(400).json({ error: 'Invalid board ID.' });
    }

    const columns = db.getColumnsByBoardId(boardId);
    res.json(columns);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
