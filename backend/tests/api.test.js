const path = require('path');
const fs = require('fs');

// Use a separate test database file
const TEST_DB_PATH = path.join(__dirname, 'taskflow.test.db');
process.env.DB_PATH = TEST_DB_PATH;

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

describe('TaskFlow Backend Test Suite', () => {
  beforeEach(() => {
    // Seed fresh test database before each test
    db.seedDatabase();
  });

  afterAll(() => {
    // Close DB and clean up test database file
    db.db.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (e) {
        // Ignore file lock on Windows during teardown
      }
    }
  });

  // -------------------------------------------------------------
  // 1. Mandatory Test: Validation (Empty/Missing Title Rejection)
  // -------------------------------------------------------------
  describe('Task Validation', () => {
    it('should fail with 400 when creating a task with an empty string title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          column_id: 1,
          title: '',
          description: 'Empty title task'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/title.*required/i);
    });

    it('should fail with 400 when creating a task with whitespace-only title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          column_id: 1,
          title: '    ',
          description: 'Whitespace title'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with 400 when title field is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          column_id: 1,
          description: 'No title provided'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with 400 when column_id does not exist', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          column_id: 9999,
          title: 'Invalid column task'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/does not exist/i);
    });
  });

  // -------------------------------------------------------------
  // 2. Mandatory Test: Moving a Task Updates Column / Status
  // -------------------------------------------------------------
  describe('Task Movement & Lifecycle', () => {
    it('should successfully move a task from one column to another', async () => {
      // Step 1: Create a task in column 1 ('To Do')
      const createRes = await request(app)
        .post('/api/tasks')
        .send({
          column_id: 1,
          title: 'Task to be moved',
          priority: 'Medium'
        });

      expect(createRes.status).toBe(201);
      const taskId = createRes.body.id;
      expect(createRes.body.column_id).toBe(1);

      // Step 2: Move task to column 2 ('In Progress')
      const moveRes = await request(app)
        .patch(`/api/tasks/${taskId}/move`)
        .send({ column_id: 2 });

      expect(moveRes.status).toBe(200);
      expect(moveRes.body.column_id).toBe(2);

      // Step 3: Fetch task to confirm persistence
      const fetchRes = await request(app).get(`/api/tasks/${taskId}`);
      expect(fetchRes.status).toBe(200);
      expect(fetchRes.body.column_id).toBe(2);
    });

    it('should update task details via PUT /api/tasks/:id', async () => {
      const updateRes = await request(app)
        .put('/api/tasks/1')
        .send({
          title: 'Updated Authentication Task',
          description: 'Updated description',
          priority: 'Low'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.title).toBe('Updated Authentication Task');
      expect(updateRes.body.priority).toBe('Low');
    });

    it('should delete a task via DELETE /api/tasks/:id', async () => {
      const deleteRes = await request(app).delete('/api/tasks/1');
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toMatch(/deleted successfully/i);

      // Confirm 404 on subsequent fetch
      const fetchRes = await request(app).get('/api/tasks/1');
      expect(fetchRes.status).toBe(404);
    });
  });

  // -------------------------------------------------------------
  // 3. Mandatory Test: Direct Database Layer Queries
  // -------------------------------------------------------------
  describe('Direct Database Layer Queries', () => {
    it('Query #1 (Direct): getTaskCountPerColumn should return correct task counts per column for seed data', () => {
      const stats = db.getTaskCountPerColumn(1);

      expect(Array.isArray(stats)).toBe(true);
      expect(stats).toHaveLength(3);

      // Seed data has 2 tasks in 'To Do', 2 in 'In Progress', 2 in 'Done'
      const todoCol = stats.find(c => c.column_name === 'To Do');
      const inProgressCol = stats.find(c => c.column_name === 'In Progress');
      const doneCol = stats.find(c => c.column_name === 'Done');

      expect(todoCol).toBeDefined();
      expect(todoCol.task_count).toBe(2);

      expect(inProgressCol).toBeDefined();
      expect(inProgressCol.task_count).toBe(2);

      expect(doneCol).toBeDefined();
      expect(doneCol.task_count).toBe(2);
    });

    it('Query #2 (Direct): getTasksByPriority should return only tasks with given priority in newest-first order', () => {
      const highTasks = db.getTasksByPriority('High');

      expect(Array.isArray(highTasks)).toBe(true);
      expect(highTasks.length).toBeGreaterThanOrEqual(2);

      // Every returned task must be 'High'
      highTasks.forEach(task => {
        expect(task.priority).toBe('High');
      });

      // Verify sorted newest first (descending timestamp order)
      for (let i = 0; i < highTasks.length - 1; i++) {
        const currentDate = new Date(highTasks[i].created_at);
        const nextDate = new Date(highTasks[i + 1].created_at);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    it('Board API: GET /api/boards/1 should return full board structure with nested tasks', async () => {
      const res = await request(app).get('/api/boards/1');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('TaskFlow Development Board');
      expect(res.body.columns).toHaveLength(3);
      expect(res.body.columns[0].tasks.length).toBe(2);
    });
  });
});
