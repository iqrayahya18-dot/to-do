import React, { useState } from 'react';
import {
  AlarmClock,
  Bell,
  CalendarDays,
  Check,
  Clock,
  Coffee,
  Moon,
  Palmtree,
  Plus,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Trash2,
  Utensils,
} from 'lucide-react';
import {
  AppState,
  DayOfWeekName,
  MealItem,
  OffDayMode,
  OffDaySettings,
  ReminderOption,
  RoutineBlockPeriod,
  RoutineItem,
  RoutineSubTab,
  SleepSchedule,
  Task,
  TaskCategory,
} from '../types/todo';
import {
  CATEGORIES,
  DAYS_OF_WEEK,
  calculateSleepDuration,
  doesTaskOccurOnDate,
  formatTime12h,
  getWeekDates,
  timeToMinutes,
} from '../utils/dateAndParser';
import { getCategoryAccentColor, getCategoryIcon } from './CategoryMeta';

interface RoutineHubViewProps {
  state: AppState;
  activeSubTab: RoutineSubTab;
  selectedDateISO: string;
  onChangeSubTab: (sub: RoutineSubTab) => void;
  onUpdateRoutineItem: (item: RoutineItem) => void;
  onAddRoutineItem: (item: RoutineItem) => void;
  onDeleteRoutineItem: (id: string) => void;
  onToggleRoutineCompleted: (id: string, dateISO: string) => void;
  onUpdateMeal: (meal: MealItem) => void;
  onToggleMealCompleted: (id: string, dateISO: string) => void;
  onUpdateSleep: (sleep: SleepSchedule) => void;
  onUpdateOffDay: (offDay: OffDaySettings) => void;
  onOpenAddTaskForDate: (dateISO: string, dayName: DayOfWeekName) => void;
}

const PERIODS: {
  id: RoutineBlockPeriod;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'Morning',
    label: 'Morning Routine',
    subtitle: 'Energize your mind & body to start the day strong',
    icon: <Sunrise className="w-4 h-4 text-[#EB7F31]" />,
  },
  {
    id: 'Afternoon',
    label: 'Afternoon',
    subtitle: 'Sustained focus, nourishing lunch & midday reset',
    icon: <Sun className="w-4 h-4 text-[#FCAD38]" />,
  },
  {
    id: 'Evening',
    label: 'Evening',
    subtitle: 'Physical exercise, personal time & warm dinner',
    icon: <Sunset className="w-4 h-4 text-[#E45742]" />,
  },
  {
    id: 'Night',
    label: 'Night',
    subtitle: 'Digital sunset, reading & restorative sleep',
    icon: <Moon className="w-4 h-4 text-[#972828] dark:text-[#FCAD38]" />,
  },
];

