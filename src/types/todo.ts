export type TaskCategory =
  | 'Study'
  | 'Work'
  | 'Personal'
  | 'Health'
  | 'Exercise'
  | 'Food'
  | 'Family'
  | 'Shopping'
  | 'Other';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Skipped';

export type RepeatPattern =
  | 'Does not repeat'
  | 'Daily'
  | 'Every weekday'
  | 'Every weekend'
  | 'Weekly'
  | 'Custom days'
  | 'Monthly';

export type DayOfWeekName =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type ReminderOption =
  | 'At time of task'
  | '5 minutes before'
  | '10 minutes before'
  | '15 minutes before'
  | '30 minutes before'
  | '1 hour before'
  | 'Custom';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime?: string; // HH:mm (24h)
  dayOfWeek: DayOfWeekName;
  repeat: RepeatPattern;
  customDays?: DayOfWeekName[];
  category: TaskCategory;
  priority: TaskPriority;
  reminder: ReminderOption;
  customReminderMinutes?: number;
  notes: string;
  subtasks: Subtask[];
  status: TaskStatus;
  /** For recurring tasks: per-date status overrides so user can complete/edit just today or whole series */
  dateStatusOverrides?: Record<string, TaskStatus>;
  excludedDates?: string[];
  createdAt: string;
}

export type RoutineBlockPeriod = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export interface RoutineItem {
  id: string;
  period: RoutineBlockPeriod;
  title: string;
  time: string; // HH:mm (24h)
  endTime?: string;
  category: TaskCategory;
  priority: TaskPriority;
  enabled: boolean;
  completedDates: string[]; // YYYY-MM-DD
  skippedDates: string[]; // YYYY-MM-DD
  inProgressDates?: string[]; // YYYY-MM-DD
  notes?: string;
}

export type MealType = 'Breakfast' | 'Brunch' | 'Lunch' | 'Evening Snack' | 'Dinner';

export interface MealItem {
  id: string;
  type: MealType;
  time: string; // HH:mm (24h)
  food: string;
  notes: string;
  calories?: number;
  completedDates: string[]; // YYYY-MM-DD
  dayOverrides?: Record<string, { food: string; time: string; notes: string }>;
}

export interface SleepSchedule {
  wakeUpTime: string; // HH:mm (24h) e.g. "07:00"
  bedtime: string; // HH:mm (24h) e.g. "23:00"
  targetHours: number; // e.g. 8
  sleepReminder: ReminderOption;
  morningAlarm: boolean;
  windDownActivity: string;
  sleepHistory: {
    date: string;
    durationHours: number;
    quality: 'Restful' | 'Good' | 'Light';
  }[];
}

export type OffDayMode = 'Full day off' | 'Partial day' | 'Normal working day';

export interface OffDaySettings {
  enabled: boolean;
  dayOfWeek: DayOfWeekName;
  mode: OffDayMode;
  skipRegularTasks: boolean;
  pauseRoutine: boolean;
  personalDayNote: string;
}

export interface AppNotification {
  id: string;
  type: 'Upcoming Task' | 'Meal Reminder' | 'Sleep Reminder' | 'Morning Reminder';
  title: string;
  message: string;
  timeLabel: string;
  read: boolean;
  category?: TaskCategory;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  avatarBg: string;
  wakeUpTime: string;
  sleepTime: string;
  workStudyHours: string;
  offDay: DayOfWeekName;
  theme: 'light' | 'dark';
  language: 'English' | 'Hinglish';
  timeZone: string;
  dateFormat: 'MMM D, YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  firstDayOfWeek: 'Monday' | 'Sunday';
  notifications: {
    upcomingTasks: boolean;
    mealReminders: boolean;
    sleepReminders: boolean;
    morningReminder: boolean;
    soundEnabled: boolean;
  };
  onboardingDone: boolean;
}

export interface AppState {
  profile: UserProfile;
  tasks: Task[];
  routine: RoutineItem[];
  meals: MealItem[];
  sleep: SleepSchedule;
  offDay: OffDaySettings;
  notifications: AppNotification[];
}

export type MainNavTab = 'home' | 'calendar' | 'tasks' | 'routine' | 'stats' | 'profile';

export type RoutineSubTab = 'builder' | 'meals' | 'sleep' | 'weekly';
