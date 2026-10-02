import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  GripVertical,
  Moon,
  Palmtree,
  Plus,
  RotateCcw,
  SkipForward,
  Sparkles,
  Sun,
  Trash2,
  Utensils,
} from 'lucide-react';
import {
  AppState,
  MainNavTab,
  RoutineSubTab,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../types/todo';
import {
  calculateSleepDuration,
  doesTaskOccurOnDate,
  formatLongHeaderDate,
  formatTime12h,
  getDayOfWeekName,
  getTaskStatusForDate,
  getTodayISO,
  getWeekDates,
  minutesToTime24h,
  timeToMinutes,
} from '../utils/dateAndParser';
import {
  getCategoryAccentColor,
  getCategoryIcon,
  getPriorityTextColor,
  getStatusLabelStyle,
} from './CategoryMeta';
import { QuickAddBar } from './QuickAddBar';

interface DashboardViewProps {
  state: AppState;
  selectedDateISO: string;
  onSelectDate: (iso: string) => void;
  onOpenAddTask: (draft?: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
  onQuickCreateTask: (task: Task) => void;
  onUpdateTaskStatus: (taskId: string, dateISO: string, status: TaskStatus) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDuplicateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onRescheduleTaskTime: (taskId: string, newStartTime24: string) => void;
  onToggleRoutineCompleted: (routineId: string, dateISO: string) => void;
  onToggleMealCompleted: (mealId: string, dateISO: string) => void;
  onNavigate: (tab: MainNavTab, routineSub?: RoutineSubTab) => void;
  onToggleOffDayMode: (enabled: boolean) => void;
}

interface UnifiedTimelineEntry {
  uid: string;
  sourceType: 'task' | 'routine' | 'meal';
  sourceId: string;
  time24: string;
  endTime24?: string;
  title: string;
  subtitle?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  taskRef?: Task;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  selectedDateISO,
  onSelectDate,
  onOpenAddTask,
  onEditTask,
  onQuickCreateTask,
  onUpdateTaskStatus,
  onToggleSubtask,
  onDuplicateTask,
  onDeleteTask,
  onRescheduleTaskTime,
  onToggleRoutineCompleted,
  onToggleMealCompleted,
  onNavigate,
  onToggleOffDayMode,
}) => {
  const [timelineFilter, setTimelineFilter] = useState<
    'all' | 'tasks' | 'routine'
  >('all');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({
    'task-6': true,
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverUid, setDragOverUid] = useState<string | null>(null);

  const todayISO = getTodayISO();
  const dateHeader = formatLongHeaderDate(selectedDateISO);
  const dayOfWeekName = getDayOfWeekName(selectedDateISO);

  const isConfiguredOffDay =
    state.offDay.enabled &&
    state.offDay.dayOfWeek === dayOfWeekName &&
    state.offDay.mode === 'Full day off';

  // Determine greeting based on current hour
  const now = new Date();
  const currentHour = now.getHours();
  const greeting =
    currentHour < 12
      ? 'Good Morning'
      : currentHour < 17
      ? 'Good Afternoon'
      : 'Good Evening';
  const liveTimeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Week strip around selectedDateISO
  const weekDays = getWeekDates(selectedDateISO, state.profile.firstDayOfWeek);

  // Tasks for selected date
  const dayTasks = state.tasks.filter((t) =>
    doesTaskOccurOnDate(
      t,
      selectedDateISO,
      isConfiguredOffDay && state.offDay.skipRegularTasks
    )
  );

  // Build unified timeline entries
  const timelineEntries: UnifiedTimelineEntry[] = [];

  if (timelineFilter === 'all' || timelineFilter === 'tasks') {
    for (const t of dayTasks) {
      const st = getTaskStatusForDate(t, selectedDateISO);
      timelineEntries.push({
        uid: `task-${t.id}`,
        sourceType: 'task',
        sourceId: t.id,
        time24: t.startTime,
        endTime24: t.endTime,
        title: t.title,
        subtitle: t.notes,
        category: t.category,
        priority: t.priority,
        status: st,
        taskRef: t,
      });
    }
  }

  if (
    (timelineFilter === 'all' || timelineFilter === 'routine') &&
    !(isConfiguredOffDay && state.offDay.pauseRoutine)
  ) {
    // Include enabled routine items that don't duplicate an exact same-time task title
    for (const r of state.routine) {
      if (!r.enabled) continue;
      const alreadyCoveredByTask =
        timelineFilter === 'all' &&
        dayTasks.some(
          (t) =>
            Math.abs(timeToMinutes(t.startTime) - timeToMinutes(r.time)) <= 15 &&
            t.category === r.category
        );
      if (alreadyCoveredByTask) continue;

      const isDone = r.completedDates.includes(selectedDateISO);
      const isSkipped = r.skippedDates.includes(selectedDateISO);
      timelineEntries.push({
        uid: `routine-${r.id}`,
        sourceType: 'routine',
        sourceId: r.id,
        time24: r.time,
        title: r.title,
        subtitle: r.notes || `${r.period} Routine`,
        category: r.category,
        priority: r.priority,
        status: isDone ? 'Completed' : isSkipped ? 'Skipped' : 'Pending',
      });
    }

    if (timelineFilter === 'routine') {
      for (const m of state.meals) {
        const isDone = m.completedDates.includes(selectedDateISO);
        timelineEntries.push({
          uid: `meal-${m.id}`,
          sourceType: 'meal',
          sourceId: m.id,
          time24: m.time,
          title: `${m.type}: ${m.food}`,
          subtitle: m.notes,
          category: 'Food',
          priority: 'Medium',
          status: isDone ? 'Completed' : 'Pending',
        });
      }
    }
  }

  timelineEntries.sort(
    (a, b) => timeToMinutes(a.time24) - timeToMinutes(b.time24)
  );

  // Progress calculations based on day's scheduled tasks
  const totalTasksCount = dayTasks.length;
  const completedCount = dayTasks.filter(
    (t) => getTaskStatusForDate(t, selectedDateISO) === 'Completed'
  ).length;
  const inProgressCount = dayTasks.filter(
    (t) => getTaskStatusForDate(t, selectedDateISO) === 'In Progress'
  ).length;
  const remainingCount = Math.max(0, totalTasksCount - completedCount);
  const progressPercent =
    totalTasksCount > 0
      ? Math.round((completedCount / totalTasksCount) * 100)
      : 0;

  // Circular SVG Ring Geometry
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (progressPercent / 100) * circumference;

  const sleepCalc = calculateSleepDuration(
    state.sleep.bedtime,
    state.sleep.wakeUpTime
  );

  const toggleExpandSubtasks = (taskId: string) => {
    setExpandedTaskIds((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleNudgeTaskTime = (task: Task, deltaMinutes: number) => {
    const currentMins = timeToMinutes(task.startTime);
    const nextTime = minutesToTime24h(currentMins + deltaMinutes);
    onRescheduleTaskTime(task.id, nextTime);
  };

  return (
    <div className="space-y-6">
      {/* Top Greeting & Live Date/Time Banner */}
      <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-[#972828] dark:text-[#FCAD38]">
              <Sun className="w-4 h-4 text-[#EB7F31]" />
              <span>{ dateHeader.full }</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{liveTimeStr}</span>
              {selectedDateISO === todayISO && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Today</span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
              {greeting}, {state.profile.name}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              {isConfiguredOffDay
                ? `${dayOfWeekName} is configured as your Off Day. Rest, recharge, and take things at your own pace.`
                : `You have ${completedCount} completed and ${remainingCount} remaining on your schedule for ${dateHeader.dayName}.`}
            </p>
          </div>

          {/* Primary Action + Wake/Sleep Summary */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 flex items-center gap-3">
              <div>
                <span className="text-neutral-400 block text-[11px]">Wake Up</span>
                <span className="font-mono font-semibold tabular-nums text-neutral-900 dark:text-white">
                  {formatTime12h(state.sleep.wakeUpTime)}
                </span>
              </div>
              <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-700" />
              <div>
                <span className="text-neutral-400 block text-[11px]">Sleep</span>
                <span className="font-mono font-semibold tabular-nums text-neutral-900 dark:text-white">
                  {formatTime12h(state.sleep.bedtime)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenAddTask({ date: selectedDateISO })}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#972828] to-[#E45742] hover:opacity-95 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-opacity cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Task</span>
            </button>
          </div>
        </div>

        {/* 7-Day Horizontal Date Scroller */}
        <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
          {weekDays.map((wd) => {
            const isSelected = wd.iso === selectedDateISO;
            const isToday = wd.iso === todayISO;
            const isOff =
              state.offDay.enabled && state.offDay.dayOfWeek === wd.dayName;

            return (
              <button
                key={wd.iso}
                type="button"
                onClick={() => onSelectDate(wd.iso)}
                className={`min-w-[52px] flex-1 py-2.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#972828] text-white shadow-sm'
                    : isToday
                    ? 'bg-[#FCAD38]/15 text-[#972828] dark:text-[#FCAD38] border border-[#FCAD38]/40'
                    : 'bg-neutral-50 dark:bg-neutral-900/70 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="text-[11px] font-medium opacity-80">
                  {wd.shortDay}
                </span>
                <span className="text-sm font-bold font-mono tabular-nums">
                  {wd.dayNumber}
                </span>
                <span
                  className={`text-[10px] ${
                    isSelected
                      ? 'text-[#FCAD38]'
                      : isOff
                      ? 'text-[#E45742]'
                      : 'text-transparent'
                  }`}
                >
                  {isOff ? 'Off' : '•'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sunday / Off-Day Banner if viewing the user's configured Off-Day */}
      {state.offDay.dayOfWeek === dayOfWeekName && (
        <section className="bg-gradient-to-r from-[#972828]/8 via-[#EB7F31]/10 to-[#FCAD38]/15 dark:from-[#972828]/20 dark:to-[#FCAD38]/10 border border-[#EB7F31]/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EB7F31] text-white flex items-center justify-center shrink-0">
              <Palmtree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                {dayOfWeekName} is my Off Day ({state.offDay.mode})
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                {state.offDay.personalDayNote}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleOffDayMode(!state.offDay.enabled)}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 hover:border-[#972828] transition-colors cursor-pointer whitespace-nowrap"
            >
              {state.offDay.enabled ? 'Switch to Working Day' : 'Enable Off Day Mode'}
            </button>
            <button
              type="button"
              onClick={() => onOpenAddTask({ date: selectedDateISO, category: 'Personal' })}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#972828] text-white hover:bg-[#7f2020] transition-colors cursor-pointer whitespace-nowrap"
            >
              + Personal Task
            </button>
          </div>
        </section>
      )}

      {/* Today's Progress + Meals + Sleep Trio Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Today's Progress (Section 2) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#972828] dark:text-[#FCAD38]">
                Daily Momentum
              </span>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Today’s Progress
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Keep steady pace through your scheduled timeline.
              </p>
            </div>

            {/* Circular Progress SVG Ring */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-neutral-100 dark:text-neutral-800"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  fill="none"
                  stroke="url(#todoBrandGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient
                    id="todoBrandGrad"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#972828" />
                    <stop offset="50%" stopColor="#E45742" />
                    <stop offset="100%" stopColor="#FCAD38" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
                  {progressPercent}%
                </span>
                <span className="text-[10px] text-neutral-400">Done</span>
              </div>
            </div>
          </div>

          {/* Horizontal Progress Bar + Numeric Metrics */}
          <div className="mt-4 space-y-3">
            <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#972828] via-[#E45742] to-[#FCAD38] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80">
                <span className="text-neutral-500 dark:text-neutral-400 block">
                  Completed
                </span>
                <span className="text-base font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {completedCount}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80">
                <span className="text-neutral-500 dark:text-neutral-400 block">
                  Remaining
                </span>
                <span className="text-base font-bold font-mono tabular-nums text-[#E45742]">
                  {remainingCount}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/80">
                <span className="text-neutral-500 dark:text-neutral-400 block">
                  In Progress
                </span>
                <span className="text-base font-bold font-mono tabular-nums text-[#EB7F31]">
                  {inProgressCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Meals Snapshot */}
        <div className="lg:col-span-3 bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#EB7F31] flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                Meal Routine
              </span>
              <button
                type="button"
                onClick={() => onNavigate('routine', 'meals')}
                className="text-xs font-medium text-[#972828] dark:text-[#FCAD38] hover:underline cursor-pointer"
              >
                Edit Meals
              </button>
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3">
              Today’s Menu
            </h3>
            <ul className="space-y-2">
              {state.meals.slice(0, 3).map((meal) => {
                const done = meal.completedDates.includes(selectedDateISO);
                return (
                  <li
                    key={meal.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleMealCompleted(meal.id, selectedDateISO)}
                      className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
                    >
                      <span
                        className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                          done
                            ? 'bg-[#EB7F31] border-[#EB7F31] text-white'
                            : 'border-neutral-300 dark:border-neutral-700'
                        }`}
                      >
                        {done && <Check className="w-3 h-3" />}
                      </span>
                      <span
                        className={`truncate ${
                          done
                            ? 'line-through text-neutral-400'
                            : 'text-neutral-800 dark:text-neutral-200 font-medium'
                        }`}
                      >
                        {meal.type}: {meal.food}
                      </span>
                    </button>
                    <span className="font-mono text-[11px] text-neutral-400 shrink-0 tabular-nums">
                      {formatTime12h(meal.time)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('routine', 'meals')}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            View All 5 Daily Meals →
          </button>
        </div>

        {/* Card 3: Sleep & Recovery Target */}
        <div className="lg:col-span-3 bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#972828] dark:text-[#FCAD38] flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5" />
                Sleep Schedule
              </span>
              <button
                type="button"
                onClick={() => onNavigate('routine', 'sleep')}
                className="text-xs font-medium text-[#972828] dark:text-[#FCAD38] hover:underline cursor-pointer"
              >
                Adjust
              </button>
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {sleepCalc.formatted} Planned
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Target: {state.sleep.targetHours} hours restorative sleep
            </p>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Bedtime</span>
                <span className="font-mono font-semibold tabular-nums text-neutral-900 dark:text-white">
                  {formatTime12h(state.sleep.bedtime)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Wake Up</span>
                <span className="font-mono font-semibold tabular-nums text-neutral-900 dark:text-white">
                  {formatTime12h(state.sleep.wakeUpTime)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('routine', 'sleep')}
            className="mt-4 w-full py-2 px-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            Open Sleep Planner →
          </button>
        </div>
      </section>

      {/* Quick Add Natural Language Bar (Section 12) */}
      <QuickAddBar
        selectedDateISO={selectedDateISO}
        onQuickCreateTask={onQuickCreateTask}
        onOpenFullModalWithDraft={(draft) => onOpenAddTask(draft)}
      />

      {/* Today's Timeline (Section 3 & Section 17 Drag & Drop) */}
      <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
              Today’s Timeline
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Drag tasks onto another slot or use the time arrows to reschedule automatically.
            </p>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl self-start sm:self-auto">
            {(
              [
                { id: 'all', label: 'Full Day Timeline' },
                { id: 'tasks', label: 'Tasks Only' },
                { id: 'routine', label: 'Routine & Meals' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTimelineFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  timelineFilter === tab.id
                    ? 'bg-white dark:bg-neutral-800 text-[#972828] dark:text-[#FCAD38] shadow-xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline List or Empty State */}
        {timelineEntries.length === 0 ? (
          <div className="py-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FCAD38]/15 text-[#EB7F31] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Your day is clear ✨
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Add something you want to accomplish today, or build your daily routine.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onOpenAddTask({ date: selectedDateISO })}
                className="min-h-[44px] px-6 py-2.5 rounded-2xl bg-[#972828] hover:bg-[#7e2020] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Task</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 relative">
            {/* Vertical Timeline Axis Line */}
            <div
              className="absolute left-[4.5rem] sm:left-[5.5rem] top-3 bottom-3 w-px bg-neutral-200/80 dark:bg-neutral-800 hidden sm:block"
              aria-hidden="true"
            />

            <div className="space-y-3">
              {timelineEntries.map((item) => {
                const isCompleted = item.status === 'Completed';
                const isSkipped = item.status === 'Skipped';
                const isInProgress = item.status === 'In Progress';
                const catColors = getCategoryAccentColor(item.category);
                const statusMeta = getStatusLabelStyle(item.status);
                const task = item.taskRef;
                const hasSubtasks = Boolean(
                  task && task.subtasks && task.subtasks.length > 0
                );
                const isExpanded = Boolean(
                  task && expandedTaskIds[task.id]
                );

                return (
                  <div
                    key={item.uid}
                    draggable={item.sourceType === 'task'}
                    onDragStart={() => {
                      if (task) setDraggedTaskId(task.id);
                    }}
                    onDragOver={(e) => {
                      if (draggedTaskId) {
                        e.preventDefault();
                        setDragOverUid(item.uid);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverUid === item.uid) setDragOverUid(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverUid(null);
                      if (draggedTaskId && draggedTaskId !== item.sourceId) {
                        onRescheduleTaskTime(draggedTaskId, item.time24);
                      }
                      setDraggedTaskId(null);
                    }}
                    className={`group relative flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-5 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      dragOverUid === item.uid
                        ? 'border-[#972828] bg-[#972828]/5'
                        : isCompleted
                        ? 'border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/60 dark:bg-neutral-900/40'
                        : isInProgress
                        ? 'border-[#EB7F31]/50 bg-[#FCAD38]/5 dark:bg-[#EB7F31]/10'
                        : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#1A1D26] hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    {/* Left Time Column */}
                    <div className="sm:w-20 shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
                      <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
                        {formatTime12h(item.time24)}
                      </span>
                      {item.endTime24 && (
                        <span className="text-[11px] font-mono tabular-nums text-neutral-400">
                          {formatTime12h(item.endTime24)}
                        </span>
                      )}
                    </div>

                    {/* Timeline Node Indicator on Desktop */}
                    <div className="hidden sm:flex items-center justify-center mt-1 z-10">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.sourceType === 'task' && task) {
                            onUpdateTaskStatus(
                              task.id,
                              selectedDateISO,
                              isCompleted ? 'Pending' : 'Completed'
                            );
                          } else if (item.sourceType === 'routine') {
                            onToggleRoutineCompleted(
                              item.sourceId,
                              selectedDateISO
                            );
                          } else if (item.sourceType === 'meal') {
                            onToggleMealCompleted(
                              item.sourceId,
                              selectedDateISO
                            );
                          }
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-transform active:scale-90 cursor-pointer ${
                          isCompleted
                            ? 'bg-[#972828] border-[#972828] text-white scale-105'
                            : isInProgress
                            ? 'bg-[#FCAD38]/20 border-[#EB7F31] text-[#EB7F31]'
                            : 'bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-600 hover:border-[#972828]'
                        }`}
                        title={
                          isCompleted ? 'Mark as Pending' : 'Mark as Completed'
                        }
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Main Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {/* Mobile Check Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (item.sourceType === 'task' && task) {
                                onUpdateTaskStatus(
                                  task.id,
                                  selectedDateISO,
                                  isCompleted ? 'Pending' : 'Completed'
                                );
                              } else if (item.sourceType === 'routine') {
                                onToggleRoutineCompleted(
                                  item.sourceId,
                                  selectedDateISO
                                );
                              } else if (item.sourceType === 'meal') {
                                onToggleMealCompleted(
                                  item.sourceId,
                                  selectedDateISO
                                );
                              }
                            }}
                            className={`sm:hidden mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 cursor-pointer ${
                              isCompleted
                                ? 'bg-[#972828] border-[#972828] text-white'
                                : 'border-neutral-300 dark:border-neutral-600'
                            }`}
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5" />}
                          </button>

                          {/* Category Icon Box */}
                          <div
                            className={`w-8 h-8 rounded-xl ${catColors.iconBg} ${catColors.iconText} flex items-center justify-center shrink-0 mt-0.5`}
                          >
                            {getCategoryIcon(item.category, 'w-4 h-4')}
                          </div>

                          <div className="min-w-0">
                            <h3
                              className={`text-sm sm:text-base font-semibold leading-snug ${
                                isCompleted
                                  ? 'line-through text-neutral-400 dark:text-neutral-500'
                                  : isSkipped
                                  ? 'line-through text-neutral-400'
                                  : 'text-neutral-900 dark:text-white'
                              }`}
                            >
                              {item.title}
                            </h3>

                            {/* Clean Unboxed Metadata with Typographic Separators */}
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              <span>{item.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className={getPriorityTextColor(item.priority)}>
                                {item.priority} Priority
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className={statusMeta.text}>
                                {statusMeta.label}
                              </span>
                              {task && task.repeat !== 'Does not repeat' && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{task.repeat}</span>
                                </>
                              )}
                              {item.sourceType === 'routine' && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>Daily Routine</span>
                                </>
                              )}
                            </div>

                            {item.subtitle && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Task Action Controls */}
                        {item.sourceType === 'task' && task && (
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Quick Time Shift (-30m / +30m) + Drag Handle */}
                            <div className="hidden md:flex items-center gap-0.5 mr-1 text-neutral-400">
                              <span
                                className="p-1 cursor-grab active:cursor-grabbing hover:text-neutral-700 dark:hover:text-neutral-200"
                                title="Drag to another time slot"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>
                              <button
                                type="button"
                                onClick={() => handleNudgeTaskTime(task, -30)}
                                className="p-1 hover:text-[#972828] dark:hover:text-[#FCAD38] rounded-lg transition-colors cursor-pointer"
                                title="Move 30 minutes earlier"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleNudgeTaskTime(task, 30)}
                                className="p-1 hover:text-[#972828] dark:hover:text-[#FCAD38] rounded-lg transition-colors cursor-pointer"
                                title="Move 30 minutes later"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Cycle Status Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const order: TaskStatus[] = [
                                  'Pending',
                                  'In Progress',
                                  'Completed',
                                  'Skipped',
                                ];
                                const next =
                                  order[
                                    (order.indexOf(item.status) + 1) %
                                      order.length
                                  ];
                                onUpdateTaskStatus(
                                  task.id,
                                  selectedDateISO,
                                  next
                                );
                              }}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[#972828] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                              title="Cycle task status"
                            >
                              {item.status === 'Completed' ? (
                                <RotateCcw className="w-3.5 h-3.5" />
                              ) : (
                                <span>Status</span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => onEditTask(task)}
                              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Edit Task"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onDuplicateTask(task)}
                              className="hidden sm:inline-flex p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Duplicate Task"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onUpdateTaskStatus(
                                  task.id,
                                  selectedDateISO,
                                  'Skipped'
                                )
                              }
                              className="hidden sm:inline-flex p-2 rounded-xl text-neutral-500 hover:text-[#EB7F31] hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Skip Task"
                            >
                              <SkipForward className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(task.id)}
                              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Inline Delete Confirmation Banner */}
                      {task && confirmDeleteId === task.id && (
                        <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
                            Delete “{task.title}” from your schedule?
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
                              Confirm Delete
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Subtasks Expandable Checklist */}
                      {hasSubtasks && task && (
                        <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                          <button
                            type="button"
                            onClick={() => toggleExpandSubtasks(task.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#972828] dark:text-[#FCAD38] hover:underline cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                            <span className="font-mono tabular-nums">
                              Subtasks (
                              {task.subtasks.filter((s) => s.completed).length}/
                              {task.subtasks.length})
                            </span>
                          </button>

                          {isExpanded && (
                            <ul className="mt-2 space-y-1.5 pl-1">
                              {task.subtasks.map((st) => (
                                <li key={st.id}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onToggleSubtask(task.id, st.id)
                                    }
                                    className="flex items-center gap-2 text-xs text-left group/st cursor-pointer"
                                  >
                                    <span
                                      className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                                        st.completed
                                          ? 'bg-[#E45742] border-[#E45742] text-white'
                                          : 'border-neutral-300 dark:border-neutral-600 group-hover/st:border-[#972828]'
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
                                          : 'text-neutral-700 dark:text-neutral-300'
                                      }
                                    >
                                      {st.title}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
