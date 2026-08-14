import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Kanban, Plus, RefreshCw } from 'lucide-react';
import Column from './Column';
import TaskModal from './TaskModal';
import FilterBar from './FilterBar';
import ErrorBanner from './ErrorBanner';
import * as api from '../api/client';

export default function Board() {
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Filter state
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [targetColumnId, setTargetColumnId] = useState(null);

  // Load board data from backend
  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const data = await api.fetchBoard(1);
      setBoard(data);
    } catch (err) {
      setErrorMessage(api.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Open Create Modal
  const handleOpenCreateModal = (columnId = null) => {
    setEditingTask(null);
    setTargetColumnId(columnId || board?.columns[0]?.id || 1);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setTargetColumnId(task.column_id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setTargetColumnId(null);
  };

  // Submit handler for Create or Edit
  const handleModalSubmit = async (taskData) => {
    try {
      setErrorMessage('');
      if (editingTask) {
        // Edit Task
        const updated = await api.updateTask(editingTask.id, {
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority
        });

        setBoard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            columns: prev.columns.map((col) => ({
              ...col,
              tasks: col.tasks.map((t) => (t.id === updated.id ? updated : t))
            }))
          };
        });
      } else {
        // Create Task
        const created = await api.createTask(taskData);
        setBoard((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            columns: prev.columns.map((col) => {
              if (col.id === created.column_id) {
                return { ...col, tasks: [...col.tasks, created] };
              }
              return col;
            })
          };
        });
      }
      handleCloseModal();
    } catch (err) {
      setErrorMessage(api.getErrorMessage(err));
    }
  };

  // Move Task across columns
  const handleMoveTask = async (taskId, targetColId) => {
    if (!board) return;

    // Find current task
    let movingTask = null;
    for (const col of board.columns) {
      const found = col.tasks.find((t) => t.id === taskId);
      if (found) {
        movingTask = found;
        break;
      }
    }

    if (!movingTask || movingTask.column_id === targetColId) return;

    // Optimistic UI update
    const previousBoard = board;
    setBoard((prev) => {
      if (!prev) return prev;
      const updatedColumns = prev.columns.map((col) => {
        if (col.id === movingTask.column_id) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
        }
        if (col.id === targetColId) {
          return { ...col, tasks: [...col.tasks, { ...movingTask, column_id: targetColId }] };
        }
        return col;
      });
      return { ...prev, columns: updatedColumns };
    });

    try {
      await api.moveTask(taskId, targetColId);
    } catch (err) {
      // Revert optimistic update on failure
      setBoard(previousBoard);
      setErrorMessage(api.getErrorMessage(err));
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    const previousBoard = board;
    // Optimistic update
    setBoard((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId)
        }))
      };
    });

    try {
      await api.deleteTask(taskId);
    } catch (err) {
      setBoard(previousBoard);
      setErrorMessage(api.getErrorMessage(err));
    }
  };

  // Computed columns with filtered tasks
  const filteredColumns = useMemo(() => {
    if (!board || !board.columns) return [];

    const query = searchQuery.trim().toLowerCase();

    return board.columns.map((col) => {
      const matchingTasks = col.tasks.filter((task) => {
        // Priority filter
        if (selectedPriority !== 'All' && task.priority !== selectedPriority) {
          return false;
        }
        // Search query filter
        if (query) {
          const inTitle = task.title.toLowerCase().includes(query);
          const inDesc = task.description ? task.description.toLowerCase().includes(query) : false;
          if (!inTitle && !inDesc) return false;
        }
        return true;
      });

      return {
        ...col,
        filteredTasks: matchingTasks
      };
    });
  }, [board, selectedPriority, searchQuery]);

  if (loading && !board) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        <p>Loading TaskFlow Board...</p>
      </div>
    );
  }

  const columnsList = board ? board.columns.map((c) => ({ id: c.id, name: c.name })) : [];

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">
            <Kanban size={20} />
          </div>
          <h1 className="brand-title">TaskFlow</h1>
          {board && (
            <span className="board-badge">{board.name}</span>
          )}
        </div>

        <div className="header-actions">
          <button
            className="btn-card-action"
            onClick={loadBoard}
            title="Refresh Board"
            aria-label="Refresh Board"
          >
            <RefreshCw size={16} />
          </button>
          <button
            className="btn-primary"
            onClick={() => handleOpenCreateModal()}
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </header>

      {/* Global Error Banner */}
      <ErrorBanner
        message={errorMessage}
        onDismiss={() => setErrorMessage('')}
      />

      {/* Filter and Search Bar */}
      <FilterBar
        selectedPriority={selectedPriority}
        onSelectPriority={setSelectedPriority}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Board Grid */}
      <main className="board-container">
        <div className="columns-grid">
          {filteredColumns.map((col) => (
            <Column
              key={col.id}
              column={col}
              allColumns={columnsList}
              tasks={col.filteredTasks}
              onAddTask={handleOpenCreateModal}
              onEditTask={handleOpenEditModal}
              onDeleteTask={handleDeleteTask}
              onMoveTask={handleMoveTask}
            />
          ))}
        </div>
      </main>

      {/* Create / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        initialData={editingTask}
        columns={columnsList}
        defaultColumnId={targetColumnId}
      />
    </div>
  );
}
