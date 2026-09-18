import { useState } from 'react';
import { usePomodoro, TimerMode } from './hooks/usePomodoro';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function CircularProgress({ progress, mode }: { progress: number; mode: TimerMode }) {
  const radius = 140;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  const colorMap = {
    focus: '#ef4444',
    shortBreak: '#10b981',
    longBreak: '#3b82f6',
  };

  const bgColorMap = {
    focus: 'rgba(239, 68, 68, 0.1)',
    shortBreak: 'rgba(16, 185, 129, 0.1)',
    longBreak: 'rgba(59, 130, 246, 0.1)',
  };

  return (
    <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        stroke={bgColorMap[mode]}
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      {/* Progress circle */}
      <circle
        stroke={colorMap[mode]}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + ' ' + circumference}
        style={{ 
          strokeDashoffset,
          transition: 'stroke-dashoffset 0.5s ease',
          strokeLinecap: 'round'
        }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
}

function ModeSelector({ mode, onModeChange }: { mode: TimerMode; onModeChange: (mode: TimerMode) => void }) {
  const modes: { key: TimerMode; label: string; icon: string }[] = [
    { key: 'focus', label: 'Focus', icon: '🎯' },
    { key: 'shortBreak', label: 'Short Break', icon: '☕' },
    { key: 'longBreak', label: 'Long Break', icon: '🌿' },
  ];

  return (
    <div className="flex gap-2 bg-white/50 backdrop-blur-sm rounded-2xl p-1.5 shadow-sm">
      {modes.map(m => (
        <button
          key={m.key}
          onClick={() => onModeChange(m.key)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            mode === m.key
              ? 'bg-white shadow-md text-gray-800 scale-105'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          }`}
        >
          <span className="mr-1.5">{m.icon}</span>
          {m.label}
        </button>
      ))}
    </div>
  );
}

function Controls({ isRunning, onStart, onPause, onReset }: {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={onReset}
        className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white/80 transition-all duration-200 hover:scale-105"
        title="Reset"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      
      <button
        onClick={isRunning ? onPause : onStart}
        className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 ${
          isRunning 
            ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-200' 
            : 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-green-200'
        }`}
      >
        {isRunning ? (
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="w-12 h-12" /> {/* Spacer for symmetry */}
    </div>
  );
}

function Statistics({ todayPomodoros, todayFocusMinutes, weekFocusMinutes, completedPomodoros }: {
  todayPomodoros: number;
  todayFocusMinutes: number;
  weekFocusMinutes: number;
  completedPomodoros: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm text-center">
        <div className="text-2xl font-bold text-gray-800">{todayPomodoros}</div>
        <div className="text-xs text-gray-500 mt-1">Today's Sessions</div>
      </div>
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm text-center">
        <div className="text-2xl font-bold text-gray-800">{todayFocusMinutes}<span className="text-sm font-normal text-gray-400">m</span></div>
        <div className="text-xs text-gray-500 mt-1">Today's Focus</div>
      </div>
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm text-center">
        <div className="text-2xl font-bold text-gray-800">{Math.round(weekFocusMinutes / 60)}<span className="text-sm font-normal text-gray-400">h</span></div>
        <div className="text-xs text-gray-500 mt-1">Weekly Focus</div>
      </div>
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm text-center">
        <div className="text-2xl font-bold text-gray-800">{completedPomodoros}</div>
        <div className="text-xs text-gray-500 mt-1">Total Sessions</div>
      </div>
    </div>
  );
}

function Settings({ settings, onUpdate, onClose }: {
  settings: { focus: number; shortBreak: number; longBreak: number; longBreakInterval: number };
  onUpdate: (s: Partial<{ focus: number; shortBreak: number; longBreak: number; longBreakInterval: number }>) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Settings</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Focus Duration (minutes)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="60"
                value={settings.focus}
                onChange={e => onUpdate({ focus: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <span className="w-10 text-center font-bold text-gray-700">{settings.focus}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Short Break (minutes)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="30"
                value={settings.shortBreak}
                onChange={e => onUpdate({ shortBreak: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="w-10 text-center font-bold text-gray-700">{settings.shortBreak}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Long Break (minutes)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="45"
                value={settings.longBreak}
                onChange={e => onUpdate({ longBreak: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="w-10 text-center font-bold text-gray-700">{settings.longBreak}</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Long Break After (sessions)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="8"
                value={settings.longBreakInterval}
                onChange={e => onUpdate({ longBreakInterval: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="w-10 text-center font-bold text-gray-700">{settings.longBreakInterval}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const {
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
  } = usePomodoro();

  const [showSettings, setShowSettings] = useState(false);

  const totalDuration = mode === 'focus' ? settings.focus * 60 :
                        mode === 'shortBreak' ? settings.shortBreak * 60 :
                        settings.longBreak * 60;
  const progress = (totalDuration - timeLeft) / totalDuration;

  const modeLabels = {
    focus: 'Focus Time',
    shortBreak: 'Short Break',
    longBreak: 'Long Break',
  };

  const bgGradients = {
    focus: 'from-red-50 via-orange-50 to-amber-50',
    shortBreak: 'from-emerald-50 via-teal-50 to-green-50',
    longBreak: 'from-blue-50 via-indigo-50 to-purple-50',
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradients[mode]} transition-colors duration-700 flex flex-col items-center justify-center p-4`}>
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-8">
        <h1 className="text-lg font-bold text-gray-700 flex items-center gap-2">
          <span className="text-2xl">🍅</span> Pomodoro
        </h1>
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-white/80 transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Mode Selector */}
      <ModeSelector mode={mode} onModeChange={switchMode} />

      {/* Timer */}
      <div className="relative my-8 flex items-center justify-center">
        <CircularProgress progress={progress} mode={mode} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-sm font-medium text-gray-400 mb-1">{modeLabels[mode]}</div>
          <div className="text-6xl font-bold text-gray-800 tracking-tight font-mono">
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-gray-400 mt-2">
            {isRunning ? '● Running' : '○ Paused'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <Controls isRunning={isRunning} onStart={start} onPause={pause} onReset={reset} />

      {/* Pomodoro indicators */}
      <div className="flex gap-2 mt-6">
        {Array.from({ length: settings.longBreakInterval }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i < (completedPomodoros % settings.longBreakInterval)
                ? 'bg-red-400 scale-110'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Statistics */}
      <div className="mt-8 w-full flex justify-center">
        <Statistics
          todayPomodoros={todayPomodoros}
          todayFocusMinutes={todayFocusMinutes}
          weekFocusMinutes={weekFocusMinutes}
          completedPomodoros={completedPomodoros}
        />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
