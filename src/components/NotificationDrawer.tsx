import React from 'react';
import { Bell, CheckCheck, Moon, Sun, Utensils, X } from 'lucide-react';
import { AppNotification } from '../types/todo';

interface NotificationDrawerProps {
  isOpen: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onDismissNotification: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  notifications,
  onClose,
  onMarkAllRead,
  onDismissNotification,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'Meal Reminder':
        return <Utensils className="w-4 h-4 text-[#EB7F31]" />;
      case 'Sleep Reminder':
        return <Moon className="w-4 h-4 text-[#972828] dark:text-[#FCAD38]" />;
      case 'Morning Reminder':
        return <Sun className="w-4 h-4 text-[#FCAD38]" />;
      case 'Upcoming Task':
      default:
        return <Bell className="w-4 h-4 text-[#E45742]" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#161820] h-full border-l border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 flex flex-col justify-between shadow-2xl">
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                Reminders & Notifications
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Smart alerts for tasks, meals, sleep, and morning briefings
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onMarkAllRead}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-[#972828] flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400">
                You’re all caught up! No active notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-colors ${
                    !n.read
                      ? 'border-[#E45742]/40 bg-[#972828]/4 dark:bg-[#972828]/15'
                      : 'border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                        {getIcon(n.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white">
                            {n.title}
                          </span>
                          <span className="text-[11px] font-mono text-neutral-400">
                            · {n.timeLabel}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                          “{n.message}”
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDismissNotification(n.id)}
                      className="text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
