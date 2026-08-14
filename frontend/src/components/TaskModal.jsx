import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const PRIORITIES = ['Low', 'Medium', 'High'];

export default function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  columns = [],
  defaultColumnId = null
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [columnId, setColumnId] = useState(defaultColumnId || (columns[0]?.id ?? 1));
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setPriority(initialData.priority || 'Medium');
      setColumnId(initialData.column_id || defaultColumnId || columns[0]?.id || 1);
    } else {
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setColumnId(defaultColumnId || columns[0]?.id || 1);
    }
    setValidationError('');
  }, [initialData, defaultColumnId, isOpen, columns]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Task title is required.');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      column_id: Number(columnId)
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {initialData ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {validationError && (
            <div style={{ color: 'var(--priority-high-text)', fontSize: '0.85rem' }}>
              ⚠️ {validationError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="task-title">
              Title <span className="required">*</span>
            </label>
            <input
              id="task-title"
              className="form-input"
              type="text"
              placeholder="e.g. Set up API database indexes"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError) setValidationError('');
              }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-desc">
              Description (optional)
            </label>
            <textarea
              id="task-desc"
              className="form-textarea"
              placeholder="Add more details about this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {!initialData && columns.length > 0 && (
            <div className="form-group">
              <label className="form-label" htmlFor="task-column">
                Column
              </label>
              <select
                id="task-column"
                className="form-select"
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Priority</label>
            <div className="priority-radio-group">
              {PRIORITIES.map((p) => {
                const pKey = p.toLowerCase();
                const isSelected = priority === p;
                return (
                  <label
                    key={p}
                    className={`priority-radio-label ${pKey} ${isSelected ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={isSelected}
                      onChange={() => setPriority(p)}
                    />
                    {p}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
