export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Habit {
  id: string;
  name: string;
  description: string;
  timeOfDay: TimeOfDay;
  activeDays: Weekday[];
  color: string;
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface WaterLog {
  date: string;
  glasses: number;
}

export interface MealLog {
  date: string;
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snack: boolean;
  };
}

export interface Reminder {
  id: string;
  habitId: string;
  time: string; // HH:MM
  enabled: boolean;
  message: string;
}

export const HABIT_COLORS = [
  { name: 'Rose', value: '#f43f5e', bg: '#fff1f2' },
  { name: 'Orange', value: '#f97316', bg: '#fff7ed' },
  { name: 'Amber', value: '#f59e0b', bg: '#fffbeb' },
  { name: 'Emerald', value: '#10b981', bg: '#ecfdf5' },
  { name: 'Teal', value: '#14b8a6', bg: '#f0fdfa' },
  { name: 'Sky', value: '#0ea5e9', bg: '#f0f9ff' },
  { name: 'Violet', value: '#8b5cf6', bg: '#f5f3ff' },
  { name: 'Pink', value: '#ec4899', bg: '#fdf2f8' },
  { name: 'Slate', value: '#64748b', bg: '#f8fafc' },
];

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  anytime: 'Anytime',
};

export const TIME_OF_DAY_ICONS: Record<TimeOfDay, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌙',
  anytime: '✨',
};

export const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
