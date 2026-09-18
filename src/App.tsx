import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { format, subDays, addDays, subMonths, addMonths, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isToday as isTodayFn, getDay, differenceInCalendarDays } from 'date-fns';
import {
  Plus, X, Trash2, Edit3, ChevronLeft, ChevronRight, Droplets, UtensilsCrossed,
  Bell, Check, Flame, Calendar, BarChart3, Undo2, Sun, Moon, Sunrise, Sparkles,
  Download, Upload, Command, Archive, Search, Filter, Timer, Target, TrendingUp,
  StickyNote, Smile, Eye, EyeOff, GripVertical, ChevronDown, ChevronUp, Printer,
} from 'lucide-react';
import { useHabits } from './hooks/useHabits';
import {
  Habit, TimeOfDay, Weekday, HabitType, TrackingMode, ScheduleType,
  HABIT_COLORS, HABIT_ICONS, HABIT_CATEGORIES, HABIT_TEMPLATES,
  TIME_OF_DAY_LABELS, WEEKDAY_NAMES, MOOD_EMOJIS, MOOD_LABELS,
} from './types';
import confetti from 'canvas-confetti';

// ===== SOUND EFFECTS =====
function playCheckSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
  } catch { /* ignore */ }
}

function playUncheckSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.1);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
  } catch { /* ignore */ }
}

// ===== 3D TILT CARD =====
function TiltCard({ children, className = '', intensity = 5 }: { children: React.ReactNode; className?: string; intensity?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -intensity;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * intensity;
    ref.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
  };
  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };
  return (
    <div ref={ref} className={`transition-transform duration-200 ease-out ${className}`}
      onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>{children}</div>
  );
}

// ===== SHIMMER PROGRESS BAR =====
function ShimmerProgress({ percent, className = '' }: { percent: number; className?: string }) {
  return (
    <div className={`h-3 bg-gray-100 rounded-full overflow-hidden relative ${className}`} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <motion.div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full relative overflow-hidden"
        initial={{ width: 0 }} animate={{ width: `${percent}%` }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }} />
      </motion.div>
    </div>
  );
}

// ===== EMBER BACKGROUND =====
function EmberBackground() {
  const embers = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 8,
    duration: 8 + Math.random() * 12, size: 2 + Math.random() * 4,
  })), []);
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {embers.map(ember => (
        <motion.div key={ember.id} className="absolute rounded-full"
          style={{ left: `${ember.x}%`, bottom: '-10px', width: ember.size, height: ember.size,
            background: `radial-gradient(circle, rgba(251, 146, 60, 0.8), rgba(251, 146, 60, 0))` }}
          animate={{ y: [0, -800], x: [0, Math.sin(ember.id) * 50], opacity: [0, 0.8, 0], scale: [0.5, 1, 0.3] }}
          transition={{ duration: ember.duration, delay: ember.delay, repeat: Infinity, ease: 'easeOut' }} />
      ))}
    </div>
  );
}

