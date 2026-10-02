import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  Filter,
  Plus,
  Search,
  SkipForward,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  AppState,
  Task,
  TaskCategory,
  TaskStatus,
} from '../types/todo';
import {
  CATEGORIES,
  addDaysISO,
  doesTaskOccurOnDate,
  formatDisplayDate,
  formatTime12h,
  getTaskStatusForDate,
  getTodayISO,
  getWeekDates,
  timeToMinutes,
} from '../utils/dateAndParser';
import {
  getCategoryAccentColor,
  getCategoryIcon,
  getPriorityTextColor,
  getStatusLabelStyle,
} from './CategoryMeta';
import { QuickAddBar } from './QuickAddBar';

interface TasksViewProps {
  state: AppState;
  selectedDateISO: string;
  onOpenAddTask: (draft?: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
  onQuickCreateTask: (task: Task) => void;
  onUpdateTaskStatus: (taskId: string, dateISO: string, status: TaskStatus) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDuplicateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

type FilterMode =
  | 'All'
  | 'Today'
  | 'Tomorrow'
  | 'This Week'
  | 'Completed'
  | 'Pending'
  | 'In Progress'
  | 'High Priority';

const FILTER_TABS: FilterMode[] = [
  'All',
  'Today',
  'Tomorrow',
  'This Week',
  'Pending',
  'In Progress',
  'Completed',
  'High Priority',
];

export const TasksView: React.FC<TasksViewProps> = ({
  state,
  selectedDateISO,
  onOpenAddTask,
  onEditTask,
  onQuickCreateTask,
  onUpdateTaskStatus,
  onToggleSubtask,
  onDuplicateTask,
  onDeleteTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterMode>('All');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'All'>(
    'All'
  );
  const [customDateFilter, setCustomDateFilter] = useState<string>('');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({
    'task-3': true,
    'task-6': true,
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const todayISO = getTodayISO();
  const tomorrowISO = addDaysISO(todayISO, 1);
  const weekISOs = getWeekDates(todayISO, state.profile.firstDayOfWeek).map(
    (d) => d.iso
  );

  // Determine reference date for status display
  const evalDateISO =
    customDateFilter ||
    (activeFilter === 'Tomorrow' ? tomorrowISO : selectedDateISO || todayISO);

  const filteredTasks = state.tasks
    .filter((task) => {
      // 1. Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = task.title.toLowerCase().includes(q);
        const inNotes = task.notes.toLowerCase().includes(q);
        const inCategory = task.category.toLowerCase().includes(q);
        const inSubtasks = task.subtasks.some((s) =>
          s.title.toLowerCase().includes(q)
        );
        if (!inTitle && !inNotes && !inCategory && !inSubtasks) return false;
      }

      // 2. Category match
      if (selectedCategory !== 'All' && task.category !== selectedCategory) {
        return false;
      }

      // 3. Specific Date Filter override
      if (customDateFilter) {
        return doesTaskOccurOnDate(task, customDateFilter, false);
      }

      // 4. Filter Mode
      const statusOnEvalDate = getTaskStatusForDate(task, evalDateISO);

      switch (activeFilter) {
        case 'Today':
          return doesTaskOccurOnDate(task, todayISO, false);
        case 'Tomorrow':
          return doesTaskOccurOnDate(task, tomorrowISO, false);
        case 'This Week':
          return weekISOs.some((iso) => doesTaskOccurOnDate(task, iso, false));
        case 'Completed':
          return statusOnEvalDate === 'Completed';
        case 'Pending':
          return statusOnEvalDate === 'Pending';
        case 'In Progress':
          return statusOnEvalDate === 'In Progress';
        case 'High Priority':
          return task.priority === 'High' || task.priority === 'Urgent';
        case 'All':
        default:
          return true;
      }
    })
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-[#972828] dark:text-[#FCAD38]">
              Task Manager & Smart Filters
            </span>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              All Tasks & Subtasks
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Search, filter by priority or category, and manage one-time or recurring tasks.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenAddTask({ date: evalDateISO })}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#972828] to-[#E45742] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm hover:opacity-95 transition-opacity cursor-pointer self-start sm:self-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Task</span>
          </button>
        </div>

        {/* Search & Date / Category Filter Row (Section 15) */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search tasks or subtasks (e.g. "Assignment", "Exam")...'
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <div className="md:col-span-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#E45742] shrink-0 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value as TaskCategory | 'All')
              }
              className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
              aria-label="Filter by category"
            >
              <option value="All">All Categories (9)</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Picker */}
          <div className="md:col-span-3 flex items-center gap-1.5">
            <input
              type="date"
              value={customDateFilter}
              onChange={(e) => setCustomDateFilter(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm font-mono tabular-nums text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
              aria-label="Filter by specific date"
            />
            {customDateFilter && (
              <button
                type="button"
                onClick={() => setCustomDateFilter('')}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
                title="Clear date filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Mode Segmented Tabs */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab && !customDateFilter;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setCustomDateFilter('');
                  setActiveFilter(tab);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#972828] text-white font-semibold'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </section>

      {/* Natural Language Quick Add */}
      <QuickAddBar
        selectedDateISO={evalDateISO}
        onQuickCreateTask={onQuickCreateTask}
        onOpenFullModalWithDraft={(draft) => onOpenAddTask(draft)}
      />

      {/* Filtered Tasks Results */}
      <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            {customDateFilter
              ? `Tasks on ${formatDisplayDate(customDateFilter)}`
              : `${activeFilter} Tasks`}
            {selectedCategory !== 'All' ? ` · ${selectedCategory}` : ''}
          </h2>
          <span className="text-xs font-mono tabular-nums text-neutral-500">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FCAD38]/15 text-[#EB7F31] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Your day is clear ✨
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {searchQuery
                ? `No tasks matched "${searchQuery}". Try another keyword or create it right now.`
                : 'Add something you want to accomplish today.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  onOpenAddTask({
                    title: searchQuery.trim() || '',
                    date: evalDateISO,
                    category:
                      selectedCategory !== 'All' ? selectedCategory : 'Study',
                  })
                }
                className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-[#972828] hover:bg-[#7e2020] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Task</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredTasks.map((task) => {
              const status = getTaskStatusForDate(task, evalDateISO);
              const isCompleted = status === 'Completed';
              const isSkipped = status === 'Skipped';
              const catColors = getCategoryAccentColor(task.category);
              const statusMeta = getStatusLabelStyle(status);
              const isExpanded = Boolean(expandedTaskIds[task.id]);

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-colors ${
                    isCompleted
                      ? 'border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/60 dark:bg-neutral-900/40'
                      : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#1A1D26]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Complete Check Button */}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTaskStatus(
                            task.id,
                            evalDateISO,
                            isCompleted ? 'Pending' : 'Completed'
                          )
                        }
                        className={`mt-1 w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 transition-transform active:scale-90 cursor-pointer ${
                          isCompleted
                            ? 'bg-[#972828] border-[#972828] text-white'
                            : 'border-neutral-300 dark:border-neutral-600 hover:border-[#972828]'
                        }`}
                        title={
                          isCompleted ? 'Mark as Pending' : 'Mark as Completed'
                        }
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5" />}
                      </button>

                      {/* Category Icon */}
                      <div
                        className={`w-9 h-9 rounded-xl ${catColors.iconBg} ${catColors.iconText} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        {getCategoryIcon(task.category, 'w-4 h-4')}
                      </div>

                      {/* Title & Unboxed Metadata */}
                      <div className="min-w-0">
                        <h3
                          className={`text-sm sm:text-base font-bold ${
                            isCompleted || isSkipped
                              ? 'line-through text-neutral-400 dark:text-neutral-500'
                              : 'text-neutral-900 dark:text-white'
                          }`}
                        >
                          {task.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
                            {formatTime12h(task.startTime)}
                            {task.endTime
                              ? ` – ${formatTime12h(task.endTime)}`
                              : ''}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{task.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className={getPriorityTextColor(task.priority)}>
                            {task.priority} Priority
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className={statusMeta.text}>
                            {statusMeta.label}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {task.repeat === 'Does not repeat'
                              ? formatDisplayDate(task.date)
                              : task.repeat}
                          </span>
                        </div>

                        {task.notes && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Action Controls: Status Select + Edit + Duplicate + Skip + Delete */}
                    <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-start shrink-0">
                      <select
                        value={status}
                        onChange={(e) =>
                          onUpdateTaskStatus(
                            task.id,
                            evalDateISO,
                            e.target.value as TaskStatus
                          )
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
                        aria-label="Task status"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Skipped">Skipped</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Edit Task"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicateTask(task)}
                        className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Duplicate Task"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTaskStatus(task.id, evalDateISO, 'Skipped')
                        }
                        className="p-2 rounded-xl text-neutral-500 hover:text-[#EB7F31] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                        title="Skip Task"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(task.id)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation */}
                  {confirmDeleteId === task.id && (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-3">
                      <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
                        Are you sure you want to delete “{task.title}”?
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTask(task.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Subtasks Checklist */}
                  {task.subtasks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTaskIds((prev) => ({
                            ...prev,
                            [task.id]: !prev[task.id],
                          }))
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#972828] dark:text-[#FCAD38] hover:underline cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                        <span className="font-mono tabular-nums">
                          Subtasks (
                          {task.subtasks.filter((s) => s.completed).length}/
                          {task.subtasks.length} completed)
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {task.subtasks.map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => onToggleSubtask(task.id, st.id)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/70 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs text-left transition-colors cursor-pointer"
                            >
                              <span
                                className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                                  st.completed
                                    ? 'bg-[#E45742] border-[#E45742] text-white'
                                    : 'border-neutral-300 dark:border-neutral-600'
                                }`}
                              >
                                {st.completed && (
                                  <Check className="w-2.5 h-2.5" />
                                )}
                              </span>
                              <span
                                className={
                                  st.completed
                                    ? 'line-through text-neutral-400'
                                    : 'text-neutral-800 dark:text-neutral-200 font-medium'
                                }
                              >
                                {st.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
