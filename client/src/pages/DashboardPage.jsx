import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../services/api';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';

const parseTaskDate = (dateStr) => {
    if (!dateStr) return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
    if (match) {
        return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? null : date;
};

const isTaskOverdue = (task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    const dueDate = parseTaskDate(task.dueDate);
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
};

const DashboardPage = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await API.get('/tasks');
            setTasks(data);
            setError('');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to fetch tasks';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleCreateTask = async (taskData) => {
        try {
            await API.post('/tasks', taskData);
            setShowForm(false);
            showToast('Task created successfully!', 'success');
            fetchTasks();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to create task';
            showToast(msg, 'error');
        }
    };

    const handleUpdateTask = async (taskData) => {
        try {
            await API.put(`/tasks/${editingTask._id}`, taskData);
            setEditingTask(null);
            setShowForm(false);
            showToast('Task updated successfully!', 'success');
            fetchTasks();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update task';
            showToast(msg, 'error');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await API.delete(`/tasks/${taskId}`);
            showToast('Task deleted successfully', 'info');
            fetchTasks();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to delete task';
            showToast(msg, 'error');
        }
    };

    const handleDeleteCompletedTasks = async () => {
        const completedCount = tasks.filter((t) => t.status === 'completed').length;
        if (completedCount === 0) return;

        if (!window.confirm(`Are you sure you want to delete all ${completedCount} completed task(s)?`)) return;

        try {
            const { data } = await API.delete('/tasks/completed');
            showToast(data.message || 'Deleted all completed tasks', 'success');
            fetchTasks();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to delete completed tasks';
            showToast(msg, 'error');
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await API.put(`/tasks/${taskId}`, { status: newStatus });
            showToast(`Task status updated to ${newStatus.replace('-', ' ')}`, 'success');
            fetchTasks();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update status';
            showToast(msg, 'error');
        }
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingTask(null);
    };

    // Calculate Dashboard Stats
    const stats = useMemo(() => {
        return {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            overdue: tasks.filter(isTaskOverdue).length
        };
    }, [tasks]);

    // Process tasks: Search -> Filter -> Sort
    const processedTasks = useMemo(() => {
        let result = [...tasks];

        // 1. Search Filter (by title or description)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(
                (task) =>
                    task.title.toLowerCase().includes(query) ||
                    (task.description && task.description.toLowerCase().includes(query))
            );
        }

        // 2. Status Filter
        if (filter === 'overdue') {
            result = result.filter(isTaskOverdue);
        } else if (filter !== 'all') {
            result = result.filter((task) => task.status === filter);
        }

        // 3. Sorting
        result.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            }
            if (sortBy === 'oldest') {
                return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            }
            if (sortBy === 'priority') {
                const weight = { high: 3, medium: 2, low: 1 };
                return (weight[b.priority] || 0) - (weight[a.priority] || 0);
            }
            if (sortBy === 'dueDate') {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            return 0;
        });

        return result;
    }, [tasks, searchQuery, filter, sortBy]);

    const filterOptions = [
        { id: 'all', label: 'All', count: stats.total },
        { id: 'pending', label: 'Pending', count: stats.pending },
        { id: 'in-progress', label: 'In Progress', count: stats.inProgress },
        { id: 'completed', label: 'Completed', count: stats.completed },
        { id: 'overdue', label: 'Overdue', count: stats.overdue }
    ];

    return (
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="dashboard-header animate-fade-in-up">
                    <div>
                        <h1 className="dashboard-title">
                            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
                        </h1>
                        <p className="dashboard-subtitle">
                            {stats.total === 0
                                ? "You don't have any tasks yet. Create one to get started!"
                                : `You have ${stats.pending + stats.inProgress} active task${(stats.pending + stats.inProgress) !== 1 ? 's' : ''}${stats.overdue > 0 ? ` (${stats.overdue} overdue)` : ''}`}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                        {stats.completed > 0 && (
                            <button
                                className="btn btn-secondary btn-danger-hover"
                                onClick={handleDeleteCompletedTasks}
                                id="clear-completed-button"
                                title="Delete all completed tasks"
                            >
                                🧹 Clear Completed ({stats.completed})
                            </button>
                        )}
                        <button
                            className="btn btn-primary"
                            onClick={() => { setEditingTask(null); setShowForm(true); }}
                            id="create-task-button"
                        >
                            + New Task
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        ⚠ {error}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="dashboard-stats stagger-children">
                    <div className="stat-card" onClick={() => setFilter('all')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-value">{stats.total}</div>
                        <div className="stat-card-label">Total Tasks</div>
                    </div>
                    <div className="stat-card" onClick={() => setFilter('pending')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-value" style={{ color: 'var(--color-pending)' }}>
                            {stats.pending}
                        </div>
                        <div className="stat-card-label">Pending</div>
                    </div>
                    <div className="stat-card" onClick={() => setFilter('in-progress')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-value" style={{ color: 'var(--color-in-progress)' }}>
                            {stats.inProgress}
                        </div>
                        <div className="stat-card-label">In Progress</div>
                    </div>
                    <div className="stat-card" onClick={() => setFilter('completed')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-value" style={{ color: 'var(--color-completed)' }}>
                            {stats.completed}
                        </div>
                        <div className="stat-card-label">Completed</div>
                    </div>
                    <div className="stat-card stat-card-overdue" onClick={() => setFilter('overdue')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card-value" style={{ color: stats.overdue > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                            {stats.overdue}
                        </div>
                        <div className="stat-card-label">Overdue</div>
                    </div>
                </div>

                {/* Search & Sort Controls Toolbar */}
                <div className="toolbar-container">
                    {/* Search Input */}
                    <div className="search-box">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            className="form-input search-input"
                            placeholder="Search tasks by title or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            id="search-tasks-input"
                        />
                        {searchQuery && (
                            <button
                                className="search-clear-btn"
                                onClick={() => setSearchQuery('')}
                                title="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Sort Select */}
                    <div className="sort-box">
                        <label htmlFor="sort-tasks-select" className="sort-label">
                            Sort by:
                        </label>
                        <select
                            id="sort-tasks-select"
                            className="form-select sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="priority">Priority (High to Low)</option>
                            <option value="dueDate">Due Date (Earliest)</option>
                        </select>
                    </div>
                </div>

                {/* Category Filters */}
                <div className="task-filters">
                    {filterOptions.map((f) => (
                        <button
                            key={f.id}
                            className={`filter-btn ${filter === f.id ? 'active' : ''}`}
                            onClick={() => setFilter(f.id)}
                            id={`filter-${f.id}`}
                        >
                            {f.label}
                            <span style={{ marginLeft: '6px', opacity: 0.7 }}>
                                {f.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Task List / Empty State */}
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : processedTasks.length === 0 ? (
                    <div className="task-empty">
                        <div className="task-empty-icon">
                            {searchQuery ? '🔍' : filter === 'completed' ? '🎉' : filter === 'overdue' ? '⏰' : '📋'}
                        </div>
                        <h3>
                            {searchQuery
                                ? `No tasks found matching "${searchQuery}"`
                                : filter === 'all'
                                ? 'No tasks yet'
                                : filter === 'overdue'
                                ? 'No overdue tasks!'
                                : `No ${filter.replace('-', ' ')} tasks`}
                        </h3>
                        <p>
                            {searchQuery
                                ? 'Try adjusting your search terms.'
                                : filter === 'all'
                                ? 'Click "+ New Task" to create your first task.'
                                : 'Try selecting another status filter.'}
                        </p>
                    </div>
                ) : (
                    <div className="task-list stagger-children">
                        {processedTasks.map((task) => (
                            <TaskCard
                                key={task._id}
                                task={task}
                                onEdit={handleEdit}
                                onDelete={handleDeleteTask}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                )}

                {/* Task Form Modal */}
                {showForm && (
                    <TaskForm
                        task={editingTask}
                        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                        onCancel={handleCloseForm}
                    />
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
