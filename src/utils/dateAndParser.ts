import {
  DayOfWeekName,
  RepeatPattern,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../types/todo';

export const DAYS_OF_WEEK: DayOfWeekName[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const CATEGORIES: TaskCategory[] = [
  'Study',
  'Work',
  'Personal',
  'Health',
  'Exercise',
  'Food',
  'Family',
  'Shopping',
  'Other',
];

export const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

export const REPEAT_OPTIONS: RepeatPattern[] = [
  'Does not repeat',
  'Daily',
  'Every weekday',
  'Every weekend',
  'Weekly',
  'Custom days',
  'Monthly',
];

export function getTodayISO(): string {
  // Using current local date (2026-10-02 in the environment or actual browser date)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysISO(iso: string, days: number): string {
  const dt = parseISODate(iso);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

export function getDayOfWeekName(iso: string): DayOfWeekName {
  const dt = parseISODate(iso);
  const jsDay = dt.getDay(); // 0 = Sunday, 1 = Monday ...
  const map: DayOfWeekName[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return map[jsDay];
}

export function formatDisplayDate(
  iso: string,
  format: 'MMM D, YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' = 'MMM D, YYYY'
): string {
  if (format === 'YYYY-MM-DD') return iso;
  const dt = parseISODate(iso);
  if (format === 'DD/MM/YYYY') {
    const d = String(dt.getDate()).padStart(2, '0');
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}/${dt.getFullYear()}`;
  }
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatLongHeaderDate(iso: string): {
  dayName: string;
  monthDay: string;
  full: string;
} {
  const dt = parseISODate(iso);
  const dayName = dt.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = dt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });
  return {
    dayName,
    monthDay,
    full: `${dayName}, ${monthDay}`,
  };
}

export function formatTime12h(time24: string): string {
  if (!time24 || !time24.includes(':')) return '8:00 AM';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) h = 8;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function timeToMinutes(time24: string): number {
  if (!time24 || !time24.includes(':')) return 480;
  const [h, m] = time24.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime24h(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calculateSleepDuration(bedtime: string, wakeUpTime: string): {
  hours: number;
  minutes: number;
  totalHoursDecimal: number;
  formatted: string;
} {
  const bedMins = timeToMinutes(bedtime);
  const wakeMins = timeToMinutes(wakeUpTime);
  let diff = wakeMins - bedMins;
  if (diff <= 0) {
    diff += 24 * 60;
  }
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  const totalHoursDecimal = Math.round((diff / 60) * 10) / 10;
  const formatted =
    minutes === 0 ? `${hours} hrs` : `${hours}h ${minutes}m`;
  return { hours, minutes, totalHoursDecimal, formatted };
}

export function getWeekDates(
  anchorISO: string,
  firstDay: 'Monday' | 'Sunday' = 'Monday'
): { iso: string; dayName: DayOfWeekName; shortDay: string; dayNumber: number }[] {
  const dt = parseISODate(anchorISO);
  const jsDay = dt.getDay(); // 0=Sun..6=Sat
  const offset =
    firstDay === 'Monday'
      ? jsDay === 0
        ? -6
        : 1 - jsDay
      : -jsDay;

  const start = new Date(dt);
  start.setDate(dt.getDate() + offset);

  const result: {
    iso: string;
    dayName: DayOfWeekName;
    shortDay: string;
    dayNumber: number;
  }[] = [];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(start);
    cur.setDate(start.getDate() + i);
    const iso = toISODate(cur);
    const dayName = getDayOfWeekName(iso);
    result.push({
      iso,
      dayName,
      shortDay: dayName.slice(0, 3),
      dayNumber: cur.getDate(),
    });
  }
  return result;
}

export function getMonthCalendarGrid(
  year: number,
  monthZeroIndexed: number,
  firstDay: 'Monday' | 'Sunday' = 'Monday'
): { iso: string; dayNumber: number; inCurrentMonth: boolean }[] {
  const firstOfMonth = new Date(year, monthZeroIndexed, 1, 12, 0, 0);
  const jsDay = firstOfMonth.getDay();
  const leadingDays =
    firstDay === 'Monday' ? (jsDay === 0 ? 6 : jsDay - 1) : jsDay;

  const startDate = new Date(firstOfMonth);
  startDate.setDate(1 - leadingDays);

  const cells: { iso: string; dayNumber: number; inCurrentMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const cur = new Date(startDate);
    cur.setDate(startDate.getDate() + i);
    cells.push({
      iso: toISODate(cur),
      dayNumber: cur.getDate(),
      inCurrentMonth: cur.getMonth() === monthZeroIndexed,
    });
  }
  return cells;
}

export function doesTaskOccurOnDate(
  task: Task,
  targetISO: string,
  isOffDayFullOff: boolean = false
): boolean {
  if (task.excludedDates?.includes(targetISO)) {
    return false;
  }

  // Exact created date always matches unless excluded
  if (task.date === targetISO) {
    return true;
  }

  // If task Does not repeat, it only appears on task.date
  if (task.repeat === 'Does not repeat') {
    return false;
  }

  // Only repeat on or after start date (or within current week for weekly)
  const dayName = getDayOfWeekName(targetISO);

  // If targetISO is an Off-Day with auto-skip enabled, skip recurring routine tasks unless explicitly scheduled for targetISO
  if (isOffDayFullOff && task.date !== targetISO) {
    return false;
  }

  switch (task.repeat) {
    case 'Daily':
      return true;
    case 'Every weekday':
      return !['Saturday', 'Sunday'].includes(dayName);
    case 'Every weekend':
      return ['Saturday', 'Sunday'].includes(dayName);
    case 'Weekly':
      return task.dayOfWeek === dayName;
    case 'Custom days':
      return Boolean(task.customDays && task.customDays.includes(dayName));
    case 'Monthly': {
      const taskDay = parseISODate(task.date).getDate();
      const targetDay = parseISODate(targetISO).getDate();
      return taskDay === targetDay;
    }
    default:
      return false;
  }
}

export function getTaskStatusForDate(task: Task, targetISO: string): TaskStatus {
  if (task.dateStatusOverrides && task.dateStatusOverrides[targetISO]) {
    return task.dateStatusOverrides[targetISO];
  }
  if (task.date === targetISO) {
    return task.status;
  }
  return 'Pending';
}

export interface ParsedQuickTask {
  title: string;
  date: string;
  dayOfWeek: DayOfWeekName;
  startTime: string;
  category: TaskCategory;
  priority: TaskPriority;
  repeat: RepeatPattern;
  detectedTokens: string[];
}

export function parseQuickAdd(
  rawInput: string,
  referenceDateISO: string
): ParsedQuickTask {
  let working = rawInput.trim();
  const detectedTokens: string[] = [];

  let date = referenceDateISO;
  let startTime = '09:00';
  let repeat: RepeatPattern = 'Does not repeat';
  let priority: TaskPriority = 'Medium';
  let category: TaskCategory = 'Personal';

  // 1. Detect Repeat patterns
  if (/\b(every\s+day|daily)\b/i.test(working)) {
    repeat = 'Daily';
    detectedTokens.push('Daily');
    working = working.replace(/\b(every\s+day|daily)\b/gi, ' ');
  } else if (/\b(every\s+weekday|weekdays)\b/i.test(working)) {
    repeat = 'Every weekday';
    detectedTokens.push('Every weekday');
    working = working.replace(/\b(every\s+weekday|weekdays)\b/gi, ' ');
  } else if (/\b(every\s+weekend|weekends)\b/i.test(working)) {
    repeat = 'Every weekend';
    detectedTokens.push('Every weekend');
    working = working.replace(/\b(every\s+weekend|weekends)\b/gi, ' ');
  } else if (/\b(weekly|every\s+week)\b/i.test(working)) {
    repeat = 'Weekly';
    detectedTokens.push('Weekly');
    working = working.replace(/\b(weekly|every\s+week)\b/gi, ' ');
  }

  // 2. Detect Priority
  if (/\b(urgent|asap|critical)\b/i.test(working)) {
    priority = 'Urgent';
    detectedTokens.push('Urgent Priority');
    working = working.replace(/\b(urgent|asap|critical)\b/gi, ' ');
  } else if (/\b(high\s+priority|important|high)\b/i.test(working)) {
    priority = 'High';
    detectedTokens.push('High Priority');
    working = working.replace(/\b(high\s+priority|important)\b/gi, ' ');
  } else if (/\b(low\s+priority)\b/i.test(working)) {
    priority = 'Low';
    detectedTokens.push('Low Priority');
    working = working.replace(/\b(low\s+priority)\b/gi, ' ');
  }

  // 3. Detect Date (today, tomorrow, or weekday name)
  if (/\btomorrow\b/i.test(working)) {
    date = addDaysISO(referenceDateISO, 1);
    detectedTokens.push('Tomorrow');
    working = working.replace(/\btomorrow\b/gi, ' ');
  } else if (/\btoday\b/i.test(working)) {
    date = referenceDateISO;
    detectedTokens.push('Today');
    working = working.replace(/\btoday\b/gi, ' ');
  } else {
    for (const dayName of DAYS_OF_WEEK) {
      const regex = new RegExp(`\\b(on\\s+)?${dayName}\\b`, 'i');
      if (regex.test(working)) {
        // Find next occurrence of dayName from referenceDateISO
        for (let offset = 0; offset < 7; offset++) {
          const candidate = addDaysISO(referenceDateISO, offset);
          if (getDayOfWeekName(candidate) === dayName) {
            date = candidate;
            break;
          }
        }
        detectedTokens.push(dayName);
        working = working.replace(regex, ' ');
        break;
      }
    }
  }

  // 4. Detect Time (e.g., "at 7 PM", "at 7:30 am", "19:00", "at 5pm")
  const time12Regex = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i;
  const time24Regex = /\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/;

  const match12 = working.match(time12Regex);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2] || '0', 10);
    const meridiem = match12[3].toLowerCase();
    if (meridiem === 'pm' && h < 12) h += 12;
    if (meridiem === 'am' && h === 12) h = 0;
    startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    detectedTokens.push(formatTime12h(startTime));
    working = working.replace(time12Regex, ' ');
  } else {
    const match24 = working.match(time24Regex);
    if (match24) {
      const h = parseInt(match24[1], 10);
      const m = parseInt(match24[2], 10);
      startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      detectedTokens.push(formatTime12h(startTime));
      working = working.replace(time24Regex, ' ');
    }
  }

  // Clean up title
  const cleanedTitle = working
    .replace(/\s+/g, ' ')
    .replace(/^[-–—,\s]+|[-–—,\s]+$/g, '')
    .trim();

  const finalTitle = cleanedTitle || rawInput.trim() || 'New Task';

  // 5. Infer Category from keywords
  const lower = finalTitle.toLowerCase();
  if (
    /\b(study|exam|assignment|math|chapter|read|lecture|homework|revision|course|class|notes)\b/.test(
      lower
    )
  ) {
    category = 'Study';
  } else if (
    /\b(work|meeting|project|client|report|email|presentation|office|call|deadline)\b/.test(
      lower
    )
  ) {
    category = 'Work';
  } else if (
    /\b(exercise|workout|gym|run|jog|yoga|walk|fitness|cardio|stretch)\b/.test(
      lower
    )
  ) {
    category = 'Exercise';
  } else if (
    /\b(breakfast|brunch|lunch|dinner|snack|meal|cook|eat|tea|coffee|water)\b/.test(
      lower
    )
  ) {
    category = 'Food';
  } else if (
    /\b(buy|shop|grocery|groceries|market|order|store|milk)\b/.test(lower)
  ) {
    category = 'Shopping';
  } else if (
    /\b(doctor|medicine|health|vitamin|sleep|meditate|dentist|checkup)\b/.test(
      lower
    )
  ) {
    category = 'Health';
  } else if (
    /\b(family|mom|dad|parents|sister|brother|kids|visit|home)\b/.test(lower)
  ) {
    category = 'Family';
  }

  return {
    title: finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1),
    date,
    dayOfWeek: getDayOfWeekName(date),
    startTime,
    category,
    priority,
    repeat,
    detectedTokens,
  };
}
