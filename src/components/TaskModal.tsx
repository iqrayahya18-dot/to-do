import React, { useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  Check,
  Clock,
  ListChecks,
  Plus,
  Repeat,
  Trash2,
  X,
} from 'lucide-react';
import {
  DayOfWeekName,
  ReminderOption,
  RepeatPattern,
  Subtask,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../types/todo';
import {
  CATEGORIES,
  DAYS_OF_WEEK,
  PRIORITIES,
  REPEAT_OPTIONS,
  getDayOfWeekName,
  getTodayISO,
} from '../utils/dateAndParser';
import { getCategoryIcon } from './CategoryMeta';

const REMINDER_OPTIONS: ReminderOption[] = [
  'At time of task',
  '5 minutes before',
  '10 minutes before',
  '15 minutes before',
  '30 minutes before',
  '1 hour before',
  'Custom',
];

interface TaskModalProps {
  isOpen: boolean;
  initialTask?: Partial<Task> | null;
  activeDateISO: string;
  onClose: () => void;
  onSaveTask: (
    task: Task,
    editScope: 'series' | 'single_occurrence',
    occurrenceDateISO: string
  ) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  initialTask,
  activeDateISO,
  onClose,
  onSaveTask,
}) => {
  const isEditingExisting = Boolean(initialTask && initialTask.id);
  const isExistingRecurring = Boolean(
    isEditingExisting &&
      initialTask?.repeat &&
      initialTask.repeat !== 'Does not repeat'
  );

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(activeDateISO || getTodayISO());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeekName>(
    getDayOfWeekName(activeDateISO || getTodayISO())
  );
  const [repeat, setRepeat] = useState<RepeatPattern>('Does not repeat');
  const [customDays, setCustomDays] = useState<DayOfWeekName[]>([
    'Monday',
    'Wednesday',
    'Friday',
  ]);
  const [category, setCategory] = useState<TaskCategory>('Study');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [reminder, setReminder] = useState<ReminderOption>('15 minutes before');
  const [customReminderMinutes, setCustomReminderMinutes] = useState<number>(20);
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [editScope, setEditScope] = useState<'series' | 'single_occurrence'>(
    'series'
  );

  useEffect(() => {
    if (!isOpen) return;
    const defaultDate = initialTask?.date || activeDateISO || getTodayISO();
    setTitle(initialTask?.title || '');
    setDate(defaultDate);
    setStartTime(initialTask?.startTime || '09:00');
    setEndTime(initialTask?.endTime || '');
    setDayOfWeek(initialTask?.dayOfWeek || getDayOfWeekName(defaultDate));
    setRepeat(initialTask?.repeat || 'Does not repeat');
    setCustomDays(
      initialTask?.customDays || ['Monday', 'Wednesday', 'Friday']
    );
    setCategory(initialTask?.category || 'Study');
    setPriority(initialTask?.priority || 'Medium');
    setReminder(initialTask?.reminder || '15 minutes before');
    setCustomReminderMinutes(initialTask?.customReminderMinutes || 20);
    setNotes(initialTask?.notes || '');
    setSubtasks(initialTask?.subtasks ? [...initialTask.subtasks] : []);
    setStatus(initialTask?.status || 'Pending');
    setEditScope('series');
    setNewSubtaskText('');
  }, [isOpen, initialTask, activeDateISO]);

  if (!isOpen) return null;

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (newDate) {
      setDayOfWeek(getDayOfWeekName(newDate));
    }
  };

  const toggleCustomDay = (day: DayOfWeekName) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddSubtask = () => {
    const trimmed = newSubtaskText.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `st-${Date.now()}-${prev.length}`, title: trimmed, completed: false },
    ]);
    setNewSubtaskText('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || 'Untitled Task';
    const taskPayload: Task = {
      id: initialTask?.id || `task-${Date.now()}`,
      title: finalTitle,
      date,
      startTime,
      endTime: endTime.trim() ? endTime.trim() : undefined,
      dayOfWeek,
      repeat,
      customDays: repeat === 'Custom days' ? customDays : undefined,
      category,
      priority,
      reminder,
      customReminderMinutes:
        reminder === 'Custom' ? customReminderMinutes : undefined,
      notes: notes.trim(),
      subtasks,
      status,
      dateStatusOverrides: initialTask?.dateStatusOverrides || {},
      excludedDates: initialTask?.excludedDates || [],
      createdAt: initialTask?.createdAt || getTodayISO(),
    };

    onSaveTask(taskPayload, editScope, activeDateISO);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#161820] border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-200/80 dark:border-neutral-800">
          <div>
            <h2
              id="task-modal-title"
              className="text-lg font-bold text-neutral-900 dark:text-white"
            >
              {isEditingExisting ? 'Edit Task & Schedule' : 'Add New Task'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Schedule your task, recurrence, subtasks, and reminder in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5"
        >
          {/* Recurring Task Scope Selector when editing an existing recurring task */}
          {isExistingRecurring && (
            <div className="p-3.5 rounded-2xl bg-[#972828]/6 dark:bg-[#972828]/15 border border-[#972828]/20">
              <p className="text-xs font-semibold text-[#972828] dark:text-[#FCAD38] mb-2">
                Recurring Task Edit Scope
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditScope('single_occurrence')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                    editScope === 'single_occurrence'
                      ? 'bg-[#972828] text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Only for {activeDateISO} (Today’s Occurrence)
                </button>
                <button
                  type="button"
                  onClick={() => setEditScope('series')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors cursor-pointer ${
                    editScope === 'series'
                      ? 'bg-[#972828] text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Entire Recurring Series
                </button>
              </div>
            </div>
          )}

          {/* Task Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Task Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. "Complete Mathematics Assignment" or "Prepare for Exam"'
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm sm:text-base text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828] transition-colors"
            />
          </div>

          {/* Date, Start Time, End Time, Day */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#972828]" />
                  Date
                </span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm font-mono tabular-nums text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#E45742]" />
                  Start Time
                </span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm font-mono tabular-nums text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                End Time (Optional)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm font-mono tabular-nums text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Day of Week
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as DayOfWeekName)}
                className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#972828] text-white shadow-xs'
                        : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {getCategoryIcon(cat, 'w-3.5 h-3.5 shrink-0')}
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Priority Level
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
                {PRIORITIES.map((p) => {
                  const active = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-white dark:bg-neutral-800 text-[#972828] dark:text-[#FCAD38] shadow-xs font-semibold'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Task Status
              </label>
              <div className="grid grid-cols-4 gap-1.5 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl">
                {(
                  ['Pending', 'In Progress', 'Completed', 'Skipped'] as TaskStatus[]
                ).map((st) => {
                  const active = status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2 px-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer truncate whitespace-nowrap ${
                        active
                          ? 'bg-white dark:bg-neutral-800 text-[#972828] dark:text-[#FCAD38] shadow-xs font-semibold'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Repeat & Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5 text-[#EB7F31]" />
                  Repeat / Recurrence
                </span>
              </label>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as RepeatPattern)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
              >
                {REPEAT_OPTIONS.map((rp) => (
                  <option key={rp} value={rp}>
                    {rp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                <span className="inline-flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-[#FCAD38]" />
                  Reminder Notification
                </span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={reminder}
                  onChange={(e) =>
                    setReminder(e.target.value as ReminderOption)
                  }
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
                >
                  {REMINDER_OPTIONS.map((rm) => (
                    <option key={rm} value={rm}>
                      {rm}
                    </option>
                  ))}
                </select>
                {reminder === 'Custom' && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={customReminderMinutes}
                      onChange={(e) =>
                        setCustomReminderMinutes(
                          Math.max(1, parseInt(e.target.value || '15', 10))
                        )
                      }
                      className="w-16 px-2 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-center"
                    />
                    <span className="text-xs text-neutral-500">min</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Days Selector when Repeat === 'Custom days' */}
          {repeat === 'Custom days' && (
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
              <span className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Select Custom Repeat Days
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const selected = customDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleCustomDay(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#972828] text-white'
                          : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      {d.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Subtasks Section */}
          <div className="p-4 rounded-2xl bg-neutral-50/80 dark:bg-neutral-900/70 border border-neutral-200/70 dark:border-neutral-800">
            <label className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2.5">
              <span className="inline-flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-[#972828] dark:text-[#E45742]" />
                Subtasks / Step-by-Step Checklist
              </span>
              <span className="font-mono text-neutral-400">
                {subtasks.filter((s) => s.completed).length}/{subtasks.length} done
              </span>
            </label>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder='Add a step (e.g. "Read Chapter 1", "Practice questions")...'
                className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#E45742] hover:bg-[#d14834] text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Step
              </button>
            </div>

            {subtasks.length > 0 ? (
              <ul className="space-y-1.5">
                {subtasks.map((st) => (
                  <li
                    key={st.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-neutral-800/90 border border-neutral-200/60 dark:border-neutral-700/60"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(st.id)}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                          st.completed
                            ? 'bg-[#972828] border-[#972828] text-white'
                            : 'border-neutral-300 dark:border-neutral-600'
                        }`}
                      >
                        {st.completed && <Check className="w-3 h-3" />}
                      </span>
                      <span
                        className={`text-xs sm:text-sm truncate ${
                          st.completed
                            ? 'line-through text-neutral-400'
                            : 'text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        {st.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                      aria-label="Remove subtask"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-neutral-400">
                Break down large tasks (like exam prep or project milestones) into smaller actionable steps.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Additional Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write links, chapters, instructions, or personal reminders..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-200/80 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#972828] to-[#E45742] hover:opacity-95 transition-opacity shadow-sm cursor-pointer"
            >
              {isEditingExisting ? 'Save Changes' : 'Schedule Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
