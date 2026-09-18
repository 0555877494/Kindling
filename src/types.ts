export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type HabitType = 'positive' | 'negative';
export type TrackingMode = 'binary' | 'count' | 'timer';
export type ScheduleType = 'daily' | 'weekly' | 'custom';
export type Theme = 'default' | 'forest' | 'ocean' | 'cosmic' | 'sunset';
export type ChallengeStatus = 'active' | 'completed' | 'failed';

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
  xpReward?: number; // XP earned per completion
  comboId?: string; // For habit combos
  gardenPlant?: string; // Plant type for garden
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

// Gamification types
export interface UserStats {
  totalXp: number;
  level: number;
  streakShields: number;
  achievements: Achievement[];
  challengesCompleted: number;
  habitsFormed: number;
  consistencyScore: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  targetDays: number;
  habitIds: string[];
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  xpReward: number;
  badgeIcon?: string;
}

export interface StreakShield {
  id: string;
  earnedAt: string;
  usedForDate?: string;
  habitId?: string;
}

// Garden types
export interface GardenPlant {
  habitId: string;
  plantType: string;
  growthStage: number; // 0-5
  lastWatered: string;
  health: number; // 0-100
}

// Time Capsule
export interface TimeCapsule {
  id: string;
  message: string;
  createdAt: string;
  openAt: string;
  opened: boolean;
}

// Reflections
export interface Reflection {
  id: string;
  date: string;
  type: 'weekly' | 'monthly';
  content: string;
  mood?: number;
  createdAt: string;
}

// Achievement definitions
export const ACHIEVEMENTS = [
  { id: 'first-habit', name: 'First Step', description: 'Create your first habit', icon: '🌱', rarity: 'common' as const },
  { id: 'first-streak-7', name: 'Week Warrior', description: '7-day streak on any habit', icon: '🔥', rarity: 'common' as const },
  { id: 'first-streak-30', name: 'Monthly Master', description: '30-day streak on any habit', icon: '⭐', rarity: 'rare' as const },
  { id: 'first-streak-100', name: 'Centurion', description: '100-day streak on any habit', icon: '💎', rarity: 'epic' as const },
  { id: 'first-streak-365', name: 'Year Legend', description: '365-day streak on any habit', icon: '👑', rarity: 'legendary' as const },
  { id: 'complete-10', name: 'Getting Started', description: 'Complete 10 habits total', icon: '✓', rarity: 'common' as const },
  { id: 'complete-100', name: 'Habit Hero', description: 'Complete 100 habits total', icon: '🏆', rarity: 'rare' as const },
  { id: 'complete-1000', name: 'Thousand Strong', description: 'Complete 1,000 habits total', icon: '🎖️', rarity: 'epic' as const },
  { id: 'level-5', name: 'Rising Star', description: 'Reach level 5', icon: '🌟', rarity: 'common' as const },
  { id: 'level-10', name: 'Habit Master', description: 'Reach level 10', icon: '🎯', rarity: 'rare' as const },
  { id: 'level-25', name: 'Grand Master', description: 'Reach level 25', icon: '🏅', rarity: 'epic' as const },
  { id: 'perfect-week', name: 'Perfect Week', description: 'Complete all habits for 7 days', icon: '✨', rarity: 'rare' as const },
  { id: 'early-bird', name: 'Early Bird', description: 'Complete 10 morning habits before 8 AM', icon: '🌅', rarity: 'common' as const },
  { id: 'night-owl', name: 'Night Owl', description: 'Complete 10 evening habits after 9 PM', icon: '🦉', rarity: 'common' as const },
  { id: 'multi-habit', name: 'Multi-Tasker', description: 'Track 5+ habits simultaneously', icon: '🎪', rarity: 'common' as const },
];

// Garden plant types
export const GARDEN_PLANTS = [
  { type: 'sunflower', stages: ['🌱', '🌿', '🌻', '🌻', '🌻', '🌻'] },
  { type: 'rose', stages: ['🌱', '🌿', '🌹', '🌹', '🌹', '🌹'] },
  { type: 'tulip', stages: ['🌱', '🌿', '🌷', '🌷', '🌷', '🌷'] },
  { type: 'cherry', stages: ['🌱', '🌿', '🌸', '🌸', '🌸', '🌸'] },
  { type: 'cactus', stages: ['🌱', '🌵', '🌵', '🌵', '🌵', '🌵'] },
  { type: 'bamboo', stages: ['🌱', '🎋', '🎋', '🎋', '🎋', '🎋'] },
  { type: 'tree', stages: ['🌱', '🌲', '🌳', '🌳', '🌳', '🌳'] },
  { type: 'mushroom', stages: ['🌱', '🍄', '🍄', '🍄', '🍄', '🍄'] },
];

