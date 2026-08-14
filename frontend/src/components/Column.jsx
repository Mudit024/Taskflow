import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

export default function Column({
  column,
  allColumns,
  tasks = [],
  onAddTask,
  onEditTask,
  onDeleteTask,
  onMoveTask
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data && data.taskId && data.fromColumnId !== column.id) {
        onMoveTask(data.taskId, column.id);
      }
    } catch (err) {
      console.error('Drop handling error:', err);
    }
  };

  return (
    <div className="column">
      <div className="column-header">
        <div className="column-title-wrap">
          <h3 className="column-title">{column.name}</h3>
          <span className="task-count-badge">{tasks.length}</span>
        </div>

        <button
          className="btn-add-column-task"
          onClick={() => onAddTask(column.id)}
          title={`Add task to ${column.name}`}
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </div>

      <div
        className={`tasks-list ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {tasks.length === 0 ? (
          <div className="empty-column-msg">
            <span>No tasks in this column</span>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              columns={allColumns}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onMove={onMoveTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
