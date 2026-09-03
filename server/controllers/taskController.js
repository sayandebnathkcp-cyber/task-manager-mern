const Task = require('../models/task');

const UPDATABLE_TASK_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];

const getTaskErrorResponse = (error, fallbackMessage) => {
    if (error.name === 'CastError') {
        return { status: 400, message: 'Invalid task ID' };
    }

    return { status: 500, message: fallbackMessage };
};

// @desc    Get all tasks for the logged-in user (with optional search and sorting)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    try {
        const { search, sortBy } = req.query;
        const query = { user: req.user._id };

        if (search && search.trim() !== '') {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { title: regex },
                { description: regex }
            ];
        }

        let sortOption = { createdAt: -1 }; // default newest
        if (sortBy === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sortBy === 'dueDate') {
            sortOption = { dueDate: 1, createdAt: -1 };
        }

        let tasks = await Task.find(query).sort(sortOption);

        if (sortBy === 'priority') {
            const priorityWeight = { high: 3, medium: 2, low: 1 };
            tasks = tasks.sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0));
        }

        res.status(200).json(tasks);
    } catch (error) {
        console.error('Get Tasks Error:', error.message);
        res.status(500).json({ message: 'Server Error while fetching tasks' });
    }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    try {
        const { title, description, status, priority, dueDate } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Please provide a task title' });
        }

        const task = await Task.create({
            user: req.user._id,
            title,
            description: description || '',
            status: status || 'pending',
            priority: priority || 'medium',
            dueDate: dueDate || null
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('Create Task Error:', error.message);
        res.status(500).json({ message: 'Server Error while creating task' });
    }
};

// @desc    Get a single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Verify ownership
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to access this task' });
        }

        res.status(200).json(task);
    } catch (error) {
        console.error('Get Task Error:', error.message);
        const { status, message } = getTaskErrorResponse(error, 'Server Error while fetching task');
        res.status(status).json({ message });
    }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Verify ownership
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this task' });
        }

        const updates = {};
        UPDATABLE_TASK_FIELDS.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        });

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Update Task Error:', error.message);
        const { status, message } = getTaskErrorResponse(error, 'Server Error while updating task');
        res.status(status).json({ message });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Verify ownership
        if (task.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this task' });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete Task Error:', error.message);
        const { status, message } = getTaskErrorResponse(error, 'Server Error while deleting task');
        res.status(status).json({ message });
    }
};

// @desc    Delete all completed tasks for logged-in user
// @route   DELETE /api/tasks/completed
// @access  Private
const deleteCompletedTasks = async (req, res) => {
    try {
        const result = await Task.deleteMany({ user: req.user._id, status: 'completed' });
        res.status(200).json({
            message: 'All completed tasks deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Delete Completed Tasks Error:', error.message);
        res.status(500).json({ message: 'Server Error while deleting completed tasks' });
    }
};

module.exports = {
    getTasks,
    createTask,
    getTaskById,
    updateTask,
    deleteTask,
    deleteCompletedTasks
};
