const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
    const priorityClass = `priority-${task.priority}`;
    const statusBadgeClass = `badge badge-${task.status}`;
    const priorityBadgeClass = `badge badge-${task.priority}`;

    const parseTaskDate = (dateStr) => {
        if (!dateStr) return null;

        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
        if (match) {
            return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        }

        const date = new Date(dateStr);
        return Number.isNaN(date.getTime()) ? null : date;
    };

    const formatDate = (dateStr) => {
        const date = parseTaskDate(dateStr);
        if (!date) return dateStr;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const isOverdue = () => {
        if (!task.dueDate || task.status === 'completed') return false;
        const dueDate = parseTaskDate(task.dueDate);
        if (!dueDate) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
    };

    const getNextStatus = () => {
        switch (task.status) {
            case 'pending': return 'in-progress';
            case 'in-progress': return 'completed';
            case 'completed': return 'pending';
            default: return 'pending';
        }
    };

    const statusIcon = {
        'pending': '○',
        'in-progress': '◐',
        'completed': '●'
    };

    return (
        <div className={`task-card ${priorityClass}`} id={`task-${task._id}`}>
            <div className="task-card-header">
                <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => onStatusChange(task._id, getNextStatus())}
                    title={`Mark as ${getNextStatus()}`}
                    id={`task-status-toggle-${task._id}`}
                    style={{ fontSize: '1.2rem', flexShrink: 0 }}
                >
                    {statusIcon[task.status]}
                </button>
                <h3 className={`task-card-title ${task.status === 'completed' ? 'completed' : ''}`}>
                    {task.title}
                </h3>
                <div className="task-card-actions">
                    <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => onEdit(task)}
                        title="Edit task"
                        id={`task-edit-${task._id}`}
                    >
                        ✎
                    </button>
                    <button
                        className="btn btn-danger btn-icon btn-sm"
                        onClick={() => onDelete(task._id)}
                        title="Delete task"
                        id={`task-delete-${task._id}`}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {task.description && (
                <p className="task-card-description">{task.description}</p>
            )}

            <div className="task-card-meta">
                <span className={statusBadgeClass}>
                    {task.status.replace('-', ' ')}
                </span>
                <span className={priorityBadgeClass}>
                    {task.priority}
                </span>
                {task.dueDate && (
                    <span className={`badge badge-due ${isOverdue() ? 'badge-high' : ''}`}>
                        {isOverdue() ? '⚠ ' : '📅 '}{formatDate(task.dueDate)}
                    </span>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
