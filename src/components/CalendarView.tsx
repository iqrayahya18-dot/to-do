import React, { useState } from 'react';
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  GripVertical,
  Moon,
  Palmtree,
  Plus,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { AppState, Task, TaskStatus } from '../types/todo';
import {
  addDaysISO,
  doesTaskOccurOnDate,
  formatDisplayDate,
  formatLongHeaderDate,
  formatTime12h,
  getDayOfWeekName,
  getMonthCalendarGrid,
  getTaskStatusForDate,
  getTodayISO,
  getWeekDates,
  parseISODate,
  timeToMinutes,
  toISODate,
} from '../utils/dateAndParser';
import { getCategoryAccentColor, getCategoryIcon } from './CategoryMeta';

interface CalendarViewProps {
  state: AppState;
  selectedDateISO: string;
  onSelectDate: (iso: string) => void;
  onOpenAddTask: (draft?: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
  onUpdateTaskStatus: (taskId: string, dateISO: string, status: TaskStatus) => void;
  onRescheduleTaskTime: (taskId: string, newStartTime24: string) => void;
  onRescheduleTaskDate: (taskId: string, newDateISO: string) => void;
}

const DAY_HOURS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  state,
  selectedDateISO,
  onSelectDate,
  onOpenAddTask,
  onEditTask,
  onUpdateTaskStatus,
  onRescheduleTaskTime,
  onRescheduleTaskDate,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  const todayISO = getTodayISO();
  const parsedSelected = parseISODate(selectedDateISO);
  const currentYear = parsedSelected.getFullYear();
  const currentMonth = parsedSelected.getMonth();

  const monthTitle = parsedSelected.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleStepPeriod = (direction: -1 | 1) => {
    if (viewMode === 'month') {
      const next = new Date(currentYear, currentMonth + direction, 1, 12, 0, 0);
      onSelectDate(toISODate(next));
    } else if (viewMode === 'week') {
      onSelectDate(addDaysISO(selectedDateISO, direction * 7));
    } else {
      onSelectDate(addDaysISO(selectedDateISO, direction));
    }
  };

  const monthCells = getMonthCalendarGrid(
    currentYear,
    currentMonth,
    state.profile.firstDayOfWeek
  );
  const weekDays = getWeekDates(selectedDateISO, state.profile.firstDayOfWeek);
  const weekdayHeaders =
    state.profile.firstDayOfWeek === 'Monday'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDayName = getDayOfWeekName(selectedDateISO);
  const isSelectedOffDay =
    state.offDay.enabled &&
    state.offDay.dayOfWeek === selectedDayName &&
    state.offDay.mode === 'Full day off';

  const selectedDateTasks = state.tasks
    .filter((t) =>
      doesTaskOccurOnDate(
        t,
        selectedDateISO,
        isSelectedOffDay && state.offDay.skipRegularTasks
      )
    )
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const selectedDateHeader = formatLongHeaderDate(selectedDateISO);

