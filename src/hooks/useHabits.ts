import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  Habit, HabitLog, WaterLog, MealLog, MoodLog, Reminder, HabitNote,
  Weekday, HabitType, TrackingMode, ScheduleType, TimeOfDay,
  HABIT_ICONS, HABIT_CATEGORIES,
} from '../types';
import { format, subDays, startOfWeek, addDays, differenceInCalendarDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const SEED_HABITS: Habit[] = [
  {
    id: 'seed-1', name: 'Morning meditation', description: '10 minutes of mindful breathing',
    timeOfDay: 'morning', activeDays: [0, 1, 2, 3, 4, 5, 6] as Weekday[],
    color: '#8b5cf6', icon: '🧘', category: 'Mind', type: 'positive',
    trackingMode: 'timer', targetDuration: 10, scheduleType: 'daily',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    archived: false, order: 0,
  },
  {
    id: 'seed-2', name: 'Evening journal', description: 'Write 3 things you are grateful for',
    timeOfDay: 'evening', activeDays: [0, 1, 2, 3, 4, 5, 6] as Weekday[],
    color: '#f43f5e', icon: '✍️', category: 'Mind', type: 'positive',
    trackingMode: 'binary', scheduleType: 'daily',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    archived: false, order: 1,
  },
  {
    id: 'seed-3', name: 'Read 20 pages', description: 'Read a book for at least 20 pages',
    timeOfDay: 'evening', activeDays: [1, 2, 3, 4, 5] as Weekday[],
    color: '#0ea5e9', icon: '📚', category: 'Learning', type: 'positive',
    trackingMode: 'count', targetCount: 20, scheduleType: 'daily',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    archived: false, order: 2,
  },
  {
    id: 'seed-4', name: 'Exercise', description: '30 minutes of any physical activity',
    timeOfDay: 'morning', activeDays: [1, 3, 5] as Weekday[],
    color: '#10b981', icon: '💪', category: 'Fitness', type: 'positive',
    trackingMode: 'timer', targetDuration: 30, scheduleType: 'daily',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    archived: false, order: 3,
  },
  {
    id: 'seed-5', name: 'No social media', description: 'Avoid social media after 9 PM',
    timeOfDay: 'evening', activeDays: [0, 1, 2, 3, 4, 5, 6] as Weekday[],
    color: '#64748b', icon: '📱', category: 'Mind', type: 'negative',
    trackingMode: 'binary', scheduleType: 'daily',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    archived: false, order: 4,
  },
];

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash % 100) / 100;
}

function generateSeedLogs(habits: Habit[]): HabitLog[] {
  const logs: HabitLog[] = [];
  const today = new Date();
  habits.forEach(habit => {
    for (let i = 1; i <= 30; i++) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOfWeek = date.getDay() as Weekday;
      if (isHabitActiveOnDateStatic(habit, date)) {
        const rand = seededRandom(`${habit.id}-${dateStr}`);
        if (rand < 0.65) {
          const log: HabitLog = { habitId: habit.id, date: dateStr, completed: true };
          if (habit.trackingMode === 'count' && habit.targetCount) {
            log.count = Math.floor(habit.targetCount * (0.5 + rand * 0.5));
          } else if (habit.trackingMode === 'timer' && habit.targetDuration) {
            log.duration = Math.floor(habit.targetDuration * (0.5 + rand * 0.5));
          }
          logs.push(log);
        }
      }
    }
  });
  return logs;
}

function isHabitActiveOnDateStatic(habit: Habit, date: Date): boolean {
  const dayOfWeek = date.getDay() as Weekday;
  if (!habit.activeDays.includes(dayOfWeek)) return false;
  if (habit.scheduleType === 'custom' && habit.scheduleInterval) {
    const daysSinceCreation = differenceInCalendarDays(date, new Date(habit.createdAt));
    return daysSinceCreation >= 0 && daysSinceCreation % habit.scheduleInterval === 0;
  }
  return true;
}

