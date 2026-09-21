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
  Habit, TimeOfDay, Weekday, HabitType, TrackingMode, ScheduleType, Theme, AppTab,
  HABIT_COLORS, HABIT_ICONS, HABIT_CATEGORIES, HABIT_TEMPLATES,
  TIME_OF_DAY_LABELS, WEEKDAY_NAMES, MOOD_EMOJIS, MOOD_LABELS,
  GARDEN_PLANTS, THEMES, ACHIEVEMENTS,
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

// ===== XP & LEVEL DISPLAY =====
function XpDisplay({ xp, level, consistencyScore }: { xp: number; level: number; consistencyScore: number }) {
  const xpForNextLevel = Math.pow(level, 2) * 100;
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
  const progress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  return (
    <TiltCard className="bg-gradient-to-br from-purple-500/90 to-indigo-600/90 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/20 text-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-4xl">⚡</div>
          <div>
            <div className="text-xs opacity-80">Level {level}</div>
            <div className="text-2xl font-bold">{xp.toLocaleString()} XP</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-80">Consistency</div>
          <div className="text-2xl font-bold">{consistencyScore}%</div>
        </div>
      </div>
      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full"
          initial={{ width: 0 }} animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }} />
      </div>
      <div className="text-xs opacity-70 mt-1 text-right">
        {xpForNextLevel - xp} XP to Level {level + 1}
      </div>
    </TiltCard>
  );
}