// Theme definitions
export const THEMES: Record<Theme, { name: string; bg: string; accent: string; unlockLevel: number }> = {
  default: { name: 'Kindling', bg: 'from-amber-50 via-orange-50 to-rose-50', accent: 'orange', unlockLevel: 0 },
  forest: { name: 'Forest', bg: 'from-emerald-50 via-green-50 to-teal-50', accent: 'emerald', unlockLevel: 5 },
  ocean: { name: 'Ocean', bg: 'from-sky-50 via-blue-50 to-indigo-50', accent: 'sky', unlockLevel: 10 },
  cosmic: { name: 'Cosmic', bg: 'from-purple-50 via-violet-50 to-fuchsia-50', accent: 'purple', unlockLevel: 15 },
  sunset: { name: 'Sunset', bg: 'from-rose-50 via-pink-50 to-orange-50', accent: 'rose', unlockLevel: 20 },
};

// Habit science tips
export const HABIT_TIPS = [
  "Habits take an average of 66 days to form, not 21!",
  "Start tiny: make your habit so small you can't say no.",
  "Habit stacking: attach new habits to existing ones.",
  "Environment design beats willpower every time.",
  "Missing one day won't kill your streak. Missing two might.",
  "Identity-based habits stick: 'I am a runner' vs 'I want to run'.",
  "The 2-minute rule: scale any habit down to 2 minutes to start.",
  "Never miss twice in a row. One mistake is an accident, two is a pattern.",
  "Make it obvious, attractive, easy, and satisfying.",
  "Track your habits visually - seeing progress is motivating!",
  "Morning habits set the tone for your entire day.",
  "Reward yourself immediately after completing a habit.",
  "Accountability partners increase success by 65%.",
  "Focus on consistency, not intensity.",
  "Your environment shapes your habits more than your goals.",
];

// Motivational moments
export const KINDLING_MOMENTS = [
  "Every small step is a spark that fuels your fire 🔥",
  "You're building the person you want to become",
  "Consistency beats intensity every time",
  "The best time to start was yesterday. The second best time is now",
  "You don't have to be extreme, just consistent",
  "Small daily improvements lead to stunning results",
  "You're not just building habits, you're building a life",
  "Progress, not perfection",
  "Every completion is a vote for your future self",
  "The flame you're kindling today will light your tomorrow",
  "One day at a time, one habit at a time",
  "Your future self will thank you for today's efforts",
  "The compound effect of small habits is extraordinary",
  "You're stronger than your excuses",
  "Discipline is choosing between what you want now and what you want most",
];

// Challenge templates
export const CHALLENGE_TEMPLATES = [
  { name: '7-Day Mindfulness', icon: '🧘', days: 7, description: 'Meditate every day for a week', category: 'Mind' },
  { name: '21-Day Fitness', icon: '💪', days: 21, description: 'Build an exercise habit', category: 'Fitness' },
  { name: '30-Day Reading', icon: '📚', days: 30, description: 'Read every day for a month', category: 'Learning' },
  { name: 'Hydration Hero', icon: '💧', days: 14, description: 'Drink 8 glasses daily', category: 'Health' },
  { name: 'Early Bird', icon: '🌅', days: 21, description: 'Wake up before 7 AM', category: 'Health' },
  { name: 'Gratitude Journal', icon: '✍️', days: 30, description: 'Write 3 things you\'re grateful for', category: 'Mind' },
];

// Habit DNA types
export type HabitDNA = 'Morning Champion' | 'Night Owl' | 'Consistent Warrior' | 'Weekend Hero' | 'Balanced Achiever';

// Sound options
export type SoundType = 'default' | 'chime' | 'bell' | 'pop' | 'success' | 'none';

export const SOUND_OPTIONS: Record<SoundType, { name: string; icon: string }> = {
  default: { name: 'Default', icon: '🔔' },
  chime: { name: 'Chime', icon: '🎵' },
  bell: { name: 'Bell', icon: '🔔' },
  pop: { name: 'Pop', icon: '💥' },
  success: { name: 'Success', icon: '✨' },
  none: { name: 'Silent', icon: '🔇' },
};

// Habit stacking
export interface HabitStack {
  id: string;
  name: string;
  habits: string[]; // habit IDs in order
  createdAt: string;
}

// Streak recovery
export interface StreakRecovery {
  habitId: string;
  brokenAt: string;
  recoveredAt?: string;
  message: string;
}

// Habit correlations
export interface HabitCorrelation {
  habitId1: string;
  habitId2: string;
  correlation: number; // -1 to 1
  strength: 'weak' | 'moderate' | 'strong';
}

// Adaptive difficulty
export interface AdaptiveSettings {
  enabled: boolean;
  adjustmentRate: number; // 0.1 = 10% adjustment
  minTarget: number;
  maxTarget: number;
}

export const MOOD_EMOJIS = ['😢', '😕', '😐', '😊', '😄'];
export const MOOD_LABELS = ['Terrible', 'Bad', 'Okay', 'Good', 'Amazing'];