// ===== FLAME ICON =====
function FlameIcon() {
  return (
    <motion.div className="relative" animate={{ scale: [1, 1.05, 1], rotate: [-1, 1, -1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
      <Flame className="w-6 h-6 text-orange-500" />
      <motion.div className="absolute inset-0" animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}>
        <Flame className="w-6 h-6 text-amber-400 blur-[1px]" />
      </motion.div>
    </motion.div>
  );
}

// ===== WATER BOTTLE =====
function WaterBottle({ glasses, goal, onAdd, onRemove }: { glasses: number; goal: number; onAdd: () => void; onRemove: () => void }) {
  const fillPercent = Math.min((glasses / goal) * 100, 100);
  return (
    <TiltCard className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50">
      <div className="flex items-center gap-3 mb-4">
        <Droplets className="w-5 h-5 text-sky-500" />
        <h3 className="font-semibold text-gray-800">Water Intake</h3>
        <span className="ml-auto text-sm text-gray-500">{glasses}/{goal}</span>
      </div>
      <div className="flex items-end gap-4">
        <div className="relative w-16 h-32 rounded-b-2xl rounded-t-lg border-2 border-sky-200 overflow-hidden bg-sky-50/50">
          <motion.div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-400 to-sky-300"
            animate={{ height: `${fillPercent}%` }} transition={{ type: 'spring', stiffness: 100, damping: 15 }}>
            <motion.div className="absolute top-0 left-0 right-0 h-2 bg-sky-300/50 rounded-full"
              animate={{ x: [-5, 5, -5], scaleY: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          </motion.div>
        </div>
        <div className="flex-1">
          <div className="flex gap-2 mb-3">
            <motion.button onClick={onRemove} disabled={glasses === 0}
              className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold disabled:opacity-30"
              whileTap={{ scale: 0.9 }}>−</motion.button>
            <motion.button onClick={onAdd}
              className="flex-1 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-medium text-sm shadow-md shadow-sky-200"
              whileTap={{ scale: 0.95 }}>
              <Droplets className="w-4 h-4 mr-1.5" />Add a glass
            </motion.button>
          </div>
          {glasses >= goal && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3 h-3" /> Goal reached! 🎉
            </motion.div>
          )}
        </div>
      </div>
    </TiltCard>
  );
}

// ===== MEAL TRACKER =====
function MealTracker({ meals, onToggle }: { meals: { breakfast: boolean; lunch: boolean; dinner: boolean; snack: boolean }; onToggle: (m: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void }) {
  const items: { key: 'breakfast' | 'lunch' | 'dinner' | 'snack'; label: string; emoji: string }[] = [
    { key: 'breakfast', label: 'Breakfast', emoji: '🥣' },
    { key: 'lunch', label: 'Lunch', emoji: '🥗' },
    { key: 'dinner', label: 'Dinner', emoji: '🍽️' },
    { key: 'snack', label: 'Snack', emoji: '🍎' },
  ];
  const completed = Object.values(meals).filter(Boolean).length;
  return (
    <TiltCard className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50">
      <div className="flex items-center gap-3 mb-4">
        <UtensilsCrossed className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-gray-800">Today's Meals</h3>
        <span className="ml-auto text-sm text-gray-500">{completed}/4</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map(item => (
          <motion.button key={item.key} onClick={() => onToggle(item.key)}
            className={`p-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${meals[item.key] ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}>
            <span>{item.emoji}</span><span>{item.label}</span>
            {meals[item.key] && <Check className="w-3.5 h-3.5 ml-auto" />}
          </motion.button>
        ))}
      </div>
    </TiltCard>
  );
}

// ===== MOOD TRACKER =====
function MoodTracker({ mood, onSetMood }: { mood: { mood: 1|2|3|4|5; note?: string } | undefined; onSetMood: (m: 1|2|3|4|5) => void }) {
  return (
    <TiltCard className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50">
      <div className="flex items-center gap-3 mb-4">
        <Smile className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-gray-800">How are you feeling?</h3>
      </div>
      <div className="flex justify-between gap-2">
        {([1,2,3,4,5] as const).map(m => (
          <motion.button key={m} onClick={() => onSetMood(m)}
            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${mood?.mood === m ? 'bg-purple-100 ring-2 ring-purple-300 scale-110' : 'hover:bg-gray-50'}`}
            whileTap={{ scale: 0.9 }}>
            <span className="text-2xl">{MOOD_EMOJIS[m-1]}</span>
            <span className="text-[10px] text-gray-500">{MOOD_LABELS[m-1]}</span>
          </motion.button>
        ))}
      </div>
    </TiltCard>
  );
}

// ===== HABIT CHECK CELL =====
function HabitCheckCell({ completed, active, color, onClick, type }: {
  completed: boolean; active: boolean; color: string; onClick: () => void; type: HabitType;
}) {
  return (
    <motion.button onClick={onClick} disabled={!active} aria-label={completed ? 'Completed' : active ? 'Mark complete' : 'Not scheduled'}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${!active ? 'bg-gray-100/50 cursor-default' : completed ? 'shadow-md' : 'bg-white/60 hover:bg-white/90 border border-gray-200/50'}`}
      style={completed ? { backgroundColor: color + '20', borderColor: color + '40' } : {}}
      whileTap={active ? { scale: 0.85 } : {}} whileHover={active ? { scale: 1.1 } : {}}>
      {completed ? (
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
          {type === 'negative' ? (
            <X className="w-4 h-4" style={{ color }} />
          ) : (
            <Check className="w-4 h-4" style={{ color }} />
          )}
        </motion.div>
      ) : active ? <div className="w-2 h-2 rounded-full bg-gray-300" /> : null}
    </motion.button>
  );
}

// ===== COUNT CELL =====
function CountCell({ count, target, active, color, onClick }: {
  count: number; target: number; active: boolean; color: string; onClick: () => void;
}) {
  const pct = Math.min(count / target, 1);
  return (
    <motion.button onClick={onClick} disabled={!active}
      className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${!active ? 'bg-gray-100/50' : 'bg-white/60 hover:bg-white/90 border border-gray-200/50'}`}
      style={count > 0 ? { backgroundColor: color + '20', color } : {}}
      whileTap={active ? { scale: 0.85 } : {}} whileHover={active ? { scale: 1.1 } : {}}>
      {active ? `${count}/${target}` : null}
    </motion.button>
  );
}

// ===== WEEK VIEW =====
function WeekView({ habits, weekDays, todayStr, isHabitCompleted, isHabitActiveOnDate, toggleHabit, getStreak, getLogForDate, updateLogCount, getHabitStrength, onHabitClick, reorderHabits }: any) {
  const handleCheck = (habitId: string, date: string, habit: Habit) => {
    const wasCompleted = isHabitCompleted(habitId, date);
    toggleHabit(habitId, date);
    if (!wasCompleted) {
      playCheckSound();
      confetti({ particleCount: 8, spread: 30, startVelocity: 15, origin: { x: 0.5, y: 0.5 },
        colors: ['#f59e0b', '#10b981', '#8b5cf6'], ticks: 60, gravity: 1.5, scalar: 0.8 });
    } else { playUncheckSound(); }
  };

  const handleCountClick = (habitId: string, date: string, habit: Habit) => {
    const log = getLogForDate(habitId, date);
    const current = log?.count ?? 0;
    const target = habit.targetCount ?? 1;
    const next = current >= target ? 0 : current + 1;
    updateLogCount(habitId, date, next);
    if (next > 0 && next >= target) {
      playCheckSound();
      confetti({ particleCount: 6, spread: 25, startVelocity: 12, origin: { x: 0.5, y: 0.5 },
        colors: [habit.color], ticks: 50, gravity: 1.5, scalar: 0.7 });
    }
  };

  const timeIcon = (tod: TimeOfDay) => {
    switch (tod) {
      case 'morning': return <Sunrise className="w-3.5 h-3.5" />;
      case 'afternoon': return <Sun className="w-3.5 h-3.5" />;
      case 'evening': return <Moon className="w-3.5 h-3.5" />;
      default: return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  const sortedHabits = [...habits].filter((h: Habit) => !h.archived).sort((a: Habit, b: Habit) => a.order - b.order);

  return (
    <motion.div className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800 text-lg">This Week</h2>
        <div className="text-xs text-gray-400">{format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d')}</div>
      </div>
      <div className="grid grid-cols-[1fr_repeat(7,auto)] gap-1.5 mb-3">
        <div />
        {weekDays.map((day: Date) => {
          const isToday = format(day, 'yyyy-MM-dd') === todayStr;
          return (
            <div key={day.toISOString()} className={`w-9 text-center text-xs font-medium ${isToday ? 'text-orange-600' : 'text-gray-400'}`}>
              <div>{WEEKDAY_NAMES[getDay(day)]}</div>
              <div className={`text-sm font-bold ${isToday ? 'text-orange-600' : 'text-gray-600'}`}>{format(day, 'd')}</div>
            </div>
          );
        })}
      </div>
      <div className="space-y-2">
        {sortedHabits.map((habit: Habit) => {
          const streak = getStreak(habit.id);
          const strength = getHabitStrength(habit.id);
          return (
            <motion.div key={habit.id} className="grid grid-cols-[1fr_repeat(7,auto)] gap-1.5 items-center group"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <button onClick={() => onHabitClick(habit)} className="flex items-center gap-2 min-w-0 pr-2 text-left hover:opacity-80 transition-opacity">
                <span className="text-base flex-shrink-0">{habit.icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate flex items-center gap-1">
                    {habit.name}
                    {habit.type === 'negative' && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded">break</span>}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    {timeIcon(habit.timeOfDay)}
                    <span>{habit.trackingMode === 'count' ? `${habit.targetCount}x` : habit.trackingMode === 'timer' ? `${habit.targetDuration}m` : ''}</span>
                    {streak > 0 && <span className="text-orange-500 font-medium">🔥{streak}</span>}
                  </div>
                </div>
              </button>
              {weekDays.map((day: Date) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const active = isHabitActiveOnDate(habit, day);
                const completed = isHabitCompleted(habit.id, dateStr);
                if (habit.trackingMode === 'count') {
                  const log = getLogForDate(habit.id, dateStr);
                  const count = log?.count ?? 0;
                  return <CountCell key={dateStr} count={count} target={habit.targetCount ?? 1} active={active} color={habit.color}
                    onClick={() => handleCountClick(habit.id, dateStr, habit)} />;
                }
                return <HabitCheckCell key={dateStr} completed={completed} active={active} color={habit.color}
                  onClick={() => handleCheck(habit.id, dateStr, habit)} type={habit.type} />;
              })}
            </motion.div>
          );
        })}
      </div>
      {habits.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">No habits yet. Add one to get started! 🌱</div>
      )}
    </motion.div>
  );
}

// ===== MONTH VIEW =====
function MonthView({ habits, isHabitActiveOnDate, isHabitCompleted }: any) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;

  const getDayIntensity = (day: Date) => {
    const active = habits.filter((h: Habit) => isHabitActiveOnDate(h, day));
    if (active.length === 0) return 0;
    const completed = active.filter((h: Habit) => isHabitCompleted(h.id, format(day, 'yyyy-MM-dd')));
    return completed.length / active.length;
  };

  return (
    <motion.div className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <h2 className="font-bold text-gray-800">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} className="aspect-square" />)}
        {days.map(day => {
          const intensity = getDayIntensity(day);
          const isToday = isTodayFn(day);
          return (
            <motion.div key={day.toISOString()}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs relative ${isToday ? 'ring-2 ring-orange-400' : ''}`}
              style={{ backgroundColor: intensity > 0 ? `rgba(16, 185, 129, ${0.1 + intensity * 0.5})` : 'rgba(243, 244, 246, 0.5)' }}
              whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 400 }}>
              <span className={intensity > 0.5 ? 'text-emerald-800 font-bold' : 'text-gray-600'}>{format(day, 'd')}</span>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <span>Less</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map(i => (
          <div key={i} className="w-4 h-4 rounded" style={{ backgroundColor: `rgba(16, 185, 129, ${i})` }} />
        ))}
        <span>More</span>
      </div>
      {/* Per-habit mini heatmaps */}
      <div className="mt-4 space-y-2">
        {habits.slice(0, 5).map((habit: Habit) => (
          <div key={habit.id} className="flex items-center gap-2">
            <span className="text-sm">{habit.icon}</span>
            <span className="text-xs text-gray-600 w-20 truncate">{habit.name}</span>
            <div className="flex gap-0.5 flex-1">
              {days.slice(-28).map((day: Date) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const active = isHabitActiveOnDate(habit, day);
                const completed = isHabitCompleted(habit.id, dateStr);
                return <div key={dateStr} className="flex-1 h-3 rounded-sm"
                  style={{ backgroundColor: !active ? '#f3f4f6' : completed ? habit.color + '80' : habit.color + '15' }} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ===== ANALYTICS VIEW =====
function AnalyticsView({ habits, logs, isHabitActiveOnDate, isHabitCompleted, getStreak, getBestStreak, getCompletionRate, getHabitStrength }: any) {
  const today = new Date();
  const last30Days = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));
  
  // Overall stats
  const totalCompletions = logs.filter((l: any) => l.completed).length;
  const activeHabits = habits.filter((h: Habit) => !h.archived);
  
  // Best day of week
  const dayStats = Array.from({ length: 7 }, (_, i) => {
    const days = last30Days.filter(d => d.getDay() === i);
    let total = 0, completed = 0;
    days.forEach(day => {
      activeHabits.forEach((h: Habit) => {
        if (isHabitActiveOnDate(h, day)) {
          total++;
          if (isHabitCompleted(h.id, format(day, 'yyyy-MM-dd'))) completed++;
        }
      });
    });
    return { day: WEEKDAY_NAMES[i], rate: total > 0 ? completed / total : 0 };
  });
  const bestDay = dayStats.reduce((best, curr) => curr.rate > best.rate ? curr : best, dayStats[0]);

  return (
    <motion.div className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50 space-y-5"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-orange-500" /> Analytics
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-orange-600">{totalCompletions}</div>
          <div className="text-xs text-orange-500">Total Check-ins</div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{activeHabits.length}</div>
          <div className="text-xs text-emerald-500">Active Habits</div>
        </div>
        <div className="bg-purple-50 rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{bestDay.day}</div>
          <div className="text-xs text-purple-500">Best Day ({Math.round(bestDay.rate * 100)}%)</div>
        </div>
        <div className="bg-sky-50 rounded-2xl p-3 text-center">
          <div className="text-2xl font-bold text-sky-600">
            {Math.round(activeHabits.reduce((sum: number, h: Habit) => sum + getCompletionRate(h.id, 7), 0) / Math.max(activeHabits.length, 1))}%
          </div>
          <div className="text-xs text-sky-500">7-day Avg</div>
        </div>
      </div>

      {/* Per-habit stats */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Habit Breakdown</h3>
        <div className="space-y-3">
          {activeHabits.map((habit: Habit) => {
            const streak = getStreak(habit.id);
            const best = getBestStreak(habit.id);
            const rate = getCompletionRate(habit.id, 30);
            const strength = getHabitStrength(habit.id);
            return (
              <div key={habit.id} className="flex items-center gap-3">
                <span className="text-lg">{habit.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate">{habit.name}</span>
                    <span className="text-xs text-gray-400">{rate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: habit.color }}
                      initial={{ width: 0 }} animate={{ width: `${rate}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }} />
                  </div>
                  <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                    <span>🔥 {streak} streak</span>
                    <span>🏆 {best} best</span>
                    <span>💪 {strength}% strength</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day of week chart */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">Best Day of Week</h3>
        <div className="flex items-end gap-1 h-20">
          {dayStats.map((ds, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div className="w-full rounded-t-md bg-gradient-to-t from-orange-400 to-amber-300"
                initial={{ height: 0 }} animate={{ height: `${ds.rate * 100}%` }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 100 }} />
              <span className="text-[9px] text-gray-400">{ds.day}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ===== HABIT DETAIL DIALOG =====
function HabitDetailDialog({ habit, onClose, getStreak, getBestStreak, getCompletionRate, getHabitStrength, logs, isHabitActiveOnDate, isHabitCompleted, getLogForDate, getNotesForHabitDate, addNote, deleteNote, onEdit, onArchive, onDelete }: any) {
  const streak = getStreak(habit.id);
  const bestStreak = getBestStreak(habit.id);
  const rate30 = getCompletionRate(habit.id, 30);
  const rate7 = getCompletionRate(habit.id, 7);
  const strength = getHabitStrength(habit.id);
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState('');
  const historyWeeks = 16;
  const today = new Date();
  const historyDays = Array.from({ length: historyWeeks * 7 }, (_, i) => subDays(today, historyWeeks * 7 - 1 - i));
  const notes = getNotesForHabitDate(habit.id, format(today, 'yyyy-MM-dd'));

  return (
    <motion.div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: habit.color + '20' }}>
              {habit.icon}
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">{habit.name}</h2>
              <p className="text-sm text-gray-500">{habit.description}</p>
              <div className="flex gap-1 mt-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{habit.category}</span>
                {habit.type === 'negative' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600">Break habit</span>}
                {habit.trackingMode === 'count' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">{habit.targetCount}x/day</span>}
                {habit.trackingMode === 'timer' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">{habit.targetDuration}min</span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-orange-50 rounded-2xl p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{streak}</div>
            <div className="text-xs text-orange-500 mt-0.5">Current Streak 🔥</div>
          </div>
          <div className="bg-purple-50 rounded-2xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{bestStreak}</div>
            <div className="text-xs text-purple-500 mt-0.5">Best Streak</div>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-600">{rate30}%</div>
            <div className="text-xs text-emerald-500 mt-0.5">30-day Rate</div>
          </div>
          <div className="bg-sky-50 rounded-2xl p-3 text-center">
            <div className="text-2xl font-bold text-sky-600">{strength}%</div>
            <div className="text-xs text-sky-500 mt-0.5">Habit Strength 💪</div>
          </div>
        </div>

        {/* 16-week history */}
        <div className="mb-5">
          <div className="text-sm font-medium text-gray-600 mb-2">16-Week History</div>
          <div className="space-y-1">
            {Array.from({ length: historyWeeks }, (_, weekIdx) => (
              <div key={weekIdx} className="flex gap-0.5">
                {Array.from({ length: 7 }, (_, dayIdx) => {
                  const day = historyDays[weekIdx * 7 + dayIdx];
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const active = isHabitActiveOnDate(habit, day);
                  const completed = isHabitCompleted(habit.id, dateStr);
                  const log = getLogForDate(habit.id, dateStr);
                  return (
                    <div key={dayIdx} className="flex-1 h-3 rounded-sm relative group cursor-pointer"
                      style={{ backgroundColor: !active ? '#f3f4f6' : completed ? habit.color : habit.color + '15' }}
                      title={`${format(day, 'MMM d')}: ${completed ? (log?.count ? `${log.count}/${habit.targetCount}` : 'Done') : active ? 'Missed' : 'Off day'}`} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <button onClick={() => setShowNotes(!showNotes)} className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
            <StickyNote className="w-4 h-4" /> Notes
            {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showNotes && (
            <div className="space-y-2">
              {notes.length === 0 && <p className="text-xs text-gray-400">No notes for today.</p>}
              {notes.map((note: any) => (
                <div key={note.id} className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg">
                  <span className="text-xs text-gray-600 flex-1">{note.content}</span>
                  <button onClick={() => deleteNote(note.id)} className="text-gray-300 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a note..." className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-orange-400" />
                <button onClick={() => { if (newNote.trim()) { addNote(habit.id, format(today, 'yyyy-MM-dd'), newNote.trim()); setNewNote(''); } }}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium">Add</button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onEdit} className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 flex items-center justify-center gap-2">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button onClick={onArchive} className="py-2.5 px-4 rounded-xl bg-amber-50 text-amber-600 font-medium text-sm hover:bg-amber-100 flex items-center justify-center gap-2">
            <Archive className="w-4 h-4" /> Archive
          </button>
          <button onClick={onDelete} className="py-2.5 px-4 rounded-xl bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===== HABIT FORM DIALOG =====
function HabitFormDialog({ habit, onClose, onSubmit }: {
  habit?: Habit; onClose: () => void; onSubmit: (data: any) => void;
}) {
  const [name, setName] = useState(habit?.name ?? '');
  const [description, setDescription] = useState(habit?.description ?? '');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(habit?.timeOfDay ?? 'morning');
  const [activeDays, setActiveDays] = useState<Weekday[]>(habit?.activeDays ?? [0, 1, 2, 3, 4, 5, 6]);
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0].value);
  const [icon, setIcon] = useState(habit?.icon ?? '🎯');
  const [category, setCategory] = useState(habit?.category ?? 'Other');
  const [type, setType] = useState<HabitType>(habit?.type ?? 'positive');
  const [trackingMode, setTrackingMode] = useState<TrackingMode>(habit?.trackingMode ?? 'binary');
  const [targetCount, setTargetCount] = useState(habit?.targetCount ?? 5);
  const [targetDuration, setTargetDuration] = useState(habit?.targetDuration ?? 10);
  const [scheduleType, setScheduleType] = useState<ScheduleType>(habit?.scheduleType ?? 'daily');
  const [scheduleInterval, setScheduleInterval] = useState(habit?.scheduleInterval ?? 2);
  const [showTemplates, setShowTemplates] = useState(!habit);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const toggleDay = (day: Weekday) => {
    setActiveDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const applyTemplate = (t: any) => {
    setName(t.name); setDescription(t.description);
    setTimeOfDay(t.timeOfDay); setIcon(t.icon); setCategory(t.category);
    if (t.type) setType(t.type);
    setShowTemplates(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(), description: description.trim(), timeOfDay, activeDays, color, icon,
      category, type, trackingMode, targetCount, targetDuration, scheduleType, scheduleInterval,
    });
  };

  if (showTemplates) {
    return (
      <motion.div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto"
          initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Start with a template</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {HABIT_TEMPLATES.map((t, i) => (
              <motion.button key={i} onClick={() => applyTemplate(t)}
                className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-left transition-colors"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <span className="text-2xl">{t.icon}</span>
                <div className="text-sm font-medium text-gray-700 mt-1">{t.name}</div>
                <div className="text-[10px] text-gray-400">{t.category}</div>
              </motion.button>
            ))}
          </div>
          <button onClick={() => setShowTemplates(false)}
            className="w-full py-2.5 rounded-xl bg-orange-50 text-orange-600 font-medium text-sm hover:bg-orange-100">
            Or create from scratch →
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">{habit ? 'Edit Habit' : 'New Habit'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon & Name */}
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowIconPicker(!showIconPicker)}
              className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl hover:bg-gray-200 transition-colors">
              {icon}
            </button>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Habit name"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-gray-800" autoFocus />
          </div>
          {showIconPicker && (
            <div className="grid grid-cols-10 gap-1 p-2 bg-gray-50 rounded-xl max-h-32 overflow-y-auto">
              {HABIT_ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => { setIcon(ic); setShowIconPicker(false); }}
                  className={`w-7 h-7 rounded text-lg flex items-center justify-center ${icon === ic ? 'bg-orange-100 ring-1 ring-orange-300' : 'hover:bg-gray-200'}`}>
                  {ic}
                </button>
              ))}
            </div>
          )}

          <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="What does 'done' look like?"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none text-gray-800" />

          {/* Type */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Habit type</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setType('positive')}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${type === 'positive' ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300' : 'bg-gray-50 text-gray-500'}`}>
                <Check className="w-4 h-4" /> Build (positive)
              </button>
              <button type="button" onClick={() => setType('negative')}
                className={`py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${type === 'negative' ? 'bg-red-100 text-red-700 ring-2 ring-red-300' : 'bg-gray-50 text-gray-500'}`}>
                <X className="w-4 h-4" /> Break (negative)
              </button>
            </div>
          </div>

          {/* Tracking mode */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Tracking mode</label>
            <div className="grid grid-cols-3 gap-2">
              {([['binary', 'Check-off', '✓'], ['count', 'Count', '#'], ['timer', 'Timer', '⏱']] as const).map(([mode, label, sym]) => (
                <button key={mode} type="button" onClick={() => setTrackingMode(mode)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium transition-all ${trackingMode === mode ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' : 'bg-gray-50 text-gray-500'}`}>
                  <span className="text-lg">{sym}</span><br />{label}
                </button>
              ))}
            </div>
            {trackingMode === 'count' && (
              <div className="mt-2">
                <label className="text-xs text-gray-500">Target count per day</label>
                <input type="number" min="1" max="100" value={targetCount} onChange={e => setTargetCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-orange-400 mt-1" />
              </div>
            )}
            {trackingMode === 'timer' && (
              <div className="mt-2">
                <label className="text-xs text-gray-500">Target duration (minutes)</label>
                <input type="number" min="1" max="240" value={targetDuration} onChange={e => setTargetDuration(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-orange-400 mt-1" />
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Category</label>
            <div className="flex gap-1.5 flex-wrap">
              {HABIT_CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${category === c ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Time of day */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Time of day</label>
            <div className="grid grid-cols-4 gap-2">
              {(['morning', 'afternoon', 'evening', 'anytime'] as TimeOfDay[]).map(tod => (
                <button key={tod} type="button" onClick={() => setTimeOfDay(tod)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium transition-all ${timeOfDay === tod ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' : 'bg-gray-50 text-gray-500'}`}>
                  {TIME_OF_DAY_LABELS[tod]}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Schedule</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {([['daily', 'Daily'], ['weekly', 'Specific days'], ['custom', 'Every N days']] as const).map(([st, label]) => (
                <button key={st} type="button" onClick={() => setScheduleType(st)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium transition-all ${scheduleType === st ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' : 'bg-gray-50 text-gray-500'}`}>
                  {label}
                </button>
              ))}
            </div>
            {scheduleType === 'weekly' && (
              <div className="flex gap-1.5">
                {([1,2,3,4,5,6,0] as Weekday[]).map(day => (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${activeDays.includes(day) ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-gray-100 text-gray-500'}`}>
                    {WEEKDAY_NAMES[day]}
                  </button>
                ))}
              </div>
            )}
            {scheduleType === 'custom' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Every</span>
                <input type="number" min="2" max="30" value={scheduleInterval} onChange={e => setScheduleInterval(parseInt(e.target.value) || 2)}
                  className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-sm text-center outline-none focus:border-orange-400" />
                <span className="text-sm text-gray-500">days</span>
              </div>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {HABIT_COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c.value ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c.value }} />
              ))}
            </div>
          </div>

          <button type="submit" disabled={!name.trim()}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium shadow-lg shadow-orange-200 hover:shadow-xl transition-all disabled:opacity-50 mt-6">
            {habit ? 'Save Changes' : 'Create Habit'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ===== REMINDER TOAST =====
function ReminderToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 5000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <motion.div className="fixed top-4 right-4 bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 z-50 border border-orange-100"
      initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><Bell className="w-5 h-5 text-orange-500" /></div>
      <div><div className="text-sm font-medium text-gray-800">{message}</div><div className="text-xs text-gray-400">Time to check in!</div></div>
      <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4 text-gray-400" /></button>
    </motion.div>
  );
}

// ===== MAIN APP =====
export default function App() {
  const {
    habits, activeHabits, logs, todayProgress, todayActiveHabits, todayCompletedHabits,
    weekDays, todayStr, categories,
    toggleHabit, updateLogCount, isHabitCompleted, getLogForDate, isHabitActiveOnDate,
    getStreak, getBestStreak, getCompletionRate, getHabitStrength,
    addHabit, updateHabit, deleteHabit, archiveHabit, unarchiveHabit, reorderHabits,
    deletedHabit, undoDelete, lastAction, undoLastAction,
    addNote, getNotesForHabitDate, deleteNote,
    getWaterForDate, addWater, removeWater, getMealsForDate, toggleMeal,
    getMoodForDate, setMood, reminders, addReminder, toggleReminder, deleteReminder,
  } = useHabits();

  const [view, setView] = useState<'week' | 'month' | 'analytics'>('week');
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showReminders, setShowReminders] = useState(false);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [waterGoal, setWaterGoal] = useState(8);
  const [darkMode, setDarkMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return { text: 'Still up? Rest well.', emoji: '🌙' };
    if (hour < 12) return { text: 'Good morning! Ready to kindle your day?', emoji: '🌅' };
    if (hour < 17) return { text: 'Afternoon — keep the flame alive.', emoji: '☀️' };
    if (hour < 21) return { text: 'Evening — how did your day go?', emoji: '🌇' };
    return { text: 'Night owl — reflect on your wins.', emoji: '✨' };
  }, []);

  useEffect(() => {
    document.title = `Kindling — ${todayCompletedHabits.length}/${todayActiveHabits.length} today`;
  }, [todayCompletedHabits.length, todayActiveHabits.length]);

  // Check if first visit
  useEffect(() => {
    const visited = localStorage.getItem('kindling-visited');
    if (!visited) {
      setShowOnboarding(true);
      localStorage.setItem('kindling-visited', 'true');
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case 'n': if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setEditingHabit(undefined); setShowHabitForm(true); } break;
        case 'w': if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setView('week'); } break;
        case 'm': if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setView('month'); } break;
        case 'a': if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setView('analytics'); } break;
        case 'd': if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setDarkMode(p => !p); } break;
        case '/': e.preventDefault(); document.getElementById('search-input')?.focus(); break;
        case '?': e.preventDefault(); setShowShortcuts(p => !p); break;
        case 'z': if (e.ctrlKey || e.metaKey) { e.preventDefault(); undoLastAction(); } break;
        case 'escape': setShowHabitForm(false); setSelectedHabit(null); setShowReminders(false); setShowShortcuts(false); setShowMenu(false); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoLastAction]);

  // Reminder check
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      reminders.forEach(r => {
        if (r.enabled && r.time === currentTime) setReminderToast(r.message || 'Time for your habit!');
      });
    };
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  // Data export
  const exportData = (exportFormat: 'json' | 'csv') => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    if (exportFormat === 'json') {
      const data = { habits, logs, waterLogs: JSON.parse(localStorage.getItem('kindling-water') || '[]'),
        mealLogs: JSON.parse(localStorage.getItem('kindling-meals') || '[]'), moodLogs: JSON.parse(localStorage.getItem('kindling-moods') || '[]'),
        reminders, notes: JSON.parse(localStorage.getItem('kindling-notes') || '[]'), exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `kindling-${dateStr}.json`; a.click();
      URL.revokeObjectURL(url);
    } else {
      let csv = 'Date,Habit,Category,Completed,Count,Duration,Note\n';
      logs.forEach((l: any) => {
        const habit = habits.find((h: Habit) => h.id === l.habitId);
        if (habit) csv += `${l.date},"${habit.name}","${habit.category}",${l.completed},${l.count || ''},${l.duration || ''},"${l.note || ''}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `kindling-${dateStr}.csv`; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.habits) localStorage.setItem('kindling-habits', JSON.stringify(data.habits));
        if (data.logs) localStorage.setItem('kindling-logs', JSON.stringify(data.logs));
        if (data.waterLogs) localStorage.setItem('kindling-water', JSON.stringify(data.waterLogs));
        if (data.mealLogs) localStorage.setItem('kindling-meals', JSON.stringify(data.mealLogs));
        if (data.moodLogs) localStorage.setItem('kindling-moods', JSON.stringify(data.moodLogs));
        if (data.reminders) localStorage.setItem('kindling-reminders', JSON.stringify(data.reminders));
        if (data.notes) localStorage.setItem('kindling-notes', JSON.stringify(data.notes));
        window.location.reload();
      } catch { alert('Invalid backup file'); }
    };
    reader.readAsText(file);
  };

  const handleAddHabit = (data: any) => {
    if (editingHabit) { updateHabit(editingHabit.id, data); }
    else { addHabit(data); }
    setShowHabitForm(false); setEditingHabit(undefined);
  };

  const handleEditHabit = (habit: Habit) => { setSelectedHabit(null); setEditingHabit(habit); setShowHabitForm(true); };
  const handleDeleteHabit = (habit: Habit) => { deleteHabit(habit.id); setSelectedHabit(null); };
  const handleArchiveHabit = (habit: Habit) => { archiveHabit(habit.id); setSelectedHabit(null); };

  // Filtered habits for display
  const displayHabits = useMemo(() => {
    let filtered = showArchived ? habits.filter(h => h.archived) : activeHabits;
    if (searchQuery) filtered = filtered.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (filterCategory !== 'all') filtered = filtered.filter(h => h.category === filterCategory);
    return filtered;
  }, [habits, activeHabits, searchQuery, filterCategory, showArchived]);

  return (
    <div className={`min-h-screen relative transition-colors duration-500 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50'}`}>
      <EmberBackground />

      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
              <FlameIcon />
              <h2 className="text-2xl font-bold text-gray-800 mt-4">Welcome to Kindling</h2>
              <p className="text-gray-500 mt-2 text-sm">Your daily habit tracker with a soul. Track habits, build streaks, and light your daily fire.</p>
              <div className="mt-4 space-y-2 text-left text-sm text-gray-600">
                <p>✨ <strong>N</strong> — New habit</p>
                <p>📅 <strong>W/M/A</strong> — Switch views</p>
                <p>🌙 <strong>D</strong> — Dark mode</p>
                <p>↩️ <strong>Ctrl+Z</strong> — Undo last action</p>
                <p>❓ <strong>?</strong> — All shortcuts</p>
              </div>
              <button onClick={() => setShowOnboarding(false)}
                className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium shadow-lg shadow-orange-200">
                Let's get started 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <AnimatePresence>
        {reminderToast && <ReminderToast message={reminderToast} onDismiss={() => setReminderToast(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {deletedHabit && (
          <motion.div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 z-50"
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}>
            <span className="text-sm">Deleted "{deletedHabit.name}"</span>
            <button onClick={undoDelete} className="text-orange-400 font-medium text-sm flex items-center gap-1 hover:text-orange-300">
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {lastAction && (
          <motion.div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-gray-800/90 text-white rounded-xl px-4 py-2 shadow-xl flex items-center gap-2 z-40 text-xs"
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            transition={{ delay: 0.5 }}>
            <button onClick={undoLastAction} className="flex items-center gap-1 hover:text-orange-300">
              <Undo2 className="w-3 h-3" /> Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <motion.header className="mb-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FlameIcon />
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Kindling</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowShortcuts(true)} className={`w-9 h-9 rounded-full ${darkMode ? 'bg-gray-800/60 text-gray-300' : 'bg-white/60 text-gray-500'} backdrop-blur-sm flex items-center justify-center transition-all`} title="Shortcuts (?)">
                <Command className="w-4 h-4" />
              </button>
              <button onClick={() => setShowMenu(!showMenu)} className={`w-9 h-9 rounded-full ${darkMode ? 'bg-gray-800/60 text-gray-300' : 'bg-white/60 text-gray-500'} backdrop-blur-sm flex items-center justify-center transition-all`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>
              <button onClick={() => { setEditingHabit(undefined); setShowHabitForm(true); }}
                className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-105 transition-all" title="New habit (N)">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-8`}>{greeting.emoji} {greeting.text}</p>

          {/* Dropdown menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div className={`absolute right-4 mt-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border p-2 z-50 min-w-[200px]`}
                initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}>
                <button onClick={() => { setDarkMode(!darkMode); setShowMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {darkMode ? 'Light mode' : 'Dark mode'} <span className="ml-auto text-xs opacity-50">D</span>
                </button>
                <button onClick={() => { setShowArchived(!showArchived); setShowMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Archive className="w-4 h-4" /> {showArchived ? 'Show active' : 'Show archived'}
                </button>
                <button onClick={() => { setShowReminders(true); setShowMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Bell className="w-4 h-4" /> Reminders
                </button>
                <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
                <button onClick={() => { exportData('json'); setShowMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Download className="w-4 h-4" /> Export JSON
                </button>
                <button onClick={() => { exportData('csv'); setShowMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <label className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} cursor-pointer`}>
                  <Upload className="w-4 h-4" /> Import data
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
                <button onClick={() => { window.print(); setShowMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Printer className="w-4 h-4" /> Print view
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Search & Filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input id="search-input" type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search habits... (/)" className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-gray-800/60 text-gray-200 border-gray-700' : 'bg-white/60 text-gray-700 border-white/50'} border backdrop-blur-sm`} />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className={`px-3 py-2 rounded-xl text-sm outline-none ${darkMode ? 'bg-gray-800/60 text-gray-200 border-gray-700' : 'bg-white/60 text-gray-700 border-white/50'} border backdrop-blur-sm`}>
            <option value="all">All</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Today's progress */}
        <TiltCard className="mb-4">
          <motion.div className={`${darkMode ? 'bg-gray-800/70 border-gray-700/50' : 'bg-white/70 border-white/50'} backdrop-blur-md rounded-3xl p-5 shadow-lg border`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Today</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{format(new Date(), 'EEEE, MMMM d')}</p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{todayProgress}%</div>
                <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{todayCompletedHabits.length}/{todayActiveHabits.length} done</div>
              </div>
            </div>
            <ShimmerProgress percent={todayProgress} />
            {todayProgress === 100 && todayActiveHabits.length > 0 && (
              <motion.div className="mt-2 text-center text-sm text-emerald-600 font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                🎉 All habits complete! Amazing day!
              </motion.div>
            )}
          </motion.div>
        </TiltCard>

        {/* View toggle */}
        <div className="flex gap-2 mb-4">
          {([['week', Calendar, 'W'], ['month', BarChart3, 'M'], ['analytics', TrendingUp, 'A']] as const).map(([v, Icon, key]) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${view === v ? (darkMode ? 'bg-gray-800 shadow-md text-gray-100' : 'bg-white shadow-md text-gray-800') : (darkMode ? 'text-gray-400 hover:bg-gray-800/50' : 'text-gray-500 hover:bg-white/50')}`}>
              <Icon className="w-4 h-4" /> {v.charAt(0).toUpperCase() + v.slice(1)} <span className="text-xs opacity-50 hidden sm:inline">({key})</span>
            </button>
          ))}
        </div>

        {/* Views */}
        <AnimatePresence mode="wait">
          {view === 'week' && (
            <motion.div key="week" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <WeekView habits={displayHabits} weekDays={weekDays} todayStr={todayStr}
                isHabitCompleted={isHabitCompleted} isHabitActiveOnDate={isHabitActiveOnDate}
                toggleHabit={toggleHabit} getStreak={getStreak} getLogForDate={getLogForDate}
                updateLogCount={updateLogCount} getHabitStrength={getHabitStrength}
                onHabitClick={setSelectedHabit} reorderHabits={reorderHabits} />
            </motion.div>
          )}
          {view === 'month' && (
            <motion.div key="month" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <MonthView habits={activeHabits} isHabitActiveOnDate={isHabitActiveOnDate} isHabitCompleted={isHabitCompleted} />
            </motion.div>
          )}
          {view === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <AnalyticsView habits={activeHabits} logs={logs} isHabitActiveOnDate={isHabitActiveOnDate}
                isHabitCompleted={isHabitCompleted} getStreak={getStreak} getBestStreak={getBestStreak}
                getCompletionRate={getCompletionRate} getHabitStrength={getHabitStrength} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wellness section */}
        <div className="grid grid-cols-1 gap-4 mt-4">
          <WaterBottle glasses={getWaterForDate(todayStr)} goal={waterGoal}
            onAdd={() => { addWater(todayStr); if (getWaterForDate(todayStr) + 1 >= waterGoal) confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 }, colors: ['#0ea5e9', '#38bdf8', '#7dd3fc'] }); }}
            onRemove={() => removeWater(todayStr)} />
          <MoodTracker mood={getMoodForDate(todayStr)} onSetMood={(m: 1|2|3|4|5) => setMood(todayStr, m)} />
          <MealTracker meals={getMealsForDate(todayStr)} onToggle={(meal) => toggleMeal(todayStr, meal)} />
        </div>

        {/* Habit list */}
        <motion.div className={`mt-4 ${darkMode ? 'bg-gray-800/70 border-gray-700/50' : 'bg-white/70 border-white/50'} backdrop-blur-md rounded-3xl p-5 shadow-lg border`}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              {showArchived ? '📦 Archived' : 'Your Habits'} ({displayHabits.length})
            </h3>
          </div>
          <div className="space-y-2">
            {displayHabits.map((habit: Habit) => (
              <motion.button key={habit.id} onClick={() => setSelectedHabit(habit)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-white/80'} transition-all text-left group`}
                whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                <span className="text-lg">{habit.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'} truncate flex items-center gap-1`}>
                    {habit.name}
                    {habit.archived && <span className="text-[9px] bg-gray-200 text-gray-500 px-1 rounded">archived</span>}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{habit.description} • {habit.category}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {getStreak(habit.id) > 0 && <span className="text-orange-500 font-medium">🔥{getStreak(habit.id)}</span>}
                  {habit.archived && (
                    <button onClick={(e) => { e.stopPropagation(); unarchiveHabit(habit.id); }}
                      className="text-emerald-500 hover:text-emerald-600 text-xs">Restore</button>
                  )}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </motion.button>
            ))}
          </div>
          {displayHabits.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              {searchQuery ? 'No habits match your search.' : showArchived ? 'No archived habits.' : 'No habits yet. Add one to get started! 🌱'}
            </div>
          )}
        </motion.div>

        {/* Weekly summary */}
        <AnimatePresence>
          {view === 'week' && (
            <motion.div className="mt-4 mb-20" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ delay: 0.5 }}>
              <TiltCard className={`${darkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-white/50'} backdrop-blur-md rounded-2xl p-3 shadow-lg border`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📊</span>
                    <div>
                      <div className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>This week</div>
                      <div className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {(() => {
                          const wc = weekDays.reduce((acc: number, day: Date) => {
                            const ds = format(day, 'yyyy-MM-dd');
                            return acc + activeHabits.filter((h: Habit) => isHabitActiveOnDate(h, day) && isHabitCompleted(h.id, ds)).length;
                          }, 0);
                          const wt = weekDays.reduce((acc: number, day: Date) => acc + activeHabits.filter((h: Habit) => isHabitActiveOnDate(h, day)).length, 0);
                          return `${wc}/${wt} habits • ${wt > 0 ? Math.round((wc / wt) * 100) : 0}%`;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {weekDays.map((day: Date) => {
                      const ds = format(day, 'yyyy-MM-dd');
                      const active = activeHabits.filter((h: Habit) => isHabitActiveOnDate(h, day));
                      const completed = active.filter((h: Habit) => isHabitCompleted(h.id, ds));
                      const pct = active.length > 0 ? completed.length / active.length : 0;
                      return <div key={ds} className="w-2 h-6 rounded-full" style={{ backgroundColor: `rgba(16, 185, 129, ${0.1 + pct * 0.8})` }}
                        title={`${format(day, 'EEE')}: ${completed.length}/${active.length}`} />;
                    })}
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`text-center text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'} mt-4 pb-4`}>
          Kindling — Light your daily fire 🔥
        </div>
      </div>

      {/* Dialogs */}
      <AnimatePresence>
        {showHabitForm && <HabitFormDialog habit={editingHabit} onClose={() => { setShowHabitForm(false); setEditingHabit(undefined); }} onSubmit={handleAddHabit} />}
        {selectedHabit && (
          <HabitDetailDialog habit={selectedHabit} onClose={() => setSelectedHabit(null)}
            getStreak={getStreak} getBestStreak={getBestStreak} getCompletionRate={getCompletionRate} getHabitStrength={getHabitStrength}
            logs={logs} isHabitActiveOnDate={isHabitActiveOnDate} isHabitCompleted={isHabitCompleted} getLogForDate={getLogForDate}
            getNotesForHabitDate={getNotesForHabitDate} addNote={addNote} deleteNote={deleteNote}
            onEdit={() => handleEditHabit(selectedHabit)} onArchive={() => handleArchiveHabit(selectedHabit)} onDelete={() => handleDeleteHabit(selectedHabit)} />
        )}
      </AnimatePresence>

      {/* Reminders panel */}
      <AnimatePresence>
        {showReminders && (
          <motion.div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReminders(false)}>
            <motion.div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-sm shadow-2xl`}
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Reminders</h2>
                <button onClick={() => setShowReminders(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              {reminders.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No reminders set yet.</p> : (
                <div className="space-y-2 mb-4">
                  {reminders.map(r => (
                    <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <button onClick={() => toggleReminder(r.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${r.enabled ? 'bg-orange-100 text-orange-500' : 'bg-gray-200 text-gray-400'}`}>
                        {r.enabled ? <Bell className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{r.message}</div>
                        <div className="text-xs text-gray-400">{r.time}</div>
                      </div>
                      <button onClick={() => deleteReminder(r.id)} className="p-1 text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => {
                const habit = activeHabits[0];
                if (habit) addReminder({ habitId: habit.id, time: '09:00', enabled: true, message: `Time for ${habit.name}!` });
              }} className="w-full py-2.5 rounded-xl bg-orange-50 text-orange-600 font-medium text-sm hover:bg-orange-100 flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add Reminder
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowShortcuts(false)}>
            <motion.div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-sm shadow-2xl`}
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Keyboard Shortcuts</h2>
                <button onClick={() => setShowShortcuts(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-2">
                {[
                  { key: 'N', desc: 'New habit' }, { key: 'W', desc: 'Week view' }, { key: 'M', desc: 'Month view' },
                  { key: 'A', desc: 'Analytics view' }, { key: 'D', desc: 'Toggle dark mode' }, { key: '/', desc: 'Search habits' },
                  { key: 'Ctrl+Z', desc: 'Undo last action' }, { key: '?', desc: 'Show shortcuts' }, { key: 'Esc', desc: 'Close dialogs' },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between py-1.5">
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{s.desc}</span>
                    <kbd className={`px-2 py-1 rounded-lg text-xs font-mono font-bold ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{s.key}</kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
