import React from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { AppState, TaskCategory } from '../types/todo';
import {
  CATEGORIES,
  doesTaskOccurOnDate,
  getTaskStatusForDate,
  getTodayISO,
  getWeekDates,
} from '../utils/dateAndParser';
import { getCategoryAccentColor, getCategoryIcon } from './CategoryMeta';

interface StatsViewProps {
  state: AppState;
  selectedDateISO: string;
}

export const StatsView: React.FC<StatsViewProps> = ({
  state,
  selectedDateISO,
}) => {
  const todayISO = getTodayISO();
  const weekDays = getWeekDates(selectedDateISO, state.profile.firstDayOfWeek);

  // 1. Tasks completed today
  const todayTasks = state.tasks.filter((t) =>
    doesTaskOccurOnDate(t, todayISO, false)
  );
  const completedToday = todayTasks.filter(
    (t) => getTaskStatusForDate(t, todayISO) === 'Completed'
  ).length;
  const todayCompletionPct =
    todayTasks.length > 0
      ? Math.round((completedToday / todayTasks.length) * 100)
      : 0;

  // 2. Weekly breakdown across the 7 days
  let completedThisWeek = 0;
  let totalScheduledThisWeek = 0;
  let missedOrSkippedThisWeek = 0;

  const dailyStats = weekDays.map((wd) => {
    const isOffDay =
      state.offDay.enabled &&
      state.offDay.dayOfWeek === wd.dayName &&
      state.offDay.mode === 'Full day off';

    const tasks = state.tasks.filter((t) =>
      doesTaskOccurOnDate(t, wd.iso, isOffDay && state.offDay.skipRegularTasks)
    );
    const done = tasks.filter(
      (t) => getTaskStatusForDate(t, wd.iso) === 'Completed'
    ).length;
    const skipped = tasks.filter(
      (t) => getTaskStatusForDate(t, wd.iso) === 'Skipped'
    ).length;

    completedThisWeek += done;
    totalScheduledThisWeek += tasks.length;
    missedOrSkippedThisWeek += skipped;

    const pct =
      tasks.length > 0 ? Math.round((done / tasks.length) * 100) : isOffDay ? 100 : 0;

    return {
      ...wd,
      total: tasks.length,
      done,
      skipped,
      pct,
      isOffDay,
    };
  });

  // Find Most Productive Day
  const mostProductiveDay = [...dailyStats].sort((a, b) => b.done - a.done)[0];

  // Routine Consistency Percentage
  const enabledRoutine = state.routine.filter((r) => r.enabled);
  const routineCompletedToday = enabledRoutine.filter((r) =>
    r.completedDates.includes(todayISO)
  ).length;
  const routineConsistencyPct =
    enabledRoutine.length > 0
      ? Math.round((routineCompletedToday / enabledRoutine.length) * 100)
      : 85;

  // Category Breakdown
  const categoryStats = CATEGORIES.map((cat: TaskCategory) => {
    const inCat = state.tasks.filter((t) => t.category === cat);
    const doneInCat = inCat.filter(
      (t) => getTaskStatusForDate(t, todayISO) === 'Completed'
    ).length;
    return {
      category: cat,
      total: inCat.length,
      done: doneInCat,
    };
  }).filter((c) => c.total > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6">
        <span className="text-xs font-semibold text-[#972828] dark:text-[#FCAD38]">
          Productivity & Routine Analytics
        </span>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mt-0.5">
          Weekly Performance & Habit Consistency
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          Simple, readable metrics showing your task completion, routine consistency, and most productive days.
        </p>
      </section>

      {/* Top 6 Key Metric Cards (Section 16) */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <div className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-4 flex flex-col justify-between">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Completed Today
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
              {completedToday}
            </span>
            <span className="text-xs font-mono text-neutral-400 tabular-nums">
              /{todayTasks.length}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-4 flex flex-col justify-between">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Completed This Week
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#972828] dark:text-[#FCAD38]">
              {completedThisWeek}
            </span>
            <span className="text-xs font-mono text-neutral-400 tabular-nums">
              tasks
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-4 flex flex-col justify-between">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Completion Rate
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
              {todayCompletionPct}%
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-4 flex flex-col justify-between">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Most Productive Day
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold text-[#E45742] truncate">
              {mostProductiveDay?.dayName || 'Friday'}
            </span>
            <Award className="w-4 h-4 text-[#FCAD38] shrink-0" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-4 flex flex-col justify-between">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Missed / Skipped
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
              {missedOrSkippedThisWeek}
            </span>
            <span className="text-xs text-neutral-400">this week</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-4 flex flex-col justify-between">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Routine Consistency
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#EB7F31]">
              {routineConsistencyPct}%
            </span>
            <Flame className="w-4 h-4 text-[#EB7F31]" />
          </div>
        </div>
      </section>

      {/* Weekly Productivity Chart + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Bar Chart */}
        <section className="lg:col-span-7 bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#972828] dark:text-[#FCAD38]" />
                  <span>Weekly Productivity Chart</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Daily task completion across Monday through Sunday
                </p>
              </div>
              <span className="text-xs font-mono text-neutral-400 tabular-nums">
                {completedThisWeek}/{totalScheduledThisWeek} completed
              </span>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-3 items-end h-52 pt-4 px-2">
              {dailyStats.map((ds) => {
                const barHeight = ds.isOffDay
                  ? 30
                  : Math.max(12, Math.min(100, ds.pct));
                const isToday = ds.iso === todayISO;

                return (
                  <div
                    key={ds.iso}
                    className="flex flex-col items-center justify-end h-full gap-2"
                  >
                    <span className="text-[11px] font-mono font-semibold text-neutral-600 dark:text-neutral-300 tabular-nums">
                      {ds.isOffDay ? 'OFF' : `${ds.done}/${ds.total}`}
                    </span>

                    <div className="w-full max-w-[42px] h-36 bg-neutral-100 dark:bg-neutral-900 rounded-2xl flex items-end overflow-hidden p-1">
                      <div
                        className={`w-full rounded-xl transition-all duration-500 ${
                          ds.isOffDay
                            ? 'bg-[#FCAD38]/50'
                            : isToday
                            ? 'bg-gradient-to-t from-[#972828] via-[#E45742] to-[#FCAD38]'
                            : 'bg-[#E45742]/80'
                        }`}
                        style={{ height: `${barHeight}%` }}
                      />
                    </div>

                    <div className="text-center">
                      <span
                        className={`text-xs font-bold block ${
                          isToday
                            ? 'text-[#972828] dark:text-[#FCAD38]'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {ds.shortDay}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 tabular-nums">
                        {ds.dayNumber}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#972828] dark:text-[#FCAD38]" />
              Consistent morning study & meal routines drive your highest completion days.
            </span>
          </div>
        </section>

        {/* Category Breakdown */}
        <section className="lg:col-span-5 bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6">
          <div className="pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
              Category Distribution
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Tasks organized by life area
            </p>
          </div>

          <div className="mt-4 space-y-3.5">
            {categoryStats.map((cs) => {
              const pct =
                cs.total > 0 ? Math.round((cs.done / cs.total) * 100) : 0;
              const catColors = getCategoryAccentColor(cs.category);

              return (
                <div key={cs.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-lg ${catColors.iconBg} ${catColors.iconText} flex items-center justify-center`}
                      >
                        {getCategoryIcon(cs.category, 'w-3.5 h-3.5')}
                      </span>
                      {cs.category}
                    </span>
                    <span className="font-mono text-neutral-500 tabular-nums">
                      {cs.done}/{cs.total} done ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${catColors.accentBar} transition-all duration-500`}
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
