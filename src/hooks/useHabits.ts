import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Habit, HabitLog, WaterLog, MealLog, Reminder, Weekday } from '../types';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const SEED_HABITS: Habit[] = [
  {
    id: 'seed-1',
    name: 'Morning meditation',
    description: '10 minutes of mindful breathing',
    timeOfDay: 'morning',
    activeDays: [0, 1, 2, 3, 4, 5, 6] as Weekday[],
    color: '#8b5cf6',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-2',
    name: 'Evening journal',
    description: 'Write 3 things you are grateful for',
    timeOfDay: 'evening',
    activeDays: [0, 1, 2, 3, 4, 5, 6] as Weekday[],
    color: '#f43f5e',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-3',
    name: 'Read 20 pages',
    description: 'Read a book for at least 20 pages',
    timeOfDay: 'evening',
    activeDays: [1, 2, 3, 4, 5] as Weekday[],
    color: '#0ea5e9',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'seed-4',
    name: 'Exercise',
    description: '30 minutes of any physical activity',
    timeOfDay: 'morning',
    activeDays: [1, 3, 5] as Weekday[],
    color: '#10b981',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
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
      
      if (habit.activeDays.includes(dayOfWeek)) {
        const rand = seededRandom(`${habit.id}-${dateStr}`);
        // ~65% completion rate for seed data
        if (rand < 0.65) {
          logs.push({ habitId: habit.id, date: dateStr, completed: true });
        }
      }
    }
  });
  
  return logs;
}

export function useHabits() {
  // Initialize with seed data if no data exists in localStorage
  const [habits, setHabits] = useLocalStorage<Habit[]>('kindling-habits', SEED_HABITS);
  const [logs, setLogs] = useLocalStorage<HabitLog[]>('kindling-logs', generateSeedLogs(SEED_HABITS));
  const [waterLogs, setWaterLogs] = useLocalStorage<WaterLog[]>('kindling-water', []);
  const [mealLogs, setMealLogs] = useLocalStorage<MealLog[]>('kindling-meals', []);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('kindling-reminders', []);
  const [deletedHabit, setDeletedHabit] = useState<Habit | null>(null);

  const toggleHabit = useCallback((habitId: string, date: string) => {
    setLogs(prev => {
      const existing = prev.find(l => l.habitId === habitId && l.date === date);
      if (existing) {
        return prev.map(l => 
          l.habitId === habitId && l.date === date 
            ? { ...l, completed: !l.completed }
            : l
        );
      }
      return [...prev, { habitId, date, completed: true }];
    });
  }, [setLogs]);

  const isHabitCompleted = useCallback((habitId: string, date: string): boolean => {
    const log = logs.find(l => l.habitId === habitId && l.date === date);
    return log?.completed ?? false;
  }, [logs]);

  const isHabitActiveOnDate = useCallback((habit: Habit, date: Date): boolean => {
    const dayOfWeek = date.getDay() as Weekday;
    return habit.activeDays.includes(dayOfWeek);
  }, []);

  const getStreak = useCallback((habitId: string): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    
    // If today isn't completed and is an active day, start from yesterday
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    const todayCompleted = isHabitCompleted(habitId, todayStr);
    const todayActive = isHabitActiveOnDate(habit, currentDate);
    
    if (todayActive && !todayCompleted) {
      currentDate = subDays(currentDate, 1);
    }
    
    // Count backwards
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
        if (isHabitCompleted(habitId, dateStr)) {
          completedDays++;
        }
      }
    }
    
    return activeDays > 0 ? Math.round((completedDays / activeDays) * 100) : 0;
  }, [habits, logs, isHabitCompleted, isHabitActiveOnDate]);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt'>) => {
    const newHabit: Habit = {
      ...habit,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setHabits(prev => [...prev, newHabit]);
    return newHabit;
  }, [setHabits]);

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
    }
  }, [habits, setHabits, setLogs, setReminders]);

  const undoDelete = useCallback(() => {
    if (deletedHabit) {
      setHabits(prev => [...prev, deletedHabit]);
      setDeletedHabit(null);
    }
  }, [deletedHabit, setHabits]);

  // Water tracking
  const getWaterForDate = useCallback((date: string): number => {
    const log = waterLogs.find(l => l.date === date);
    return log?.glasses ?? 0;
  }, [waterLogs]);

  const addWater = useCallback((date: string) => {
    setWaterLogs(prev => {
      const existing = prev.find(l => l.date === date);
      if (existing) {
        return prev.map(l => l.date === date ? { ...l, glasses: l.glasses + 1 } : l);
      }
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

  // Meal tracking
  const getMealsForDate = useCallback((date: string) => {
    const log = mealLogs.find(l => l.date === date);
    return log?.meals ?? { breakfast: false, lunch: false, dinner: false, snack: false };
  }, [mealLogs]);

  const toggleMeal = useCallback((date: string, meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    setMealLogs(prev => {
      const existing = prev.find(l => l.date === date);
      if (existing) {
        return prev.map(l => l.date === date ? { 
          ...l, 
          meals: { ...l.meals, [meal]: !l.meals[meal] }
        } : l);
      }
      return [...prev, { date, meals: { breakfast: false, lunch: false, dinner: false, snack: false, [meal]: true } }];
    });
  }, [setMealLogs]);

  // Reminders
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

  // Today's progress
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayActiveHabits = habits.filter(h => isHabitActiveOnDate(h, new Date()));
  const todayCompletedHabits = todayActiveHabits.filter(h => isHabitCompleted(h.id, todayStr));
  const todayProgress = todayActiveHabits.length > 0 
    ? Math.round((todayCompletedHabits.length / todayActiveHabits.length) * 100) 
    : 0;

  // Week data
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return {
    habits,
    logs,
    waterLogs,
    mealLogs,
    reminders,
    deletedHabit,
    todayProgress,
    todayActiveHabits,
    todayCompletedHabits,
    weekDays,
    todayStr,
    toggleHabit,
    isHabitCompleted,
    isHabitActiveOnDate,
    getStreak,
    getBestStreak,
    getCompletionRate,
    addHabit,
    updateHabit,
    deleteHabit,
    undoDelete,
    getWaterForDate,
    addWater,
    removeWater,
    getMealsForDate,
    toggleMeal,
    addReminder,
    toggleReminder,
    deleteReminder,
  };
}
