import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  focus: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
}

export interface FocusSession {
  date: string;
  duration: number;
  completedAt: string;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
};

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Second beep
    setTimeout(() => {
      try {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.5);
      } catch { /* ignore */ }
    }, 300);
  } catch {
    // Silently fail if audio not available
  }
}

export function usePomodoro() {
  const [settings, setSettings] = useLocalStorage<PomodoroSettings>('pomodoro-settings', DEFAULT_SETTINGS);
  const [sessions, setSessions] = useLocalStorage<FocusSession[]>('pomodoro-sessions', []);
  const [completedPomodoros, setCompletedPomodoros] = useLocalStorage<number>('pomodoro-completed', 0);
  
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(settings.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef = useRef<TimerMode>(mode);
  const settingsRef = useRef(settings);
  const completedRef = useRef(completedPomodoros);

  // Keep refs in sync
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { completedRef.current = completedPomodoros; }, [completedPomodoros]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    const s = settingsRef.current;
    const duration = newMode === 'focus' ? s.focus * 60 :
                     newMode === 'shortBreak' ? s.shortBreak * 60 :
                     s.longBreak * 60;
    setTimeLeft(duration);
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer completed
            setIsRunning(false);
            
            const currentMode = modeRef.current;
            const currentSettings = settingsRef.current;
            const currentCompleted = completedRef.current;

            if (currentMode === 'focus') {
              const newCompleted = currentCompleted + 1;
              setCompletedPomodoros(newCompleted);
              
              const session: FocusSession = {
                date: getTodayKey(),
                duration: currentSettings.focus,
                completedAt: new Date().toISOString(),
              };
              setSessions(prev => [...prev, session]);
              playNotificationSound();

              if (newCompleted % currentSettings.longBreakInterval === 0) {
                switchMode('longBreak');
              } else {
                switchMode('shortBreak');
              }
            } else {
              playNotificationSound();
              switchMode('focus');
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, setCompletedPomodoros, setSessions, switchMode]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  
  const reset = useCallback(() => {
    setIsRunning(false);
    const s = settingsRef.current;
    const m = modeRef.current;
    const duration = m === 'focus' ? s.focus * 60 :
                     m === 'shortBreak' ? s.shortBreak * 60 :
                     s.longBreak * 60;
    setTimeLeft(duration);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      // Update time if not running
      setIsRunning(currentRunning => {
        if (!currentRunning) {
          const m = modeRef.current;
          if (m === 'focus') setTimeLeft(updated.focus * 60);
          else if (m === 'shortBreak') setTimeLeft(updated.shortBreak * 60);
          else setTimeLeft(updated.longBreak * 60);
        }
        return currentRunning;
      });
      return updated;
    });
  }, [setSettings]);

  // Today's statistics
  const todayKey = getTodayKey();
  const todaySessions = sessions.filter(s => s.date === todayKey);
  const todayFocusMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
  const todayPomodoros = todaySessions.length;

  // Weekly statistics
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekSessions = sessions.filter(s => new Date(s.date) >= weekStart);
  const weekFocusMinutes = weekSessions.reduce((acc, s) => acc + s.duration, 0);

  return {
    mode,
    timeLeft,
    isRunning,
    completedPomodoros,
    settings,
    todayFocusMinutes,
    todayPomodoros,
    weekFocusMinutes,
    start,
    pause,
    reset,
    switchMode,
    updateSettings,
  };
}
