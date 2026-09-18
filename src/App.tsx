import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, addDays, subMonths, addMonths, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isToday as isTodayFn, getDay } from 'date-fns';
import { Plus, X, Trash2, Edit3, ChevronLeft, ChevronRight, Droplets, UtensilsCrossed, Bell, Check, Flame, Calendar, BarChart3, Undo2, Sun, Moon, Sunrise, Sparkles, Download, Upload, Volume2, VolumeX, Command } from 'lucide-react';
import { useHabits } from './hooks/useHabits';
import { Habit, TimeOfDay, Weekday, HABIT_COLORS, TIME_OF_DAY_LABELS, WEEKDAY_NAMES } from './types';
import confetti from 'canvas-confetti';

// ===== SOUND EFFECTS =====
function playCheckSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* ignore */ }
}

function playUncheckSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.1);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch { /* ignore */ }
}

// ===== 3D TILT CARD =====
function TiltCard({ children, className = '', intensity = 5 }: { children: React.ReactNode; className?: string; intensity?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;
    ref.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  return (
    <div
      ref={ref}
      className={`transition-transform duration-200 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

// ===== SHIMMER PROGRESS BAR =====
function ShimmerProgress({ percent, className = '' }: { percent: number; className?: string }) {
  return (
    <div className={`h-3 bg-gray-100 rounded-full overflow-hidden relative ${className}`}>
      <motion.div
        className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full relative overflow-hidden"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
        />
      </motion.div>
    </div>
  );
}

// ===== MOTIVATIONAL GREETING =====
function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 6) return { text: 'Still up? Rest well.', emoji: '🌙' };
  if (hour < 12) return { text: 'Good morning! Ready to kindle your day?', emoji: '🌅' };
  if (hour < 17) return { text: 'Afternoon — keep the flame alive.', emoji: '☀️' };
  if (hour < 21) return { text: 'Evening — how did your day go?', emoji: '🌇' };
  return { text: 'Night owl — reflect on your wins.', emoji: '✨' };
}

// ===== EMBER BACKGROUND =====
function EmberBackground() {
  const embers = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 8 + Math.random() * 12,
    size: 2 + Math.random() * 4,
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Paper grain texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />
      {/* Floating embers */}
      {embers.map(ember => (
        <motion.div
          key={ember.id}
          className="absolute rounded-full"
          style={{
            left: `${ember.x}%`,
            bottom: '-10px',
            width: ember.size,
            height: ember.size,
            background: `radial-gradient(circle, rgba(251, 146, 60, 0.8), rgba(251, 146, 60, 0))`,
          }}
          animate={{
            y: [0, -800],
            x: [0, Math.sin(ember.id) * 50],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: ember.duration,
            delay: ember.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// ===== FLAME ICON =====
function FlameIcon({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{ scale: [1, 1.05, 1], rotate: [-1, 1, -1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Flame className="w-6 h-6 text-orange-500" />
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Flame className="w-6 h-6 text-amber-400 blur-[1px]" />
      </motion.div>
    </motion.div>
  );
}

// ===== WATER BOTTLE =====
function WaterBottle({ glasses, goal, onAdd, onRemove }: { glasses: number; goal: number; onAdd: () => void; onRemove: () => void }) {
  const fillPercent = Math.min((glasses / goal) * 100, 100);
  const isComplete = glasses >= goal;

  return (
    <motion.div
      className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50"
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Droplets className="w-5 h-5 text-sky-500" />
        <h3 className="font-semibold text-gray-800">Water Intake</h3>
        <span className="ml-auto text-sm text-gray-500">{glasses}/{goal} glasses</span>
      </div>
      
      <div className="flex items-end gap-4">
        {/* Bottle */}
        <div className="relative w-16 h-32 rounded-b-2xl rounded-t-lg border-2 border-sky-200 overflow-hidden bg-sky-50/50">
          {/* Water fill */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-400 to-sky-300"
            animate={{ height: `${fillPercent}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          >
            {/* Wave effect */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-2 bg-sky-300/50 rounded-full"
              animate={{ x: [-5, 5, -5], scaleY: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
          {/* Bottle neck */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-3 bg-sky-100 border-b border-sky-200 rounded-b-sm" />
        </div>

        {/* Controls */}
        <div className="flex-1">
          <div className="flex gap-2 mb-3">
            <motion.button
              onClick={onRemove}
              disabled={glasses === 0}
              className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold disabled:opacity-30 hover:bg-sky-200 transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              −
            </motion.button>
            <motion.button
              onClick={onAdd}
              className="flex-1 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-medium text-sm hover:bg-sky-600 transition-colors shadow-md shadow-sky-200"
              whileTap={{ scale: 0.95 }}
            >
              <Droplets className="w-4 h-4 mr-1.5" />
              Add a glass
            </motion.button>
          </div>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-emerald-600 font-medium flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Goal reached! 🎉
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ===== MEAL TRACKER =====
function MealTracker({ meals, onToggle }: { 
  meals: { breakfast: boolean; lunch: boolean; dinner: boolean; snack: boolean };
  onToggle: (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
}) {
  const mealItems: { key: 'breakfast' | 'lunch' | 'dinner' | 'snack'; label: string; emoji: string }[] = [
    { key: 'breakfast', label: 'Breakfast', emoji: '🥣' },
    { key: 'lunch', label: 'Lunch', emoji: '🥗' },
    { key: 'dinner', label: 'Dinner', emoji: '🍽️' },
    { key: 'snack', label: 'Snack', emoji: '🍎' },
  ];

  const completed = Object.values(meals).filter(Boolean).length;

  return (
    <motion.div
      className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50"
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <UtensilsCrossed className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-gray-800">Today's Meals</h3>
        <span className="ml-auto text-sm text-gray-500">{completed}/4</span>
      </div>
      
      {/* Plate visualization */}
      <div className="relative w-24 h-24 mx-auto mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-amber-100 bg-amber-50/50" />
        <motion.div
          className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-200 to-orange-200"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {completed === 4 ? '🎉' : completed > 0 ? '🍴' : '🍽️'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {mealItems.map(item => (
          <motion.button
            key={item.key}
            onClick={() => onToggle(item.key)}
            className={`p-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
              meals[item.key]
                ? 'bg-emerald-100 text-emerald-700 shadow-sm'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
            {meals[item.key] && <Check className="w-3.5 h-3.5 ml-auto" />}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ===== HABIT CHECK CELL =====
function HabitCheckCell({ completed, active, color, onClick }: {
  completed: boolean;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={!active}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
        !active ? 'bg-gray-100/50 cursor-default' :
        completed ? 'shadow-md' : 'bg-white/60 hover:bg-white/90 border border-gray-200/50'
      }`}
      style={completed ? { backgroundColor: color + '20', borderColor: color + '40' } : {}}
      whileTap={active ? { scale: 0.85 } : {}}
      whileHover={active ? { scale: 1.1 } : {}}
    >
      {completed ? (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <Check className="w-4 h-4" style={{ color }} />
        </motion.div>
      ) : active ? (
        <div className="w-2 h-2 rounded-full bg-gray-300" />
      ) : null}
    </motion.button>
  );
}

// ===== WEEK VIEW =====
function WeekView({ habits, weekDays, todayStr, isHabitCompleted, isHabitActiveOnDate, toggleHabit, getStreak }: {
  habits: Habit[];
  weekDays: Date[];
  todayStr: string;
  isHabitCompleted: (id: string, date: string) => boolean;
  isHabitActiveOnDate: (h: Habit, d: Date) => boolean;
  toggleHabit: (id: string, date: string) => void;
  getStreak: (id: string) => number;
}) {
  const handleCheck = (habitId: string, date: string) => {
    const wasCompleted = isHabitCompleted(habitId, date);
    toggleHabit(habitId, date);
    if (!wasCompleted) {
      playCheckSound();
      // Small confetti burst
      confetti({
        particleCount: 8,
        spread: 30,
        startVelocity: 15,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#f59e0b', '#10b981', '#8b5cf6'],
        ticks: 60,
        gravity: 1.5,
        scalar: 0.8,
      });
    } else {
      playUncheckSound();
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

  return (
    <motion.div
      className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800 text-lg">This Week</h2>
        <div className="text-xs text-gray-400">
          {format(weekDays[0], 'MMM d')} – {format(weekDays[6], 'MMM d')}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[1fr_repeat(7,auto)] gap-1.5 mb-3">
        <div />
        {weekDays.map(day => {
          const isToday = format(day, 'yyyy-MM-dd') === todayStr;
          return (
            <div key={day.toISOString()} className={`w-9 text-center text-xs font-medium ${isToday ? 'text-orange-600' : 'text-gray-400'}`}>
              <div>{WEEKDAY_NAMES[getDay(day)]}</div>
              <div className={`text-sm font-bold ${isToday ? 'text-orange-600' : 'text-gray-600'}`}>
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Habit rows */}
      <div className="space-y-2">
        {habits.map(habit => {
          const streak = getStreak(habit.id);
          return (
            <motion.div
              key={habit.id}
              className="grid grid-cols-[1fr_repeat(7,auto)] gap-1.5 items-center"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{habit.name}</div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    {timeIcon(habit.timeOfDay)}
                    <span>{TIME_OF_DAY_LABELS[habit.timeOfDay]}</span>
                    {streak > 0 && (
                      <span className="ml-1 text-orange-500 font-medium">🔥{streak}</span>
                    )}
                  </div>
                </div>
              </div>
              {weekDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const active = isHabitActiveOnDate(habit, day);
                const completed = isHabitCompleted(habit.id, dateStr);
                return (
                  <HabitCheckCell
                    key={dateStr}
                    completed={completed}
                    active={active}
                    color={habit.color}
                    onClick={() => handleCheck(habit.id, dateStr)}
                  />
                );
              })}
            </motion.div>
          );
        })}
      </div>

      {habits.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No habits yet. Add one to get started! 🌱
        </div>
      )}
    </motion.div>
  );
}

// ===== MONTH VIEW =====
function MonthView({ habits, logs, isHabitActiveOnDate, isHabitCompleted }: {
  habits: Habit[];
  logs: { habitId: string; date: string; completed: boolean }[];
  isHabitActiveOnDate: (h: Habit, d: Date) => boolean;
  isHabitCompleted: (id: string, date: string) => boolean;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Pad start of month
  const startPadding = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;

  const getDayIntensity = (day: Date) => {
    const activeHabits = habits.filter(h => isHabitActiveOnDate(h, day));
    if (activeHabits.length === 0) return 0;
    const completed = activeHabits.filter(h => isHabitCompleted(h.id, format(day, 'yyyy-MM-dd')));
    return completed.length / activeHabits.length;
  };

  return (
    <motion.div
      className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <h2 className="font-bold text-gray-800">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}
        {days.map(day => {
          const intensity = getDayIntensity(day);
          const isToday = isTodayFn(day);
          return (
            <motion.div
              key={day.toISOString()}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs relative ${
                isToday ? 'ring-2 ring-orange-400' : ''
              }`}
              style={{
                backgroundColor: intensity > 0 
                  ? `rgba(16, 185, 129, ${0.1 + intensity * 0.5})` 
                  : 'rgba(243, 244, 246, 0.5)',
              }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span className={`${intensity > 0.5 ? 'text-emerald-800 font-bold' : 'text-gray-600'}`}>
                {format(day, 'd')}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Habit heatmap legend */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
        <span>Less</span>
        {[0.1, 0.3, 0.5, 0.7, 0.9].map(intensity => (
          <div
            key={intensity}
            className="w-4 h-4 rounded"
            style={{ backgroundColor: `rgba(16, 185, 129, ${intensity})` }}
          />
        ))}
        <span>More</span>
      </div>

      {/* Per-habit mini heatmaps */}
      <div className="mt-4 space-y-2">
        {habits.slice(0, 4).map(habit => (
          <div key={habit.id} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: habit.color }} />
            <span className="text-xs text-gray-600 w-20 truncate">{habit.name}</span>
            <div className="flex gap-0.5 flex-1">
              {days.slice(-28).map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const active = isHabitActiveOnDate(habit, day);
                const completed = isHabitCompleted(habit.id, dateStr);
                return (
                  <div
                    key={dateStr}
                    className="flex-1 h-3 rounded-sm"
                    style={{
                      backgroundColor: !active ? '#f3f4f6' : completed ? habit.color + '80' : habit.color + '15',
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ===== HABIT DETAIL DIALOG =====
function HabitDetailDialog({ habit, onClose, getStreak, getBestStreak, getCompletionRate, logs, isHabitActiveOnDate, isHabitCompleted, onEdit, onDelete }: {
  habit: Habit;
  onClose: () => void;
  getStreak: (id: string) => number;
  getBestStreak: (id: string) => number;
  getCompletionRate: (id: string, days?: number) => number;
  logs: { habitId: string; date: string; completed: boolean }[];
  isHabitActiveOnDate: (h: Habit, d: Date) => boolean;
  isHabitCompleted: (id: string, date: string) => boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const streak = getStreak(habit.id);
  const bestStreak = getBestStreak(habit.id);
  const rate30 = getCompletionRate(habit.id, 30);
  const rate7 = getCompletionRate(habit.id, 7);

  // Last 16 weeks history
  const historyWeeks = 16;
  const today = new Date();
  const historyDays = Array.from({ length: historyWeeks * 7 }, (_, i) => subDays(today, historyWeeks * 7 - 1 - i));

  return (
    <motion.div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: habit.color + '20' }}>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: habit.color }} />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">{habit.name}</h2>
              <p className="text-sm text-gray-500">{habit.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Stats grid */}
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
            <div className="text-2xl font-bold text-sky-600">{rate7}%</div>
            <div className="text-xs text-sky-500 mt-0.5">7-day Rate</div>
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
                  return (
                    <div
                      key={dayIdx}
                      className="flex-1 h-3 rounded-sm"
                      style={{
                        backgroundColor: !active ? '#f3f4f6' : completed ? habit.color : habit.color + '15',
                      }}
                      title={`${format(day, 'MMM d')}: ${completed ? 'Done' : active ? 'Missed' : 'Off day'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={onDelete}
            className="py-2.5 px-4 rounded-xl bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ===== HABIT FORM DIALOG =====
function HabitFormDialog({ habit, onClose, onSubmit }: {
  habit?: Habit;
  onClose: () => void;
  onSubmit: (data: Omit<Habit, 'id' | 'createdAt'>) => void;
}) {
  const [name, setName] = useState(habit?.name ?? '');
  const [description, setDescription] = useState(habit?.description ?? '');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(habit?.timeOfDay ?? 'morning');
  const [activeDays, setActiveDays] = useState<Weekday[]>(habit?.activeDays ?? [0, 1, 2, 3, 4, 5, 6]);
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0].value);

  const toggleDay = (day: Weekday) => {
    setActiveDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim(), timeOfDay, activeDays, color });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">{habit ? 'Edit Habit' : 'New Habit'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Morning meditation"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-800"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">What to do</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g., 10 minutes of mindful breathing"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-800"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Time of day</label>
            <div className="grid grid-cols-4 gap-2">
              {(['morning', 'afternoon', 'evening', 'anytime'] as TimeOfDay[]).map(tod => (
                <button
                  key={tod}
                  type="button"
                  onClick={() => setTimeOfDay(tod)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                    timeOfDay === tod
                      ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {TIME_OF_DAY_LABELS[tod]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Days it counts</label>
            <div className="flex gap-1.5">
              {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-9 h-9 rounded-lg text-xs font-medium transition-all ${
                    activeDays.includes(day)
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {WEEKDAY_NAMES[day]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {HABIT_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c.value ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.value, outlineColor: color === c.value ? c.value : undefined }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium shadow-lg shadow-orange-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {habit ? 'Save Changes' : 'Create Habit'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ===== REMINDER TOAST =====
function ReminderToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      className="fixed top-4 right-4 bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-3 z-50 border border-orange-100"
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
        <Bell className="w-5 h-5 text-orange-500" />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-800">{message}</div>
        <div className="text-xs text-gray-400">Time to check in!</div>
      </div>
      <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-gray-100">
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </motion.div>
  );
}

// ===== MAIN APP =====
export default function App() {
  const {
    habits,
    logs,
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
    deletedHabit,
    undoDelete,
    getWaterForDate,
    addWater,
    removeWater,
    getMealsForDate,
    toggleMeal,
    reminders,
    addReminder,
    toggleReminder,
    deleteReminder,
  } = useHabits();

  const [view, setView] = useState<'week' | 'month'>('week');
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showReminders, setShowReminders] = useState(false);
  const [reminderToast, setReminderToast] = useState<string | null>(null);
  const [waterGoal, setWaterGoal] = useState(8);
  const [darkMode, setDarkMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const greeting = useMemo(() => getGreeting(), []);

  // Update document title
  useEffect(() => {
    document.title = `Kindling — ${todayCompletedHabits.length}/${todayActiveHabits.length} today`;
  }, [todayCompletedHabits.length, todayActiveHabits.length]);

  // Simple reminder check
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      reminders.forEach(r => {
        if (r.enabled && r.time === currentTime) {
          setReminderToast(r.message || `Time for your habit!`);
        }
      });
    };
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'n':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setEditingHabit(undefined);
            setShowHabitForm(true);
          }
          break;
        case 'w':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setView('week');
          }
          break;
        case 'm':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setView('month');
          }
          break;
        case 'd':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setDarkMode(prev => !prev);
          }
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts(prev => !prev);
          break;
        case 'escape':
          setShowHabitForm(false);
          setSelectedHabit(null);
          setShowReminders(false);
          setShowShortcuts(false);
          setShowMenu(false);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Data export
  const exportData = () => {
    const data = {
      habits,
      logs,
      waterLogs: JSON.parse(localStorage.getItem('kindling-water') || '[]'),
      mealLogs: JSON.parse(localStorage.getItem('kindling-meals') || '[]'),
      reminders,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kindling-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Data import
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.habits) localStorage.setItem('kindling-habits', JSON.stringify(data.habits));
        if (data.logs) localStorage.setItem('kindling-logs', JSON.stringify(data.logs));
        if (data.waterLogs) localStorage.setItem('kindling-water', JSON.stringify(data.waterLogs));
        if (data.mealLogs) localStorage.setItem('kindling-meals', JSON.stringify(data.mealLogs));
        if (data.reminders) localStorage.setItem('kindling-reminders', JSON.stringify(data.reminders));
        window.location.reload();
      } catch {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleAddHabit = (data: Omit<Habit, 'id' | 'createdAt'>) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, data);
    } else {
      addHabit(data);
    }
    setShowHabitForm(false);
    setEditingHabit(undefined);
  };

  const handleEditHabit = (habit: Habit) => {
    setSelectedHabit(null);
    setEditingHabit(habit);
    setShowHabitForm(true);
  };

  const handleDeleteHabit = (habit: Habit) => {
    deleteHabit(habit.id);
    setSelectedHabit(null);
  };

  return (
    <div className={`min-h-screen relative transition-colors duration-500 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50'
    }`}>
      <EmberBackground />

      {/* Reminder toasts */}
      <AnimatePresence>
        {reminderToast && (
          <ReminderToast message={reminderToast} onDismiss={() => setReminderToast(null)} />
        )}
      </AnimatePresence>

      {/* Undo delete toast */}
      <AnimatePresence>
        {deletedHabit && (
          <motion.div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 z-50"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            <span className="text-sm">Deleted "{deletedHabit.name}"</span>
            <button onClick={undoDelete} className="text-orange-400 font-medium text-sm flex items-center gap-1 hover:text-orange-300">
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className={`relative z-10 max-w-lg mx-auto px-4 py-6 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
        {/* Header */}
        <motion.header
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FlameIcon />
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Kindling</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShortcuts(true)}
                className={`w-9 h-9 rounded-full ${darkMode ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80' : 'bg-white/60 text-gray-500 hover:bg-white/80'} backdrop-blur-sm flex items-center justify-center transition-all`}
                title="Keyboard shortcuts (?)"
              >
                <Command className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`w-9 h-9 rounded-full ${darkMode ? 'bg-gray-800/60 text-gray-300 hover:bg-gray-700/80' : 'bg-white/60 text-gray-500 hover:bg-white/80'} backdrop-blur-sm flex items-center justify-center transition-all`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>
              <button
                onClick={() => { setEditingHabit(undefined); setShowHabitForm(true); }}
                className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200 hover:shadow-xl hover:scale-105 transition-all"
                title="New habit (N)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Greeting */}
          <motion.p
            className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} ml-8`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {greeting.emoji} {greeting.text}
          </motion.p>

          {/* Dropdown menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                className={`absolute right-4 mt-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border p-2 z-50 min-w-[180px]`}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
              >
                <button
                  onClick={() => { setDarkMode(!darkMode); setShowMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {darkMode ? 'Light mode' : 'Dark mode'}
                  <span className="ml-auto text-xs opacity-50">D</span>
                </button>
                <button
                  onClick={() => { setShowReminders(true); setShowMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                >
                  <Bell className="w-4 h-4" />
                  Reminders
                </button>
                <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />
                <button
                  onClick={() => { exportData(); setShowMenu(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors`}
                >
                  <Download className="w-4 h-4" />
                  Export data
                </button>
                <label
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors cursor-pointer`}
                >
                  <Upload className="w-4 h-4" />
                  Import data
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Today's progress */}
        <TiltCard className="mb-4">
          <motion.div
            className={`${darkMode ? 'bg-gray-800/70 border-gray-700/50' : 'bg-white/70 border-white/50'} backdrop-blur-md rounded-3xl p-5 shadow-lg border`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
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
            {/* Progress bar */}
            <ShimmerProgress percent={todayProgress} />
            {todayProgress === 100 && todayActiveHabits.length > 0 && (
              <motion.div
                className="mt-2 text-center text-sm text-emerald-600 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                🎉 All habits complete! Amazing day!
              </motion.div>
            )}
          </motion.div>
        </TiltCard>

        {/* View toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView('week')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              view === 'week' 
                ? darkMode ? 'bg-gray-800 shadow-md text-gray-100' : 'bg-white shadow-md text-gray-800'
                : darkMode ? 'text-gray-400 hover:bg-gray-800/50' : 'text-gray-500 hover:bg-white/50'
            }`}
          >
            <Calendar className="w-4 h-4" /> Week <span className="text-xs opacity-50 hidden sm:inline">(W)</span>
          </button>
          <button
            onClick={() => setView('month')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              view === 'month' 
                ? darkMode ? 'bg-gray-800 shadow-md text-gray-100' : 'bg-white shadow-md text-gray-800'
                : darkMode ? 'text-gray-400 hover:bg-gray-800/50' : 'text-gray-500 hover:bg-white/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Month <span className="text-xs opacity-50 hidden sm:inline">(M)</span>
          </button>
        </div>

        {/* Main views */}
        <AnimatePresence mode="wait">
          {view === 'week' ? (
            <motion.div key="week" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <WeekView
                habits={habits}
                weekDays={weekDays}
                todayStr={todayStr}
                isHabitCompleted={isHabitCompleted}
                isHabitActiveOnDate={isHabitActiveOnDate}
                toggleHabit={toggleHabit}
                getStreak={getStreak}
              />
            </motion.div>
          ) : (
            <motion.div key="month" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <MonthView
                habits={habits}
                logs={logs}
                isHabitActiveOnDate={isHabitActiveOnDate}
                isHabitCompleted={isHabitCompleted}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Water & Meals */}
        <div className="grid grid-cols-1 gap-4 mt-4">
          <WaterBottle
            glasses={getWaterForDate(todayStr)}
            goal={waterGoal}
            onAdd={() => {
              addWater(todayStr);
              if (getWaterForDate(todayStr) + 1 >= waterGoal) {
                confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 }, colors: ['#0ea5e9', '#38bdf8', '#7dd3fc'] });
              }
            }}
            onRemove={() => removeWater(todayStr)}
          />
          <MealTracker
            meals={getMealsForDate(todayStr)}
            onToggle={(meal) => toggleMeal(todayStr, meal)}
          />
        </div>

        {/* Habit list with tap-to-detail */}
        <motion.div
          className="mt-4 bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-bold text-gray-800 mb-3">Your Habits</h3>
          <div className="space-y-2">
            {habits.map(habit => (
              <motion.button
                key={habit.id}
                onClick={() => setSelectedHabit(habit)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/80 transition-all text-left group"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{habit.name}</div>
                  <div className="text-xs text-gray-400 truncate">{habit.description}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {getStreak(habit.id) > 0 && (
                    <span className="text-orange-500 font-medium">🔥{getStreak(habit.id)}</span>
                  )}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8 pb-4">
          Kindling — Light your daily fire 🍅
        </div>
      </div>

      {/* Dialogs */}
      <AnimatePresence>
        {showHabitForm && (
          <HabitFormDialog
            habit={editingHabit}
            onClose={() => { setShowHabitForm(false); setEditingHabit(undefined); }}
            onSubmit={handleAddHabit}
          />
        )}
        {selectedHabit && (
          <HabitDetailDialog
            habit={selectedHabit}
            onClose={() => setSelectedHabit(null)}
            getStreak={getStreak}
            getBestStreak={getBestStreak}
            getCompletionRate={getCompletionRate}
            logs={logs}
            isHabitActiveOnDate={isHabitActiveOnDate}
            isHabitCompleted={isHabitCompleted}
            onEdit={() => handleEditHabit(selectedHabit)}
            onDelete={() => handleDeleteHabit(selectedHabit)}
          />
        )}
      </AnimatePresence>

      {/* Reminders panel */}
      <AnimatePresence>
        {showReminders && (
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReminders(false)}
          >
            <motion.div
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Reminders</h2>
                <button onClick={() => setShowReminders(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {reminders.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No reminders set yet.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {reminders.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <button
                        onClick={() => toggleReminder(r.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${r.enabled ? 'bg-orange-100 text-orange-500' : 'bg-gray-200 text-gray-400'}`}
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">{r.message}</div>
                        <div className="text-xs text-gray-400">{r.time}</div>
                      </div>
                      <button onClick={() => deleteReminder(r.id)} className="p-1 text-gray-300 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  const habit = habits[0];
                  if (habit) {
                    addReminder({
                      habitId: habit.id,
                      time: '09:00',
                      enabled: true,
                      message: `Time for ${habit.name}!`,
                    });
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-orange-50 text-orange-600 font-medium text-sm hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Reminder
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcuts dialog */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl p-6 w-full max-w-sm shadow-2xl`}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Keyboard Shortcuts</h2>
                <button onClick={() => setShowShortcuts(false)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { key: 'N', desc: 'New habit' },
                  { key: 'W', desc: 'Week view' },
                  { key: 'M', desc: 'Month view' },
                  { key: 'D', desc: 'Toggle dark mode' },
                  { key: '?', desc: 'Show shortcuts' },
                  { key: 'Esc', desc: 'Close dialogs' },
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

      {/* Weekly Summary */}
      <AnimatePresence>
        {view === 'week' && (
          <motion.div
            className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-20"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ delay: 0.5 }}
          >
            <TiltCard className="bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📊</span>
                  <div>
                    <div className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>This week</div>
                    <div className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {(() => {
                        const weekCompleted = weekDays.reduce((acc, day) => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          return acc + habits.filter(h => isHabitActiveOnDate(h, day) && isHabitCompleted(h.id, dateStr)).length;
                        }, 0);
                        const weekTotal = weekDays.reduce((acc, day) => {
                          return acc + habits.filter(h => isHabitActiveOnDate(h, day)).length;
                        }, 0);
                        const pct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;
                        return `${weekCompleted}/${weekTotal} habits • ${pct}%`;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {weekDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const active = habits.filter(h => isHabitActiveOnDate(h, day));
                    const completed = active.filter(h => isHabitCompleted(h.id, dateStr));
                    const pct = active.length > 0 ? completed.length / active.length : 0;
                    return (
                      <div
                        key={dateStr}
                        className="w-2 h-6 rounded-full"
                        style={{
                          backgroundColor: `rgba(16, 185, 129, ${0.1 + pct * 0.8})`,
                        }}
                        title={`${format(day, 'EEE')}: ${completed.length}/${active.length}`}
                      />
                    );
                  })}
                </div>
              </div>
            </TiltCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
