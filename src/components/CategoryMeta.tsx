import React from 'react';
import {
  BookOpen,
  Briefcase,
  Dumbbell,
  Heart,
  Home,
  Lightbulb,
  ShoppingBag,
  Users,
  Utensils,
} from 'lucide-react';
import { TaskCategory, TaskPriority, TaskStatus } from '../types/todo';

export function getCategoryIcon(
  category: TaskCategory,
  className: string = 'w-4 h-4'
): React.ReactNode {
  switch (category) {
    case 'Study':
      return <BookOpen className={className} />;
    case 'Work':
      return <Briefcase className={className} />;
    case 'Personal':
      return <Home className={className} />;
    case 'Health':
      return <Heart className={className} />;
    case 'Exercise':
      return <Dumbbell className={className} />;
    case 'Food':
      return <Utensils className={className} />;
    case 'Family':
      return <Users className={className} />;
    case 'Shopping':
      return <ShoppingBag className={className} />;
    case 'Other':
    default:
      return <Lightbulb className={className} />;
  }
}

export function getCategoryAccentColor(category: TaskCategory): {
  iconBg: string;
  iconText: string;
  accentBar: string;
} {
  switch (category) {
    case 'Study':
      return {
        iconBg: 'bg-[#972828]/10 dark:bg-[#972828]/25',
        iconText: 'text-[#972828] dark:text-[#E45742]',
        accentBar: 'bg-[#972828]',
      };
    case 'Work':
      return {
        iconBg: 'bg-[#E45742]/10 dark:bg-[#E45742]/20',
        iconText: 'text-[#E45742]',
        accentBar: 'bg-[#E45742]',
      };
    case 'Exercise':
      return {
        iconBg: 'bg-[#EB7F31]/12 dark:bg-[#EB7F31]/20',
        iconText: 'text-[#D96B1B] dark:text-[#EB7F31]',
        accentBar: 'bg-[#EB7F31]',
      };
    case 'Food':
      return {
        iconBg: 'bg-[#FCAD38]/15 dark:bg-[#FCAD38]/20',
        iconText: 'text-[#B87309] dark:text-[#FCAD38]',
        accentBar: 'bg-[#FCAD38]',
      };
    case 'Health':
      return {
        iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
        iconText: 'text-rose-700 dark:text-rose-400',
        accentBar: 'bg-rose-600',
      };
    case 'Personal':
      return {
        iconBg: 'bg-amber-600/10 dark:bg-amber-500/20',
        iconText: 'text-amber-800 dark:text-amber-300',
        accentBar: 'bg-amber-600',
      };
    case 'Family':
      return {
        iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
        iconText: 'text-orange-700 dark:text-orange-300',
        accentBar: 'bg-orange-500',
      };
    case 'Shopping':
      return {
        iconBg: 'bg-emerald-600/10 dark:bg-emerald-500/20',
        iconText: 'text-emerald-700 dark:text-emerald-400',
        accentBar: 'bg-emerald-600',
      };
    case 'Other':
    default:
      return {
        iconBg: 'bg-neutral-500/10 dark:bg-neutral-400/15',
        iconText: 'text-neutral-700 dark:text-neutral-300',
        accentBar: 'bg-neutral-500',
      };
  }
}

export function getPriorityTextColor(priority: TaskPriority): string {
  switch (priority) {
    case 'Urgent':
      return 'text-[#972828] dark:text-[#E45742] font-semibold';
    case 'High':
      return 'text-[#E45742] dark:text-[#EB7F31] font-medium';
    case 'Medium':
      return 'text-neutral-600 dark:text-neutral-400';
    case 'Low':
    default:
      return 'text-neutral-400 dark:text-neutral-500';
  }
}

export function getStatusLabelStyle(status: TaskStatus): {
  text: string;
  label: string;
} {
  switch (status) {
    case 'Completed':
      return {
        text: 'text-emerald-700 dark:text-emerald-400 font-medium',
        label: 'Completed',
      };
    case 'In Progress':
      return {
        text: 'text-[#EB7F31] dark:text-[#FCAD38] font-medium',
        label: 'In Progress',
      };
    case 'Skipped':
      return {
        text: 'text-neutral-400 dark:text-neutral-500 line-through',
        label: 'Skipped',
      };
    case 'Pending':
    default:
      return {
        text: 'text-neutral-500 dark:text-neutral-400',
        label: 'Pending',
      };
  }
}
