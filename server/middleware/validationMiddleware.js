/**
 * Validation middleware for request body validation.
 * Returns a middleware function that validates required fields and field constraints.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TASK_STATUSES = ['pending', 'in-progress', 'completed'];
const TASK_PRIORITIES = ['low', 'medium', 'high'];
const TASK_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate'];

const hasOwn = (object, property) => Object.prototype.hasOwnProperty.call(object, property);

const getRequestBody = (req, errors) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        errors.push('Request body must be an object');
        return {};
    }

    return req.body;
};

const isValidDueDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
};

const sendValidationErrors = (res, errors) => {
    if (errors.length > 0) {
        res.status(400).json({ message: errors[0], errors });
        return true;
    }

    return false;
};

const validateRegistration = (req, res, next) => {
    const errors = [];
    const { name, email, password } = getRequestBody(req, errors);

    if (typeof name !== 'string' || !name.trim()) {
        errors.push('Name is required');
    } else if (name.trim().length > 50) {
        errors.push('Name cannot exceed 50 characters');
    }

    if (typeof email !== 'string' || !email.trim()) {
        errors.push('Email is required');
    } else if (!EMAIL_REGEX.test(email.trim())) {
        errors.push('Please provide a valid email address');
    }

    if (typeof password !== 'string' || !password) {
        errors.push('Password is required');
    } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    if (sendValidationErrors(res, errors)) return;
    return next();
};

const validateLogin = (req, res, next) => {
    const errors = [];
    const { email, password } = getRequestBody(req, errors);

    if (typeof email !== 'string' || !email.trim()) {
        errors.push('Email is required');
    } else if (!EMAIL_REGEX.test(email.trim())) {
        errors.push('Please provide a valid email address');
    }

    if (typeof password !== 'string' || !password) {
        errors.push('Password is required');
    }

    if (sendValidationErrors(res, errors)) return;
    return next();
};

const validateTaskFields = (req, res, next, requireTitle) => {
    const errors = [];
    const body = getRequestBody(req, errors);
    const { title, status, priority, description } = body;
    const unknownFields = Object.keys(body).filter((field) => !TASK_FIELDS.includes(field));

    if (unknownFields.length > 0) {
        errors.push(`Unsupported task field${unknownFields.length > 1 ? 's' : ''}: ${unknownFields.join(', ')}`);
    }

    if (title !== undefined) {
        if (typeof title !== 'string' || !title.trim()) {
            errors.push(requireTitle ? 'Task title is required' : 'Task title cannot be empty');
        } else if (title.trim().length > 100) {
            errors.push('Title cannot exceed 100 characters');
        }
    } else if (requireTitle) {
        errors.push('Task title is required');
    }

    if (description !== undefined && typeof description !== 'string') {
        errors.push('Description must be a string');
    } else if (description !== undefined && description.length > 500) {
        errors.push('Description cannot exceed 500 characters');
    }

    if (status !== undefined && !TASK_STATUSES.includes(status)) {
        errors.push('Status must be pending, in-progress, or completed');
    }

    if (priority !== undefined && !TASK_PRIORITIES.includes(priority)) {
        errors.push('Priority must be low, medium, or high');
    }

    if (hasOwn(body, 'dueDate')
        && body.dueDate !== null
        && body.dueDate !== ''
        && !isValidDueDate(body.dueDate)) {
        errors.push('Due date must be a valid YYYY-MM-DD date');
    }

    if (sendValidationErrors(res, errors)) return;
    return next();
};

const validateTask = (req, res, next) => {
    return validateTaskFields(req, res, next, true);
};

const validateTaskUpdate = (req, res, next) => {
    const errors = [];
    const body = getRequestBody(req, errors);

    if (sendValidationErrors(res, errors)) return;

    if (Object.keys(body).length === 0) {
        return res.status(400).json({ message: 'Provide at least one task field to update' });
    }

    return validateTaskFields(req, res, next, false);
};

module.exports = { validateRegistration, validateLogin, validateTask, validateTaskUpdate };