export const RoutineHubView: React.FC<RoutineHubViewProps> = ({
  state,
  activeSubTab,
  selectedDateISO,
  onChangeSubTab,
  onUpdateRoutineItem,
  onAddRoutineItem,
  onDeleteRoutineItem,
  onToggleRoutineCompleted,
  onUpdateMeal,
  onToggleMealCompleted,
  onUpdateSleep,
  onUpdateOffDay,
  onOpenAddTaskForDate,
}) => {
  // State for adding a new routine item
  const [addingPeriod, setAddingPeriod] = useState<RoutineBlockPeriod | null>(
    null
  );
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState('08:00');
  const [newRoutineCategory, setNewRoutineCategory] =
    useState<TaskCategory>('Personal');
  const [newRoutineNotes, setNewRoutineNotes] = useState('');

  const handleCreateRoutineStep = (period: RoutineBlockPeriod) => {
    if (!newRoutineTitle.trim()) return;
    const item: RoutineItem = {
      id: `rt-${Date.now()}`,
      period,
      title: newRoutineTitle.trim(),
      time: newRoutineTime,
      category: newRoutineCategory,
      priority: 'Medium',
      enabled: true,
      completedDates: [],
      skippedDates: [],
      notes: newRoutineNotes.trim() || undefined,
    };
    onAddRoutineItem(item);
    setNewRoutineTitle('');
    setNewRoutineNotes('');
    setAddingPeriod(null);
  };

  const sleepDuration = calculateSleepDuration(
    state.sleep.bedtime,
    state.sleep.wakeUpTime
  );
  const sleepTargetDiff =
    Math.round((sleepDuration.totalHoursDecimal - state.sleep.targetHours) * 10) /
    10;

  const weekDates = getWeekDates(
    selectedDateISO,
    state.profile.firstDayOfWeek
  );

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation Tabs */}
      <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-[#972828] dark:text-[#FCAD38]">
              Daily Life Architecture
            </span>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Routine, Meals, Sleep & Weekly Plan
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Customize your daily habits, meal schedule, sleep target, and Sunday Off-Day rules.
            </p>
          </div>

          {/* 4 Sub-Tab Buttons */}
          <div className="flex items-center gap-1.5 p-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-2xl overflow-x-auto no-scrollbar">
            {(
              [
                {
                  id: 'builder',
                  label: 'Daily Routine',
                  icon: <Sparkles className="w-3.5 h-3.5" />,
                },
                {
                  id: 'meals',
                  label: 'Meal Planner',
                  icon: <Utensils className="w-3.5 h-3.5" />,
                },
                {
                  id: 'sleep',
                  label: 'Sleep Schedule',
                  icon: <Moon className="w-3.5 h-3.5" />,
                },
                {
                  id: 'weekly',
                  label: 'Weekly & Off-Day',
                  icon: <CalendarDays className="w-3.5 h-3.5" />,
                },
              ] as const
            ).map((tab) => {
              const active = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeSubTab(tab.id)}
                  className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#972828] text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SUB-TAB 1: DAILY ROUTINE BUILDER (Section 5) */}
      {activeSubTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {PERIODS.map((periodMeta) => {
            const items = state.routine
              .filter((r) => r.period === periodMeta.id)
              .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

            return (
              <section
                key={periodMeta.id}
                className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                        {periodMeta.icon}
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                          {periodMeta.label}
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {periodMeta.subtitle}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAddingPeriod(periodMeta.id);
                        setNewRoutineTime(
                          periodMeta.id === 'Morning'
                            ? '08:00'
                            : periodMeta.id === 'Afternoon'
                            ? '13:00'
                            : periodMeta.id === 'Evening'
                            ? '18:00'
                            : '21:30'
                        );
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#972828]/10 dark:bg-[#972828]/25 text-[#972828] dark:text-[#FCAD38] text-xs font-semibold hover:bg-[#972828] hover:text-white transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Step</span>
                    </button>
                  </div>

                  {/* Routine Steps List */}
                  <div className="mt-4 space-y-2.5">
                    {items.map((item) => {
                      const isDoneToday =
                        item.completedDates.includes(selectedDateISO);
                      const catColors = getCategoryAccentColor(item.category);

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                            !item.enabled
                              ? 'opacity-50 border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50 dark:bg-neutral-900/30'
                              : isDoneToday
                              ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10'
                              : 'border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() =>
                                onToggleRoutineCompleted(
                                  item.id,
                                  selectedDateISO
                                )
                              }
                              className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 cursor-pointer ${
                                isDoneToday
                                  ? 'bg-[#972828] border-[#972828] text-white'
                                  : 'border-neutral-300 dark:border-neutral-600 hover:border-[#972828]'
                              }`}
                              title="Toggle completed for selected day"
                            >
                              {isDoneToday && <Check className="w-3.5 h-3.5" />}
                            </button>

                            <div
                              className={`w-8 h-8 rounded-xl ${catColors.iconBg} ${catColors.iconText} flex items-center justify-center shrink-0`}
                            >
                              {getCategoryIcon(item.category, 'w-4 h-4')}
                            </div>

                            <div className="min-w-0 flex-1">
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) =>
                                  onUpdateRoutineItem({
                                    ...item,
                                    title: e.target.value,
                                  })
                                }
                                className="w-full bg-transparent text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none focus:underline truncate"
                                aria-label="Routine step title"
                              />
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                                {item.category}
                                {item.notes ? ` · ${item.notes}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Editable Time Input + Active Toggle + Delete */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="time"
                              value={item.time}
                              onChange={(e) =>
                                onUpdateRoutineItem({
                                  ...item,
                                  time: e.target.value,
                                })
                              }
                              className="px-2 py-1 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono font-semibold tabular-nums text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
                              aria-label={`Time for ${item.title}`}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                onUpdateRoutineItem({
                                  ...item,
                                  enabled: !item.enabled,
                                })
                              }
                              className={`px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer ${
                                item.enabled
                                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                                  : 'text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800'
                              }`}
                              title="Enable or pause routine item"
                            >
                              {item.enabled ? 'On' : 'Paused'}
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteRoutineItem(item.id)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Remove routine item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Inline Form to Add New Routine Step */}
                    {addingPeriod === periodMeta.id && (
                      <div className="p-3.5 rounded-2xl bg-[#972828]/5 dark:bg-[#972828]/15 border border-[#972828]/30 space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Activity name (e.g. Meditation)"
                            value={newRoutineTitle}
                            onChange={(e) => setNewRoutineTitle(e.target.value)}
                            className="sm:col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                          />
                          <input
                            type="time"
                            value={newRoutineTime}
                            onChange={(e) => setNewRoutineTime(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={newRoutineCategory}
                            onChange={(e) =>
                              setNewRoutineCategory(
                                e.target.value as TaskCategory
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setAddingPeriod(null)}
                              className="px-3 py-1.5 rounded-xl text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleCreateRoutineStep(periodMeta.id)
                              }
                              className="px-3.5 py-1.5 rounded-xl bg-[#972828] text-white text-xs font-semibold cursor-pointer"
                            >
                              Save Step
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 2: MEAL PLANNER (Section 6) */}
      {activeSubTab === 'meals' && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {state.meals.map((meal) => {
              const isCompleted = meal.completedDates.includes(selectedDateISO);

              return (
                <div
                  key={meal.id}
                  className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-[#FCAD38]/20 text-[#B87309] dark:text-[#FCAD38] flex items-center justify-center">
                          {meal.type === 'Brunch' ||
                          meal.type === 'Evening Snack' ? (
                            <Coffee className="w-4 h-4" />
                          ) : (
                            <Utensils className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                            {meal.type}
                          </h2>
                          <span className="text-xs font-mono text-[#E45742] tabular-nums">
                            {formatTime12h(meal.time)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onToggleMealCompleted(meal.id, selectedDateISO)
                        }
                        className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-[#EB7F31] hover:text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isCompleted ? 'Eaten' : 'Mark Done'}</span>
                      </button>
                    </div>

                    {/* Time Picker */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                        Scheduled Time
                      </label>
                      <input
                        type="time"
                        value={meal.time}
                        onChange={(e) =>
                          onUpdateMeal({ ...meal, time: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-mono tabular-nums text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
                      />
                    </div>

                    {/* What will I eat? */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                        What will I eat? (Menu)
                      </label>
                      <input
                        type="text"
                        value={meal.food}
                        onChange={(e) =>
                          onUpdateMeal({ ...meal, food: e.target.value })
                        }
                        placeholder="e.g. Eggs + Toast + Tea"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                        Preparation / Nutrition Notes
                      </label>
                      <textarea
                        rows={2}
                        value={meal.notes}
                        onChange={(e) =>
                          onUpdateMeal({ ...meal, notes: e.target.value })
                        }
                        placeholder="Portion notes, hydration reminder, or ingredients..."
                        className="w-full px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-[#972828]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SUB-TAB 3: SLEEP SCHEDULE (Section 7) */}
      {activeSubTab === 'sleep' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Sleep Schedule Configuration */}
          <div className="lg:col-span-7 bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-[#972828] dark:text-[#FCAD38]">
                  Restorative Night Routine
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                  Sleep & Wake-Up Schedule
                </h2>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#972828]/10 dark:bg-[#972828]/25 text-[#972828] dark:text-[#FCAD38] flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bedtime */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-2">
                  <Moon className="w-3.5 h-3.5 text-[#972828] dark:text-[#FCAD38]" />
                  Bedtime (Sleep)
                </label>
                <input
                  type="time"
                  value={state.sleep.bedtime}
                  onChange={(e) =>
                    onUpdateSleep({ ...state.sleep, bedtime: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-base font-bold font-mono tabular-nums text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
                />
                <span className="block text-[11px] text-neutral-400 mt-1.5 font-mono">
                  Formatted: {formatTime12h(state.sleep.bedtime)}
                </span>
              </div>

              {/* Wake-Up Time */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-2">
                  <Sun className="w-3.5 h-3.5 text-[#EB7F31]" />
                  Wake-Up Time
                </label>
                <input
                  type="time"
                  value={state.sleep.wakeUpTime}
                  onChange={(e) =>
                    onUpdateSleep({
                      ...state.sleep,
                      wakeUpTime: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-base font-bold font-mono tabular-nums text-neutral-900 dark:text-white focus:outline-none focus:border-[#972828]"
                />
                <span className="block text-[11px] text-neutral-400 mt-1.5 font-mono">
                  Formatted: {formatTime12h(state.sleep.wakeUpTime)}
                </span>
              </div>
            </div>

            {/* Daily Sleep Target & Sleep Reminder */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Daily Sleep Target (Hours)
                </label>
                <input
                  type="number"
                  min={4}
                  max={12}
                  step={0.5}
                  value={state.sleep.targetHours}
                  onChange={(e) =>
                    onUpdateSleep({
                      ...state.sleep,
                      targetHours: parseFloat(e.target.value || '8'),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-mono font-bold tabular-nums text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <span className="inline-flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-[#E45742]" />
                    Sleep Reminder
                  </span>
                </label>
                <select
                  value={state.sleep.sleepReminder}
                  onChange={(e) =>
                    onUpdateSleep({
                      ...state.sleep,
                      sleepReminder: e.target.value as ReminderOption,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white"
                >
                  <option value="At time of task">At bedtime</option>
                  <option value="15 minutes before">15 minutes before</option>
                  <option value="30 minutes before">30 minutes before</option>
                  <option value="1 hour before">1 hour before</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <span className="inline-flex items-center gap-1">
                    <AlarmClock className="w-3.5 h-3.5 text-[#EB7F31]" />
                    Morning Alarm
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSleep({
                      ...state.sleep,
                      morningAlarm: !state.sleep.morningAlarm,
                    })
                  }
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    state.sleep.morningAlarm
                      ? 'bg-[#972828] text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {state.sleep.morningAlarm
                    ? `Alarm Active (${formatTime12h(state.sleep.wakeUpTime)})`
                    : 'Alarm Off'}
                </button>
              </div>
            </div>

            {/* Wind-down activity note */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Evening Wind-Down Ritual
              </label>
              <input
                type="text"
                value={state.sleep.windDownActivity}
                onChange={(e) =>
                  onUpdateSleep({
                    ...state.sleep,
                    windDownActivity: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-800 dark:text-neutral-200"
              />
            </div>
          </div>

          {/* Right: Planned Duration Summary Card */}
          <div className="lg:col-span-5 bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <span className="text-xs font-semibold text-[#EB7F31]">
                Automatic Duration Calculator
              </span>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#972828] via-[#E45742] to-[#EB7F31] text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-85">
                    Planned Sleep Duration
                  </span>
                  <span className="text-xs font-mono bg-white/15 px-2.5 py-0.5 rounded-lg">
                    Target: {state.sleep.targetHours}h
                  </span>
                </div>
                <div className="text-3xl font-bold font-mono tabular-nums">
                  {sleepDuration.formatted}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs">
                  <div>
                    <span className="opacity-75 block">Sleep</span>
                    <span className="font-mono font-semibold">
                      {formatTime12h(state.sleep.bedtime)}
                    </span>
                  </div>
                  <div>
                    <span className="opacity-75 block">Wake Up</span>
                    <span className="font-mono font-semibold">
                      {formatTime12h(state.sleep.wakeUpTime)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                {sleepTargetDiff >= 0
                  ? `Your planned schedule meets your ${state.sleep.targetHours}-hour sleep goal (${
                      sleepTargetDiff > 0 ? `+${sleepTargetDiff}h buffer` : 'exact match'
                    }).`
                  : `Your current window is ${Math.abs(
                      sleepTargetDiff
                    )}h short of your ${state.sleep.targetHours}h target. Consider moving bedtime earlier.`}
              </p>
            </div>

            {/* Recent Sleep Consistency */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
              <h3 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-2.5">
                Recent Sleep Consistency
              </h3>
              <div className="space-y-2">
                {state.sleep.sleepHistory.map((log) => (
                  <div
                    key={log.date}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-none"
                  >
                    <span className="font-mono text-neutral-500 tabular-nums">
                      {log.date}
                    </span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {log.durationHours} hrs
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      {log.quality}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SUB-TAB 4: WEEKLY PLANNER & SUNDAY / OFF DAY (Sections 8 & 9) */}
      {activeSubTab === 'weekly' && (
        <div className="space-y-6">
          {/* Dedicated Sunday / Off-Day Settings Card (Section 9) */}
          <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#EB7F31]/15 text-[#EB7F31] flex items-center justify-center shrink-0">
                  <Palmtree className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#972828] dark:text-[#FCAD38]">
                    Weekly Recharge Rule
                  </span>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {state.offDay.dayOfWeek} is my Off Day
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    When enabled, regular recurring tasks are skipped and your routine switches to Personal Recharge Day.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.offDay.enabled}
                    onChange={(e) =>
                      onUpdateOffDay({
                        ...state.offDay,
                        enabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-[#972828] rounded cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                    Enable Weekly Off Day
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Select which day is Off Day */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Designated Off Day
                </label>
                <select
                  value={state.offDay.dayOfWeek}
                  onChange={(e) =>
                    onUpdateOffDay({
                      ...state.offDay,
                      dayOfWeek: e.target.value as DayOfWeekName,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Off Day Mode: Full day off / Partial day / Normal working day */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {state.offDay.dayOfWeek} Schedule Mode
                </label>
                <select
                  value={state.offDay.mode}
                  onChange={(e) =>
                    onUpdateOffDay({
                      ...state.offDay,
                      mode: e.target.value as OffDayMode,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs sm:text-sm text-neutral-900 dark:text-white"
                >
                  <option value="Full day off">Full day off</option>
                  <option value="Partial day">Partial day</option>
                  <option value="Normal working day">Normal working day</option>
                </select>
              </div>

              {/* Automation toggles */}
              <div className="flex flex-col justify-center gap-2 pt-2">
                <label className="inline-flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.offDay.skipRegularTasks}
                    onChange={(e) =>
                      onUpdateOffDay({
                        ...state.offDay,
                        skipRegularTasks: e.target.checked,
                      })
                    }
                    className="accent-[#972828]"
                  />
                  <span>Automatically skip regular recurring tasks</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.offDay.pauseRoutine}
                    onChange={(e) =>
                      onUpdateOffDay({
                        ...state.offDay,
                        pauseRoutine: e.target.checked,
                      })
                    }
                    className="accent-[#972828]"
                  />
                  <span>Show Personal / Rest Mode instead of work routine</span>
                </label>
              </div>
            </div>
          </section>

          {/* Monday–Sunday Weekly Schedule Grid (Section 8) */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3.5">
            {weekDates.map((wd) => {
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
                  className={`rounded-3xl p-4 border flex flex-col justify-between min-h-[280px] ${
                    isOffDay
                      ? 'bg-gradient-to-b from-[#FCAD38]/12 to-white dark:from-[#972828]/20 dark:to-[#161820] border-[#FCAD38]/50'
                      : 'bg-white dark:bg-[#161820] border-neutral-200/80 dark:border-neutral-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {wd.dayName}
                        </h3>
                        <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                          {wd.iso}
                        </span>
                      </div>
                      {isOffDay ? (
                        <span className="text-[11px] font-bold text-[#972828] dark:text-[#FCAD38]">
                          OFF DAY
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-neutral-400">
                          {dayTasks.length} items
                        </span>
                      )}
                    </div>

                    {isOffDay ? (
                      <div className="py-5 text-center space-y-2">
                        <Palmtree className="w-6 h-6 text-[#EB7F31] mx-auto" />
                        <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          Personal & Rest Day
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          Regular work routine is paused.
                        </p>
                        {dayTasks.length > 0 && (
                          <div className="pt-2 text-left space-y-1.5">
                            {dayTasks.map((t) => (
                              <div
                                key={t.id}
                                className="p-2 rounded-xl bg-white/90 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-xs"
                              >
                                <span className="font-mono text-[10px] text-[#972828] dark:text-[#FCAD38] block">
                                  {formatTime12h(t.startTime)}
                                </span>
                                <span className="font-medium text-neutral-900 dark:text-white line-clamp-1">
                                  {t.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 pb-1 flex items-center justify-between">
                          <span>Daily Routine</span>
                          <span className="font-mono text-emerald-700 dark:text-emerald-400">
                            Active ({state.routine.filter((r) => r.enabled).length})
                          </span>
                        </div>
                        {dayTasks.slice(0, 5).map((t) => (
                          <div
                            key={t.id}
                            className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200/60 dark:border-neutral-800 text-xs"
                          >
                            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono tabular-nums">
                              <span>{formatTime12h(t.startTime)}</span>
                              <span>{t.category}</span>
                            </div>
                            <p className="font-medium text-neutral-800 dark:text-neutral-200 truncate mt-0.5">
                              {t.title}
                            </p>
                          </div>
                        ))}
                        {dayTasks.length > 5 && (
                          <p className="text-[11px] text-neutral-400 text-center font-mono">
                            +{dayTasks.length - 5} more scheduled
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAddTaskForDate(wd.iso, wd.dayName)}
                    className="mt-3 w-full py-2 px-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-[#972828] hover:text-white text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isOffDay ? 'Add Sunday Task' : 'Add Task'}</span>
                  </button>
                </div>
              );
            })}
          </section>
        </div>
      )}
    </div>
  );
};
