import { useState, useEffect } from 'react';

const TaskForm = ({ task, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isEditing = !!task;

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                status: task.status || 'pending',
                priority: task.priority || 'medium',
                dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
            });
        }
    }, [task]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setError('Task title is required');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                ...formData,
                dueDate: formData.dueDate || null
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
            <div className="modal animate-scale-in">
                <div className="modal-header">
                    <h2>{isEditing ? 'Edit Task' : 'Create New Task'}</h2>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={onCancel}
                        id="task-form-close"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-error">⚠ {error}</div>
                        )}

                        <div className="form-group">
                            <label className="form-label" htmlFor="task-title">Title</label>
                            <input
                                id="task-title"
                                className="form-input"
                                type="text"
                                name="title"
                                placeholder="What needs to be done?"
                                value={formData.title}
                                onChange={handleChange}
                                autoFocus
                                required
                                maxLength={100}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="task-description">Description</label>
                            <textarea
                                id="task-description"
                                className="form-textarea"
                                name="description"
                                placeholder="Add some details..."
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                maxLength={500}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="task-status">Status</label>
                                <select
                                    id="task-status"
                                    className="form-select"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="task-priority">Priority</label>
                                <select
                                    id="task-priority"
                                    className="form-select"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="task-due-date">Due Date</label>
                            <input
                                id="task-due-date"
                                className="form-input"
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                            id="task-form-cancel"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
                            disabled={loading}
                            id="task-form-submit"
                        >
                            <span className="btn-text">
                                {isEditing ? 'Update Task' : 'Create Task'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskForm;
