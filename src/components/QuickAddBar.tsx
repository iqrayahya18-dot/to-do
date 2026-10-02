import React, { useState } from 'react';
import { Calendar, Clock, Plus, SlidersHorizontal, Zap } from 'lucide-react';
import { Task } from '../types/todo';
import {
  formatDisplayDate,
  formatTime12h,
  parseQuickAdd,
} from '../utils/dateAndParser';
import { getCategoryIcon } from './CategoryMeta';

interface QuickAddBarProps {
  selectedDateISO: string;
  onQuickCreateTask: (task: Task) => void;
  onOpenFullModalWithDraft: (draft: Partial<Task>) => void;
}

const EXAMPLE_PROMPTS = [
  'Study at 7 PM tomorrow',
  'Complete Mathematics Assignment at 4 PM high priority',
  'Exercise at 6:30 AM daily',
  'Buy groceries at 6 PM Saturday',
];

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  selectedDateISO,
  onQuickCreateTask,
  onOpenFullModalWithDraft,
}) => {
  const [input, setInput] = useState('');

  const parsed = input.trim()
    ? parseQuickAdd(input, selectedDateISO)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsed) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: parsed.title,
      date: parsed.date,
      startTime: parsed.startTime,
      dayOfWeek: parsed.dayOfWeek,
      repeat: parsed.repeat,
      category: parsed.category,
      priority: parsed.priority,
      reminder: '15 minutes before',
      notes: '',
      subtasks: [],
      status: 'Pending',
      createdAt: selectedDateISO,
    };

    onQuickCreateTask(newTask);
    setInput('');
  };

  return (
    <div className="bg-white dark:bg-[#171921] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-3.5 sm:p-4 shadow-xs transition-colors">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#972828]/10 dark:bg-[#972828]/25 text-[#972828] dark:text-[#E45742] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Quick Add: Try "Study at 7 PM tomorrow" or "Exercise at 6 AM daily"...'
            className="flex-1 bg-transparent text-sm sm:text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none min-w-0"
            aria-label="Quick add task natural language input"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            {input.trim().length > 0 && parsed && (
              <button
                type="button"
                onClick={() => {
                  onOpenFullModalWithDraft({
                    title: parsed.title,
                    date: parsed.date,
                    startTime: parsed.startTime,
                    dayOfWeek: parsed.dayOfWeek,
                    repeat: parsed.repeat,
                    category: parsed.category,
                    priority: parsed.priority,
                  });
                  setInput('');
                }}
                className="min-h-[40px] px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap"
                title="Customize all task options"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Options</span>
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim()}
              className="min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#972828] hover:bg-[#7e2020] disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Add</span>
            </button>
          </div>
        </div>

        {/* Live Smart Detection Strip */}
        {parsed ? (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-600 dark:text-neutral-400">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-[#972828] dark:text-[#E45742]">
                Smart Detect:
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                “{parsed.title}”
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Calendar className="w-3.5 h-3.5 text-[#E45742]" />
                {parsed.dayOfWeek}, {formatDisplayDate(parsed.date)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[#EB7F31]" />
                {formatTime12h(parsed.startTime)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                {getCategoryIcon(parsed.category, 'w-3.5 h-3.5 text-[#972828] dark:text-[#FCAD38]')}
                {parsed.category}
              </span>
              <span aria-hidden="true">·</span>
              <span>{parsed.priority} Priority</span>
              {parsed.repeat !== 'Does not repeat' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#972828] dark:text-[#FCAD38] font-medium">
                    Repeats {parsed.repeat}
                  </span>
                </>
              )}
            </div>
            <span className="text-[11px] text-neutral-400">
              Press Enter to schedule
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="shrink-0 text-neutral-400 dark:text-neutral-500">
              Try:
            </span>
            {EXAMPLE_PROMPTS.map((sample, idx) => (
              <React.Fragment key={sample}>
                {idx > 0 && <span aria-hidden="true">·</span>}
                <button
                  type="button"
                  onClick={() => setInput(sample)}
                  className="hover:text-[#972828] dark:hover:text-[#FCAD38] transition-colors whitespace-nowrap cursor-pointer text-left"
                >
                  “{sample}”
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};