// ===== ACHIEVEMENT NOTIFICATION =====
function AchievementNotification({ achievement, onClose }: { achievement: any; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const rarityColors: Record<string, string> = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500',
  };

  return (
    <motion.div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-4 border-2"
      style={{ borderColor: achievement.rarity === 'legendary' ? '#f59e0b' : achievement.rarity === 'epic' ? '#8b5cf6' : '#3b82f6' }}
      initial={{ y: -100, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -100, opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <motion.div
        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${rarityColors[achievement.rarity]} flex items-center justify-center text-3xl shadow-lg`}
        animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {achievement.icon}
      </motion.div>
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">Achievement Unlocked!</div>
        <div className="text-lg font-bold text-gray-800">{achievement.name}</div>
        <div className="text-sm text-gray-600">{achievement.description}</div>
      </div>
      <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 ml-2">
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </motion.div>
  );
}

// ===== HABIT GARDEN =====
function HabitGarden({ plants, habits }: { plants: any[]; habits: Habit[] }) {
  if (plants.length === 0) {
    return (
      <TiltCard className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-5 shadow-lg border border-green-200/50">
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🌱</div>
          <div className="text-gray-600 font-medium">Your garden is empty</div>
          <div className="text-sm text-gray-500 mt-1">Complete habits to grow plants!</div>
        </div>
      </TiltCard>
    );
  }

  return (
    <TiltCard className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-5 shadow-lg border border-green-200/50">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🌻</span>
        <h3 className="font-bold text-gray-800">Your Habit Garden</h3>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {plants.map(plant => {
          const habit = habits.find(h => h.id === plant.habitId);
          const plantDef = GARDEN_PLANTS.find(p => p.type === plant.plantType);
          const stage = plantDef?.stages[plant.growthStage] || '🌱';
          const healthColor = plant.health > 70 ? 'text-green-600' : plant.health > 40 ? 'text-yellow-600' : 'text-red-600';
          
          return (
            <motion.div
              key={plant.habitId}
              className="flex flex-col items-center p-2 bg-white/60 rounded-xl"
              whileHover={{ scale: 1.05 }}
              title={habit?.name || 'Unknown habit'}
            >
              <motion.div
                className="text-3xl mb-1"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
              >
                {stage}
              </motion.div>
              <div className={`text-xs font-medium ${healthColor}`}>
                {plant.health}%
              </div>
            </motion.div>
          );
        })}
      </div>
    </TiltCard>
  );
}

// ===== STREAK SHIELDS =====
function StreakShieldsDisplay({ shields, count }: { shields: any[]; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-2xl">🛡️</div>
      <div>
        <div className="text-xs text-gray-500">Streak Shields</div>
        <div className="text-lg font-bold text-gray-800">{count}</div>
      </div>
      {count > 0 && (
        <div className="flex gap-1 ml-2">
          {shields.slice(-3).map(shield => (
            <motion.div
              key={shield.id}
              className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-xs text-white shadow-md"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== THEME SWITCHER =====
function ThemeSwitcher({ selectedTheme, onSelectTheme, level }: { selectedTheme: Theme; onSelectTheme: (theme: Theme) => void; level: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white/80 transition-all"
      >
        🎨
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-2 z-50 min-w-[200px]"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
          >
            {Object.entries(THEMES).map(([key, theme]) => {
              const unlocked = level >= theme.unlockLevel;
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (unlocked) {
                      onSelectTheme(key as Theme);
                      setIsOpen(false);
                    }
                  }}
                  disabled={!unlocked}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                    selectedTheme === key ? 'bg-orange-100 text-orange-700' :
                    unlocked ? 'hover:bg-gray-100 text-gray-700' : 'opacity-50 cursor-not-allowed text-gray-400'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${theme.bg}`} />
                  <span className="flex-1 text-left">{theme.name}</span>
                  {!unlocked && <span className="text-xs">🔒 Lvl {theme.unlockLevel}</span>}
                  {selectedTheme === key && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== HABIT SCIENCE TIP =====
function HabitScienceTip() {
  const tips = [
    "🧠 Habits take 66 days to form on average, not 21!",
    "⚡ Small wins create momentum - start with 2-minute habits",
    "🎯 Stack new habits onto existing ones for better success",
    "🌅 Morning routines set the tone for your entire day",
    "📊 Tracking increases success rate by 40%",
    "🔄 Missing one day won't break your streak - missing two might",
    "🎨 Environment design beats willpower every time",
    "💪 Identity-based habits stick: 'I am a runner' vs 'I want to run'",
    "🌟 Celebrate small wins - your brain needs positive reinforcement",
    "🧘 Consistency beats intensity - show up daily, even if briefly",
  ];
  
  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % tips.length;
  const tip = tips[dayIndex];
  
  return (
    <motion.div
      className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 shadow-sm border border-blue-200"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">💡</div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-blue-600 mb-1">Daily Habit Science</div>
          <div className="text-sm text-gray-700">{tip}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ===== KINDLING MOMENT =====
function KindlingMoment() {
  const moments = [
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
  ];
  
  const hour = new Date().getHours();
  const momentIndex = hour % moments.length;
  const moment = moments[momentIndex];
  
  return (
    <motion.div
      className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl p-4 shadow-sm border border-orange-200"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="text-center">
        <div className="text-xs font-semibold text-orange-600 mb-2">✨ Kindling Moment</div>
        <div className="text-sm text-gray-700 italic">{moment}</div>
      </div>
    </motion.div>
  );
}

// ===== TIME CAPSULE =====
function TimeCapsule({ capsules, onCreate, onOpen }: {
  capsules: Array<{ id: string; message: string; createdAt: string; openAt: string; opened: boolean }>;
  onCreate: (message: string, daysToOpen: number) => void;
  onOpen: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [days, setDays] = useState(30);
  
  const canOpen = (openAt: string) => new Date(openAt) <= new Date();
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-4 shadow-sm border border-purple-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💊</span>
          <h3 className="font-bold text-gray-800">Time Capsules</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          {showForm ? 'Cancel' : '+ New'}
        </button>
      </div>
      
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-3"
        >
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write a message to your future self..."
            className="w-full p-2 border border-purple-200 rounded-lg text-sm resize-none"
            rows={3}
          />
          <div className="flex items-center gap-2 mt-2">
            <label className="text-xs text-gray-600">Open in:</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="text-sm border border-purple-200 rounded px-2 py-1"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>1 year</option>
            </select>
            <button
              onClick={() => {
                if (message.trim()) {
                  onCreate(message, days);
                  setMessage('');
                  setShowForm(false);
                }
              }}
              className="ml-auto px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
            >
              Create
            </button>
          </div>
        </motion.div>
      )}
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {capsules.length === 0 && !showForm && (
          <div className="text-center text-sm text-gray-500 py-4">
            No capsules yet. Write to your future self!
          </div>
        )}
        {capsules.map((capsule) => (
          <motion.div
            key={capsule.id}
            className="bg-white/60 rounded-lg p-3 text-sm"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">
                  Created {format(new Date(capsule.createdAt), 'MMM d, yyyy')}
                </div>
                {capsule.opened ? (
                  <div className="text-gray-700">{capsule.message}</div>
                ) : (
                  <div className="text-gray-500 italic">
                    Opens {format(new Date(capsule.openAt), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
              {!capsule.opened && canOpen(capsule.openAt) && (
                <button
                  onClick={() => onOpen(capsule.id)}
                  className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 whitespace-nowrap"
                >
                  Open
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ===== REFLECTION =====
function Reflection({ reflections, onCreate }: {
  reflections: Array<{ id: string; date: string; type: 'weekly' | 'monthly'; content: string; mood?: number; createdAt: string }>;
  onCreate: (type: 'weekly' | 'monthly', content: string, mood?: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'weekly' | 'monthly'>('weekly');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<number | undefined>();
  
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 shadow-sm border border-green-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <h3 className="font-bold text-gray-800">Reflections</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          {showForm ? 'Cancel' : '+ Reflect'}
        </button>
      </div>
      
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-3"
        >
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setType('weekly')}
              className={`flex-1 py-1 text-sm rounded ${type === 'weekly' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}
            >
              Weekly
            </button>
            <button
              onClick={() => setType('monthly')}
              className={`flex-1 py-1 text-sm rounded ${type === 'monthly' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}
            >
              Monthly
            </button>
          </div>
          
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((m) => (
              <button
                key={m}
                onClick={() => setMood(mood === m ? undefined : m)}
                className={`flex-1 text-2xl rounded p-1 ${mood === m ? 'bg-green-200' : 'hover:bg-green-100'}`}
              >
                {['😢', '😕', '😐', '😊', '😄'][m - 1]}
              </button>
            ))}
          </div>
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="How did your week/month go? What worked? What didn't?"
            className="w-full p-2 border border-green-200 rounded-lg text-sm resize-none"
            rows={3}
          />
          
          <button
            onClick={() => {
              if (content.trim()) {
                onCreate(type, content, mood);
                setContent('');
                setMood(undefined);
                setShowForm(false);
              }
            }}
            className="w-full mt-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
          >
            Save Reflection
          </button>
        </motion.div>
      )}
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {reflections.length === 0 && !showForm && (
          <div className="text-center text-sm text-gray-500 py-4">
            No reflections yet. Take a moment to reflect!
          </div>
        )}
        {reflections.slice(-5).reverse().map((reflection) => (
          <motion.div
            key={reflection.id}
            className="bg-white/60 rounded-lg p-3 text-sm"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="text-xs text-gray-500">
                {format(new Date(reflection.createdAt), 'MMM d, yyyy')} • {reflection.type}
              </div>
              {reflection.mood && (
                <div className="text-lg">
                  {['😢', '😕', '😐', '😊', '😄'][reflection.mood - 1]}
                </div>
              )}
            </div>
            <div className="text-gray-700">{reflection.content}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ===== HABIT HEATMAP =====
function HabitHeatmap({ logs, habits }: { logs: Array<{ date: string; completed: boolean }>; habits: Habit[] }) {
  const today = new Date();
  const days = 365;
  const heatmapData = Array.from({ length: days }, (_, i) => {
    const date = subDays(today, days - 1 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLogs = logs.filter(l => l.date === dateStr && l.completed);
    const totalHabits = habits.filter(h => !h.archived).length;
    const completionRate = totalHabits > 0 ? dayLogs.length / totalHabits : 0;
    return { date, completionRate, count: dayLogs.length };
  });
  
  const getColor = (rate: number) => {
    if (rate === 0) return 'bg-gray-100';
    if (rate < 0.25) return 'bg-green-200';
    if (rate < 0.5) return 'bg-green-300';
    if (rate < 0.75) return 'bg-green-400';
    return 'bg-green-600';
  };
  
  return (
    <div className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📊</span>
        <h3 className="font-bold text-gray-800">Year in Review</h3>
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-[600px]">
          {heatmapData.map((day, i) => (
            <motion.div
              key={i}
              className={`w-3 h-3 rounded-sm ${getColor(day.completionRate)}`}
              whileHover={{ scale: 1.5 }}
              title={`${format(day.date, 'MMM d, yyyy')}: ${day.count} habits completed`}
            />
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-gray-100" />
          <div className="w-3 h-3 rounded-sm bg-green-200" />
          <div className="w-3 h-3 rounded-sm bg-green-300" />
          <div className="w-3 h-3 rounded-sm bg-green-400" />
          <div className="w-3 h-3 rounded-sm bg-green-600" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

// ===== HABIT CHALLENGES =====
function HabitChallenges({ challenges, onJoin, onComplete }: {
  challenges: Array<{ id: string; name: string; icon: string; days: number; description: string; category: string; joined: boolean; progress: number; startDate?: string }>;
  onJoin: (challengeId: string) => void;
  onComplete: (challengeId: string) => void;
}) {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl p-4 shadow-sm border border-yellow-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🏆</span>
        <h3 className="font-bold text-gray-800">Habit Challenges</h3>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {challenges.map((challenge) => (
          <motion.div
            key={challenge.id}
            className="bg-white/60 rounded-lg p-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{challenge.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 text-sm">{challenge.name}</div>
                <div className="text-xs text-gray-600 mb-2">{challenge.description}</div>
                
                {challenge.joined ? (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{challenge.progress}/{challenge.days} days</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(challenge.progress / challenge.days) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 100 }}
                      />
                    </div>
                    {challenge.progress >= challenge.days && (
                      <button
                        onClick={() => onComplete(challenge.id)}
                        className="mt-2 w-full py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                      >
                        Complete Challenge ✓
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => onJoin(challenge.id)}
                    className="mt-1 px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                  >
                    Join Challenge
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ===== HABIT DNA ANALYSIS =====
function HabitDNA({ logs, habits }: { logs: Array<{ date: string; completed: boolean; habitId: string }>; habits: Habit[] }) {
  const analyzeDNA = (): { type: string; icon: string; description: string; color: string } => {
    if (logs.length === 0) {
      return { type: 'Just Getting Started', icon: '🌱', description: 'Begin your journey and discover your habit patterns!', color: 'from-gray-400 to-gray-500' };
    }
    
    // Analyze completion patterns
    const morningCompletions = logs.filter(l => {
      const habit = habits.find(h => h.id === l.habitId);
      return habit?.timeOfDay === 'morning' && l.completed;
    }).length;
    
    const eveningCompletions = logs.filter(l => {
      const habit = habits.find(h => h.id === l.habitId);
      return habit?.timeOfDay === 'evening' && l.completed;
    }).length;
    
    const weekendDays = [0, 6]; // Sunday, Saturday
    const weekendCompletions = logs.filter(l => {
      const date = new Date(l.date);
      return weekendDays.includes(date.getDay()) && l.completed;
    }).length;
    
    const weekdayCompletions = logs.filter(l => {
      const date = new Date(l.date);
      return !weekendDays.includes(date.getDay()) && l.completed;
    }).length;
    
    // Calculate consistency (standard deviation of daily completions)
    const dailyCounts: Record<string, number> = {};
    logs.forEach(l => {
      if (l.completed) {
        dailyCounts[l.date] = (dailyCounts[l.date] || 0) + 1;
      }
    });
    const counts = Object.values(dailyCounts);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / counts.length;
    const consistency = 1 / (1 + Math.sqrt(variance));
    
    // Determine DNA type
    if (morningCompletions > eveningCompletions * 1.5) {
      return { type: 'Morning Champion', icon: '🌅', description: 'You thrive in the early hours! Your best work happens before noon.', color: 'from-orange-400 to-yellow-500' };
    } else if (eveningCompletions > morningCompletions * 1.5) {
      return { type: 'Night Owl', icon: '🦉', description: 'You come alive after dark! Evenings are your power time.', color: 'from-purple-400 to-indigo-500' };
    } else if (weekendCompletions > weekdayCompletions * 1.3) {
      return { type: 'Weekend Warrior', icon: '🎉', description: 'You shine on weekends! Free time fuels your best habits.', color: 'from-pink-400 to-rose-500' };
    } else if (consistency > 0.8) {
      return { type: 'Consistent Warrior', icon: '⚔️', description: 'Unstoppable consistency! You show up every single day.', color: 'from-red-400 to-orange-500' };
    } else {
      return { type: 'Balanced Achiever', icon: '⚖️', description: 'Well-rounded and adaptable! You find success in all areas.', color: 'from-blue-400 to-cyan-500' };
    }
  };
  
  const dna = analyzeDNA();
  
  return (
    <div className={`bg-gradient-to-br ${dna.color} rounded-2xl p-4 shadow-sm text-white`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-3xl">{dna.icon}</span>
        <div>
          <div className="text-xs opacity-80">Your Habit DNA</div>
          <div className="font-bold text-lg">{dna.type}</div>
        </div>
      </div>
      <div className="text-sm opacity-90">{dna.description}</div>
    </div>
  );
}

// ===== EXPORT ACHIEVEMENT CARD =====
function ExportAchievement({ userStats, habits, logs }: {
  userStats: { totalXp: number; level: number; achievements: Array<{ name: string; icon: string }> };
  habits: Habit[];
  logs: Array<{ date: string; completed: boolean }>;
}) {
  const [showExport, setShowExport] = useState(false);
  
  const totalCompletions = logs.filter(l => l.completed).length;
  const activeHabits = habits.filter(h => !h.archived).length;
  const achievementsUnlocked = userStats.achievements.length;
  
  const handleExport = () => {
    // Create a simple text summary
    const summary = `
🔥 KINDLING ACHIEVEMENT CARD 🔥

Level: ${userStats.level}
Total XP: ${userStats.totalXp.toLocaleString()}
Active Habits: ${activeHabits}
Total Completions: ${totalCompletions}
Achievements Unlocked: ${achievementsUnlocked}

Recent Achievements:
${userStats.achievements.slice(-5).map(a => `${a.icon} ${a.name}`).join('\n')}

Keep kindling your daily fire! 🔥
    `.trim();
    
    // Copy to clipboard
    navigator.clipboard.writeText(summary);
    alert('Achievement card copied to clipboard! Share it with friends! 🎉');
  };
  
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-2xl p-4 shadow-sm border border-indigo-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎴</span>
          <h3 className="font-bold text-gray-800">Share Progress</h3>
        </div>
        <button
          onClick={() => setShowExport(!showExport)}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          {showExport ? 'Hide' : 'View'}
        </button>
      </div>
      
      {showExport && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <div className="bg-white/60 rounded-lg p-3 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-gray-800">Level {userStats.level}</div>
            <div className="text-sm text-gray-600">{userStats.totalXp.toLocaleString()} XP</div>
            <div className="flex justify-center gap-4 mt-3 text-xs text-gray-600">
              <div>
                <div className="text-lg font-bold text-gray-800">{activeHabits}</div>
                <div>Habits</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800">{totalCompletions}</div>
                <div>Completions</div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-800">{achievementsUnlocked}</div>
                <div>Achievements</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleExport}
            className="w-full py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            📋 Copy to Clipboard
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ===== SOUND SELECTOR =====
function SoundSelector({ selectedSound, onSelectSound }: {
  selectedSound: string;
  onSelectSound: (sound: string) => void;
}) {
  const sounds = [
    { id: 'default', name: 'Default', icon: '🔔' },
    { id: 'chime', name: 'Chime', icon: '🎵' },
    { id: 'bell', name: 'Bell', icon: '🔔' },
    { id: 'pop', name: 'Pop', icon: '💥' },
    { id: 'success', name: 'Success', icon: '✨' },
    { id: 'none', name: 'Silent', icon: '🔇' },
  ];
  
  return (
    <div className="bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🔊</span>
        <h3 className="font-bold text-gray-800">Sound Effects</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {sounds.map((sound) => (
          <button
            key={sound.id}
            onClick={() => onSelectSound(sound.id)}
            className={`p-3 rounded-lg text-center transition-all ${
              selectedSound === sound.id
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="text-2xl mb-1">{sound.icon}</div>
            <div className="text-xs font-medium">{sound.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== HABIT STACKING BUILDER =====
function HabitStackingBuilder({ habitStacks, habits, onAddStack, onDeleteStack }: {
  habitStacks: Array<{ id: string; name: string; habits: string[]; createdAt: string }>;
  habits: Habit[];
  onAddStack: (name: string, habitIds: string[]) => void;
  onDeleteStack: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [stackName, setStackName] = useState('');
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  
  const activeHabits = habits.filter(h => !h.archived);
  
  const handleAddHabit = (habitId: string) => {
    if (!selectedHabits.includes(habitId)) {
      setSelectedHabits([...selectedHabits, habitId]);
    }
  };
  
  const handleRemoveHabit = (habitId: string) => {
    setSelectedHabits(selectedHabits.filter(id => id !== habitId));
  };
  
  const handleSubmit = () => {
    if (stackName.trim() && selectedHabits.length >= 2) {
      onAddStack(stackName, selectedHabits);
      setStackName('');
      setSelectedHabits([]);
      setShowForm(false);
    }
  };
  
  return (
    <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-2xl p-4 shadow-sm border border-cyan-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔗</span>
          <h3 className="font-bold text-gray-800">Habit Stacking</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
        >
          {showForm ? 'Cancel' : '+ New Stack'}
        </button>
      </div>
      
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-3 space-y-3"
        >
          <input
            type="text"
            value={stackName}
            onChange={(e) => setStackName(e.target.value)}
            placeholder="Stack name (e.g., Morning Routine)"
            className="w-full p-2 border border-cyan-200 rounded-lg text-sm"
          />
          
          <div>
            <div className="text-xs text-gray-600 mb-2">Select habits in order (minimum 2):</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {activeHabits.map((habit) => (
                <button
                  key={habit.id}
                  onClick={() => {
                    if (selectedHabits.includes(habit.id)) {
                      handleRemoveHabit(habit.id);
                    } else {
                      handleAddHabit(habit.id);
                    }
                  }}
                  className={`w-full p-2 rounded-lg text-left text-sm transition-all ${
                    selectedHabits.includes(habit.id)
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white/60 hover:bg-white/80 text-gray-700'
                  }`}
                >
                  <span className="mr-2">{habit.icon}</span>
                  {habit.name}
                  {selectedHabits.includes(habit.id) && (
                    <span className="float-right">#{selectedHabits.indexOf(habit.id) + 1}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {selectedHabits.length >= 2 && (
            <div className="bg-white/60 rounded-lg p-2">
              <div className="text-xs text-gray-600 mb-1">Your stack:</div>
              <div className="flex items-center gap-1 flex-wrap">
                {selectedHabits.map((id, idx) => {
                  const habit = habits.find(h => h.id === id);
                  return (
                    <div key={id} className="flex items-center gap-1">
                      <span className="text-sm">{habit?.icon} {habit?.name}</span>
                      {idx < selectedHabits.length - 1 && <span className="text-gray-400">→</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={!stackName.trim() || selectedHabits.length < 2}
            className="w-full py-2 bg-cyan-600 text-white text-sm rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Stack
          </button>
        </motion.div>
      )}
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {habitStacks.length === 0 && !showForm && (
          <div className="text-center text-sm text-gray-500 py-4">
            No habit stacks yet. Chain habits together!
          </div>
        )}
        {habitStacks.map((stack) => (
          <motion.div
            key={stack.id}
            className="bg-white/60 rounded-lg p-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="font-semibold text-gray-800 text-sm">{stack.name}</div>
              <button
                onClick={() => onDeleteStack(stack.id)}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Delete
              </button>
            </div>
            <div className="flex items-center gap-1 flex-wrap text-xs">
              {stack.habits.map((id, idx) => {
                const habit = habits.find(h => h.id === id);
                return (
                  <div key={id} className="flex items-center gap-1">
                    <span>{habit?.icon} {habit?.name}</span>
                    {idx < stack.habits.length - 1 && <span className="text-gray-400">→</span>}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ===== STREAK RECOVERY MODE =====
function StreakRecoveryMode({ streakRecoveries, habits, onMarkRecovered }: {
  streakRecoveries: Array<{ habitId: string; brokenAt: string; recoveredAt?: string; message: string }>;
  habits: Habit[];
  onMarkRecovered: (habitId: string) => void;
}) {
  const activeRecoveries = streakRecoveries.filter(r => !r.recoveredAt);
  
  if (activeRecoveries.length === 0) return null;
  
  return (
    <div className="bg-gradient-to-br from-rose-50 to-pink-100 rounded-2xl p-4 shadow-sm border border-rose-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">💝</span>
        <h3 className="font-bold text-gray-800">Streak Recovery</h3>
      </div>
      
      <div className="space-y-2">
        {activeRecoveries.map((recovery) => {
          const habit = habits.find(h => h.id === recovery.habitId);
          if (!habit) return null;
          
          return (
            <motion.div
              key={recovery.habitId}
              className="bg-white/60 rounded-lg p-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{habit.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-sm mb-1">{habit.name}</div>
                  <div className="text-xs text-gray-600 italic mb-2">{recovery.message}</div>
                  <button
                    onClick={() => onMarkRecovered(recovery.habitId)}
                    className="px-3 py-1 bg-rose-500 text-white text-xs rounded hover:bg-rose-600"
                  >
                    I'm Back On Track ✓
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ===== HABIT CORRELATIONS =====
function HabitCorrelations({ correlations, habits }: {
  correlations: Array<{ habitId1: string; habitId2: string; correlation: number; strength: 'weak' | 'moderate' | 'strong' }>;
  habits: Habit[];
}) {
  if (correlations.length === 0) {
    return (
      <div className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl p-4 shadow-sm border border-violet-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🔬</span>
          <h3 className="font-bold text-gray-800">Habit Correlations</h3>
        </div>
        <div className="text-center text-sm text-gray-500 py-4">
          Complete more habits to discover patterns!
        </div>
      </div>
    );
  }
  
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-2xl p-4 shadow-sm border border-violet-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🔬</span>
        <h3 className="font-bold text-gray-800">Habit Correlations</h3>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {correlations.slice(0, 5).map((corr, idx) => {
          const habit1 = habits.find(h => h.id === corr.habitId1);
          const habit2 = habits.find(h => h.id === corr.habitId2);
          if (!habit1 || !habit2) return null;
          
          const isPositive = corr.correlation > 0;
          
          return (
            <motion.div
              key={idx}
              className="bg-white/60 rounded-lg p-3"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{habit1.icon}</span>
                <span className="text-xs text-gray-500">↔</span>
                <span className="text-lg">{habit2.icon}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  {isPositive ? 'When you do one, you tend to do the other' : 'When you do one, you tend to skip the other'}
                </div>
                <div className={`text-xs px-2 py-0.5 rounded ${getStrengthColor(corr.strength)}`}>
                  {corr.strength} ({Math.abs(corr.correlation).toFixed(2)})
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ===== ADAPTIVE DIFFICULTY SETTINGS =====
function AdaptiveDifficultySettings({ settings, onUpdate }: {
  settings: { enabled: boolean; adjustmentRate: number; minTarget: number; maxTarget: number };
  onUpdate: (settings: Partial<{ enabled: boolean; adjustmentRate: number; minTarget: number; maxTarget: number }>) => void;
}) {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-4 shadow-sm border border-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🎚️</span>
        <h3 className="font-bold text-gray-800">Adaptive Difficulty</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">Auto-adjust targets</div>
          <button
            onClick={() => onUpdate({ enabled: !settings.enabled })}
            className={`w-12 h-6 rounded-full transition-colors ${
              settings.enabled ? 'bg-amber-500' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
        
        {settings.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <div>
              <label className="text-xs text-gray-600 block mb-1">
                Adjustment Rate: {Math.round(settings.adjustmentRate * 100)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.3"
                step="0.05"
                value={settings.adjustmentRate}
                onChange={(e) => onUpdate({ adjustmentRate: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Min Target</label>
                <input
                  type="number"
                  min="1"
                  value={settings.minTarget}
                  onChange={(e) => onUpdate({ minTarget: parseInt(e.target.value) })}
                  className="w-full p-1 border border-amber-200 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Max Target</label>
                <input
                  type="number"
                  min="1"
                  value={settings.maxTarget}
                  onChange={(e) => onUpdate({ maxTarget: parseInt(e.target.value) })}
                  className="w-full p-1 border border-amber-200 rounded text-sm"
                />
              </div>
            </div>
            
            <div className="text-xs text-gray-500 italic">
              Targets adjust based on 14-day completion rate. Increase if &gt;90%, decrease if &lt;50%.
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ===== FOCUS MODE =====
function FocusMode({ habit, onComplete, onCancel }: {
  habit: Habit;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(habit.targetDuration ? habit.targetDuration * 60 : 1500); // 25 min default
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      onComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = habit.targetDuration ? ((habit.targetDuration * 60 - timeLeft) / (habit.targetDuration * 60)) * 100 : 0;
  
  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-md w-full text-center text-white">
        <div className="mb-8">
          <div className="text-6xl mb-4">{habit.icon}</div>
          <h2 className="text-3xl font-bold mb-2">{habit.name}</h2>
          <p className="text-white/70">{habit.description}</p>
        </div>
        
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="128"
              cy="128"
              r="120"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              transition={{ duration: 0.5 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl font-bold">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <motion.button
            onClick={() => setIsRunning(!isRunning)}
            className="px-8 py-4 bg-white/20 backdrop-blur-sm rounded-2xl font-semibold text-lg hover:bg-white/30 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            {isRunning ? 'Pause' : timeLeft === (habit.targetDuration ? habit.targetDuration * 60 : 1500) ? 'Start' : 'Resume'}
          </motion.button>
          <motion.button
            onClick={onCancel}
            className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-2xl font-semibold text-lg hover:bg-white/20 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            Cancel
          </motion.button>
        </div>
        
        <div className="mt-8 text-white/50 text-sm">
          {isRunning ? 'Stay focused... 🧘' : 'Ready when you are'}
        </div>
      </div>
    </motion.div>
  );
}

// ===== BOTTOM NAVIGATION =====
function BottomNavigation({ activeTab, onTabChange }: {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}) {
  const tabs: { id: AppTab; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'habits', label: 'Habits', icon: '✓' },
    { id: 'insights', label: 'Insights', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 z-40 safe-area-bottom">
      <div className="max-w-lg mx-auto flex justify-around py-2">
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              activeTab === tab.id ? 'text-orange-600' : 'text-gray-500'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                className="absolute bottom-0 w-12 h-1 bg-orange-500 rounded-full"
                layoutId="activeTab"
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ===== QUICK ACTIONS FAB =====
function QuickActionsFAB({ onAction }: {
  onAction: (action: 'focus' | 'review' | 'reflect') => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const actions = [
    { id: 'focus' as const, label: 'Focus Mode', icon: '🎯', color: 'bg-indigo-500' },
    { id: 'review' as const, label: 'Quick Review', icon: '📝', color: 'bg-purple-500' },
    { id: 'reflect' as const, label: 'Reflect', icon: '💭', color: 'bg-pink-500' },
  ];
  
  return (
    <div className="fixed bottom-24 right-4 z-30">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="flex flex-col gap-3 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {actions.map((action, idx) => (
              <motion.button
                key={action.id}
                onClick={() => {
                  onAction(action.id);
                  setIsOpen(false);
                }}
                className={`${action.color} text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 font-medium whitespace-nowrap`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-xl">{action.icon}</span>
                {action.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full shadow-xl flex items-center justify-center text-white text-2xl"
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        {isOpen ? '✕' : '+'}
      </motion.button>
    </div>
  );
}

// ===== SWIPEABLE HABIT CARD =====
function SwipeableHabitCard({ habit, onSwipeRight, onSwipeLeft, children }: {
  habit: Habit;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  children: React.ReactNode;
}) {
  const [dragX, setDragX] = useState(0);
  
  return (
    <motion.div
      className="relative"
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      onDragEnd={(e, { offset, velocity }) => {
        if (offset.x > 80) {
          onSwipeRight();
        } else if (offset.x < -80) {
          onSwipeLeft();
        }
        setDragX(0);
      }}
      animate={{ x: dragX }}
    >
      {/* Right swipe indicator */}
      {dragX > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-green-500 rounded-l-2xl flex items-center justify-center text-white">
          <Check className="w-8 h-8" />
        </div>
      )}
      
      {/* Left swipe indicator */}
      {dragX < 0 && (
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 rounded-r-2xl flex items-center justify-center text-white">
          <X className="w-8 h-8" />
        </div>
      )}
      
      <motion.div
        className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-lg"
        style={{ x: dragX }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ===== REVIEW FLOW =====
function ReviewFlow({ type, onComplete, onCancel }: {
  type: 'daily' | 'weekly' | 'monthly';
  onComplete: (highlights: string[], challenges: string[], intentions: string[], rating?: number) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [highlights, setHighlights] = useState('');
  const [challenges, setChallenges] = useState('');
  const [intentions, setIntentions] = useState('');
  const [rating, setRating] = useState<number | undefined>();
  
  const steps = [
    {
      title: type === 'daily' ? 'How was your day?' : type === 'weekly' ? 'How was your week?' : 'How was your month?',
      content: (
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(r => (
              <motion.button
                key={r}
                onClick={() => setRating(r)}
                className={`text-4xl p-2 rounded-xl ${rating === r ? 'bg-orange-100 scale-110' : 'hover:bg-gray-100'}`}
                whileTap={{ scale: 0.9 }}
              >
                {['😢', '😕', '😐', '😊', '😄'][r - 1]}
              </motion.button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'What went well?',
      content: (
        <textarea
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
          placeholder="Celebrate your wins, no matter how small..."
          className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none"
          rows={4}
          autoFocus
        />
      ),
    },
    {
      title: 'What was challenging?',
      content: (
        <textarea
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
          placeholder="What obstacles did you face?"
          className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none"
          rows={4}
          autoFocus
        />
      ),
    },
    {
      title: 'What are your intentions?',
      content: (
        <textarea
          value={intentions}
          onChange={(e) => setIntentions(e.target.value)}
          placeholder="What do you want to focus on next?"
          className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none"
          rows={4}
          autoFocus
        />
      ),
    },
  ];
  
  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(
        highlights.split('\n').filter(h => h.trim()),
        challenges.split('\n').filter(c => c.trim()),
        intentions.split('\n').filter(i => i.trim()),
        rating
      );
    }
  };
  
  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">{steps[step].title}</h2>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex gap-1 mb-4">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-1 rounded-full ${idx <= step ? 'bg-orange-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          {steps[step].content}
        </div>
        
        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg transition-shadow"
          >
            {step === steps.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
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
    // Gamification
    userStats, streakShields, gardenPlants, selectedTheme, consistencyScore, newAchievement,
    setSelectedTheme,
    // Time Capsules & Reflections
    timeCapsules, reflections, createTimeCapsule, openTimeCapsule, createReflection,
    // Additional gamification
    addXp,
    // Phase 4 features
    habitStacks, streakRecoveries, adaptiveSettings,
    addHabitStack, deleteHabitStack,
    triggerStreakRecovery, markStreakRecovered,
    calculateCorrelations,
    adaptHabitDifficulty, updateAdaptiveSettings,
    // Phase 5 features
    currentFocusSession,
    startFocusSession, completeFocusSession, cancelFocusSession,
    createReview, shouldShowReview,
  } = useHabits();
  
  const [activeTab, setActiveTab] = useState<AppTab>('home');

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
  const [selectedSound, setSelectedSound] = useState('default');
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [focusHabit, setFocusHabit] = useState<Habit | null>(null);
  const [showReviewFlow, setShowReviewFlow] = useState(false);
  const [reviewType, setReviewType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [challenges, setChallenges] = useState([
    { id: '1', name: '7-Day Mindfulness', icon: '🧘', days: 7, description: 'Meditate every day for a week', category: 'Mind', joined: false, progress: 0 },
    { id: '2', name: '21-Day Fitness', icon: '💪', days: 21, description: 'Build an exercise habit', category: 'Fitness', joined: false, progress: 0 },
    { id: '3', name: '30-Day Reading', icon: '📚', days: 30, description: 'Read every day for a month', category: 'Learning', joined: false, progress: 0 },
    { id: '4', name: 'Hydration Hero', icon: '💧', days: 14, description: 'Drink 8 glasses daily', category: 'Health', joined: false, progress: 0 },
  ]);

  const handleJoinChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(c => 
      c.id === challengeId ? { ...c, joined: true, startDate: new Date().toISOString() } : c
    ));
  };

  const handleCompleteChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(c => 
      c.id === challengeId ? { ...c, joined: false, progress: 0 } : c
    ));
    addXp(100);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const handleStartFocus = (habit: Habit) => {
    setFocusHabit(habit);
    setShowFocusMode(true);
    startFocusSession(habit.id, habit.targetDuration ? habit.targetDuration * 60 : 1500);
  };

  const handleCompleteFocus = () => {
    completeFocusSession();
    setShowFocusMode(false);
    setFocusHabit(null);
    confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
  };

  const handleCancelFocus = () => {
    cancelFocusSession();
    setShowFocusMode(false);
    setFocusHabit(null);
  };

  const handleStartReview = (type: 'daily' | 'weekly' | 'monthly') => {
    setReviewType(type);
    setShowReviewFlow(true);
  };

  const handleCompleteReview = (highlights: string[], challenges: string[], intentions: string[], rating?: number) => {
    createReview(reviewType, highlights, challenges, intentions, rating);
    setShowReviewFlow(false);
    addXp(50);
  };

  const handleQuickAction = (action: 'focus' | 'review' | 'reflect') => {
    if (action === 'focus' && todayActiveHabits.length > 0) {
      handleStartFocus(todayActiveHabits[0]);
    } else if (action === 'review') {
      handleStartReview('daily');
    } else if (action === 'reflect') {
      // Could open reflection dialog
      console.log('Open reflection');
    }
  };

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
        {newAchievement && (
          <AchievementNotification achievement={newAchievement} onClose={() => {}} />
        )}
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
              <ThemeSwitcher selectedTheme={selectedTheme} onSelectTheme={setSelectedTheme} level={userStats.level} />
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

        {/* XP & Level Display */}
        <div className="mb-4">
          <XpDisplay xp={userStats.totalXp} level={userStats.level} consistencyScore={consistencyScore} />
        </div>

        {/* Habit Garden */}
        <div className="mb-4">
          <HabitGarden plants={gardenPlants} habits={habits} />
        </div>

        {/* Streak Shields */}
        {userStats.streakShields > 0 && (
          <div className="mb-4 bg-white/70 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/50">
            <StreakShieldsDisplay shields={streakShields} count={userStats.streakShields} />
          </div>
        )}

        {/* Habit Science Tip */}
        <div className="mb-4">
          <HabitScienceTip />
        </div>

        {/* Kindling Moment */}
        <div className="mb-4">
          <KindlingMoment />
        </div>

        {/* Time Capsules & Reflections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <TimeCapsule
            capsules={timeCapsules}
            onCreate={createTimeCapsule}
            onOpen={openTimeCapsule}
          />
          <Reflection
            reflections={reflections}
            onCreate={createReflection}
          />
        </div>

        {/* Habit Heatmap */}
        <div className="mb-4">
          <HabitHeatmap logs={logs} habits={habits} />
        </div>

        {/* Habit DNA Analysis */}
        <div className="mb-4">
          <HabitDNA logs={logs} habits={habits} />
        </div>

        {/* Habit Challenges */}
        <div className="mb-4">
          <HabitChallenges
            challenges={challenges}
            onJoin={handleJoinChallenge}
            onComplete={handleCompleteChallenge}
          />
        </div>

        {/* Export Achievement Card */}
        <div className="mb-4">
          <ExportAchievement userStats={userStats} habits={habits} logs={logs} />
        </div>

        {/* Sound Selector */}
        <div className="mb-4">
          <SoundSelector selectedSound={selectedSound} onSelectSound={setSelectedSound} />
        </div>

        {/* Streak Recovery Mode */}
        {streakRecoveries.filter(r => !r.recoveredAt).length > 0 && (
          <div className="mb-4">
            <StreakRecoveryMode
              streakRecoveries={streakRecoveries}
              habits={habits}
              onMarkRecovered={markStreakRecovered}
            />
          </div>
        )}

        {/* Habit Stacking Builder */}
        <div className="mb-4">
          <HabitStackingBuilder
            habitStacks={habitStacks}
            habits={habits}
            onAddStack={addHabitStack}
            onDeleteStack={deleteHabitStack}
          />
        </div>

        {/* Habit Correlations */}
        <div className="mb-4">
          <HabitCorrelations
            correlations={calculateCorrelations()}
            habits={habits}
          />
        </div>

        {/* Adaptive Difficulty Settings */}
        <div className="mb-4">
          <AdaptiveDifficultySettings
            settings={adaptiveSettings}
            onUpdate={updateAdaptiveSettings}
          />
        </div>

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

        <div className={`text-center text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'} mt-4 pb-20`}>
          Kindling — Light your daily fire 🔥
        </div>
      </div>

      {/* Focus Mode */}
      <AnimatePresence>
        {showFocusMode && focusHabit && (
          <FocusMode
            habit={focusHabit}
            onComplete={handleCompleteFocus}
            onCancel={handleCancelFocus}
          />
        )}
      </AnimatePresence>

      {/* Review Flow */}
      <AnimatePresence>
        {showReviewFlow && (
          <ReviewFlow
            type={reviewType}
            onComplete={handleCompleteReview}
            onCancel={() => setShowReviewFlow(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Quick Actions FAB */}
      <QuickActionsFAB onAction={handleQuickAction} />

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
