/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  Calendar,
  CheckSquare,
  Home,
  Moon,
  Plus,
  Sparkles,
  Sun,
  User,
  Utensils,
} from 'lucide-react';
import { CalendarView } from './components/CalendarView';
import { DashboardView } from './components/DashboardView';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { RoutineHubView } from './components/RoutineHubView';
import { SmartSetupModal } from './components/SmartSetupModal';
import { StatsView } from './components/StatsView';
import { TaskModal } from './components/TaskModal';
import { TasksView } from './components/TasksView';
import { createDefaultState } from './data/defaultState';
import {
  AppNotification,
  AppState,
  DayOfWeekName,
  MainNavTab,
  MealItem,
  OffDaySettings,
  RoutineItem,
  RoutineSubTab,
  SleepSchedule,
  Task,
  TaskStatus,
  UserProfile,
} from './types/todo';
import {
  formatTime12h,
  getDayOfWeekName,
  getTodayISO,
} from './utils/dateAndParser';

const STORAGE_KEY = 'todo_smart_routine_state_v1';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AppState;
        if (parsed && parsed.profile && Array.isArray(parsed.tasks)) {
          return parsed;
        }
      }
    } catch {
      // Fallback to default state
    }
    return createDefaultState();
  });

  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  const [routineSubTab, setRoutineSubTab] = useState<RoutineSubTab>('builder');
  const [selectedDateISO, setSelectedDateISO] = useState<string>(() =>
    getTodayISO()
  );

  // Modals & Drawers
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskDraft, setEditingTaskDraft] =
    useState<Partial<Task> | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSmartSetupOpen, setIsSmartSetupOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Sync dark mode class on document root
  useEffect(() => {
    const root = document.documentElement;
    if (state.profile.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.profile.theme]);

  // Persist to localStorage & sync to backend API
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }

    const controller = new AbortController();
    fetch('/api/state', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': state.profile.id || 'user-iqra-01',
      },
      body: JSON.stringify({ state }),
      signal: controller.signal,
    }).catch(() => {
      // Offline / local fallback already handled via localStorage
    });

    return () => controller.abort();
  }, [state]);

  const unreadNotificationsCount = state.notifications.filter(
    (n) => !n.read
  ).length;

  // Navigation Helper
  const handleNavigate = (tab: MainNavTab, sub?: RoutineSubTab) => {
    setActiveTab(tab);
    if (sub) {
      setRoutineSubTab(sub);
    }
  };

  // Task Handlers
  const handleOpenAddTask = (draft?: Partial<Task>) => {
    setEditingTaskDraft(
      draft || {
        date: selectedDateISO,
        dayOfWeek: getDayOfWeekName(selectedDateISO),
      }
    );
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskDraft(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (
    savedTask: Task,
    editScope: 'series' | 'single_occurrence',
    occurrenceDateISO: string
  ) => {
    setState((prev) => {
      const exists = prev.tasks.some((t) => t.id === savedTask.id);
      if (!exists) {
        return {
          ...prev,
          tasks: [...prev.tasks, savedTask],
        };
      }

      // If editing only today's occurrence of a recurring task
      if (
        editScope === 'single_occurrence' &&
        savedTask.repeat !== 'Does not repeat'
      ) {
        const detachedTask: Task = {
          ...savedTask,
          id: `task-${Date.now()}`,
          date: occurrenceDateISO,
          dayOfWeek: getDayOfWeekName(occurrenceDateISO),
          repeat: 'Does not repeat',
        };

        return {
          ...prev,
          tasks: [
            ...prev.tasks.map((t) =>
              t.id === savedTask.id
                ? {
                    ...t,
                    excludedDates: [
                      ...(t.excludedDates || []),
                      occurrenceDateISO,
                    ],
                  }
                : t
            ),
            detachedTask,
          ],
        };
      }

      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === savedTask.id ? savedTask : t)),
      };
    });

    showToast(
      `Saved “${savedTask.title}” at ${formatTime12h(savedTask.startTime)}`
    );
  };

  const handleQuickCreateTask = (newTask: Task) => {
    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
    showToast(
      `Quick Added: “${newTask.title}” (${formatTime12h(newTask.startTime)})`
    );
  };

  const handleUpdateTaskStatus = (
    taskId: string,
    dateISO: string,
    status: TaskStatus
  ) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: t.date === dateISO ? status : t.status,
          dateStatusOverrides: {
            ...(t.dateStatusOverrides || {}),
            [dateISO]: status,
          },
        };
      }),
    }));
    if (status === 'Completed') {
      showToast('Task marked as Completed ✨');
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          ),
        };
      }),
    }));
  };

  const handleDuplicateTask = (task: Task) => {
    const copy: Task = {
      ...task,
      id: `task-${Date.now()}`,
      title: `${task.title} (Copy)`,
      status: 'Pending',
      dateStatusOverrides: {},
    };
    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, copy],
    }));
    showToast(`Duplicated “${task.title}”`);
  };

  const handleDeleteTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
    showToast('Task removed from your schedule');
  };

  const handleRescheduleTaskTime = (taskId: string, newStartTime24: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, startTime: newStartTime24 } : t
      ),
    }));
    showToast(`Rescheduled task to ${formatTime12h(newStartTime24)}`);
  };

  const handleRescheduleTaskDate = (taskId: string, newDateISO: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              date: newDateISO,
              dayOfWeek: getDayOfWeekName(newDateISO),
            }
          : t
      ),
    }));
    showToast(`Moved task to ${newDateISO}`);
  };

  // Routine, Meals, Sleep & Off-Day Handlers
  const handleToggleRoutineCompleted = (routineId: string, dateISO: string) => {
    setState((prev) => ({
      ...prev,
      routine: prev.routine.map((r) => {
        if (r.id !== routineId) return r;
        const exists = r.completedDates.includes(dateISO);
        return {
          ...r,
          completedDates: exists
            ? r.completedDates.filter((d) => d !== dateISO)
            : [...r.completedDates, dateISO],
        };
      }),
    }));
  };

  const handleUpdateRoutineItem = (updated: RoutineItem) => {
    setState((prev) => ({
      ...prev,
      routine: prev.routine.map((r) => (r.id === updated.id ? updated : r)),
    }));
  };

  const handleAddRoutineItem = (newItem: RoutineItem) => {
    setState((prev) => ({
      ...prev,
      routine: [...prev.routine, newItem],
    }));
    showToast(`Added “${newItem.title}” to ${newItem.period} Routine`);
  };

  const handleDeleteRoutineItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      routine: prev.routine.filter((r) => r.id !== id),
    }));
  };

  const handleUpdateMeal = (updatedMeal: MealItem) => {
    setState((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => (m.id === updatedMeal.id ? updatedMeal : m)),
    }));
  };

  const handleToggleMealCompleted = (mealId: string, dateISO: string) => {
    setState((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => {
        if (m.id !== mealId) return m;
        const done = m.completedDates.includes(dateISO);
        return {
          ...m,
          completedDates: done
            ? m.completedDates.filter((d) => d !== dateISO)
            : [...m.completedDates, dateISO],
        };
      }),
    }));
  };

  const handleUpdateSleep = (sleep: SleepSchedule) => {
    setState((prev) => ({
      ...prev,
      sleep,
      profile: {
        ...prev.profile,
        wakeUpTime: sleep.wakeUpTime,
        sleepTime: sleep.bedtime,
      },
    }));
  };

  const handleUpdateOffDay = (offDay: OffDaySettings) => {
    setState((prev) => ({
      ...prev,
      offDay,
      profile: {
        ...prev.profile,
        offDay: offDay.dayOfWeek,
      },
    }));
  };

  const handleUpdateProfile = (profile: UserProfile) => {
    setState((prev) => ({
      ...prev,
      profile,
      sleep: {
        ...prev.sleep,
        wakeUpTime: profile.wakeUpTime,
        bedtime: profile.sleepTime,
      },
      offDay: {
        ...prev.offDay,
        dayOfWeek: profile.offDay,
      },
    }));
  };

  const handleCompleteSmartSetup = (setup: {
    name: string;
    wakeUpTime: string;
    sleepTime: string;
    workStudyHours: string;
    offDay: DayOfWeekName;
  }) => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        name: setup.name,
        avatarInitials: setup.name.slice(0, 2).toUpperCase(),
        wakeUpTime: setup.wakeUpTime,
        sleepTime: setup.sleepTime,
        workStudyHours: setup.workStudyHours,
        offDay: setup.offDay,
        onboardingDone: true,
      },
      sleep: {
        ...prev.sleep,
        wakeUpTime: setup.wakeUpTime,
        bedtime: setup.sleepTime,
      },
      offDay: {
        ...prev.offDay,
        enabled: true,
        dayOfWeek: setup.offDay,
      },
      routine: prev.routine.map((r) => {
        if (r.id === 'rt-m1') return { ...r, time: setup.wakeUpTime };
        if (r.id === 'rt-n3') return { ...r, time: setup.sleepTime };
        return r;
      }),
    }));
    showToast(`Smart routine tailored for ${setup.name}!`);
  };

  const handleTriggerSampleNotification = (
    type: AppNotification['type']
  ) => {
    const messages: Record<AppNotification['type'], string> = {
      'Upcoming Task': 'Your study session starts in 15 minutes.',
      'Meal Reminder': 'Breakfast time is coming.',
      'Sleep Reminder': "It's almost time to sleep.",
      'Morning Reminder': `Good morning! Your day starts at ${formatTime12h(
        state.sleep.wakeUpTime
      )}.`,
    };
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      type,
      title: type,
      message: messages[type],
      timeLabel: 'Just now',
      read: false,
    };
    setState((prev) => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications],
    }));
    setIsNotificationsOpen(true);
  };

  const handleExportBackup = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          { exportedAt: new Date().toISOString(), state },
          null,
          2
        )
      );
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `todo-routine-backup-${getTodayISO()}.json`;
    a.click();
    showToast('Backup exported as JSON');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F7] dark:bg-[#0E1015] text-neutral-900 dark:text-neutral-100 flex flex-col">
      {/* Top Bar Contract (3 Zones: Brand Wordmark — Clean Nav Links — Primary Actions) */}
      <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/90 dark:bg-[#14161D]/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 sm:px-8 flex items-center justify-between">
        {/* Zone 1: Single Text Element Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('home');
          }}
          className="text-xl font-bold tracking-tight text-[#972828] dark:text-[#FCAD38]"
        >
          ToDo
        </a>

        {/* Zone 2: Clean Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {(
            [
              { id: 'home', label: 'Home' },
              { id: 'calendar', label: 'Calendar' },
              { id: 'tasks', label: 'Tasks' },
              { id: 'routine', label: 'Routine' },
              { id: 'stats', label: 'Statistics' },
              { id: 'profile', label: 'Profile' },
            ] as const
          ).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                }}
                className={`py-1 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-[#972828] dark:text-[#FCAD38] font-semibold underline underline-offset-8 decoration-2 decoration-[#972828] dark:decoration-[#FCAD38]'
                    : 'hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1–2 Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            className="relative min-h-[40px] min-w-[40px] rounded-xl bg-neutral-100 dark:bg-neutral-800/90 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E45742]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddTask()}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#972828] hover:bg-[#7e2020] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Container (Sidebar on Desktop + Content Viewport) */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto flex gap-6 px-4 sm:px-6 lg:px-8 py-5 pb-24 md:pb-10">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col justify-between w-60 shrink-0 bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-4 h-fit sticky top-22">
          <div className="space-y-5">
            {/* User Mini Card */}
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer"
              >
                <div
                  className="w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0"
                  style={{ backgroundColor: state.profile.avatarBg }}
                >
                  {state.profile.avatarInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {state.profile.name}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    Off Day: {state.offDay.dayOfWeek}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleUpdateProfile({
                    ...state.profile,
                    theme: state.profile.theme === 'light' ? 'dark' : 'light',
                  })
                }
                className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                title="Toggle Light / Dark Mode"
              >
                {state.profile.theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4 text-[#FCAD38]" />
                )}
              </button>
            </div>

            {/* Primary Navigation */}
            <div className="space-y-1">
              {(
                [
                  { id: 'home', label: 'Today Dashboard', icon: Home },
                  { id: 'calendar', label: 'Calendar', icon: Calendar },
                  { id: 'tasks', label: 'Tasks & Search', icon: CheckSquare },
                  { id: 'routine', label: 'Daily Routine', icon: Sparkles },
                  { id: 'stats', label: 'Statistics', icon: BarChart3 },
                  { id: 'profile', label: 'Profile & Settings', icon: User },
                ] as const
              ).map((nav) => {
                const Icon = nav.icon;
                const active = activeTab === nav.id;
                return (
                  <button
                    key={nav.id}
                    type="button"
                    onClick={() => setActiveTab(nav.id)}
                    className={`w-full min-h-[42px] px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#972828] text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{nav.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Direct Shortcuts for Meals, Sleep & Sunday Off-Day */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-1">
              <span className="px-3 text-[11px] font-semibold text-neutral-400 block mb-1">
                Life Planners
              </span>
              <button
                type="button"
                onClick={() => handleNavigate('routine', 'meals')}
                className="w-full px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-[#972828] dark:hover:text-[#FCAD38] hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center gap-2.5 cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5 text-[#EB7F31]" />
                <span>Meal Planner</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('routine', 'sleep')}
                className="w-full px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-[#972828] dark:hover:text-[#FCAD38] hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center gap-2.5 cursor-pointer"
              >
                <Moon className="w-3.5 h-3.5 text-[#972828] dark:text-[#FCAD38]" />
                <span>Sleep Schedule</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('routine', 'weekly')}
                className="w-full px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-[#972828] dark:hover:text-[#FCAD38] hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center gap-2.5 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#E45742]" />
                <span>Weekly & Sunday Off</span>
              </button>
            </div>
          </div>

          {/* Smart Setup Trigger */}
          <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsSmartSetupOpen(true)}
              className="w-full py-2.5 px-3 rounded-2xl bg-[#FCAD38]/15 hover:bg-[#FCAD38]/25 text-[#972828] dark:text-[#FCAD38] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Routine Setup</span>
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0">
          {activeTab === 'home' && (
            <DashboardView
              state={state}
              selectedDateISO={selectedDateISO}
              onSelectDate={setSelectedDateISO}
              onOpenAddTask={handleOpenAddTask}
              onEditTask={handleEditTask}
              onQuickCreateTask={handleQuickCreateTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onToggleSubtask={handleToggleSubtask}
              onDuplicateTask={handleDuplicateTask}
              onDeleteTask={handleDeleteTask}
              onRescheduleTaskTime={handleRescheduleTaskTime}
              onToggleRoutineCompleted={handleToggleRoutineCompleted}
              onToggleMealCompleted={handleToggleMealCompleted}
              onNavigate={handleNavigate}
              onToggleOffDayMode={(enabled) =>
                handleUpdateOffDay({ ...state.offDay, enabled })
              }
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              state={state}
              selectedDateISO={selectedDateISO}
              onSelectDate={setSelectedDateISO}
              onOpenAddTask={handleOpenAddTask}
              onEditTask={handleEditTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onRescheduleTaskTime={handleRescheduleTaskTime}
              onRescheduleTaskDate={handleRescheduleTaskDate}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              state={state}
              selectedDateISO={selectedDateISO}
              onOpenAddTask={handleOpenAddTask}
              onEditTask={handleEditTask}
              onQuickCreateTask={handleQuickCreateTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onToggleSubtask={handleToggleSubtask}
              onDuplicateTask={handleDuplicateTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === 'routine' && (
            <RoutineHubView
              state={state}
              activeSubTab={routineSubTab}
              selectedDateISO={selectedDateISO}
              onChangeSubTab={setRoutineSubTab}
              onUpdateRoutineItem={handleUpdateRoutineItem}
              onAddRoutineItem={handleAddRoutineItem}
              onDeleteRoutineItem={handleDeleteRoutineItem}
              onToggleRoutineCompleted={handleToggleRoutineCompleted}
              onUpdateMeal={handleUpdateMeal}
              onToggleMealCompleted={handleToggleMealCompleted}
              onUpdateSleep={handleUpdateSleep}
              onUpdateOffDay={handleUpdateOffDay}
              onOpenAddTaskForDate={(dateISO, dayName) =>
                handleOpenAddTask({ date: dateISO, dayOfWeek: dayName })
              }
            />
          )}

          {activeTab === 'stats' && (
            <StatsView state={state} selectedDateISO={selectedDateISO} />
          )}

          {activeTab === 'profile' && (
            <ProfileSettingsView
              state={state}
              onUpdateProfile={handleUpdateProfile}
              onOpenSmartSetup={() => setIsSmartSetupOpen(true)}
              onTriggerSampleNotification={handleTriggerSampleNotification}
              onExportBackup={handleExportBackup}
              onImportBackup={(imported) => {
                setState(imported);
                showToast('Restored schedule from backup');
              }}
              onResetDefaults={() => {
                const fresh = createDefaultState();
                setState(fresh);
                showToast('Reset schedule to default smart routine');
              }}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Section 22: Home | Calendar | Tasks | Routine | Profile) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#14161D]/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-5 items-center px-2"
        aria-label="Mobile bottom navigation"
      >
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare },
            { id: 'routine', label: 'Routine', icon: Sparkles },
            { id: 'profile', label: 'Profile', icon: User },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                active
                  ? 'text-[#972828] dark:text-[#FCAD38] font-bold'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Non-Intrusive Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 px-4 py-2.5 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FCAD38]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals & Drawers */}
      <TaskModal
        isOpen={isTaskModalOpen}
        initialTask={editingTaskDraft}
        activeDateISO={selectedDateISO}
        onClose={() => setIsTaskModalOpen(false)}
        onSaveTask={handleSaveTask}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        notifications={state.notifications}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkAllRead={() =>
          setState((prev) => ({
            ...prev,
            notifications: prev.notifications.map((n) => ({
              ...n,
              read: true,
            })),
          }))
        }
        onDismissNotification={(id) =>
          setState((prev) => ({
            ...prev,
            notifications: prev.notifications.filter((n) => n.id !== id),
          }))
        }
      />

      <SmartSetupModal
        isOpen={isSmartSetupOpen}
        profile={state.profile}
        onClose={() => setIsSmartSetupOpen(false)}
        onCompleteSetup={handleCompleteSmartSetup}
      />
    </div>
  );
}
