import React, { useState } from 'react';
import { Edit2, Trash2, Calendar, GripVertical } from 'lucide-react';

export default function TaskCard({
  task,
  columns = [],
  onEdit,
  onDelete,
  onMove
}) {
  const [isDragging, setIsDragging] = useState(false);

  const formattedDate = task.created_at
    ? new Date(task.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      })
    : '';

  const priorityClass = (task.priority || 'Medium').toLowerCase();

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, fromColumnId: task.column_id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const otherColumns = columns.filter((c) => c.id !== task.column_id);

  return (
    <div
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="task-card-header">
        <h4 className="task-title">{task.title}</h4>
      </div>

      {task.description && (
        <p className="task-desc">{task.description}</p>
      )}

      <div className="task-card-footer">
        <div className="task-meta">
          <span className={`priority-badge ${priorityClass}`}>
            {task.priority}
          </span>
          {formattedDate && (
            <span className="task-date" title={`Created: ${task.created_at}`}>
              {formattedDate}
            </span>
          )}
        </div>

        <div className="task-actions">
          {/* Quick Column Move Dropdown */}
          <select
            className="move-select"
            value={task.column_id}
            onChange={(e) => onMove(task.id, Number(e.target.value))}
            title="Move task to another column"
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Edit Button */}
          <button
            className="btn-card-action"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
            title="Edit task"
          >
            <Edit2 size={14} />
          </button>

          {/* Delete Button */}
          <button
            className="btn-card-action delete"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