export function useHabits() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('kindling-habits', SEED_HABITS);
  const [logs, setLogs] = useLocalStorage<HabitLog[]>('kindling-logs', generateSeedLogs(SEED_HABITS));
  const [waterLogs, setWaterLogs] = useLocalStorage<WaterLog[]>('kindling-water', []);
  const [mealLogs, setMealLogs] = useLocalStorage<MealLog[]>('kindling-meals', []);
  const [moodLogs, setMoodLogs] = useLocalStorage<MoodLog[]>('kindling-moods', []);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('kindling-reminders', []);
  const [notes, setNotes] = useLocalStorage<HabitNote[]>('kindling-notes', []);
  const [deletedHabit, setDeletedHabit] = useState<Habit | null>(null);
  const [lastAction, setLastAction] = useState<{ type: string; data: any } | null>(null);

  // ===== HABITS =====
  const toggleHabit = useCallback((habitId: string, date: string) => {
    setLogs(prev => {
      const existing = prev.find(l => l.habitId === habitId && l.date === date);
      if (existing) {
        const wasCompleted = existing.completed;
        setLastAction({ type: 'toggle', data: { habitId, date, wasCompleted } });
        return prev.map(l =>
          l.habitId === habitId && l.date === date
            ? { ...l, completed: !l.completed }
            : l
        );
      }
      setLastAction({ type: 'toggle', data: { habitId, date, wasCompleted: false } });
      return [...prev, { habitId, date, completed: true }];
    });
  }, []);

  const updateLogCount = useCallback((habitId: string, date: string, count: number) => {
    setLogs(prev => {
      const existing = prev.find(l => l.habitId === habitId && l.date === date);
      if (existing) {
        return prev.map(l =>
          l.habitId === habitId && l.date === date
            ? { ...l, count, completed: count > 0 }
            : l
        );
      }
      return [...prev, { habitId, date, completed: true, count }];
    });
  }, []);

  const updateLogDuration = useCallback((habitId: string, date: string, duration: number) => {
    setLogs(prev => {
      const existing = prev.find(l => l.habitId === habitId && l.date === date);
      if (existing) {
        return prev.map(l =>
          l.habitId === habitId && l.date === date
            ? { ...l, duration, completed: duration > 0 }
            : l
        );
      }
      return [...prev, { habitId, date, completed: true, duration }];
    });
  }, []);

  const isHabitCompleted = useCallback((habitId: string, date: string): boolean => {
    const log = logs.find(l => l.habitId === habitId && l.date === date);
    return log?.completed ?? false;
  }, [logs]);

  const getLogForDate = useCallback((habitId: string, date: string): HabitLog | undefined => {
    return logs.find(l => l.habitId === habitId && l.date === date);
  }, [logs]);

  const isHabitActiveOnDate = useCallback((habit: Habit, date: Date): boolean => {
    return isHabitActiveOnDateStatic(habit, date);
  }, []);

  // Habit strength score (Loop-style) - decays when skipped
  const getHabitStrength = useCallback((habitId: string): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;
    let strength = 0;
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const active = isHabitActiveOnDate(habit, date);
      if (active) {
        if (isHabitCompleted(habitId, dateStr)) {
          strength = Math.min(100, strength + (100 - strength) * 0.05);
        } else {
          strength = strength * 0.95;
        }
      }
    }
    return Math.round(strength);
  }, [habits, logs, isHabitCompleted, isHabitActiveOnDate]);

  const getStreak = useCallback((habitId: string): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;
    let streak = 0;
    let currentDate = new Date();
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    const todayCompleted = isHabitCompleted(habitId, todayStr);
    const todayActive = isHabitActiveOnDate(habit, currentDate);
    if (todayActive && !todayCompleted) {
      currentDate = subDays(currentDate, 1);
    }
    for (let i = 0; i < 365; i++) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const active = isHabitActiveOnDate(habit, currentDate);
      if (active) {
        if (isHabitCompleted(habitId, dateStr)) {
          streak++;
        } else {
          break;
        }
      }
      currentDate = subDays(currentDate, 1);
    }
    return streak;
  }, [habits, logs, isHabitCompleted, isHabitActiveOnDate]);

  const getBestStreak = useCallback((habitId: string): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;
    let bestStreak = 0;
    let currentStreak = 0;
    const today = new Date();
    for (let i = 90; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const active = isHabitActiveOnDate(habit, date);
      if (active) {
        if (isHabitCompleted(habitId, dateStr)) {
          currentStreak++;
          bestStreak = Math.max(bestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
    }
    return bestStreak;
  }, [habits, logs, isHabitCompleted, isHabitActiveOnDate]);

  const getCompletionRate = useCallback((habitId: string, days: number = 30): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;
    let activeDays = 0;
    let completedDays = 0;
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const active = isHabitActiveOnDate(habit, date);
      if (active) {
        activeDays++;
        if (isHabitCompleted(habitId, dateStr)) completedDays++;
      }
    }
    return activeDays > 0 ? Math.round((completedDays / activeDays) * 100) : 0;
  }, [habits, logs, isHabitCompleted, isHabitActiveOnDate]);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt' | 'archived' | 'order'>) => {
    const maxOrder = Math.max(0, ...habits.filter(h => !h.archived).map(h => h.order));
    const newHabit: Habit = {
      ...habit,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      archived: false,
      order: maxOrder + 1,
    };
    setHabits(prev => [...prev, newHabit]);
    return newHabit;
  }, [habits, setHabits]);

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  }, [setHabits]);

  const deleteHabit = useCallback((id: string) => {
    const habit = habits.find(h => h.id === id);
    if (habit) {
      setDeletedHabit(habit);
      setHabits(prev => prev.filter(h => h.id !== id));
      setLogs(prev => prev.filter(l => l.habitId !== id));
      setReminders(prev => prev.filter(r => r.habitId !== id));
      setNotes(prev => prev.filter(n => n.habitId !== id));
    }
  }, [habits, setHabits, setLogs, setReminders, setNotes]);

  const archiveHabit = useCallback((id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, archived: true } : h));
  }, [setHabits]);

  const unarchiveHabit = useCallback((id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, archived: false } : h));
  }, [setHabits]);

  const reorderHabits = useCallback((fromIndex: number, toIndex: number) => {
    setHabits(prev => {
      const active = prev.filter(h => !h.archived).sort((a, b) => a.order - b.order);
      const [moved] = active.splice(fromIndex, 1);
      active.splice(toIndex, 0, moved);
      const archived = prev.filter(h => h.archived);
      const reordered = active.map((h, i) => ({ ...h, order: i }));
      return [...reordered, ...archived];
    });
  }, [setHabits]);

  const undoDelete = useCallback(() => {
    if (deletedHabit) {
      setHabits(prev => [...prev, deletedHabit]);
      setDeletedHabit(null);
    }
  }, [deletedHabit, setHabits]);

  const undoLastAction = useCallback(() => {
    if (lastAction?.type === 'toggle') {
      const { habitId, date, wasCompleted } = lastAction.data;
      setLogs(prev => prev.map(l =>
        l.habitId === habitId && l.date === date
          ? { ...l, completed: wasCompleted }
          : l
      ));
      setLastAction(null);
    }
  }, [lastAction, setLogs]);

  // ===== NOTES =====
  const addNote = useCallback((habitId: string, date: string, content: string) => {
    const note: HabitNote = {
      id: uuidv4(), habitId, date, content,
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [...prev, note]);
  }, [setNotes]);

  const getNotesForHabitDate = useCallback((habitId: string, date: string): HabitNote[] => {
    return notes.filter(n => n.habitId === habitId && n.date === date);
  }, [notes]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, [setNotes]);

  // ===== WATER =====
  const getWaterForDate = useCallback((date: string): number => {
    const log = waterLogs.find(l => l.date === date);
    return log?.glasses ?? 0;
  }, [waterLogs]);

  const addWater = useCallback((date: string) => {
    setWaterLogs(prev => {
      const existing = prev.find(l => l.date === date);
      if (existing) return prev.map(l => l.date === date ? { ...l, glasses: l.glasses + 1 } : l);
      return [...prev, { date, glasses: 1 }];
    });
  }, [setWaterLogs]);

  const removeWater = useCallback((date: string) => {
    setWaterLogs(prev => {
      const existing = prev.find(l => l.date === date);
      if (existing && existing.glasses > 0) {
        return prev.map(l => l.date === date ? { ...l, glasses: l.glasses - 1 } : l);
      }
      return prev;
    });
  }, [setWaterLogs]);

  // ===== MEALS =====
  const getMealsForDate = useCallback((date: string) => {
    const log = mealLogs.find(l => l.date === date);
    return log?.meals ?? { breakfast: false, lunch: false, dinner: false, snack: false };
  }, [mealLogs]);

  const toggleMeal = useCallback((date: string, meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setMealLogs(prev => {
      const existing = prev.find(l => l.date === date);
      if (existing) {
        return prev.map(l => l.date === date ? {
          ...l, meals: { ...l.meals, [meal]: !l.meals[meal] }
        } : l);
      }
      return [...prev, { date, meals: { breakfast: false, lunch: false, dinner: false, snack: false, [meal]: true } }];
    });
  }, [setMealLogs]);

  // ===== MOOD =====
  const getMoodForDate = useCallback((date: string): MoodLog | undefined => {
    return moodLogs.find(l => l.date === date);
  }, [moodLogs]);

  const setMood = useCallback((date: string, mood: 1 | 2 | 3 | 4 | 5, note?: string) => {
    setMoodLogs(prev => {
      const existing = prev.find(l => l.date === date);
      if (existing) {
        return prev.map(l => l.date === date ? { ...l, mood, note } : l);
      }
      return [...prev, { date, mood, note }];
    });
  }, [setMoodLogs]);

  // ===== REMINDERS =====
  const addReminder = useCallback((reminder: Omit<Reminder, 'id'>) => {
    const newReminder: Reminder = { ...reminder, id: uuidv4() };
    setReminders(prev => [...prev, newReminder]);
    return newReminder;
  }, [setReminders]);

  const toggleReminder = useCallback((id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, [setReminders]);

  const deleteReminder = useCallback((id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  }, [setReminders]);

  // ===== TODAY'S PROGRESS =====
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const activeHabits = habits.filter(h => !h.archived);
  const todayActiveHabits = activeHabits.filter(h => isHabitActiveOnDate(h, new Date()));
  const todayCompletedHabits = todayActiveHabits.filter(h => isHabitCompleted(h.id, todayStr));
  const todayProgress = todayActiveHabits.length > 0
    ? Math.round((todayCompletedHabits.length / todayActiveHabits.length) * 100)
    : 0;

  // Week data
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Categories
  const categories = Array.from(new Set(activeHabits.map(h => h.category)));

  return {
    habits, activeHabits, logs, waterLogs, mealLogs, moodLogs, reminders, notes,
    deletedHabit, lastAction, todayProgress, todayActiveHabits, todayCompletedHabits,
    weekDays, todayStr, categories,
    toggleHabit, updateLogCount, updateLogDuration, isHabitCompleted, getLogForDate,
    isHabitActiveOnDate, getStreak, getBestStreak, getCompletionRate, getHabitStrength,
    addHabit, updateHabit, deleteHabit, archiveHabit, unarchiveHabit, reorderHabits,
    undoDelete, undoLastAction,
    addNote, getNotesForHabitDate, deleteNote,
    getWaterForDate, addWater, removeWater,
    getMealsForDate, toggleMeal,
    getMoodForDate, setMood,
    addReminder, toggleReminder, deleteReminder,
  };
}
