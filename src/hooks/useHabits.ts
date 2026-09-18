import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  Habit, HabitLog, WaterLog, MealLog, MoodLog, Reminder, HabitNote,
  Weekday, HabitType, TrackingMode, ScheduleType, TimeOfDay, Theme,
  UserStats, Achievement, Challenge, StreakShield, GardenPlant, TimeCapsule, Reflection,
  ACHIEVEMENTS, GARDEN_PLANTS,
} from '../types';
import { format, subDays, startOfWeek, addDays, differenceInCalendarDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// ... (keeping all existing seed data and helper functions)

export function useHabits() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('kindling-habits', []);
  const [logs, setLogs] = useLocalStorage<HabitLog[]>('kindling-logs', []);
  const [waterLogs, setWaterLogs] = useLocalStorage<WaterLog[]>('kindling-water', []);
  const [mealLogs, setMealLogs] = useLocalStorage<MealLog[]>('kindling-meals', []);
  const [moodLogs, setMoodLogs] = useLocalStorage<MoodLog[]>('kindling-moods', []);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('kindling-reminders', []);
  const [notes, setNotes] = useLocalStorage<HabitNote[]>('kindling-notes', []);
  const [deletedHabit, setDeletedHabit] = useState<Habit | null>(null);
  const [lastAction, setLastAction] = useState<{ type: string; data: any } | null>(null);
  
  // New gamification state
  const [userStats, setUserStats] = useLocalStorage<UserStats>('kindling-stats', {
    totalXp: 0,
    level: 1,
    streakShields: 0,
    achievements: [],
    challengesCompleted: 0,
    habitsFormed: 0,
    consistencyScore: 0,
  });
  const [streakShields, setStreakShields] = useLocalStorage<StreakShield[]>('kindling-shields', []);
  const [challenges, setChallenges] = useLocalStorage<Challenge[]>('kindling-challenges', []);
  const [gardenPlants, setGardenPlants] = useLocalStorage<GardenPlant[]>('kindling-garden', []);
  const [timeCapsules, setTimeCapsules] = useLocalStorage<TimeCapsule[]>('kindling-capsules', []);
  const [reflections, setReflections] = useLocalStorage<Reflection[]>('kindling-reflections', []);
  const [selectedTheme, setSelectedTheme] = useLocalStorage<Theme>('kindling-theme', 'default');

  // XP and Level calculation
  const calculateLevel = (xp: number): number => {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  };

  const addXp = useCallback((amount: number) => {
    setUserStats(prev => {
      const newXp = prev.totalXp + amount;
      const newLevel = calculateLevel(newXp);
      return { ...prev, totalXp: newXp, level: newLevel };
    });
  }, [setUserStats]);

  // Achievement checking
  const checkAchievements = useCallback(() => {
    const totalCompletions = logs.filter(l => l.completed).length;
    const maxStreak = Math.max(0, ...habits.map(h => getStreak(h.id)));
    
    const newAchievements: Achievement[] = [];
    
    // Check each achievement
    ACHIEVEMENTS.forEach(ach => {
      if (userStats.achievements.find(a => a.id === ach.id)) return;
      
      let unlocked = false;
      if (ach.id === 'first-habit' && habits.length > 0) unlocked = true;
      if (ach.id === 'first-streak-7' && maxStreak >= 7) unlocked = true;
      if (ach.id === 'first-streak-30' && maxStreak >= 30) unlocked = true;
      if (ach.id === 'first-streak-100' && maxStreak >= 100) unlocked = true;
      if (ach.id === 'first-streak-365' && maxStreak >= 365) unlocked = true;
      if (ach.id === 'complete-10' && totalCompletions >= 10) unlocked = true;
      if (ach.id === 'complete-100' && totalCompletions >= 100) unlocked = true;
      if (ach.id === 'complete-1000' && totalCompletions >= 1000) unlocked = true;
      if (ach.id === 'level-5' && userStats.level >= 5) unlocked = true;
      if (ach.id === 'level-10' && userStats.level >= 10) unlocked = true;
      if (ach.id === 'level-25' && userStats.level >= 25) unlocked = true;
      if (ach.id === 'multi-habit' && habits.filter(h => !h.archived).length >= 5) unlocked = true;
      
      if (unlocked) {
        newAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
      }
    });
    
    if (newAchievements.length > 0) {
      setUserStats(prev => ({
        ...prev,
        achievements: [...prev.achievements, ...newAchievements],
      }));
    }
    
    return newAchievements;
  }, [habits, logs, userStats, setUserStats]);

  // Streak shield logic
  const earnStreakShield = useCallback((habitId: string) => {
    const streak = getStreak(habitId);
    if (streak > 0 && streak % 7 === 0) {
      const shield: StreakShield = {
        id: uuidv4(),
        earnedAt: new Date().toISOString(),
      };
      setStreakShields(prev => [...prev, shield]);
      setUserStats(prev => ({ ...prev, streakShields: prev.streakShields + 1 }));
    }
  }, [setStreakShields, setUserStats]);

  const useStreakShield = useCallback((habitId: string, date: string) => {
    const availableShield = streakShields.find(s => !s.usedForDate);
    if (availableShield) {
      setStreakShields(prev => prev.map(s => 
        s.id === availableShield.id ? { ...s, usedForDate: date, habitId } : s
      ));
      setUserStats(prev => ({ ...prev, streakShields: prev.streakShields - 1 }));
      return true;
    }
    return false;
  }, [streakShields, setStreakShields, setUserStats]);

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
      } else {
        const plantType = GARDEN_PLANTS[Math.floor(Math.random() * GARDEN_PLANTS.length)].type;
        return [...prev, {
          habitId,
          plantType,
          growthStage: completed ? 1 : 0,
          lastWatered: new Date().toISOString(),
          health: completed ? 60 : 40,
        }];
      }
    });
  }, [setGardenPlants]);

  // Time capsule
  const createTimeCapsule = useCallback((message: string, daysToOpen: number) => {
    const capsule: TimeCapsule = {
      id: uuidv4(),
      message,
      createdAt: new Date().toISOString(),
      openAt: format(addDays(new Date(), daysToOpen), 'yyyy-MM-dd'),
      opened: false,
    };
    setTimeCapsules(prev => [...prev, capsule]);
  }, [setTimeCapsules]);

  const openTimeCapsule = useCallback((id: string) => {
    setTimeCapsules(prev => prev.map(c => 
      c.id === id ? { ...c, opened: true } : c
    ));
  }, [setTimeCapsules]);

  // Reflections
  const createReflection = useCallback((type: 'weekly' | 'monthly', content: string, mood?: number) => {
    const reflection: Reflection = {
      id: uuidv4(),
      date: format(new Date(), 'yyyy-MM-dd'),
      type,
      content,
      mood,
      createdAt: new Date().toISOString(),
    };
    setReflections(prev => [...prev, reflection]);
  }, [setReflections]);

  // Consistency score calculation
  const calculateConsistencyScore = useCallback((): number => {
    const last30Days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), i));
    let totalActive = 0;
    let totalCompleted = 0;
    
    last30Days.forEach(day => {
      habits.forEach(habit => {
        if (isHabitActiveOnDate(habit, day)) {
          totalActive++;
          if (isHabitCompleted(habit.id, format(day, 'yyyy-MM-dd'))) {
            totalCompleted++;
          }
        }
      });
    });
    
    return totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0;
  }, [habits, logs]);

  // ... (include all existing functions from previous implementation)

  // Enhanced toggle with XP and achievements
  const toggleHabit = useCallback((habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    setLogs(prev => {
      const existing = prev.find(l => l.habitId === habitId && l.date === date);
      if (existing) {
        const wasCompleted = existing.completed;
        setLastAction({ type: 'toggle', data: { habitId, date, wasCompleted } });
        
        if (!wasCompleted) {
          // Award XP
          const xp = habit.xpReward || 10;
          addXp(xp);
          
          // Update garden
          updateGardenPlant(habitId, true);
          
          // Check for streak shield
          earnStreakShield(habitId);
          
          // Check achievements
          setTimeout(() => checkAchievements(), 100);
        } else {
          // Remove XP if unchecking
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
      
      // Award XP for new completion
      const xp = habit.xpReward || 10;
      addXp(xp);
      updateGardenPlant(habitId, true);
      earnStreakShield(habitId);
      setTimeout(() => checkAchievements(), 100);
      
      return [...prev, { habitId, date, completed: true }];
    });
  }, [habits, setLogs, addXp, updateGardenPlant, earnStreakShield, checkAchievements]);

  // ... (include all other existing functions)

  // Update consistency score periodically
  const consistencyScore = calculateConsistencyScore();

  return {
    // ... (all existing returns)
    userStats,
    streakShields,
    challenges,
    gardenPlants,
    timeCapsules,
    reflections,
    selectedTheme,
    consistencyScore,
    addXp,
    checkAchievements,
    earnStreakShield,
    useStreakShield,
    updateGardenPlant,
    createTimeCapsule,
    openTimeCapsule,
    createReflection,
    setSelectedTheme,
    calculateConsistencyScore,
  };
}
