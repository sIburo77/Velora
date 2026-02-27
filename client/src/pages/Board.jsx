import { useEffect, useState, useCallback } from 'react';
import {
  Plus, MoreHorizontal, Trash2, Edit3, GripVertical,
  Search, Filter, Calendar, Flag, CheckCircle, Circle, X, ChevronDown,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Loader from '../components/ui/Loader';
import Modal from '../components/ui/Modal';

const priorityColors = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const priorityDots = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };

export default function Board() {
  const { currentWorkspace } = useWorkspace();
  const { success, error } = useToast();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddCol, setShowAddCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [taskModal, setTaskModal] = useState({ open: false, columnId: null, task: null });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', deadline: '' });
  const [editingCol, setEditingCol] = useState(null);
  const [editColName, setEditColName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCompleted, setFilterCompleted] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [dragTask, setDragTask] = useState(null);

  const fetchBoard = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const data = await api.getBoard(currentWorkspace.id);
      setBoard(data);
    } catch (err) {
      error('Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    setLoading(true);
    setSearchResults(null);
    fetchBoard();
  }, [fetchBoard]);

  const addColumn = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    try {
      await api.createColumn(currentWorkspace.id, { name: newColName.trim() });
      setNewColName('');
      setShowAddCol(false);
      fetchBoard();
      success('Column created');
    } catch (err) {
      error(err.message);
    }
  };

  const deleteColumn = async (colId) => {
    try {
      await api.deleteColumn(currentWorkspace.id, colId);
      fetchBoard();
      success('Column deleted');
    } catch (err) {
      error(err.message);
    }
  };

  const renameColumn = async (colId) => {
    if (!editColName.trim()) return;
    try {
      await api.updateColumn(currentWorkspace.id, colId, { name: editColName.trim() });
      setEditingCol(null);
      fetchBoard();
    } catch (err) {
      error(err.message);
    }
  };

  const openTaskModal = (columnId, task = null) => {
    if (task) {
      setTaskForm({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        deadline: task.deadline ? task.deadline.slice(0, 16) : '',
      });
    } else {
      setTaskForm({ title: '', description: '', priority: 'medium', deadline: '' });
    }
    setTaskModal({ open: true, columnId, task });
  };

  const saveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    const data = {
      ...taskForm,
      deadline: taskForm.deadline ? new Date(taskForm.deadline).toISOString() : null,
    };
    try {
      if (taskModal.task) {
        await api.updateTask(currentWorkspace.id, taskModal.task.id, data);
        success('Task updated');
      } else {
        await api.createTask(currentWorkspace.id, taskModal.columnId, data);
        success('Task created');
      }
      setTaskModal({ open: false, columnId: null, task: null });
      fetchBoard();
    } catch (err) {
      error(err.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.deleteTask(currentWorkspace.id, taskId);
      fetchBoard();
      success('Task deleted');
    } catch (err) {
      error(err.message);
    }
  };

  const toggleComplete = async (task) => {
    try {
      await api.updateTask(currentWorkspace.id, task.id, { is_completed: !task.is_completed });
      fetchBoard();
    } catch (err) {
      error(err.message);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery && !filterPriority && filterCompleted === '') {
      setSearchResults(null);
      return;
    }
    try {
      const params = {};
      if (searchQuery) params.q = searchQuery;
      if (filterPriority) params.priority = filterPriority;
      if (filterCompleted !== '') params.is_completed = filterCompleted;
      const results = await api.searchTasks(currentWorkspace.id, params);
      setSearchResults(results);
    } catch (err) {
      error(err.message);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterPriority('');
    setFilterCompleted('');
    setSearchResults(null);
  };

  // Drag and drop
  const handleDragStart = (e, task, sourceColId) => {
    setDragTask({ task, sourceColId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetColId) => {
    e.preventDefault();
    if (!dragTask || dragTask.sourceColId === targetColId) {
      setDragTask(null);
      return;
    }
    try {
      await api.moveTask(currentWorkspace.id, dragTask.task.id, {
        column_id: targetColId,
        position: 0,
      });
      fetchBoard();
    } catch (err) {
      error(err.message);
    }
    setDragTask(null);
  };

  if (loading) return <Loader />;

  if (!currentWorkspace) {
    return <div className="text-center text-slate-400 mt-20">Select a workspace to view the board</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{board?.name || 'Board'}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input-field pl-9 py-2 text-sm w-56"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary py-2 px-3 text-sm ${showFilters ? 'border-violet-500/30' : ''}`}
          >
            <Filter size={16} />
          </button>
          <button onClick={() => setShowAddCol(true)} className="btn-primary py-2 text-sm">
            <Plus size={16} className="inline mr-1" /> Column
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <select
            className="input-field py-2 text-sm w-40"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className="input-field py-2 text-sm w-40"
            value={filterCompleted}
            onChange={(e) => setFilterCompleted(e.target.value)}
          >
            <option value="">All status</option>
            <option value="true">Completed</option>
            <option value="false">Active</option>
          </select>
          <button onClick={handleSearch} className="btn-primary py-2 text-sm">Apply</button>
          {searchResults && (
            <button onClick={clearFilters} className="btn-secondary py-2 text-sm flex items-center gap-1">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="mb-6">
          <h3 className="text-sm text-slate-400 mb-3">Search results: {searchResults.length} tasks</h3>
          <div className="grid gap-2 max-w-2xl">
            {searchResults.map((task) => (
              <div key={task.id} className="card py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${priorityDots[task.priority]}`} />
                  <span className={task.is_completed ? 'line-through text-slate-500' : ''}>{task.title}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 min-h-[400px] pb-4">
          {board?.columns?.map((col) => (
            <div
              key={col.id}
              className="w-72 shrink-0 flex flex-col rounded-2xl glass"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                {editingCol === col.id ? (
                  <input
                    className="input-field py-1 text-sm flex-1 mr-2"
                    value={editColName}
                    onChange={(e) => setEditColName(e.target.value)}
                    onBlur={() => renameColumn(col.id)}
                    onKeyDown={(e) => e.key === 'Enter' && renameColumn(col.id)}
                    autoFocus
                  />
                ) : (
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    {col.name}
                    <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-md">
                      {col.tasks?.length || 0}
                    </span>
                  </h3>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingCol(col.id); setEditColName(col.name); }}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 transition"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => deleteColumn(col.id)}
                    className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Tasks */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {col.tasks?.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task, col.id)}
                    className="rounded-xl p-3 bg-dark-100 border border-white/5 hover:border-white/10 cursor-grab active:cursor-grabbing transition group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <button onClick={() => toggleComplete(task)} className="mt-0.5 shrink-0">
                          {task.is_completed ? (
                            <CheckCircle size={16} className="text-emerald-400" />
                          ) : (
                            <Circle size={16} className="text-slate-500" />
                          )}
                        </button>
                        <span
                          className={`text-sm font-medium leading-tight ${
                            task.is_completed ? 'line-through text-slate-500' : ''
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                        <button
                          onClick={() => openTaskModal(col.id, task)}
                          className="p-1 rounded hover:bg-white/10 text-slate-400"
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500 mb-2 ml-6 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center gap-2 ml-6 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                      {task.deadline && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Task */}
              <button
                onClick={() => openTaskModal(col.id)}
                className="m-2 p-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition flex items-center justify-center gap-1"
              >
                <Plus size={16} /> Add Task
              </button>
            </div>
          ))}

          {/* Add Column */}
          {showAddCol ? (
            <div className="w-72 shrink-0">
              <form onSubmit={addColumn} className="glass rounded-2xl p-4">
                <input
                  className="input-field mb-3 text-sm"
                  placeholder="Column name"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary py-2 text-sm flex-1">Add</button>
                  <button type="button" onClick={() => setShowAddCol(false)} className="btn-secondary py-2 text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCol(true)}
              className="w-72 shrink-0 rounded-2xl border-2 border-dashed border-white/10 hover:border-violet-500/30 flex items-center justify-center text-slate-400 hover:text-violet-400 transition min-h-[200px]"
            >
              <Plus size={20} className="mr-2" /> Add Column
            </button>
          )}
        </div>
      </div>

      {/* Task Modal */}
      <Modal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, columnId: null, task: null })}
        title={taskModal.task ? 'Edit Task' : 'New Task'}
      >
        <form onSubmit={saveTask} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Title</label>
            <input
              className="input-field"
              placeholder="Task title"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Description</label>
            <textarea
              className="input-field min-h-[80px] resize-none"
              placeholder="Optional description"
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Priority</label>
              <select
                className="input-field"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Deadline</label>
              <input
                type="datetime-local"
                className="input-field"
                value={taskForm.deadline}
                onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            {taskModal.task ? 'Save Changes' : 'Create Task'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
