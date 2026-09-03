const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateTask, validateTaskUpdate } = require('../middleware/validationMiddleware');
const {
    getTasks,
    createTask,
    getTaskById,
    updateTask,
    deleteTask,
    deleteCompletedTasks
} = require('../controllers/taskController');

// All task routes are protected — user must be logged in
router.use(protect);

// Route: DELETE /api/tasks/completed — Delete all completed tasks for logged-in user
router.delete('/completed', deleteCompletedTasks);

// Route: GET /api/tasks — Get all tasks for the logged-in user
// Route: POST /api/tasks — Create a new task
router.route('/').get(getTasks).post(validateTask, createTask);

// Route: GET /api/tasks/:id — Get a single task
// Route: PUT /api/tasks/:id — Update a task
// Route: DELETE /api/tasks/:id — Delete a task
router.route('/:id').get(getTaskById).put(validateTaskUpdate, updateTask).delete(deleteTask);

module.exports = router;