  return (
    <div className="space-y-6">
      {/* Top Calendar Controls Bar */}
      <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xs font-semibold text-[#972828] dark:text-[#FCAD38]">
                Unified Schedule & Drag-and-Drop Planner
              </span>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {monthTitle}
              </h1>
            </div>

            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={() => handleStepPeriod(-1)}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 cursor-pointer"
                aria-label="Previous period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onSelectDate(todayISO)}
                className="min-h-[38px] px-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleStepPeriod(1)}
                className="min-h-[38px] min-w-[38px] rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 cursor-pointer"
                aria-label="Next period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
              {(
                [
                  { id: 'month', label: 'Month' },
                  { id: 'week', label: 'Week' },
                  { id: 'day', label: 'Day' },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setViewMode(v.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    viewMode === v.id
                      ? 'bg-[#972828] text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onOpenAddTask({ date: selectedDateISO })}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#972828] to-[#E45742] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Task</span>
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5">
          {viewMode === 'month' && (
            <div>
              <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
                {weekdayHeaders.map((wh) => (
                  <div
                    key={wh}
                    className="text-xs font-semibold text-neutral-400 py-1.5"
                  >
                    {wh}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {monthCells.map((cell) => {
                  const isSelected = cell.iso === selectedDateISO;
                  const isToday = cell.iso === todayISO;
                  const dayName = getDayOfWeekName(cell.iso);
                  const isOffDay =
                    state.offDay.enabled &&
                    state.offDay.dayOfWeek === dayName &&
                    state.offDay.mode === 'Full day off';

                  const tasksOnCell = state.tasks.filter((t) =>
                    doesTaskOccurOnDate(
                      t,
                      cell.iso,
                      isOffDay && state.offDay.skipRegularTasks
                    )
                  );
                  const completedOnCell = tasksOnCell.filter(
                    (t) => getTaskStatusForDate(t, cell.iso) === 'Completed'
                  ).length;

                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() => onSelectDate(cell.iso)}
                      onDragOver={(e) => {
                        if (draggedTaskId) {
                          e.preventDefault();
                          setDropTargetKey(cell.iso);
                        }
                      }}
                      onDragLeave={() => {
                        if (dropTargetKey === cell.iso) setDropTargetKey(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDropTargetKey(null);
                        if (draggedTaskId) {
                          onRescheduleTaskDate(draggedTaskId, cell.iso);
                          setDraggedTaskId(null);
                        }
                      }}
                      className={`min-h-[78px] sm:min-h-[92px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        dropTargetKey === cell.iso
                          ? 'border-[#972828] bg-[#972828]/10'
                          : isSelected
                          ? 'bg-[#972828] text-white border-[#972828] shadow-sm'
                          : isToday
                          ? 'bg-[#FCAD38]/12 border-[#FCAD38] text-neutral-900 dark:text-white'
                          : cell.inCurrentMonth
                          ? 'bg-neutral-50/70 dark:bg-neutral-900/50 border-neutral-200/60 dark:border-neutral-800/80 hover:border-[#E45742]'
                          : 'opacity-40 bg-transparent border-neutral-100 dark:border-neutral-900'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${
                            isSelected
                              ? 'text-white'
                              : isToday
                              ? 'text-[#972828] dark:text-[#FCAD38]'
                              : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>
                        {isOffDay && (
                          <span
                            className={`text-[9px] font-semibold ${
                              isSelected ? 'text-[#FCAD38]' : 'text-[#EB7F31]'
                            }`}
                          >
                            OFF
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 w-full mt-1">
                        {tasksOnCell.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            className={`text-[10px] truncate px-1.5 py-0.5 rounded-md ${
                              isSelected
                                ? 'bg-white/15 text-white'
                                : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            {t.title}
                          </div>
                        ))}
                        {tasksOnCell.length > 0 && (
                          <div
                            className={`text-[10px] font-mono tabular-nums ${
                              isSelected
                                ? 'text-white/80'
                                : 'text-neutral-400 dark:text-neutral-500'
                            }`}
                          >
                            {completedOnCell}/{tasksOnCell.length} done
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Tip: Drag any task card to another day column to reschedule its date.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5">
                {weekDays.map((wd) => {
                  const isSelected = wd.iso === selectedDateISO;
                  const isOffDay =
                    state.offDay.enabled &&
                    state.offDay.dayOfWeek === wd.dayName &&
                    state.offDay.mode === 'Full day off';

                  const dayTasks = state.tasks
                    .filter((t) =>
                      doesTaskOccurOnDate(
                        t,
                        wd.iso,
                        isOffDay && state.offDay.skipRegularTasks
                      )
                    )
                    .sort(
                      (a, b) =>
                        timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
                    );

                  return (
                    <div
                      key={wd.iso}
                      onClick={() => onSelectDate(wd.iso)}
                      onDragOver={(e) => {
                        if (draggedTaskId) {
                          e.preventDefault();
                          setDropTargetKey(wd.iso);
                        }
                      }}
                      onDragLeave={() => {
                        if (dropTargetKey === wd.iso) setDropTargetKey(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDropTargetKey(null);
                        if (draggedTaskId) {
                          onRescheduleTaskDate(draggedTaskId, wd.iso);
                          setDraggedTaskId(null);
                        }
                      }}
                      className={`p-3 rounded-2xl border min-h-[320px] flex flex-col justify-between transition-colors cursor-pointer ${
                        dropTargetKey === wd.iso
                          ? 'border-[#972828] bg-[#972828]/10'
                          : isSelected
                          ? 'border-[#972828] bg-[#972828]/4 dark:bg-[#972828]/15'
                          : 'border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200/60 dark:border-neutral-800">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            {wd.shortDay}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#972828] dark:text-[#FCAD38] tabular-nums">
                            {wd.dayNumber}
                          </span>
                        </div>

                        {isOffDay && (
                          <div className="mb-2 p-2 rounded-xl bg-[#FCAD38]/15 text-[11px] font-semibold text-[#972828] dark:text-[#FCAD38] text-center">
                            Off Day
                          </div>
                        )}

                        <div className="space-y-1.5">
                          {dayTasks.map((t) => (
                            <div
                              key={t.id}
                              draggable
                              onDragStart={(e) => {
                                e.stopPropagation();
                                setDraggedTaskId(t.id);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(t);
                              }}
                              className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700 text-xs shadow-2xs cursor-grab active:cursor-grabbing hover:border-[#972828]"
                            >
                              <div className="font-mono text-[10px] text-[#E45742] tabular-nums">
                                {formatTime12h(t.startTime)}
                              </div>
                              <div className="font-medium text-neutral-900 dark:text-white line-clamp-2 mt-0.5">
                                {t.title}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddTask({ date: wd.iso });
                        }}
                        className="mt-3 w-full py-1.5 rounded-lg text-[11px] font-medium text-neutral-500 hover:text-[#972828] hover:bg-white dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'day' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div>
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                    {selectedDateHeader.full} — Hourly Planner
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Drag any task to a different hour slot to automatically update its start time.
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                {DAY_HOURS.map((hour24) => {
                  const hourNum = parseInt(hour24.split(':')[0], 10);
                  const tasksInHour = selectedDateTasks.filter((t) => {
                    const th = parseInt(t.startTime.split(':')[0], 10);
                    return th === hourNum;
                  });

                  const routineInHour = state.routine.filter((r) => {
                    if (!r.enabled) return false;
                    const rh = parseInt(r.time.split(':')[0], 10);
                    return rh === hourNum;
                  });

                  return (
                    <div
                      key={hour24}
                      onDragOver={(e) => {
                        if (draggedTaskId) {
                          e.preventDefault();
                          setDropTargetKey(hour24);
                        }
                      }}
                      onDragLeave={() => {
                        if (dropTargetKey === hour24) setDropTargetKey(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDropTargetKey(null);
                        if (draggedTaskId) {
                          onRescheduleTaskTime(draggedTaskId, hour24);
                          setDraggedTaskId(null);
                        }
                      }}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-colors ${
                        dropTargetKey === hour24
                          ? 'border-[#972828] bg-[#972828]/8'
                          : 'border-neutral-200/60 dark:border-neutral-800/70 bg-neutral-50/40 dark:bg-neutral-900/40'
                      }`}
                    >
                      <div className="w-20 shrink-0 flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-neutral-500 dark:text-neutral-400 tabular-nums">
                          {formatTime12h(hour24)}
                        </span>
                      </div>

                      <div className="flex-1 space-y-2 min-w-0">
                        {tasksInHour.map((t) => (
                          <div
                            key={t.id}
                            draggable
                            onDragStart={() => setDraggedTaskId(t.id)}
                            className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <GripVertical className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                              <span className="text-xs font-mono font-semibold text-[#972828] dark:text-[#FCAD38] shrink-0 tabular-nums">
                                {formatTime12h(t.startTime)}
                              </span>
                              <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white truncate">
                                {t.title}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => onEditTask(t)}
                              className="text-xs text-neutral-500 hover:text-[#972828] px-2 py-1 rounded-lg cursor-pointer"
                            >
                              Edit
                            </button>
                          </div>
                        ))}

                        {routineInHour.map((r) => (
                          <div
                            key={r.id}
                            className="px-3 py-1.5 rounded-xl bg-[#FCAD38]/10 border border-[#FCAD38]/30 flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300"
                          >
                            <span>
                              Routine: <strong>{r.title}</strong>
                            </span>
                            <span className="font-mono tabular-nums text-[11px]">
                              {formatTime12h(r.time)}
                            </span>
                          </div>
                        ))}

                        {tasksInHour.length === 0 &&
                          routineInHour.length === 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenAddTask({
                                  date: selectedDateISO,
                                  startTime: hour24,
                                })
                              }
                              className="text-xs text-neutral-400 hover:text-[#972828] dark:hover:text-[#FCAD38] transition-colors cursor-pointer"
                            >
                              + Schedule at {formatTime12h(hour24)}
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Columns: Selected Date Unified Inspector */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3.5">
              <div>
                <span className="text-xs font-semibold text-[#972828] dark:text-[#FCAD38]">
                  Selected Date Overview
                </span>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {selectedDateHeader.full}
                </h2>
                <span className="text-xs font-mono text-neutral-400 tabular-nums">
                  {formatDisplayDate(selectedDateISO)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onOpenAddTask({ date: selectedDateISO })}
                className="p-2.5 rounded-2xl bg-[#972828] text-white hover:bg-[#7e2020] transition-colors cursor-pointer"
                title="Add task on selected date"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isSelectedOffDay && (
              <div className="p-3.5 rounded-2xl bg-[#FCAD38]/15 border border-[#FCAD38]/40 flex items-center gap-3">
                <Palmtree className="w-5 h-5 text-[#EB7F31] shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-neutral-900 dark:text-white">
                    {selectedDayName} Off Day Active
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    Regular recurring tasks are skipped for rest.
                  </p>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center justify-between">
                <span>Scheduled Tasks</span>
                <span className="font-mono text-neutral-400">
                  {selectedDateTasks.length}
                </span>
              </h3>
              {selectedDateTasks.length === 0 ? (
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 text-center space-y-1">
                  <Sparkles className="w-4 h-4 text-[#EB7F31] mx-auto" />
                  <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    No tasks scheduled
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDateTasks.map((t) => {
                    const st = getTaskStatusForDate(t, selectedDateISO);
                    const done = st === 'Completed';
                    const catColors = getCategoryAccentColor(t.category);
                    return (
                      <div
                        key={t.id}
                        className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateTaskStatus(
                                t.id,
                                selectedDateISO,
                                done ? 'Pending' : 'Completed'
                              )
                            }
                            className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 cursor-pointer ${
                              done
                                ? 'bg-[#972828] border-[#972828] text-white'
                                : 'border-neutral-300 dark:border-neutral-600'
                            }`}
                          >
                            {done && <Check className="w-3 h-3" />}
                          </button>
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-semibold truncate ${
                                done
                                  ? 'line-through text-neutral-400'
                                  : 'text-neutral-900 dark:text-white'
                              }`}
                            >
                              {t.title}
                            </p>
                            <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                              {formatTime12h(t.startTime)} · {t.category}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-7 h-7 rounded-lg ${catColors.iconBg} ${catColors.iconText} flex items-center justify-center shrink-0`}
                        >
                          {getCategoryIcon(t.category, 'w-3.5 h-3.5')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-[#EB7F31]" />
                <span>Meals Planned</span>
              </h3>
              <div className="space-y-1.5">
                {state.meals.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs py-1 text-neutral-600 dark:text-neutral-400"
                  >
                    <span className="truncate pr-2">
                      <strong className="text-neutral-800 dark:text-neutral-200">
                        {m.type}:
                      </strong>{' '}
                      {m.food}
                    </span>
                    <span className="font-mono text-[11px] shrink-0 tabular-nums">
                      {formatTime12h(m.time)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#972828] dark:text-[#FCAD38]" />
                <span>Reminders & Sleep Window</span>
              </h3>
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#E45742]" />
                    Morning Alarm
                  </span>
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                    {formatTime12h(state.sleep.wakeUpTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-[#972828] dark:text-[#FCAD38]" />
                    Sleep Target
                  </span>
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                    {formatTime12h(state.sleep.bedtime)} ({state.sleep.targetHours}h)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
