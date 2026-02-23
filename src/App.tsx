/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Footprints, 
  Dumbbell, 
  Utensils, 
  Flame, 
  TrendingUp, 
  Zap,
  CheckCircle2,
  ChevronRight,
  Play,
  Settings,
  Trophy,
  History,
  Menu,
  X,
  Timer,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types & Constants ---

type DietPreference = 'veg' | 'non-veg';

interface DayData {
  dietCompleted: boolean;
  runCompleted: boolean;
  gymCompleted: boolean;
  caloriesConsumed: number;
  caloriesBurned: number;
  exercises: Record<string, boolean>;
  weight?: number;
}

interface AuraState {
  weight: number;
  dietPreference: DietPreference;
  dailyData: Record<string, DayData>;
  lastUpdated: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const GYM_PLAN = [
  { day: 'Monday', focus: 'Chest & Triceps (Push)', exercises: ['Bench Press', 'Incline Dumbbell Press', 'Chest Flys', 'Tricep Pushdowns', 'Overhead Extensions', 'Dips'] },
  { day: 'Tuesday', focus: 'Back & Biceps (Pull)', exercises: ['Deadlifts', 'Pull-ups', 'Bent Over Rows', 'Lat Pulldowns', 'Barbell Curls', 'Hammer Curls'] },
  { day: 'Wednesday', focus: 'Running & Active Recovery', exercises: ['Interval Run (See Running Tab)', 'Dynamic Stretching', 'Foam Rolling'] },
  { day: 'Thursday', focus: 'Shoulders & Abs', exercises: ['Overhead Press', 'Lateral Raises', 'Front Raises', 'Face Pulls', 'Plank (3 mins)', 'Leg Raises'] },
  { day: 'Friday', focus: 'Legs & Bethaks', exercises: ['Squats', 'Leg Press', 'Lunges', 'Hindu Squats (Bethaks)', 'Calf Raises', 'Sapate (Burpees)'] },
  { day: 'Saturday', focus: 'Core & Plank', exercises: ['Plank (5 mins)', 'Russian Twists', 'Bicycle Crunches', 'Mountain Climbers', 'Sapate (50)'] },
  { day: 'Sunday', focus: 'Rest & Recovery', exercises: ['Light Walk', 'Mobility Work'] },
];

const DIET_PLAN: Record<DietPreference, Array<{ day: string, meals: string[] }>> = {
  'veg': [
    { day: 'Monday', meals: ['Sattu Drink', 'Paneer Bhurji + Roti', 'Greek Yogurt', 'Soya Chunks Pulao', 'Milk + Almonds'] },
    { day: 'Tuesday', meals: ['Moong Dal Chilla', 'Rajma + Brown Rice', 'Roasted Chana', 'Paneer Tikka + Salad', 'Protein Shake'] },
    { day: 'Wednesday', meals: ['Oats with Fruits', 'Mixed Veg Curry + Roti', 'Paneer Sandwich', 'Dal Makhani (Low Fat)', 'Buttermilk'] },
    { day: 'Thursday', meals: ['Sprouted Salad', 'Tofu Stir Fry', 'Peanut Butter Toast', 'Kadhai Paneer (Less Oil)', 'Milk'] },
    { day: 'Friday', meals: ['Besan Chilla', 'Chole + Bhature (Air Fried)', 'Paneer Salad', 'Soya Keema', 'Walnuts'] },
    { day: 'Saturday', meals: ['Poha with Peanuts', 'Palak Paneer', 'Fruit Bowl', 'Dal Tadka + Jeera Rice', 'Protein Bar'] },
    { day: 'Sunday', meals: ['Stuffed Paratha (Paneer)', 'Veg Biryani', 'Lassi', 'Paneer Butter Masala (Cheat)', 'Milk'] },
  ],
  'non-veg': [
    { day: 'Monday', meals: ['Boiled Eggs (3)', 'Chicken Breast + Rice', 'Peanuts', 'Fish Curry', 'Milk'] },
    { day: 'Tuesday', meals: ['Omelette (4 Eggs)', 'Chicken Salad', 'Greek Yogurt', 'Grilled Chicken + Veggies', 'Protein Shake'] },
    { day: 'Wednesday', meals: ['Egg Bhurji', 'Chicken Biryani', 'Fruit Bowl', 'Mutton Curry (Lean)', 'Buttermilk'] },
    { day: 'Thursday', meals: ['Scrambled Eggs', 'Chicken Sandwich', 'Roasted Chana', 'Fish Fry (Air Fried)', 'Milk'] },
    { day: 'Friday', meals: ['Egg Curry', 'Chicken Tikka', 'Almonds', 'Grilled Fish', 'Protein Bar'] },
    { day: 'Saturday', meals: ['Boiled Eggs', 'Butter Chicken (Healthy)', 'Fruit Bowl', 'Chicken Pulao', 'Lassi'] },
    { day: 'Sunday', meals: ['Egg Paratha', 'Chicken Biryani (Cheat)', 'Greek Yogurt', 'Tandoori Chicken', 'Milk'] },
  ]
};

const RUNNING_PLAN = Array.from({ length: 40 }, (_, i) => {
  const week = i + 1;
  // Expert progression: Alternating intensity and recovery weeks
  const isRecoveryWeek = week % 4 === 0;
  const baseIntensity = Math.floor((week - 1) / 4) + 1;
  
  const runTime = isRecoveryWeek ? Math.max(2, baseIntensity) : baseIntensity + 2;
  const walkTime = isRecoveryWeek ? 3 : Math.max(1, 3 - Math.floor(baseIntensity / 2));
  const reps = isRecoveryWeek ? 4 : 6 + baseIntensity;

  const type = week <= 10 ? 'Base Building' : week <= 25 ? 'Strength & Speed' : 'Peak Performance';
  const focus = week % 2 === 0 ? 'Tempo Intervals' : 'Endurance Intervals';

  return {
    week,
    type,
    focus,
    warmup: '8m Dynamic Warmup + Light Jog',
    intervals: `${reps}x [${runTime}m ${focus} / ${walkTime}m Recovery Walk]`,
    cooldown: '5m Mobility + Static Stretching',
    totalTime: 13 + (runTime + walkTime) * reps,
    estBurn: 300 + (week * 15)
  };
});

// --- Helper Functions ---

const getTodayKey = () => new Date().toISOString().split('T')[0];

const getIntensity = (day: DayData) => {
  let score = 0;
  if (day.dietCompleted) score++;
  if (day.runCompleted) score++;
  if (day.gymCompleted) score++;
  return score;
};

// --- Components ---

const Toast = ({ message, visible }: { message: string, visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-orange-500 to-yellow-400 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2"
      >
        <CheckCircle2 size={18} />
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'running' | 'workout' | 'nutrition'>('dashboard');
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<string>(DAYS_OF_WEEK[new Date().getDay()]);
  const [selectedDietDay, setSelectedDietDay] = useState<string>(DAYS_OF_WEEK[new Date().getDay()]);
  const [selectedRunningWeek, setSelectedRunningWeek] = useState<number>(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [auraState, setAuraState] = useState<AuraState>(() => {
    const saved = localStorage.getItem('auraState');
    if (saved) return JSON.parse(saved);
    return {
      weight: 75,
      dietPreference: 'non-veg',
      dailyData: {},
      lastUpdated: new Date().toISOString()
    };
  });
  const [toast, setToast] = useState({ visible: false, message: '' });

  const todayKey = getTodayKey();
  const todayData = auraState.dailyData[todayKey] || {
    dietCompleted: false,
    runCompleted: false,
    gymCompleted: false,
    caloriesConsumed: 0,
    caloriesBurned: 0,
    exercises: {},
  };

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2000);
  };

  const updateState = (newData: Partial<AuraState> | ((prev: AuraState) => AuraState)) => {
    setAuraState(prev => {
      const next = typeof newData === 'function' ? newData(prev) : { ...prev, ...newData };
      localStorage.setItem('auraState', JSON.stringify(next));
      return next;
    });
    showToast('Progress Saved');
  };

  const toggleTodayMetric = (metric: keyof Pick<DayData, 'dietCompleted' | 'runCompleted' | 'gymCompleted'>) => {
    updateState(prev => ({
      ...prev,
      dailyData: {
        ...prev.dailyData,
        [todayKey]: {
          ...todayData,
          [metric]: !todayData[metric]
        }
      }
    }));
  };

  const toggleExercise = (exercise: string) => {
    updateState(prev => {
      const currentExercises = { ...todayData.exercises };
      currentExercises[exercise] = !currentExercises[exercise];
      
      // Auto-complete gym if all exercises are done for the CURRENTLY VIEWED plan
      const allDone = currentGymPlan.exercises.every(ex => currentExercises[ex]);

      return {
        ...prev,
        dailyData: {
          ...prev.dailyData,
          [todayKey]: {
            ...todayData,
            exercises: currentExercises,
            gymCompleted: allDone
          }
        }
      };
    });
  };

  // --- Dashboard Logic ---
  
  const stats = useMemo(() => {
    const keys = Object.keys(auraState.dailyData).sort();
    let streak = 0;
    let totalBurned = 0;
    
    // Calculate streak
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const data = auraState.dailyData[key];
      if (data && (data.gymCompleted || data.runCompleted)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Calculate total burned
    (Object.values(auraState.dailyData) as DayData[]).forEach(d => {
      totalBurned += d.caloriesBurned || 0;
    });

    return { streak, totalBurned };
  }, [auraState]);

  const heatmapData = useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dayInfo = auraState.dailyData[key];
      data.push({
        date: key,
        intensity: dayInfo ? getIntensity(dayInfo) : 0
      });
    }
    return data;
  }, [auraState]);

  const currentDayOfWeek = new Date().getDay();
  const currentGymPlan = GYM_PLAN.find(p => p.day === selectedWorkoutDay) || GYM_PLAN[currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1];
  const currentDietPlan = DIET_PLAN[auraState.dietPreference].find(p => p.day === selectedDietDay) || DIET_PLAN[auraState.dietPreference][currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1];
  const currentRunningPlan = RUNNING_PLAN.find(p => p.week === selectedRunningWeek) || RUNNING_PLAN[0];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-offwhite text-slate-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 border-r border-black/5 p-6 flex-col gap-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">BroFit</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('running')}
            className={`nav-item ${activeTab === 'running' ? 'active' : ''}`}
          >
            <Footprints size={20} /> Running
          </button>
          <button 
            onClick={() => setActiveTab('workout')}
            className={`nav-item ${activeTab === 'workout' ? 'active' : ''}`}
          >
            <Dumbbell size={20} /> Workout
          </button>
          <button 
            onClick={() => setActiveTab('nutrition')}
            className={`nav-item ${activeTab === 'nutrition' ? 'active' : ''}`}
          >
            <Utensils size={20} /> Nutrition
          </button>
        </nav>

        <div className="glass-card p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Current Weight</span>
            <span className="text-slate-900 font-bold">{auraState.weight} kg</span>
          </div>
          <input 
            type="range" 
            min="40" 
            max="150" 
            value={auraState.weight} 
            onChange={(e) => updateState({ weight: parseInt(e.target.value) })}
            className="w-full accent-orange-accent cursor-pointer"
          />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-400 rounded-lg flex items-center justify-center">
            <Zap className="text-white fill-white" size={18} />
          </div>
          <span className="text-xl font-bold text-slate-900">BroFit</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 top-[65px] bg-offwhite z-30 p-6 flex flex-col gap-6"
          >
            <nav className="flex flex-col gap-4">
              <button 
                onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-medium transition-all ${activeTab === 'dashboard' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' : 'text-slate-500'}`}
              >
                <LayoutDashboard size={24} /> Dashboard
              </button>
              <button 
                onClick={() => { setActiveTab('running'); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-medium transition-all ${activeTab === 'running' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' : 'text-slate-500'}`}
              >
                <Footprints size={24} /> Running
              </button>
              <button 
                onClick={() => { setActiveTab('workout'); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-medium transition-all ${activeTab === 'workout' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' : 'text-slate-500'}`}
              >
                <Dumbbell size={24} /> Workout
              </button>
              <button 
                onClick={() => { setActiveTab('nutrition'); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-medium transition-all ${activeTab === 'nutrition' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' : 'text-slate-500'}`}
              >
                <Utensils size={24} /> Nutrition
              </button>
            </nav>
            <div className="mt-auto glass-card p-6">
              <p className="text-slate-500 text-sm mb-4">Update Weight</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-slate-900">{auraState.weight} kg</span>
              </div>
              <input 
                type="range" 
                min="40" 
                max="150" 
                value={auraState.weight} 
                onChange={(e) => updateState({ weight: parseInt(e.target.value) })}
                className="w-full accent-orange-accent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto pb-24 md:pb-10">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6 md:gap-8"
            >
              <header>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Command Center</h2>
                <p className="text-slate-500 text-sm md:text-base">Welcome back, Athlete. Here's your tactical overview.</p>
              </header>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="glass-card flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Current Streak</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.streak} Days</p>
                  </div>
                </div>
                <div className="glass-card flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                    <Flame size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Calories Burned</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalBurned} kcal</p>
                  </div>
                </div>
                <div className="glass-card flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Weight Trend</p>
                    <p className="text-2xl font-bold text-slate-900">{auraState.weight} kg</p>
                  </div>
                </div>
              </div>

              {/* Heatmap */}
              <div className="glass-card">
                <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                  <History size={18} className="text-orange-500" />
                  Annual Performance Heatmap
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {heatmapData.map((day, i) => (
                    <div 
                      key={i}
                      title={`${day.date}: Level ${day.intensity}`}
                      className={`w-3.5 h-3.5 rounded-sm transition-colors duration-300 ${
                        day.intensity === 0 ? 'bg-black/5' :
                        day.intensity === 1 ? 'bg-orange-900/20' :
                        day.intensity === 2 ? 'bg-orange-500/60' :
                        'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-black/5" />
                    <div className="w-3 h-3 rounded-sm bg-orange-900/20" />
                    <div className="w-3 h-3 rounded-sm bg-orange-500/60" />
                    <div className="w-3 h-3 rounded-sm bg-orange-500" />
                  </div>
                  <span>More</span>
                </div>
              </div>

              {/* Daily Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Today's Targets</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => toggleTodayMetric('gymCompleted')}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                        todayData.gymCompleted 
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' 
                        : 'bg-black/5 border-black/5 text-slate-600 hover:bg-black/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Dumbbell size={18} />
                        <span>Gym Session</span>
                      </div>
                      {todayData.gymCompleted && <CheckCircle2 size={18} />}
                    </button>
                    <button 
                      onClick={() => toggleTodayMetric('runCompleted')}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                        todayData.runCompleted 
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' 
                        : 'bg-black/5 border-black/5 text-slate-600 hover:bg-black/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Footprints size={18} />
                        <span>Daily Run</span>
                      </div>
                      {todayData.runCompleted && <CheckCircle2 size={18} />}
                    </button>
                    <button 
                      onClick={() => toggleTodayMetric('dietCompleted')}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                        todayData.dietCompleted 
                        ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' 
                        : 'bg-black/5 border-black/5 text-slate-600 hover:bg-black/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Utensils size={18} />
                        <span>Diet Adherence</span>
                      </div>
                      {todayData.dietCompleted && <CheckCircle2 size={18} />}
                    </button>
                  </div>
                </div>

                <div className="glass-card flex flex-col justify-center items-center text-center p-8">
                  <div className="w-24 h-24 rounded-full border-4 border-orange-500/30 flex items-center justify-center mb-4 relative">
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-orange-500 transition-all duration-1000"
                      style={{ clipPath: `inset(${100 - (getIntensity(todayData) / 3 * 100)}% 0 0 0)` }}
                    />
                    <span className="text-3xl font-bold text-slate-900">{Math.round(getIntensity(todayData) / 3 * 100)}%</span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Daily Readiness</h4>
                  <p className="text-slate-500 text-sm mt-2">Complete all 3 pillars to achieve Elite status for today.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'running' && (
            <motion.div 
              key="running"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6 md:gap-8"
            >
              <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Elite Running Engine</h2>
                  <p className="text-slate-500 text-sm md:text-base">Scientific 40-week progression for peak aerobic capacity.</p>
                </div>
                <div className="flex items-center gap-2 bg-orange-500/20 text-orange-600 px-4 py-2 rounded-lg text-sm font-bold border border-orange-500/30 w-fit">
                  <Activity size={16} />
                  {currentRunningPlan.type}
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card border-orange-500/20 bg-orange-500/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">Week {currentRunningPlan.week}: {currentRunningPlan.focus}</h3>
                        <p className="text-orange-600 text-sm font-medium">Goal: Increase VO2 Max & Lactate Threshold</p>
                      </div>
                      <button 
                        onClick={() => {
                          updateState(prev => ({
                            ...prev,
                            dailyData: {
                              ...prev.dailyData,
                              [todayKey]: {
                                ...todayData,
                                runCompleted: true,
                                caloriesBurned: todayData.caloriesBurned + currentRunningPlan.estBurn
                              }
                            }
                          }));
                        }}
                        className="bg-gradient-to-r from-orange-500 to-yellow-400 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
                      >
                        <Play size={18} fill="currentColor" /> Start Session
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-black/5 rounded-xl border border-black/5 hover:bg-black/10 transition-colors cursor-default">
                        <div className="flex items-center gap-2 mb-2">
                          <Timer size={14} className="text-slate-500" />
                          <p className="text-xs text-slate-500 uppercase tracking-wider">Warmup</p>
                        </div>
                        <p className="text-slate-900 font-medium">{currentRunningPlan.warmup}</p>
                      </div>
                      <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20 hover:bg-orange-500/20 transition-colors cursor-default">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap size={14} className="text-orange-500" />
                          <p className="text-xs text-orange-500 uppercase tracking-wider">Main Set</p>
                        </div>
                        <p className="text-slate-900 font-bold">{currentRunningPlan.intervals}</p>
                      </div>
                      <div className="p-4 bg-black/5 rounded-xl border border-black/5 hover:bg-black/10 transition-colors cursor-default">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp size={14} className="text-slate-500" />
                          <p className="text-xs text-slate-500 uppercase tracking-wider">Cool Down</p>
                        </div>
                        <p className="text-slate-900 font-medium">{currentRunningPlan.cooldown}</p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-black/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <div className="text-slate-500">
                          <p className="text-xs uppercase font-semibold">Total Time</p>
                          <p className="text-slate-900 font-bold text-lg">{currentRunningPlan.totalTime} mins</p>
                        </div>
                        <div className="w-px h-10 bg-black/10 hidden md:block" />
                        <div className="text-slate-500">
                          <p className="text-xs uppercase font-semibold">Est. Burn</p>
                          <p className="text-slate-900 font-bold text-lg">{currentRunningPlan.estBurn} kcal</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 italic text-center md:text-right">"Consistency is the bridge between goals and accomplishment."</p>
                    </div>
                  </div>

                  <div className="glass-card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Training Timeline</h3>
                    <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                      {RUNNING_PLAN.map((p) => (
                        <button 
                          key={p.week} 
                          onClick={() => setSelectedRunningWeek(p.week)}
                          className={`flex-shrink-0 w-24 p-4 rounded-2xl text-center transition-all border ${
                            p.week === selectedRunningWeek 
                            ? 'bg-orange-500/20 border-orange-500/40 scale-105' 
                            : 'bg-black/5 border-black/5 hover:bg-black/10'
                          }`}
                        >
                          <p className="text-[10px] text-slate-500 uppercase mb-1">Week</p>
                          <p className={`text-xl font-bold ${p.week === selectedRunningWeek ? 'text-orange-600' : 'text-slate-900'}`}>{p.week}</p>
                          <div className={`mt-2 h-1 w-full rounded-full overflow-hidden ${p.week === selectedRunningWeek ? 'bg-orange-500/20' : 'bg-black/5'}`}>
                            <div className={`h-full bg-orange-500 transition-all duration-500 ${p.week === selectedRunningWeek ? 'w-full' : 'w-0'}`} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card h-fit">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Running History</h3>
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-black/5 rounded-xl border border-black/5 hover:bg-black/10 transition-colors cursor-pointer">
                          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500">
                            <Footprints size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">Interval Session</p>
                            <p className="text-xs text-slate-500">Feb {22-i}, 2026 • 5.1 km</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-orange-600">+{300 + (i * 15)}</p>
                            <p className="text-[10px] text-slate-500 uppercase">kcal</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-6 py-2 text-sm text-orange-600 font-medium hover:bg-orange-500/10 rounded-lg transition-colors">View All Sessions</button>
                  </div>

                  <div className="glass-card bg-blue-500/5 border-blue-500/20">
                    <h3 className="text-lg font-semibold text-blue-600 mb-2 flex items-center gap-2">
                      <TrendingUp size={18} /> Expert Tip
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Every 4th week is a **Recovery Week**. We reduce volume by 30% to allow your central nervous system to adapt. Don't skip these—they are when the actual gains happen.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'workout' && (
            <motion.div 
              key="workout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6 md:gap-8"
            >
              <header>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Desi Strength Protocol</h2>
                <p className="text-slate-500 text-sm md:text-base">7-Day PPL + Core split featuring traditional Bethaks and Sapate.</p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{currentGymPlan.day} Focus</h3>
                        <p className="text-orange-600 font-medium">{currentGymPlan.focus}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase">Progress</p>
                          <p className="text-xl font-bold text-slate-900">
                            {Object.values(todayData.exercises).filter(Boolean).length} / {currentGymPlan.exercises.length}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full border-2 border-orange-500/20 flex items-center justify-center">
                           <span className="text-xs font-bold text-orange-600">
                             {Math.round((Object.values(todayData.exercises).filter(Boolean).length / currentGymPlan.exercises.length) * 100)}%
                           </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {currentGymPlan.exercises.map((ex) => (
                        <motion.div 
                          key={ex}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleExercise(ex)}
                          className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                            todayData.exercises[ex] 
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-600' 
                            : 'bg-black/5 border-black/5 text-slate-600 hover:bg-black/10'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                              todayData.exercises[ex] ? 'bg-orange-500 border-orange-500' : 'border-black/20'
                            }`}>
                              {todayData.exercises[ex] && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <span className="font-medium text-sm md:text-base">{ex}</span>
                          </div>
                          <div className="flex gap-3 text-[10px] md:text-xs text-slate-500 uppercase font-semibold">
                            <span>4 Sets</span>
                            <span>12 Reps</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Weekly Split</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                      {GYM_PLAN.map((p) => (
                        <button 
                          key={p.day} 
                          onClick={() => setSelectedWorkoutDay(p.day)}
                          className={`p-3 rounded-lg flex flex-col lg:flex-row lg:items-center lg:justify-between transition-all border ${p.day === selectedWorkoutDay ? 'bg-orange-500/20 border-orange-500/30' : 'bg-black/5 hover:bg-black/10 border-transparent'}`}
                        >
                          <span className={`text-xs md:text-sm ${p.day === selectedWorkoutDay ? 'text-orange-600 font-bold' : 'text-slate-500'}`}>{p.day}</span>
                          <span className="text-[10px] text-slate-500 lg:ml-2 truncate">{p.focus.split('(')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card bg-orange-500/5 border-orange-500/20">
                    <h3 className="text-lg font-semibold text-orange-600 mb-2 flex items-center gap-2">
                      <Zap size={18} /> Pro Tip
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Don't skip the **Hindu Squats (Bethaks)**. They build explosive power and endurance that standard squats can't match. Keep your heels off the ground for maximum calf engagement.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'nutrition' && (
            <motion.div 
              key="nutrition"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6 md:gap-8"
            >
              <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Fuel & Recovery</h2>
                  <p className="text-slate-500 text-sm md:text-base">High-protein Indian meal plans optimized for muscle synthesis.</p>
                </div>
                <div className="flex bg-black/5 p-1 rounded-xl border border-black/5 w-fit">
                  <button 
                    onClick={() => updateState({ dietPreference: 'veg' })}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${auraState.dietPreference === 'veg' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}
                  >
                    Vegetarian
                  </button>
                  <button 
                    onClick={() => updateState({ dietPreference: 'non-veg' })}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${auraState.dietPreference === 'non-veg' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}
                  >
                    Non-Veg
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      <h3 className="text-2xl font-bold text-slate-900">{currentDietPlan.day} Menu</h3>
                      <button 
                        onClick={() => toggleTodayMetric('dietCompleted')}
                        className={`px-6 py-3 rounded-xl font-bold border transition-all shadow-lg ${
                          todayData.dietCompleted 
                          ? 'bg-orange-500 border-orange-500 text-white shadow-orange-500/20' 
                          : 'bg-black/5 border-black/5 text-slate-600 hover:bg-black/10'
                        }`}
                      >
                        {todayData.dietCompleted ? 'Diet Followed' : 'Mark Adhered'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {currentDietPlan.meals.map((meal, i) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ x: 5 }}
                          className="flex gap-4 group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center text-slate-500 group-hover:bg-orange-500/20 group-hover:text-orange-600 transition-colors flex-shrink-0">
                            <span className="font-bold text-lg">{i + 1}</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Meal {i + 1}</p>
                            <p className="text-slate-900 font-medium text-base md:text-lg leading-tight">{meal}</p>
                            <p className="text-[10px] text-orange-600/60 mt-1 uppercase font-bold tracking-tighter">~450 kcal • 35g Protein</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Calorie Command</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                      <div className="p-6 bg-black/5 rounded-2xl text-center border border-black/5">
                        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Food Intake</p>
                        <div className="flex items-center justify-center gap-2">
                          <input 
                            type="number" 
                            value={todayData.caloriesConsumed || ''} 
                            placeholder="0"
                            onChange={(e) => updateState(prev => ({
                              ...prev,
                              dailyData: {
                                ...prev.dailyData,
                                [todayKey]: {
                                  ...todayData,
                                  caloriesConsumed: parseInt(e.target.value) || 0
                                }
                              }
                            }))}
                            className="bg-transparent text-3xl font-bold text-slate-900 w-24 text-center focus:outline-none border-b border-black/10 focus:border-orange-500 transition-colors"
                          />
                          <span className="text-slate-500 font-bold">kcal</span>
                        </div>
                      </div>
                      <div className="p-6 bg-black/5 rounded-2xl text-center border border-black/5">
                        <p className="text-sm text-slate-500 mb-2 uppercase tracking-wider">Burned (Run)</p>
                        <p className="text-3xl font-bold text-orange-600">-{todayData.caloriesBurned} <span className="text-sm text-slate-500">kcal</span></p>
                      </div>
                      <div className="p-6 bg-orange-500/10 rounded-2xl text-center border border-orange-500/20 shadow-inner">
                        <p className="text-xs text-orange-600 mb-2 uppercase tracking-wider">Daily Deficit</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {Math.max(0, (todayData.caloriesConsumed || 0) - todayData.caloriesBurned)}
                          <span className="text-sm text-slate-500 ml-1 font-normal">Net</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Weekly Menu</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button 
                          key={day} 
                          onClick={() => setSelectedDietDay(day)}
                          className={`p-3 rounded-lg flex flex-col lg:flex-row lg:items-center lg:justify-between transition-all border ${day === selectedDietDay ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-black/5 hover:bg-black/10 border-transparent'}`}
                        >
                          <span className={`text-xs md:text-sm ${day === selectedDietDay ? 'text-orange-600 font-bold' : 'text-slate-500'}`}>{day}</span>
                          <span className="text-[10px] text-slate-500 lg:ml-2">View Menu</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Protein Sources</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Soya Chunks', p: '52g / 100g' },
                        { name: 'Paneer', p: '18g / 100g' },
                        { name: 'Chicken Breast', p: '31g / 100g' },
                        { name: 'Eggs', p: '6g / Egg' },
                        { name: 'Sattu', p: '20g / 100g' },
                      ].map(item => (
                        <div key={item.name} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">{item.name}</span>
                          <span className="text-orange-600 font-mono font-bold">{item.p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card bg-orange-500/5 border-orange-500/20">
                    <h3 className="text-lg font-semibold text-orange-600 mb-2">The Sattu Secret</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Sattu (roasted gram flour) is the "Desi Protein Shake". It's rich in fiber, iron, and protein. Mix 2-3 spoons in water with lemon and black salt for a perfect pre-workout fuel.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Toast visible={toast.visible} message={toast.message} />

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-black/5 flex justify-around p-2 z-40">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'dashboard' ? 'text-orange-600' : 'text-slate-500'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('running')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'running' ? 'text-orange-600' : 'text-slate-500'}`}
        >
          <Footprints size={20} />
          <span className="text-[10px] font-medium">Run</span>
        </button>
        <button 
          onClick={() => setActiveTab('workout')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'workout' ? 'text-orange-600' : 'text-slate-500'}`}
        >
          <Dumbbell size={20} />
          <span className="text-[10px] font-medium">Gym</span>
        </button>
        <button 
          onClick={() => setActiveTab('nutrition')}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'nutrition' ? 'text-orange-600' : 'text-slate-500'}`}
        >
          <Utensils size={20} />
          <span className="text-[10px] font-medium">Diet</span>
        </button>
      </nav>
    </div>
  );
}
