export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type HabitType = 'positive' | 'negative';
export type TrackingMode = 'binary' | 'count' | 'timer';
export type ScheduleType = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  name: string;
  description: string;
  timeOfDay: TimeOfDay;
  activeDays: Weekday[];
  color: string;
  icon: string;
  category: string;
  type: HabitType;
  trackingMode: TrackingMode;
  targetCount?: number; // For count mode
  targetDuration?: number; // For timer mode (minutes)
  scheduleType: ScheduleType;
  scheduleInterval?: number; // For "every X days"
  createdAt: string;
  archived: boolean;
  order: number;
}

export interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
  count?: number; // For count mode
  duration?: number; // For timer mode (minutes)
  note?: string;
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

export interface MoodLog {
  date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  note?: string;
}

export interface Reminder {
  id: string;
  habitId: string;
  time: string;
  enabled: boolean;
  message: string;
  location?: string;
}

export interface HabitNote {
  id: string;
  habitId: string;
  date: string;
  content: string;
  createdAt: string;
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

export const HABIT_ICONS = [
  '🎯', '💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '✍️', '🎨',
  '🎵', '🧠', '💊', '🚶', '🧹', '📱', '🌱', '☀️', '🌙', '⭐',
  '🔥', '💎', '🎁', '🏆', '🎪', '🎭', '🎮', '🎸', '📷', '🚴',
  '🧗', '🏊', '⛷️', '🎿', '🏄', '🚣', '🏋️', '🤸', '⚽', '🏀',
  '🎾', '🏐', '🏈', '⚾', '🥊', '🤺', '🏓', '🏸', '🎳', '🎯'
];

export const HABIT_CATEGORIES = [
  'Health', 'Mind', 'Work', 'Fitness', 'Learning', 'Social', 'Creative', 'Finance', 'Home', 'Other'
];

export const HABIT_TEMPLATES = [
  { name: 'Morning meditation', icon: '🧘', category: 'Mind', description: '10 minutes of mindful breathing', timeOfDay: 'morning' as TimeOfDay },
  { name: 'Drink water', icon: '💧', category: 'Health', description: '8 glasses of water daily', timeOfDay: 'anytime' as TimeOfDay },
  { name: 'Exercise', icon: '💪', category: 'Fitness', description: '30 minutes of physical activity', timeOfDay: 'morning' as TimeOfDay },
  { name: 'Read', icon: '📚', category: 'Learning', description: 'Read for 20 minutes', timeOfDay: 'evening' as TimeOfDay },
  { name: 'Journal', icon: '✍️', category: 'Mind', description: 'Write in journal', timeOfDay: 'evening' as TimeOfDay },
  { name: 'No social media', icon: '📱', category: 'Mind', description: 'Avoid social media', timeOfDay: 'evening' as TimeOfDay, type: 'negative' as HabitType },
  { name: 'Sleep 8 hours', icon: '😴', category: 'Health', description: 'Get 8 hours of sleep', timeOfDay: 'evening' as TimeOfDay },
  { name: 'Walk 10k steps', icon: '🚶', category: 'Fitness', description: 'Walk 10,000 steps', timeOfDay: 'anytime' as TimeOfDay },
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

export const MOOD_EMOJIS = ['😢', '😕', '😐', '😊', '😄'];
export const MOOD_LABELS = ['Terrible', 'Bad', 'Okay', 'Good', 'Amazing'];
