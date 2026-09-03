const assert = require('node:assert/strict');
const test = require('node:test');

const Task = require('../models/task');
const { updateTask, deleteCompletedTasks } = require('../controllers/taskController');
const {
    validateRegistration,
    validateTask,
    validateTaskUpdate
} = require('../middleware/validationMiddleware');

const runMiddleware = (middleware, body) => {
    let nextCalled = false;
    const response = {
        statusCode: null,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
            return this;
        }
    };

    middleware({ body }, response, () => {
        nextCalled = true;
    });

    return { nextCalled, response };
};

test('registration validation accepts a valid payload', () => {
    const { nextCalled, response } = runMiddleware(validateRegistration, {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'correct-horse-battery-staple'
    });

    assert.equal(nextCalled, true);
    assert.equal(response.statusCode, null);
});

test('task validation rejects unknown fields and invalid calendar dates', () => {
    const { nextCalled, response } = runMiddleware(validateTask, {
        title: 'Ship TaskFlow',
        dueDate: '2026-02-30',
        user: 'another-user-id'
    });

    assert.equal(nextCalled, false);
    assert.equal(response.statusCode, 400);
    assert.match(response.payload.errors.join(' '), /Unsupported task field: user/);
    assert.match(response.payload.errors.join(' '), /Due date must be a valid YYYY-MM-DD date/);
});

test('partial task updates are valid while empty updates are rejected', () => {
    const validResult = runMiddleware(validateTaskUpdate, { status: 'completed' });
    assert.equal(validResult.nextCalled, true);

    const invalidResult = runMiddleware(validateTaskUpdate, {});
    assert.equal(invalidResult.nextCalled, false);
    assert.equal(invalidResult.response.statusCode, 400);
});

test('task controller never passes an owner change to MongoDB', async () => {
    const originalFindById = Task.findById;
    const originalFindByIdAndUpdate = Task.findByIdAndUpdate;
    let receivedUpdates;

    Task.findById = async () => ({
        user: { toString: () => 'owner-id' }
    });
    Task.findByIdAndUpdate = async (id, updates) => {
        receivedUpdates = updates;
        return { _id: id, ...updates };
    };

    const response = {
        statusCode: null,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
            return this;
        }
    };

    try {
        await updateTask({
            params: { id: 'task-id' },
            user: { _id: 'owner-id' },
            body: { title: 'Updated title', user: 'another-user-id' }
        }, response);

        assert.deepEqual(receivedUpdates, { title: 'Updated title' });
        assert.equal(response.statusCode, 200);
        assert.equal(response.payload.title, 'Updated title');
    } finally {
        Task.findById = originalFindById;
        Task.findByIdAndUpdate = originalFindByIdAndUpdate;
    }
});

test('deleteCompletedTasks removes completed tasks for authenticated user', async () => {
    const originalDeleteMany = Task.deleteMany;
    let deleteCriteria;

    Task.deleteMany = async (criteria) => {
        deleteCriteria = criteria;
        return { deletedCount: 3 };
    };

    const response = {
        statusCode: null,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
            return this;
        }
    };

    try {
        await deleteCompletedTasks({ user: { _id: 'user-123' } }, response);

        assert.deepEqual(deleteCriteria, { user: 'user-123', status: 'completed' });
        assert.equal(response.statusCode, 200);
        assert.equal(response.payload.deletedCount, 3);
    } finally {
        Task.deleteMany = originalDeleteMany;
    }
});
