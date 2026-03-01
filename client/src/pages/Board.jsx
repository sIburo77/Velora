import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, MoreHorizontal, Trash2, Edit3, GripVertical,
  Search, Filter, Calendar, Flag, CheckCircle, Circle, X, ChevronDown, Tag,
} from 'lucide-react';
import {
  DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { SkeletonColumn } from '../components/ui/Skeleton';
import Markdown from '../components/ui/Markdown';
import Modal from '../components/ui/Modal';
import CommentSection from '../components/tasks/CommentSection';
import AttachmentList from '../components/tasks/AttachmentList';

const priorityColors = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const priorityDots = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-emerald-500' };

function TaskCard({ task, colId, onToggle, onEdit, onDelete, overlay = false, members = [] }) {
  const assignee = task.assigned_to ? members.find((m) => m.user_id === task.assigned_to) : null;
  return (
    <div className={`rounded-xl p-3 bg-surface-elevated border border-[var(--color-border)] ${overlay ? 'shadow-2xl shadow-violet-500/20 rotate-2 scale-105' : 'hover:border-[var(--color-border-hover)]'} transition group`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 min-w-0">
          <button onClick={() => !overlay && onToggle(task)} className="mt-0.5 shrink-0">
            {task.is_completed ? (
              <CheckCircle size={16} className="text-emerald-400" />
            ) : (
              <Circle size={16} className="text-content-muted" />
            )}
          </button>
          <span className={`text-sm font-medium leading-tight ${task.is_completed ? 'line-through text-content-muted' : ''}`}>
            {task.title}
          </span>
        </div>
        {!overlay && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
            <button onClick={() => onEdit(colId, task)} className="p-1 rounded hover:bg-surface-glass text-content-secondary">
              <Edit3 size={12} />
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-red-500/10 text-content-secondary hover:text-red-400">
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {task.description && (
        <div className="text-xs text-content-muted mb-2 ml-6 line-clamp-2">
          <Markdown content={task.description} />
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-6 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        {task.tags?.map((tag) => (
          <span
            key={tag.id}
            className="text-xs px-2 py-0.5 rounded-full text-white/90 font-medium"
            style={{ backgroundColor: tag.color + 'cc' }}
          >
            {tag.name}
          </span>
        ))}
        {task.deadline && (
          <span className="text-xs text-content-muted flex items-center gap-1">
            <Calendar size={10} />
            {new Date(task.deadline).toLocaleDateString()}
          </span>
        )}
        {assignee && (
          <span className="text-xs text-content-muted flex items-center gap-1 ml-auto">
            {assignee.avatar_url ? (
              <img src={assignee.avatar_url} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[8px] font-bold text-white">
                {(assignee.user_name || '?')[0].toUpperCase()}
              </div>
            )}
            {assignee.user_name}
          </span>
        )}
      </div>
    </div>
  );
}

function SortableTaskCard({ task, colId, onToggle, onEdit, onDelete, members }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task, colId },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <TaskCard task={task} colId={colId} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} members={members} />
    </div>
  );
}

export default function Board() {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const { success, error } = useToast();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddCol, setShowAddCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [taskModal, setTaskModal] = useState({ open: false, columnId: null, task: null });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', deadline: '', assigned_to: '' });
  const [members, setMembers] = useState([]);
  const [editingCol, setEditingCol] = useState(null);
  const [editColName, setEditColName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCompleted, setFilterCompleted] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [workspaceTags, setWorkspaceTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#8b5cf6');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchBoard = useCallback(async () => {
    if (!currentWorkspace) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.getBoard(currentWorkspace.id);
      setBoard(data);
    } catch (err) {
      error(t('board.failedLoad'));
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    setLoading(true);
    setSearchResults(null);
    fetchBoard();
  }, [fetchBoard]);

  useEffect(() => {
    if (!currentWorkspace) return;
    api.getTags(currentWorkspace.id).then(setWorkspaceTags).catch(() => {});
    api.getMembers(currentWorkspace.id).then(setMembers).catch(() => {});
  }, [currentWorkspace]);

  const tagColors = ['#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#06b6d4', '#f97316'];

  const handleAddTag = async (taskId, tagId) => {
    try {
      await api.addTagToTask(currentWorkspace.id, taskId, tagId);
      fetchBoard();
    } catch {}
  };

  const handleRemoveTag = async (taskId, tagId) => {
    try {
      await api.removeTagFromTask(currentWorkspace.id, taskId, tagId);
      fetchBoard();
    } catch {}
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const tag = await api.createTag(currentWorkspace.id, { name: newTagName.trim(), color: newTagColor });
      setWorkspaceTags((prev) => [...prev, tag]);
      setNewTagName('');
      setNewTagColor('#8b5cf6');
    } catch {}
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await api.deleteTag(currentWorkspace.id, tagId);
      setWorkspaceTags((prev) => prev.filter((t) => t.id !== tagId));
      fetchBoard();
    } catch {}
  };

  const addColumn = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    try {
      await api.createColumn(currentWorkspace.id, { name: newColName.trim() });
      setNewColName('');
      setShowAddCol(false);
      fetchBoard();
      success(t('board.columnCreated'));
    } catch (err) {
      error(err.message);
    }
  };

  const deleteColumn = async (colId) => {
    try {
      await api.deleteColumn(currentWorkspace.id, colId);
      fetchBoard();
      success(t('board.columnDeleted'));
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
        assigned_to: task.assigned_to || '',
      });
    } else {
      setTaskForm({ title: '', description: '', priority: 'medium', deadline: '', assigned_to: '' });
    }
    setTaskModal({ open: true, columnId, task });
  };

  const saveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    const data = {
      ...taskForm,
      deadline: taskForm.deadline ? new Date(taskForm.deadline).toISOString() : null,
      assigned_to: taskForm.assigned_to || null,
    };
    try {
      if (taskModal.task) {
        await api.updateTask(currentWorkspace.id, taskModal.task.id, data);
        success(t('board.taskUpdated'));
        setTaskModal({ open: false, columnId: null, task: null });
      } else {
        const created = await api.createTask(currentWorkspace.id, taskModal.columnId, data);
        success(t('board.taskCreated'));
        setTaskModal({ open: true, columnId: taskModal.columnId, task: created });
        setTaskForm({
          title: created.title,
          description: created.description || '',
          priority: created.priority,
          deadline: created.deadline ? created.deadline.slice(0, 16) : '',
        });
      }
      fetchBoard();
    } catch (err) {
      error(err.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await api.deleteTask(currentWorkspace.id, taskId);
      fetchBoard();
      success(t('board.taskDeleted'));
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
    if (!searchQuery && !filterPriority && filterCompleted === '' && !filterDateFrom && !filterDateTo) {
      setSearchResults(null);
      return;
    }
    try {
      const params = {};
      if (searchQuery) params.q = searchQuery;
      if (filterPriority) params.priority = filterPriority;
      if (filterCompleted !== '') params.is_completed = filterCompleted;
      if (filterDateFrom) params.deadline_from = new Date(filterDateFrom).toISOString();
      if (filterDateTo) params.deadline_to = new Date(filterDateTo + 'T23:59:59').toISOString();
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
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchResults(null);
  };

  // DnD helpers
  const findColumnByTaskId = (taskId) => {
    for (const col of board?.columns || []) {
      if (col.tasks?.some((t) => t.id === taskId)) return col;
    }
    return null;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const col = findColumnByTaskId(active.id);
    if (col) {
      const task = col.tasks.find((t) => t.id === active.id);
      setActiveTask(task);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || !board) return;

    const activeCol = findColumnByTaskId(active.id);
    if (!activeCol) return;

    // Determine over column: either the task's column or the column itself
    let overCol = findColumnByTaskId(over.id);
    if (!overCol) {
      // over.id might be a column id (droppable)
      overCol = board.columns.find((c) => c.id === over.id);
    }
    if (!overCol || activeCol.id === overCol.id) return;

    // Move task from activeCol to overCol optimistically
    setBoard((prev) => {
      const newColumns = prev.columns.map((col) => ({ ...col, tasks: [...(col.tasks || [])] }));
      const srcCol = newColumns.find((c) => c.id === activeCol.id);
      const dstCol = newColumns.find((c) => c.id === overCol.id);
      const taskIdx = srcCol.tasks.findIndex((t) => t.id === active.id);
      if (taskIdx === -1) return prev;
      const [task] = srcCol.tasks.splice(taskIdx, 1);

      // Find insert index
      const overIdx = dstCol.tasks.findIndex((t) => t.id === over.id);
      if (overIdx >= 0) {
        dstCol.tasks.splice(overIdx, 0, task);
      } else {
        dstCol.tasks.push(task);
      }

      return { ...prev, columns: newColumns };
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || !board) return;

    const activeCol = findColumnByTaskId(active.id);
    if (!activeCol) return;

    let overCol = findColumnByTaskId(over.id);
    if (!overCol) {
      overCol = board.columns.find((c) => c.id === over.id);
    }
    if (!overCol) return;

    if (activeCol.id === overCol.id) {
      // Within-column reorder
      const oldIdx = activeCol.tasks.findIndex((t) => t.id === active.id);
      const newIdx = activeCol.tasks.findIndex((t) => t.id === over.id);
      if (oldIdx !== newIdx && newIdx >= 0) {
        const reordered = arrayMove(activeCol.tasks, oldIdx, newIdx);
        setBoard((prev) => ({
          ...prev,
          columns: prev.columns.map((c) =>
            c.id === activeCol.id ? { ...c, tasks: reordered } : c
          ),
        }));
        try {
          await api.reorderTasks(currentWorkspace.id, activeCol.id, reordered.map((t) => t.id));
        } catch {
          fetchBoard();
        }
      }
    } else {
      // Cross-column move — state was already updated in handleDragOver
      const targetTasks = overCol.tasks || [];
      const position = targetTasks.findIndex((t) => t.id === active.id);
      try {
        await api.moveTask(currentWorkspace.id, active.id, {
          column_id: overCol.id,
          position: position >= 0 ? position : 0,
        });
        // Also reorder remaining tasks in the target column
        await api.reorderTasks(currentWorkspace.id, overCol.id, targetTasks.map((t) => t.id));
      } catch {
        fetchBoard();
      }
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-32 rounded bg-surface-elevated animate-pulse" />
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 min-h-[400px] pb-4">
            <SkeletonColumn />
            <SkeletonColumn />
            <SkeletonColumn />
            <SkeletonColumn />
          </div>
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return <div className="text-center text-content-secondary mt-20">{t('board.selectWorkspace')}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{board?.name || t('board.board')}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              className="input-field pl-9 py-2 text-sm w-56"
              placeholder={t('board.searchPlaceholder')}
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
            <Plus size={16} className="inline mr-1" /> {t('board.column')}
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
            <option value="">{t('board.allPriorities')}</option>
            <option value="high">{t('board.high')}</option>
            <option value="medium">{t('board.medium')}</option>
            <option value="low">{t('board.low')}</option>
          </select>
          <select
            className="input-field py-2 text-sm w-40"
            value={filterCompleted}
            onChange={(e) => setFilterCompleted(e.target.value)}
          >
            <option value="">{t('board.allStatus')}</option>
            <option value="true">{t('board.completedFilter')}</option>
            <option value="false">{t('board.activeFilter')}</option>
          </select>
          <input
            type="date"
            className="input-field py-2 text-sm w-40"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            placeholder={t('board.dateFrom')}
          />
          <input
            type="date"
            className="input-field py-2 text-sm w-40"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            placeholder={t('board.dateTo')}
          />
          <button onClick={handleSearch} className="btn-primary py-2 text-sm">{t('common.apply')}</button>
          {searchResults && (
            <button onClick={clearFilters} className="btn-secondary py-2 text-sm flex items-center gap-1">
              <X size={14} /> {t('common.clear')}
            </button>
          )}
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="mb-6">
          <h3 className="text-sm text-content-secondary mb-3">{t('board.searchResults')} {searchResults.length} {t('board.tasks')}</h3>
          <div className="grid gap-2 max-w-2xl">
            {searchResults.map((task) => (
              <div key={task.id} className="card py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${priorityDots[task.priority]}`} />
                  <span className={task.is_completed ? 'line-through text-content-muted' : ''}>{task.title}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Columns with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 min-h-[400px] pb-4">
            {board?.columns?.map((col) => (
              <div
                key={col.id}
                className="w-72 shrink-0 flex flex-col rounded-2xl glass"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
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
                      <span className="text-xs text-content-muted bg-surface-glass px-1.5 py-0.5 rounded-md">
                        {col.tasks?.length || 0}
                      </span>
                    </h3>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingCol(col.id); setEditColName(col.name); }}
                      className="p-1 rounded-lg hover:bg-surface-glass text-content-secondary transition"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteColumn(col.id)}
                      className="p-1 rounded-lg hover:bg-red-500/10 text-content-secondary hover:text-red-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Tasks */}
                <SortableContext
                  items={(col.tasks || []).map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                  id={col.id}
                >
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[60px]">
                    {col.tasks?.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        colId={col.id}
                        onToggle={toggleComplete}
                        onEdit={openTaskModal}
                        onDelete={deleteTask}
                        members={members}
                      />
                    ))}
                  </div>
                </SortableContext>

                {/* Add Task */}
                <button
                  onClick={() => openTaskModal(col.id)}
                  className="m-2 p-2 rounded-xl text-sm text-content-secondary hover:text-slate-200 hover:bg-surface-glass transition flex items-center justify-center gap-1"
                >
                  <Plus size={16} /> {t('board.addTask')}
                </button>
              </div>
            ))}

            {/* Add Column */}
            {showAddCol ? (
              <div className="w-72 shrink-0">
                <form onSubmit={addColumn} className="glass rounded-2xl p-4">
                  <input
                    className="input-field mb-3 text-sm"
                    placeholder={t('board.columnName')}
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary py-2 text-sm flex-1">{t('common.add')}</button>
                    <button type="button" onClick={() => setShowAddCol(false)} className="btn-secondary py-2 text-sm">
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setShowAddCol(true)}
                className="w-72 shrink-0 rounded-2xl border-2 border-dashed border-[var(--color-border-hover)] hover:border-violet-500/30 flex items-center justify-center text-content-secondary hover:text-violet-400 transition min-h-[200px]"
              >
                <Plus size={20} className="mr-2" /> {t('board.addColumn')}
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="w-68">
              <TaskCard task={activeTask} overlay members={members} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Modal */}
      <Modal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false, columnId: null, task: null })}
        title={taskModal.task ? t('board.editTask') : t('board.newTask')}
        size={taskModal.task ? 'lg' : 'md'}
      >
        <form onSubmit={saveTask} className="space-y-4">
          <div>
            <label className="block text-sm text-content-secondary mb-1">{t('board.title')}</label>
            <input
              className="input-field"
              placeholder={t('board.taskTitle')}
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-content-secondary mb-1">{t('board.description')}</label>
            <textarea
              className="input-field min-h-[80px] resize-none"
              placeholder={t('board.optionalDesc')}
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-content-secondary mb-1">{t('board.priority')}</label>
              <select
                className="input-field"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                <option value="low">{t('board.low')}</option>
                <option value="medium">{t('board.medium')}</option>
                <option value="high">{t('board.high')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-content-secondary mb-1">{t('board.deadline')}</label>
              <input
                type="datetime-local"
                className="input-field"
                value={taskForm.deadline}
                onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-content-secondary mb-1">{t('board.assignee')}</label>
            <select
              className="input-field"
              value={taskForm.assigned_to}
              onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
            >
              <option value="">{t('board.unassigned')}</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user_name || m.user_email}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">
            {taskModal.task ? t('board.saveChanges') : t('board.createTask')}
          </button>
        </form>

        {/* Tags for existing tasks */}
        {taskModal.task && currentWorkspace && (
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Tag size={14} /> {t('board.tags')}
            </h4>

            {/* Current tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {taskModal.task.tags?.length > 0 ? (
                taskModal.task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="text-xs px-2 py-1 rounded-full text-white/90 font-medium inline-flex items-center gap-1"
                    style={{ backgroundColor: tag.color + 'cc' }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(taskModal.task.id, tag.id)}
                      className="hover:text-white ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-content-muted">{t('board.noTags')}</span>
              )}
            </div>

            {/* Add existing tag */}
            <div className="relative mb-3">
              <button
                type="button"
                onClick={() => setShowTagDropdown(!showTagDropdown)}
                className="btn-secondary py-1.5 px-3 text-xs w-full flex items-center justify-between"
              >
                {t('board.addTag')} <ChevronDown size={12} />
              </button>
              {showTagDropdown && (
                <div className="absolute z-20 mt-1 w-full glass rounded-xl border border-[var(--color-border)] p-2 space-y-1 max-h-40 overflow-y-auto">
                  {workspaceTags
                    .filter((wt) => !taskModal.task.tags?.some((tt) => tt.id === wt.id))
                    .map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => { handleAddTag(taskModal.task.id, tag.id); setShowTagDropdown(false); }}
                        className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-surface-glass flex items-center gap-2 group"
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                        <span className="flex-1">{tag.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag.id); }}
                          className="opacity-0 group-hover:opacity-100 text-content-muted hover:text-red-400 p-0.5"
                        >
                          <Trash2 size={10} />
                        </button>
                      </button>
                    ))}
                  {workspaceTags.filter((wt) => !taskModal.task.tags?.some((tt) => tt.id === wt.id)).length === 0 && (
                    <span className="text-xs text-content-muted block px-2 py-1">{t('board.noMoreTags')}</span>
                  )}
                </div>
              )}
            </div>

            {/* Create new tag */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {tagColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewTagColor(c)}
                    className={`w-5 h-5 rounded-full transition ${newTagColor === c ? 'ring-2 ring-offset-1 ring-offset-[var(--color-bg)] ring-white/50 scale-110' : 'opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <input
                className="input-field flex-1 py-1.5 text-xs"
                placeholder={t('board.tagName')}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
              />
              <button
                type="button"
                onClick={handleCreateTag}
                className="btn-primary py-1.5 px-3 text-xs"
              >
                {t('board.createTag')}
              </button>
            </div>
          </div>
        )}

        {/* Attachments & Comments for existing tasks */}
        {taskModal.task && currentWorkspace && (
          <>
            <AttachmentList
              workspaceId={currentWorkspace.id}
              taskId={taskModal.task.id}
              canEdit={true}
            />
            <CommentSection
              workspaceId={currentWorkspace.id}
              taskId={taskModal.task.id}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
