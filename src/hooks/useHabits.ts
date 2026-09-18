import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  Habit, HabitLog, WaterLog, MealLog, MoodLog, Reminder, HabitNote,
  Weekday, Theme, UserStats, Achievement, StreakShield, GardenPlant, TimeCapsule, Reflection,
  HabitStack, StreakRecovery, HabitCorrelation, AdaptiveSettings,
  ACHIEVEMENTS, GARDEN_PLANTS,
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
    archived: false, order: 0, xpReward: 15,
  },
  {
    id: 'seed-2', name: 'Evening journal', description: 'Write 3 things you are grateful for',
    timeOfDay: 'evening', activeDays: [0, 1, 2, 3, 4, 5, 6] as Weekday[],
    color: '#f43f5e', icon: '✍️', category: 'Mind', type: 'positive',
    trackingMode: 'binary', scheduleType: 'daily',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    archived: false, order: 1, xpReward: 10,
  },
  {
    id: 'seed-3', name: 'Read 20 pages', description: 'Read a book for at least 20 pages',
    timeOfDay: 'evening', activeDays: [1, 2, 3, 4, 5] as Weekday[],
    color: '#0ea5e9', icon: '📚', category: 'Learning', type: 'positive',
    trackingMode: 'count', targetCount: 20, scheduleType: 'daily',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    archived: false, order: 2, xpReward: 12,
  },
  {
    id: 'seed-4', name: 'Exercise', description: '30 minutes of any physical activity',
    timeOfDay: 'morning', activeDays: [1, 3, 5] as Weekday[],
    color: '#10b981', icon: '💪', category: 'Fitness', type: 'positive',
    trackingMode: 'timer', targetDuration: 30, scheduleType: 'daily',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    archived: false, order: 3, xpReward: 20,
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
  
  // Gamification state
  const [userStats, setUserStats] = useLocalStorage<UserStats>('kindling-stats', {
    totalXp: 0, level: 1, streakShields: 0, achievements: [],
    challengesCompleted: 0, habitsFormed: 0, consistencyScore: 0,
  });
  const [streakShields, setStreakShields] = useLocalStorage<StreakShield[]>('kindling-shields', []);
  const [gardenPlants, setGardenPlants] = useLocalStorage<GardenPlant[]>('kindling-garden', []);
  const [timeCapsules, setTimeCapsules] = useLocalStorage<TimeCapsule[]>('kindling-capsules', []);
  const [reflections, setReflections] = useLocalStorage<Reflection[]>('kindling-reflections', []);
  const [selectedTheme, setSelectedTheme] = useLocalStorage<Theme>('kindling-theme', 'default');
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  
  // Phase 4 features
  const [habitStacks, setHabitStacks] = useLocalStorage<HabitStack[]>('kindling-stacks', []);
  const [streakRecoveries, setStreakRecoveries] = useLocalStorage<StreakRecovery[]>('kindling-recoveries', []);
  const [adaptiveSettings, setAdaptiveSettings] = useLocalStorage<AdaptiveSettings>('kindling-adaptive', {
    enabled: false,
    adjustmentRate: 0.1,
    minTarget: 1,
    maxTarget: 100,
  });

  // XP and Level
  const calculateLevel = (xp: number): number => Math.floor(Math.sqrt(xp / 100)) + 1;

  const addXp = useCallback((amount: number) => {
    setUserStats(prev => {
      const newXp = Math.max(0, prev.totalXp + amount);
      const newLevel = calculateLevel(newXp);
      return { ...prev, totalXp: newXp, level: newLevel };
    });
  }, [setUserStats]);

  // Achievement checking
  const checkAchievements = useCallback(() => {
    const totalCompletions = logs.filter(l => l.completed).length;
    const maxStreak = Math.max(0, ...habits.map(h => {
      let streak = 0;
      let currentDate = new Date();
      for (let i = 0; i < 365; i++) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const active = isHabitActiveOnDateStatic(h, currentDate);
        if (active) {
          const log = logs.find(l => l.habitId === h.id && l.date === dateStr);
          if (log?.completed) streak++;
          else break;
        }
        currentDate = subDays(currentDate, 1);
      }
      return streak;
    }));
    
    const newAchievements: Achievement[] = [];
    
    ACHIEVEMENTS.forEach(ach => {
      if (userStats.achievements.find(a => a.id === ach.id)) return;
      
      let unlocked = false;
      if (ach.id === 'first-habit' && habits.length > 0) unlocked = true;
      if (ach.id === 'first-streak-7' && maxStreak >= 7) unlocked = true;
      if (ach.id === 'first-streak-30' && maxStreak >= 30) unlocked = true;
      if (ach.id === 'first-streak-100' && maxStreak >= 100) unlocked = true;
      if (ach.id === 'complete-10' && totalCompletions >= 10) unlocked = true;
      if (ach.id === 'complete-100' && totalCompletions >= 100) unlocked = true;
      if (ach.id === 'complete-1000' && totalCompletions >= 1000) unlocked = true;
      if (ach.id === 'level-5' && userStats.level >= 5) unlocked = true;
      if (ach.id === 'level-10' && userStats.level >= 10) unlocked = true;
      if (ach.id === 'multi-habit' && habits.filter(h => !h.archived).length >= 5) unlocked = true;
      
      if (unlocked) {
        const achievement = { ...ach, unlockedAt: new Date().toISOString() };
        newAchievements.push(achievement);
      }
    });
    
    if (newAchievements.length > 0) {
      setUserStats(prev => ({
        ...prev,
        achievements: [...prev.achievements, ...newAchievements],
      }));
      setNewAchievement(newAchievements[0]);
      setTimeout(() => setNewAchievement(null), 5000);
    }
    
    return newAchievements;
  }, [habits, logs, userStats, setUserStats]);

  // Streak shield logic
  const earnStreakShield = useCallback((habitId: string) => {
    let streak = 0;
    let currentDate = new Date();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    for (let i = 0; i < 365; i++) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const active = isHabitActiveOnDateStatic(habit, currentDate);
      if (active) {
        const log = logs.find(l => l.habitId === habitId && l.date === dateStr);
        if (log?.completed) streak++;
        else break;
      }
      currentDate = subDays(currentDate, 1);
    }
    
    if (streak > 0 && streak % 7 === 0) {
      const shield: StreakShield = { id: uuidv4(), earnedAt: new Date().toISOString() };
      setStreakShields(prev => [...prev, shield]);
      setUserStats(prev => ({ ...prev, streakShields: prev.streakShields + 1 }));
    }
  }, [habits, logs, setStreakShields, setUserStats]);

  // Garden plant management
  const updateGardenPlant = useCallback((habitId: string, completed: boolean) => {
    setGardenPlants(prev => {
      const existing = prev.find(p => p.habitId === habitId);
      if (existing) {
        if (completed) {
          return prev.map(p => p.habitId === habitId ? {
            ...p,
            growthStage: Math.min(5, p.growthStage + 1),
            lastWatered: new Date().toISOString(),
            health: Math.min(100, p.health + 10),
          } : p);
        } else {
          return prev.map(p => p.habitId === habitId ? {
            ...p,
            health: Math.max(0, p.health - 20),
          } : p);
        }
      } else if (completed) {
        const plantType = GARDEN_PLANTS[Math.floor(Math.random() * GARDEN_PLANTS.length)].type;
        return [...prev, {
          habitId, plantType, growthStage: 1,
          lastWatered: new Date().toISOString(), health: 60,
        }];
      }
      return prev;
    });
  }, [setGardenPlants]);

  // Time capsule
  const createTimeCapsule = useCallback((message: string, daysToOpen: number) => {
    const capsule: TimeCapsule = {
      id: uuidv4(), message,
      createdAt: new Date().toISOString(),
      openAt: format(addDays(new Date(), daysToOpen), 'yyyy-MM-dd'),
      opened: false,
    };
    setTimeCapsules(prev => [...prev, capsule]);
  }, [setTimeCapsules]);

  const openTimeCapsule = useCallback((id: string) => {
    setTimeCapsules(prev => prev.map(c => c.id === id ? { ...c, opened: true } : c));
  }, [setTimeCapsules]);

  // Reflections
  const createReflection = useCallback((type: 'weekly' | 'monthly', content: string, mood?: number) => {
    const reflection: Reflection = {
      id: uuidv4(), date: format(new Date(), 'yyyy-MM-dd'),
      type, content, mood, createdAt: new Date().toISOString(),
    };
    setReflections(prev => [...prev, reflection]);
  }, [setReflections]);

  // Consistency score
  const calculateConsistencyScore = useCallback((): number => {
    const last30Days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), i));
    let totalActive = 0;
    let totalCompleted = 0;
    
    last30Days.forEach(day => {
      habits.forEach(habit => {
        if (isHabitActiveOnDateStatic(habit, day)) {
          totalActive++;
          const dateStr = format(day, 'yyyy-MM-dd');
          const log = logs.find(l => l.habitId === habit.id && l.date === dateStr);
          if (log?.completed) totalCompleted++;
        }
      });
    });
    
    return totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0;
  }, [habits, logs]);

  // Habit operations
  const toggleHabit = useCallback((habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    setLogs(prev => {
      const existing = prev.find(l => l.habitId === habitId && l.date === date);
      if (existing) {
        const wasCompleted = existing.completed;
        setLastAction({ type: 'toggle', data: { habitId, date, wasCompleted } });
        
        if (!wasCompleted) {
          const xp = habit.xpReward || 10;
          addXp(xp);
          updateGardenPlant(habitId, true);
          earnStreakShield(habitId);
          setTimeout(() => checkAchievements(), 100);
        } else {
          const xp = -(habit.xpReward || 10);
          addXp(xp);
          updateGardenPlant(habitId, false);
        }
        
        return prev.map(l =>
          l.habitId === habitId && l.date === date
            ? { ...l, completed: !l.completed }
            : l
        );
      }
      
      setLastAction({ type: 'toggle', data: { habitId, date, wasCompleted: false } });
      const xp = habit.xpReward || 10;
      addXp(xp);
      updateGardenPlant(habitId, true);
      earnStreakShield(habitId);
      setTimeout(() => checkAchievements(), 100);
      
      return [...prev, { habitId, date, completed: true }];
    });
  }, [habits, setLogs, addXp, updateGardenPlant, earnStreakShield, checkAchievements]);

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
  }, [setLogs]);

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

  const getHabitStrength = useCallback((habitId: string): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;
    let strength = 0;
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const active = isHabitActiveOnDateStatic(habit, date);
      if (active) {
        const log = logs.find(l => l.habitId === habitId && l.date === dateStr);
        if (log?.completed) {
          strength = Math.min(100, strength + (100 - strength) * 0.05);
        } else {
          strength = strength * 0.95;
        }
      }
    }
    return Math.round(strength);
  }, [habits, logs]);

  const getStreak = useCallback((habitId: string): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;
    let streak = 0;
    let currentDate = new Date();
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    const todayLog = logs.find(l => l.habitId === habitId && l.date === todayStr);
    const todayActive = isHabitActiveOnDateStatic(habit, currentDate);
    if (todayActive && !todayLog?.completed) {
      currentDate = subDays(currentDate, 1);
    }
    for (let i = 0; i < 365; i++) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const active = isHabitActiveOnDateStatic(habit, currentDate);
      if (active) {
        const log = logs.find(l => l.habitId === habitId && l.date === dateStr);
        if (log?.completed) streak++;
        else break;
      }
      currentDate = subDays(currentDate, 1);
    }
    return streak;
  }, [habits, logs]);

  const getBestStreak = useCallback((habitId: string): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;
    let bestStreak = 0;
    let currentStreak = 0;
    const today = new Date();
    for (let i = 90; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const active = isHabitActiveOnDateStatic(habit, date);
      if (active) {
        const log = logs.find(l => l.habitId === habitId && l.date === dateStr);
        if (log?.completed) {
          currentStreak++;
          bestStreak = Math.max(bestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
    }
    return bestStreak;
  }, [habits, logs]);

  const getCompletionRate = useCallback((habitId: string, days: number = 30): number => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return 0;
    let activeDays = 0;
    let completedDays = 0;
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const active = isHabitActiveOnDateStatic(habit, date);
      if (active) {
        activeDays++;
        const log = logs.find(l => l.habitId === habitId && l.date === dateStr);
        if (log?.completed) completedDays++;
      }
    }
    return activeDays > 0 ? Math.round((completedDays / activeDays) * 100) : 0;
  }, [habits, logs]);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt' | 'archived' | 'order'>) => {
    const maxOrder = Math.max(0, ...habits.filter(h => !h.archived).map(h => h.order));
    const newHabit: Habit = {
      ...habit, id: uuidv4(),
      createdAt: new Date().toISOString(),
      archived: false, order: maxOrder + 1,
    };
    setHabits(prev => [...prev, newHabit]);
    setTimeout(() => checkAchievements(), 100);
    return newHabit;
  }, [habits, setHabits, checkAchievements]);

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

  // Notes
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

  // Water
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

  // Meals
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

  // Mood
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

  // Habit Stacking
  const addHabitStack = useCallback((name: string, habitIds: string[]) => {
    const stack: HabitStack = {
      id: uuidv4(),
      name,
      habits: habitIds,
      createdAt: new Date().toISOString(),
    };
    setHabitStacks(prev => [...prev, stack]);
    return stack;
  }, [setHabitStacks]);

  const deleteHabitStack = useCallback((id: string) => {
    setHabitStacks(prev => prev.filter(s => s.id !== id));
  }, [setHabitStacks]);

  // Streak Recovery
  const triggerStreakRecovery = useCallback((habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const messages = [
      "Every expert was once a beginner. Your journey continues!",
      "One missed day doesn't define you. What matters is what you do next.",
      "Progress, not perfection. You're still building something amazing.",
      "The flame may dim, but it never goes out. Keep kindling!",
      "Setbacks are setups for comebacks. You've got this!",
    ];
    
    const recovery: StreakRecovery = {
      habitId,
      brokenAt: new Date().toISOString(),
      message: messages[Math.floor(Math.random() * messages.length)],
    };
    
    setStreakRecoveries(prev => [...prev, recovery]);
    return recovery;
  }, [habits, setStreakRecoveries]);

  const markStreakRecovered = useCallback((habitId: string) => {
    setStreakRecoveries(prev => prev.map(r => 
      r.habitId === habitId && !r.recoveredAt 
        ? { ...r, recoveredAt: new Date().toISOString() }
        : r
    ));
  }, [setStreakRecoveries]);

  // Habit Correlations
  const calculateCorrelations = useCallback((): HabitCorrelation[] => {
    const correlations: HabitCorrelation[] = [];
    const activeHabits = habits.filter(h => !h.archived);
    
    if (activeHabits.length < 2) return correlations;
    
    // Calculate correlation for each pair of habits
    for (let i = 0; i < activeHabits.length; i++) {
      for (let j = i + 1; j < activeHabits.length; j++) {
        const habit1 = activeHabits[i];
        const habit2 = activeHabits[j];
        
        // Get last 30 days of data
        const last30Days = Array.from({ length: 30 }, (_, idx) => {
          const date = subDays(new Date(), idx);
          return format(date, 'yyyy-MM-dd');
        });
        
        let bothCompleted = 0;
        let habit1Only = 0;
        let habit2Only = 0;
        let neitherCompleted = 0;
        
        last30Days.forEach(dateStr => {
          const log1 = logs.find(l => l.habitId === habit1.id && l.date === dateStr);
          const log2 = logs.find(l => l.habitId === habit2.id && l.date === dateStr);
          
          const completed1 = log1?.completed || false;
          const completed2 = log2?.completed || false;
          
          if (completed1 && completed2) bothCompleted++;
          else if (completed1) habit1Only++;
          else if (completed2) habit2Only++;
          else neitherCompleted++;
        });
        
        // Calculate correlation coefficient
        const total = last30Days.length;
        const p1 = (bothCompleted + habit1Only) / total;
        const p2 = (bothCompleted + habit2Only) / total;
        const p12 = bothCompleted / total;
        
        const correlation = (p12 - p1 * p2) / Math.sqrt(p1 * (1 - p1) * p2 * (1 - p2));
        
        // Determine strength
        const absCorr = Math.abs(correlation);
        let strength: 'weak' | 'moderate' | 'strong' = 'weak';
        if (absCorr > 0.7) strength = 'strong';
        else if (absCorr > 0.4) strength = 'moderate';
        
        correlations.push({
          habitId1: habit1.id,
          habitId2: habit2.id,
          correlation: Math.round(correlation * 100) / 100,
          strength,
        });
      }
    }
    
    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [habits, logs]);

  // Adaptive Difficulty
  const adaptHabitDifficulty = useCallback((habitId: string) => {
    if (!adaptiveSettings.enabled) return;
    
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    // Get last 14 days of data
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    });
    
    let completedDays = 0;
    let activeDays = 0;
    
    last14Days.forEach(dateStr => {
      const date = new Date(dateStr);
      if (isHabitActiveOnDateStatic(habit, date)) {
        activeDays++;
        const log = logs.find(l => l.habitId === habitId && l.date === dateStr);
        if (log?.completed) completedDays++;
      }
    });
    
    if (activeDays === 0) return;
    
    const completionRate = completedDays / activeDays;
    const adjustment = adaptiveSettings.adjustmentRate;
    
    let newTarget: number | undefined;
    
    if (habit.trackingMode === 'count' && habit.targetCount) {
      if (completionRate > 0.9) {
        // Increase difficulty
        newTarget = Math.min(
          Math.ceil(habit.targetCount * (1 + adjustment)),
          adaptiveSettings.maxTarget
        );
      } else if (completionRate < 0.5) {
        // Decrease difficulty
        newTarget = Math.max(
          Math.floor(habit.targetCount * (1 - adjustment)),
          adaptiveSettings.minTarget
        );
      }
      
      if (newTarget && newTarget !== habit.targetCount) {
        updateHabit(habitId, { targetCount: newTarget });
      }
    } else if (habit.trackingMode === 'timer' && habit.targetDuration) {
      if (completionRate > 0.9) {
        newTarget = Math.min(
          Math.ceil(habit.targetDuration * (1 + adjustment)),
          adaptiveSettings.maxTarget
        );
      } else if (completionRate < 0.5) {
        newTarget = Math.max(
          Math.floor(habit.targetDuration * (1 - adjustment)),
          adaptiveSettings.minTarget
        );
      }
      
      if (newTarget && newTarget !== habit.targetDuration) {
        updateHabit(habitId, { targetDuration: newTarget });
      }
    }
  }, [habits, logs, adaptiveSettings, updateHabit]);

  const updateAdaptiveSettings = useCallback((settings: Partial<AdaptiveSettings>) => {
    setAdaptiveSettings(prev => ({ ...prev, ...settings }));
  }, [setAdaptiveSettings]);

  // Today's progress
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const activeHabits = habits.filter(h => !h.archived);
  const todayActiveHabits = activeHabits.filter(h => isHabitActiveOnDateStatic(h, new Date()));
  const todayCompletedHabits = todayActiveHabits.filter(h => isHabitCompleted(h.id, todayStr));
  const todayProgress = todayActiveHabits.length > 0
    ? Math.round((todayCompletedHabits.length / todayActiveHabits.length) * 100)
    : 0;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const categories = Array.from(new Set(activeHabits.map(h => h.category)));
  const consistencyScore = calculateConsistencyScore();

  return {
    habits, activeHabits, logs, waterLogs, mealLogs, moodLogs, reminders, notes,
    deletedHabit, lastAction, todayProgress, todayActiveHabits, todayCompletedHabits,
    weekDays, todayStr, categories,
    toggleHabit, updateLogCount, isHabitCompleted, getLogForDate,
    isHabitActiveOnDate, getStreak, getBestStreak, getCompletionRate, getHabitStrength,
    addHabit, updateHabit, deleteHabit, archiveHabit, unarchiveHabit, reorderHabits,
    undoDelete, undoLastAction,
    addNote, getNotesForHabitDate, deleteNote,
    getWaterForDate, addWater, removeWater,
    getMealsForDate, toggleMeal,
    getMoodForDate, setMood,
    addReminder, toggleReminder, deleteReminder,
    // Gamification
    userStats, streakShields, gardenPlants, timeCapsules, reflections,
    selectedTheme, consistencyScore, newAchievement,
    addXp, checkAchievements, earnStreakShield,
    updateGardenPlant, createTimeCapsule, openTimeCapsule,
    createReflection, setSelectedTheme,
    // Phase 4 features
    habitStacks, streakRecoveries, adaptiveSettings,
    addHabitStack, deleteHabitStack,
    triggerStreakRecovery, markStreakRecovered,
    calculateCorrelations,
    adaptHabitDifficulty, updateAdaptiveSettings,
  };
}
