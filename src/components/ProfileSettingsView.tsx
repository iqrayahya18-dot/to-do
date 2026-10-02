import React, { useRef } from 'react';
import {
  Bell,
  Clock,
  Download,
  Globe,
  Moon,
  Palette,
  RotateCcw,
  Sparkles,
  Sun,
  Upload,
  User,
} from 'lucide-react';
import {
  AppState,
  DayOfWeekName,
  UserProfile,
} from '../types/todo';
import { DAYS_OF_WEEK } from '../utils/dateAndParser';

interface ProfileSettingsViewProps {
  state: AppState;
  onUpdateProfile: (profile: UserProfile) => void;
  onOpenSmartSetup: () => void;
  onTriggerSampleNotification: (
    type: 'Upcoming Task' | 'Meal Reminder' | 'Sleep Reminder' | 'Morning Reminder'
  ) => void;
  onExportBackup: () => void;
  onImportBackup: (importedState: AppState) => void;
  onResetDefaults: () => void;
}

const AVATAR_COLORS = [
  '#972828',
  '#E45742',
  '#EB7F31',
  '#D97706',
  '#0F766E',
  '#1E293B',
];

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({
  state,
  onUpdateProfile,
  onOpenSmartSetup,
  onTriggerSampleNotification,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { profile } = state;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        const candidate = parsed.state || parsed;
        if (candidate && candidate.profile && Array.isArray(candidate.tasks)) {
          onImportBackup(candidate as AppState);
        }
      } catch {
        // Ignore invalid file
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Profile Banner */}
      <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-3xl text-white font-bold text-xl flex items-center justify-center shadow-sm shrink-0"
            style={{ backgroundColor: profile.avatarBg }}
          >
            {profile.avatarInitials || profile.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="text-xs font-semibold text-[#972828] dark:text-[#FCAD38]">
              Personal Daily Planner Profile
            </span>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {profile.name}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {profile.email} · Off Day: {profile.offDay}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSmartSetup}
          className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#972828] to-[#E45742] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm hover:opacity-95 transition-opacity cursor-pointer self-start md:self-auto whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          <span>Run 5-Step Smart Setup</span>
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Identity, Default Timings, Regional & Calendar Formats */}
        <div className="lg:col-span-7 space-y-6">
          {/* Identity & Avatar */}
          <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-[#972828] dark:text-[#FCAD38]" />
              <span>Profile & Identity</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...profile,
                      name: e.target.value,
                      avatarInitials: e.target.value
                        .trim()
                        .slice(0, 2)
                        .toUpperCase(),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Profile Picture Accent
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {AVATAR_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() =>
                        onUpdateProfile({ ...profile, avatarBg: color })
                      }
                      className={`w-8 h-8 rounded-xl transition-transform cursor-pointer ${
                        profile.avatarBg === color
                          ? 'scale-110 ring-2 ring-offset-2 ring-[#972828]'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select avatar color ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Default Wake-up, Sleep, Work/Study Hours & Off Day */}
          <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E45742]" />
              <span>Default Routine & Off-Day Preferences</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Default Wake-Up Time
                </label>
                <input
                  type="time"
                  value={profile.wakeUpTime}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, wakeUpTime: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-mono tabular-nums text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Default Sleep Time
                </label>
                <input
                  type="time"
                  value={profile.sleepTime}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, sleepTime: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-mono tabular-nums text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Working / Study Hours
                </label>
                <input
                  type="text"
                  value={profile.workStudyHours}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...profile,
                      workStudyHours: e.target.value,
                    })
                  }
                  placeholder="e.g. 08:30 – 17:00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Default Weekly Off Day
                </label>
                <select
                  value={profile.offDay}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...profile,
                      offDay: e.target.value as DayOfWeekName,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Regional, Theme, Language, Time Zone, Date Format, First Day of Week */}
          <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#EB7F31]" />
              <span>Appearance, Language & Calendar Formats</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Theme */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <span className="inline-flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-[#972828]" />
                    Theme Mode
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateProfile({ ...profile, theme: 'light' })
                    }
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      profile.theme === 'light'
                        ? 'bg-white text-[#972828] shadow-xs'
                        : 'text-neutral-500'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateProfile({ ...profile, theme: 'dark' })
                    }
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                      profile.theme === 'dark'
                        ? 'bg-neutral-800 text-[#FCAD38] shadow-xs'
                        : 'text-neutral-500'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    Dark
                  </button>
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Language
                </label>
                <select
                  value={profile.language}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...profile,
                      language: e.target.value as 'English' | 'Hinglish',
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white"
                >
                  <option value="English">English</option>
                  <option value="Hinglish">Hinglish / हिन्दी</option>
                </select>
              </div>

              {/* Time Zone */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Time Zone
                </label>
                <select
                  value={profile.timeZone}
                  onChange={(e) =>
                    onUpdateProfile({ ...profile, timeZone: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white"
                >
                  <option value="Asia/Karachi (GMT+5)">
                    Asia/Karachi (GMT+5)
                  </option>
                  <option value="Asia/Kolkata (GMT+5:30)">
                    Asia/Kolkata (GMT+5:30)
                  </option>
                  <option value="Asia/Dubai (GMT+4)">Asia/Dubai (GMT+4)</option>
                  <option value="Europe/London (GMT+0)">
                    Europe/London (GMT+0)
                  </option>
                  <option value="America/New_York (GMT-5)">
                    America/New_York (GMT-5)
                  </option>
                </select>
              </div>

              {/* Date Format */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Date Format
                </label>
                <select
                  value={profile.dateFormat}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...profile,
                      dateFormat: e.target.value as
                        | 'MMM D, YYYY'
                        | 'DD/MM/YYYY'
                        | 'YYYY-MM-DD',
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm font-mono text-neutral-900 dark:text-white"
                >
                  <option value="MMM D, YYYY">Oct 2, 2026 (MMM D, YYYY)</option>
                  <option value="DD/MM/YYYY">02/10/2026 (DD/MM/YYYY)</option>
                  <option value="YYYY-MM-DD">2026-10-02 (YYYY-MM-DD)</option>
                </select>
              </div>

              {/* First Day of Week */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  First Day of Week
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl max-w-xs">
                  {(['Monday', 'Sunday'] as const).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() =>
                        onUpdateProfile({ ...profile, firstDayOfWeek: day })
                      }
                      className={`py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer ${
                        profile.firstDayOfWeek === day
                          ? 'bg-white dark:bg-neutral-800 text-[#972828] dark:text-[#FCAD38] shadow-xs'
                          : 'text-neutral-500'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right 5 Cols: Notification Settings & Data Backup */}
        <div className="lg:col-span-5 space-y-6">
          {/* Notification Settings (Section 13) */}
          <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#972828] dark:text-[#FCAD38]" />
              <span>Reminders & Notification Settings</span>
            </h2>

            <div className="space-y-3">
              {(
                [
                  {
                    key: 'upcomingTasks',
                    title: 'Upcoming Task Alerts',
                    desc: '“Your study session starts in 15 minutes.”',
                    testType: 'Upcoming Task',
                  },
                  {
                    key: 'mealReminders',
                    title: 'Meal Routine Reminders',
                    desc: '“Breakfast time is coming.”',
                    testType: 'Meal Reminder',
                  },
                  {
                    key: 'sleepReminders',
                    title: 'Sleep Wind-Down Alerts',
                    desc: "“It's almost time to sleep.”",
                    testType: 'Sleep Reminder',
                  },
                  {
                    key: 'morningReminder',
                    title: 'Morning Day Briefing',
                    desc: '“Good morning! Your day starts at 7:00 AM.”',
                    testType: 'Morning Reminder',
                  },
                ] as const
              ).map((item) => {
                const checked = profile.notifications[item.key];
                return (
                  <div
                    key={item.key}
                    className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between gap-3"
                  >
                    <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          onUpdateProfile({
                            ...profile,
                            notifications: {
                              ...profile.notifications,
                              [item.key]: e.target.checked,
                            },
                          })
                        }
                        className="mt-1 accent-[#972828]"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {item.desc}
                        </span>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => onTriggerSampleNotification(item.testType)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-medium text-[#972828] dark:text-[#FCAD38] hover:border-[#972828] cursor-pointer shrink-0"
                    >
                      Preview
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Data Backup & Recovery (Section 27) */}
          <section className="bg-white dark:bg-[#161820] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Data Backup & Restore
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Your schedule is automatically saved to the server and browser storage. You can also export or restore a JSON backup anytime.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={onExportBackup}
                className="w-full min-h-[42px] px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-[#972828] dark:text-[#FCAD38]" />
                <span>Export Complete Backup (.json)</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[42px] px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 text-[#E45742]" />
                <span>Restore Backup from JSON</span>
              </button>

              <button
                type="button"
                onClick={onResetDefaults}
                className="w-full min-h-[42px] px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Demo Schedule to Defaults</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
