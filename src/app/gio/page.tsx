'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, Apple, ArrowRight, BookOpen, Bot, BriefcaseBusiness, CalendarDays,
  CheckCircle2, ChevronRight, Clock3, Cloud, Download, Dumbbell, Flame, GlassWater, HeartPulse,
  LineChart, ListChecks, Lock, Mail, Moon, NotebookPen, Plus, ShieldAlert,
  ShieldCheck, Sparkles, ScanBarcode, Scale, Target, TimerReset, Trophy,
  Utensils, Waves, Zap,
} from 'lucide-react'
import {
  AGENT_ROSTER, DEFAULT_GROCERIES, FAST_FOOD_GUIDES, PERSONAL_PROFILE,
  TRAINING_WEEK, WEEKLY_GYM_PLAN, bodyTipOfTheDay, defaultDayPlan,
  groceryTextFromDefaults, mealIdeasFromGroceries, readinessScore,
  tomorrowProtocol, verseOfTheDay, waterTargetOz, workoutFor,
  type DailyGrowthLog, type TrainingBlock, type WeeklyGymDay,
} from '@/lib/personal'
import { cn } from '@/lib/utils'
import { useOS } from '@/lib/store'
import CommandBar from '@/components/dashboard/CommandBar'
import { HARD_FLOOR_LB, PERFORMANCE_RANGE, isBelowHardFloor, underFueledMessage, weightGuardMessage } from '@/lib/health-guards'
import {
  getCurrentUser, isPersonalMemoryConnected, listGioCheckins, onAuthChanged,
  saveGioCheckin, saveGioFaith, saveGioWatchMetrics, saveGioWater,
  signInWithEmail, signOutOfMemory,
} from '@/lib/supabase'

const LOG_KEY = 'gio-os-growth-log-v4'
const GROCERY_KEY = 'gio-os-groceries-v4'
const WATER_KEY = 'gio-os-water-v2'
const PROTEIN_KEY = 'gio-os-protein-v1'
const PLAN_KEY = 'gio-os-plan-v2'
const CHECKLIST_KEY = 'gio-os-checklist-v1'
const BARCODE_KEY = 'gio-os-barcodes-v1'
const FOOD_LOG_KEY = 'gio-os-food-log-v1'
const GROCERY_STOCK_KEY = 'gio-os-grocery-stock-v1'
const WORKOUT_SETS_KEY = 'gio-os-workout-sets-v1'
const CLAUDE_RESULTS_KEY = 'gio-os-claude-results-v1'
const WORKOUT_DONE_KEY = 'gio-os-workout-done-v1'
const PERSONAL_SYNC_PREF_KEY = 'gio-os-personal-sync-pref-v1'

type Mode = 'Gym' | 'Home' | 'Recovery'
type Focus = 'Mission' | 'Train' | 'Eat' | 'Track' | 'Faith' | 'Claude'
type FoodAddTab = 'Staples' | 'Combos' | 'Recent' | 'Custom'

interface FoodLookup {
  name: string
  brand?: string
  serving?: string
  calories?: number
  protein?: number
}

interface FoodEntry {
  id: string
  date: string
  meal: string
  name: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface QuickFoodMacro {
  name: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  note: string
}

interface WorkoutSetEntry {
  id: string
  date: string
  session: string
  exercise: string
  weight: string
  reps: number
  rpe: number
}

const NAV: { id: Focus; label: string }[] = [
  { id: 'Mission', label: 'Mission' },
  { id: 'Train', label: 'Train' },
  { id: 'Eat', label: 'Eat' },
  { id: 'Track', label: 'Track' },
  { id: 'Faith', label: 'Faith' },
  { id: 'Claude', label: 'Claude' },
]

const DAILY_ACTIONS = [
  { id: 'weigh', label: 'Morning weigh-in' },
  { id: 'sleep', label: 'Log sleep, mood, soreness, energy' },
  { id: 'mission', label: 'Read today mission first' },
  { id: 'protein', label: 'Hit protein at every meal' },
  { id: 'water', label: 'Drink water through the day' },
  { id: 'mobility', label: 'Do 10 minutes mobility' },
  { id: 'train', label: 'Train, wrestle, or recover' },
  { id: 'faith', label: 'Prayer and journal' },
]

const REMINDERS = [
  'Morning: weigh in, water, breakfast, mission',
  'Midday: protein meal, refill water, check schedule',
  'Pre-training: carbs plus protein 60-120 minutes before',
  'After training: recovery meal, log energy, stretch',
  'Night: faith journal, plan tomorrow, sleep target',
]

const BODYWEIGHT_TESTS = [
  'Pushups',
  'Pullups',
  'Bodyweight squats',
  'Plank hold',
  'Sprint/bike intervals',
  'Mobility minutes',
]

const MEAL_SECTIONS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const

const MACRO_TARGETS = {
  protein: 150,
  carbs: 330,
  fat: 90,
}

const CLAUDE_WORK_LANE = [
  {
    title: 'Nutrition research assistant',
    prompt: 'Build Gio a safe teen-athlete meal planning checklist for wrestling off-season at 144. Focus on protein, hydration, energy, recovery, and grocery-based meals. Do not recommend dehydration, skipped meals, or aggressive weight descent.',
  },
  {
    title: 'Workout planning assistant',
    prompt: 'Create a wrestling off-season weekly workout plan for a 16-year-old, 6 ft, 145 lb wrestler with practices Tuesday/Thursday 6-8 PM and Sunday 2-4 PM. Prioritize strength, agility, mobility, injury prevention, and safe recovery.',
  },
  {
    title: 'Business revenue assistant',
    prompt: 'Create a daily action plan for GR Scale to get its first HVAC customer. Include lead research, audit angle, outreach script, follow-up, booking, proposal, deposit, and delivery checklist.',
  },
]

const TOMORROW_EXECUTION = [
  {
    time: '8:00',
    title: 'Wake, weigh, water',
    action: 'Bathroom first. Log morning weight, sleep, soreness, mood, and energy. Drink one steady water block.',
  },
  {
    time: '8:20',
    title: 'Breakfast',
    action: '3 eggs, 2 slices toast with peanut butter, banana, and milk.',
  },
  {
    time: 'Before work',
    title: 'Pack fuel',
    action: 'Pack Premier shake, tuna wrap or chicken wrap, granola bar, banana if available, and water bottle.',
  },
  {
    time: 'Mid-shift',
    title: 'Lunch',
    action: 'Chicken wrap/sandwich or tuna tortilla. Drink water. Use granola only if energy is dipping.',
  },
  {
    time: 'After work',
    title: 'Training decision',
    action: 'If readiness is 65+: gym 45 minutes. If tired/sore: 25-minute home or recovery plan.',
  },
  {
    time: 'After gym',
    title: 'Recovery meal',
    action: 'Premier or Kate Farms shake first, then chicken breast/chunks with fried rice for dinner.',
  },
  {
    time: 'Night',
    title: 'Faith, reflection, sleep',
    action: 'Prayer, one lesson, one win, one fix. Prep tomorrow and protect sleep.',
  },
]

const TOMORROW_READY_ACTIONS = [
  { id: 'alarm', label: 'Alarm set for 8:00 AM' },
  { id: 'scale', label: 'Scale ready for morning weigh-in' },
  { id: 'water', label: 'Water bottle ready' },
  { id: 'breakfast', label: 'Breakfast picked: eggs, toast, banana, milk' },
  { id: 'pack', label: 'Work food packed or planned' },
  { id: 'gym-clothes', label: 'Gym clothes/shoes ready' },
  { id: 'dashboard', label: 'Gio OS open on phone/laptop' },
  { id: 'business', label: 'Business action chosen: send/log 10' },
]

const WORK_PACK_LIST = [
  'Premier Protein shake',
  'Tuna tortilla or chicken wrap',
  'Granola bar',
  'Banana if available',
  'Water bottle',
  'Optional peanut butter sandwich if the shift is long',
]

const TOMORROW_MEAL_PRESETS = [
  {
    label: 'Work breakfast',
    note: 'Eggs, toast, banana, milk.',
    items: [
      { food: 'Egg', grams: 150, meal: 'Breakfast' },
      { food: 'Nature Own bread', grams: 60, meal: 'Breakfast' },
      { food: 'Banana', grams: 120, meal: 'Breakfast' },
      { food: 'Milk', grams: 240, meal: 'Breakfast' },
    ],
  },
  {
    label: 'Packed tuna wrap',
    note: 'Fast lean protein for work.',
    items: [
      { food: 'Tuna packet', grams: 84, meal: 'Lunch' },
      { food: 'Carb Balance tortilla', grams: 70, meal: 'Lunch' },
      { food: 'Cheese slice', grams: 20, meal: 'Lunch' },
    ],
  },
  {
    label: 'Packed chicken wrap',
    note: 'Best all-around work lunch.',
    items: [
      { food: 'Kirkland chicken chunks', grams: 140, meal: 'Lunch' },
      { food: 'Carb Balance tortilla', grams: 70, meal: 'Lunch' },
      { food: 'Cheese slice', grams: 20, meal: 'Lunch' },
    ],
  },
  {
    label: 'Work snack',
    note: 'Use when energy dips.',
    items: [
      { food: 'Premier Protein shake', grams: 325, meal: 'Snack' },
      { food: 'Granola bar', grams: 40, meal: 'Snack' },
    ],
  },
  {
    label: 'Recovery dinner',
    note: 'After gym or long day.',
    items: [
      { food: 'Chicken breast cooked', grams: 170, meal: 'Dinner' },
      { food: 'Fried rice with chicken', grams: 255, meal: 'Dinner' },
    ],
  },
]

const WEIGHT_RANGE = {
  low: PERFORMANCE_RANGE.low,
  high: PERFORMANCE_RANGE.high,
  hardFloor: HARD_FLOOR_LB,
}

const NUTRITION_TARGETS = {
  calories: '2900-3100',
  protein: 150,
  proteinRange: '140-160g',
  water: '3-4L / about 1 gallon',
}

const STAPLE_FOODS = [
  { label: 'Egg breakfast', line: '3 eggs, toast, banana, milk - about 35g protein' },
  { label: 'Chicken tortillas', line: '2 Carb Balance tortillas with chicken chunks and cheese - about 45g protein' },
  { label: 'Premier shake', line: 'Premier Protein shake - about 30g protein' },
  { label: 'Tuna wrap', line: 'Tuna packet in Carb Balance tortilla with cheese - about 35g protein' },
  { label: 'Chicken rice', line: 'Chicken breast or chunks with fried rice - about 45g protein' },
  { label: 'PB toast', line: 'Peanut butter toast with milk - calorie booster' },
]

const QUICK_FOOD_MACROS: QuickFoodMacro[] = [
  { name: 'Chicken breast cooked', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 4, note: 'Best lean protein base.' },
  { name: 'Kirkland chicken chunks', caloriesPer100g: 150, proteinPer100g: 25, carbsPer100g: 1, fatPer100g: 4, note: 'Estimate until label is entered.' },
  { name: 'Egg', caloriesPer100g: 143, proteinPer100g: 13, carbsPer100g: 1, fatPer100g: 10, note: 'Weigh cooked eggs if possible.' },
  { name: 'Tuna packet', caloriesPer100g: 116, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1, note: 'Very lean protein.' },
  { name: 'Premier Protein shake', caloriesPer100g: 49, proteinPer100g: 9, carbsPer100g: 2, fatPer100g: 1, note: 'One bottle is usually about 325g.' },
  { name: 'Nature Own bread', caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 4, note: 'Use the label later for exact.' },
  { name: 'Carb Balance tortilla', caloriesPer100g: 218, proteinPer100g: 8, carbsPer100g: 43, fatPer100g: 6, note: 'Great wrap tool.' },
  { name: 'Banana', caloriesPer100g: 89, proteinPer100g: 1, carbsPer100g: 23, fatPer100g: 0, note: 'Training carb.' },
  { name: 'Peanut butter', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, note: 'Calorie booster; weigh it.' },
  { name: 'Fried rice with chicken', caloriesPer100g: 150, proteinPer100g: 7, carbsPer100g: 21, fatPer100g: 4, note: 'Estimate per 100g until label is exact.' },
  { name: 'Cheese slice', caloriesPer100g: 350, proteinPer100g: 22, carbsPer100g: 3, fatPer100g: 28, note: 'Adds protein and calories.' },
  { name: 'Milk', caloriesPer100g: 61, proteinPer100g: 3, carbsPer100g: 5, fatPer100g: 3, note: 'Easy calories and fluids.' },
  { name: 'Granola bar', caloriesPer100g: 430, proteinPer100g: 7, carbsPer100g: 70, fatPer100g: 14, note: 'Quick fuel; label later.' },
  { name: 'Special K / Cheerios', caloriesPer100g: 370, proteinPer100g: 8, carbsPer100g: 80, fatPer100g: 3, note: 'Add protein with it.' },
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function defaultGroceryStock() {
  return DEFAULT_GROCERIES.reduce<Record<string, boolean>>((stock, item) => {
    stock[slugify(item.name)] = true
    return stock
  }, {})
}

function weekdayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

function Section({
  id, eyebrow, title, icon: Icon, children, className,
}: {
  id?: string
  eyebrow: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn('scroll-mt-28 border-t border-white/10 py-8', className)}>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
          <Icon className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</p>
          <h2 className="text-2xl font-black tracking-tight text-white">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  const [tapCount, setTapCount] = useState(0)

  function handleCardTap(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, video')) return
    setTapCount(current => current + 1)
  }

  return (
    <div
      onClick={handleCardTap}
      className={cn(
        'relative rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/10 transition',
        tapCount > 0 && 'ring-1 ring-cyan-300/30',
        className
      )}
    >
      {tapCount > 0 && (
        <span className="pointer-events-none absolute right-3 top-3 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-100">
          Active {tapCount}
        </span>
      )}
      {children}
    </div>
  )
}

function Metric({ label, value, sub, tone = 'cyan' }: { label: string; value: string; sub: string; tone?: 'cyan' | 'green' | 'amber' | 'violet' }) {
  const colors = {
    cyan: 'text-cyan-200',
    green: 'text-emerald-200',
    amber: 'text-amber-200',
    violet: 'text-violet-200',
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{label}</p>
      <p className={cn('mt-1 text-3xl font-black tracking-tight', colors[tone])}>{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-white/45">{sub}</p>
    </div>
  )
}

function PillButton({
  active, children, onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-11 rounded-full border px-4 text-sm font-black transition',
        active
          ? 'border-cyan-300 bg-cyan-300 text-slate-950'
          : 'border-white/10 bg-black/20 text-white/55 hover:border-white/25 hover:text-white'
      )}
    >
      {children}
    </button>
  )
}

function CheckRow({ checked, label, onClick }: { checked: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm font-bold transition',
        checked
          ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100'
          : 'border-white/10 bg-black/20 text-white/58 hover:text-white'
      )}
    >
      <CheckCircle2 className={cn('h-4 w-4 shrink-0', checked ? 'text-emerald-300' : 'text-white/25')} />
      {label}
    </button>
  )
}

function InputField({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-widest text-white/35">{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60"
      />
    </label>
  )
}

function groceryNeeds(groceries: string) {
  const lower = groceries.toLowerCase()
  const needs = []
  if (!lower.includes('rice') && !lower.includes('potato')) needs.push('Rice or potatoes for training carbs')
  if (!lower.includes('vegetable') && !lower.includes('broccoli') && !lower.includes('salad')) needs.push('Vegetables or salad kits')
  if (!lower.includes('yogurt')) needs.push('Greek yogurt')
  if (!lower.includes('berry') && !lower.includes('apple')) needs.push('Apples or berries')
  if (!lower.includes('oats')) needs.push('Oats')
  return needs.slice(0, 5)
}

function estimatedProtein(log: DailyGrowthLog, proteinBlocks: number) {
  const base = proteinBlocks * 25
  const mealText = `${log.meals ?? ''} ${log.workout ?? ''}`.toLowerCase()
  const bonus = mealText.includes('chicken') || mealText.includes('tuna') || mealText.includes('egg') ? 20 : 0
  return Math.min(180, base + bonus)
}

function numeric(value?: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function roundMacro(value: number) {
  return Math.round(value * 10) / 10
}

function macroEntry(food: QuickFoodMacro, grams: number, meal: string, date: string): FoodEntry {
  const factor = Math.max(0, grams) / 100
  return {
    id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date,
    meal,
    name: food.name,
    grams: Math.round(grams),
    calories: Math.round(food.caloriesPer100g * factor),
    protein: roundMacro(food.proteinPer100g * factor),
    carbs: roundMacro(food.carbsPer100g * factor),
    fat: roundMacro(food.fatPer100g * factor),
  }
}

function foodTotals(entries: FoodEntry[]) {
  return entries.reduce((totals, entry) => ({
    calories: totals.calories + entry.calories,
    protein: roundMacro(totals.protein + entry.protein),
    carbs: roundMacro(totals.carbs + entry.carbs),
    fat: roundMacro(totals.fat + entry.fat),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
}

function mealNameForDiary(meal: string) {
  const lower = meal.toLowerCase()
  if (lower.includes('breakfast')) return 'Breakfast'
  if (lower.includes('lunch') || lower.includes('pre-workout')) return 'Lunch'
  if (lower.includes('dinner')) return 'Dinner'
  return 'Snacks'
}

function yesterdayIso(dateIso: string) {
  const date = dateIso ? new Date(`${dateIso}T00:00:00`) : new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString().slice(0, 10)
}

function workoutSetSummary(sets: WorkoutSetEntry[]) {
  if (!sets.length) return { count: 0, avgRpe: 0, totalReps: 0, signal: 'Log sets to activate progression.' }
  const avgRpe = roundMacro(sets.reduce((sum, set) => sum + set.rpe, 0) / sets.length)
  const totalReps = sets.reduce((sum, set) => sum + set.reps, 0)
  const signal = avgRpe <= 7
    ? 'Clean work. If all planned sets are done, next matching session can progress slightly.'
    : avgRpe >= 9
      ? 'Too hard. Reduce load or volume next set/session.'
      : 'Solid effort. Repeat or progress only if form stayed clean.'
  return { count: sets.length, avgRpe, totalReps, signal }
}

function groceryMealCombos(stock: Record<string, boolean>) {
  const has = (name: string) => Boolean(stock[slugify(name)])
  const combos = [
    {
      ok: has('eggs') && has("Nature's Own bread") && has('bananas'),
      label: 'Eggs + toast + banana',
      use: 'Best breakfast or post-lift fuel.',
    },
    {
      ok: has('Kirkland chicken breast chunks') && has('Carb Balance tortillas') && has('cheese slices'),
      label: 'Chicken tortilla wrap',
      use: 'Best fast lunch: protein plus easy carbs.',
    },
    {
      ok: has('Kirkland tuna packets') && has('Carb Balance tortillas'),
      label: 'Tuna tortilla',
      use: 'Lean protein when you need something quick.',
    },
    {
      ok: has('Premier Protein shakes') && has('Kirkland soft and chewy granola bars'),
      label: 'Premier shake + granola bar',
      use: 'Best snack when you are behind on protein.',
    },
    {
      ok: has('Kirkland chicken breasts') && has('chicken fried rice meals'),
      label: 'Chicken breast + fried rice',
      use: 'Best dinner after gym or practice.',
    },
    {
      ok: has('peanut butter') && has("Nature's Own bread") && has('milk'),
      label: 'PB toast + milk',
      use: 'Calorie booster if you are under-fueled.',
    },
  ]
  return combos.filter(combo => combo.ok).slice(0, 4)
}

function workoutCompletionForToday(plan: WeeklyGymDay, done: Record<string, boolean>, date: string) {
  if (!plan.plan.length) return 0
  const completed = plan.plan.filter(step => done[`${date}-${plan.day}-${step}`]).length
  return Math.round((completed / plan.plan.length) * 100)
}

function adaptiveCoachSignals({
  log,
  readiness,
  hasPractice,
  workoutCompletion,
  protein,
  waterPct,
}: {
  log: DailyGrowthLog
  readiness: number
  hasPractice: boolean
  workoutCompletion: number
  protein: number
  waterPct: number
}) {
  const sleep = numeric(log.sleep)
  const soreness = numeric(log.soreness)
  const energy = numeric(log.energy)
  const signals: string[] = []

  if (sleep > 0 && sleep < 7) signals.push('Sleep is low: lower intensity and protect bedtime.')
  if (soreness >= 7) signals.push('Soreness is high: recovery/mobility beats forcing volume.')
  if (energy > 0 && energy <= 4) signals.push('Energy is low: use a short technical session or recovery plan.')
  if (readiness >= 80 && !hasPractice) signals.push('Readiness is high: good day to progress strength carefully.')
  if (hasPractice) signals.push('Practice day: fuel before practice, hydrate early, stretch after.')
  if (workoutCompletion >= 90) signals.push('Workout completed: next matching lift can add 1 rep per set or small weight if form stayed clean.')
  if (workoutCompletion > 0 && workoutCompletion < 60) signals.push('Workout partial: repeat the same level next time instead of jumping ahead.')
  if (protein < 110) signals.push('Protein is behind: next meal needs a real protein base.')
  if (isBelowHardFloor(log.weight)) signals.unshift('Below floor: fuel, hydrate, recover, and bring this to a parent/coach/doctor.')
  if (waterPct < 55) signals.push('Water is behind: sip steadily. Water is never reduced for weight.')

  return signals.slice(0, 5)
}

function nextMealRecommendation(entries: FoodEntry[], protein: number, hasPractice: boolean) {
  const totals = foodTotals(entries)
  if (totals.calories < 600) return 'Next meal: eggs or chicken wrap plus milk/banana. Start the day with real fuel.'
  if (protein < 90) return 'Next meal: chicken, tuna, eggs, or Premier shake. Protein is the limiter right now.'
  if (hasPractice && totals.carbs < 160) return 'Next meal: add training carbs like bread, rice, banana, cereal, or granola with protein.'
  if (totals.fat > 95) return 'Next meal: keep it leaner: chicken/tuna/eggs plus carbs and water.'
  return 'Next meal: balanced plate. Protein first, training carbs second, water steady.'
}

function buildAdaptivePlanText(args: {
  mode: Mode
  minutes: string
  readiness: number
  hasPractice: boolean
  todayTraining?: TrainingBlock
  workoutCompletion: number
  protein: number
  waterOz: number
  targetOz: number
  meal: string
}) {
  const intensity = args.readiness >= 80 && !args.hasPractice
    ? 'progress strength'
    : args.readiness >= 65
      ? 'train controlled'
      : 'recover smart'
  const trainingLine = args.hasPractice
    ? `Practice is loaded today: ${args.todayTraining?.time}. Lift only if it helps practice, not if it steals from it.`
    : `${args.mode} mode for ${args.minutes} minutes: ${intensity}.`
  const progressLine = args.workoutCompletion >= 90
    ? 'Last workout was completed: add a small progression next matching session if form was clean and RPE stayed 7 or lower.'
    : args.workoutCompletion > 0
      ? 'Workout was partial: repeat the same level and win clean before increasing.'
      : 'No workout completion logged yet: choose the minimum effective session and log every step.'

  return [
    `Adaptive Gio OS plan for ${weekdayName()}:`,
    trainingLine,
    progressLine,
    `Nutrition next step: ${args.meal}`,
    `Hydration: ${args.waterOz}/${args.targetOz} oz. Sip steadily. Water is never reduced for weight.`,
    `Faith: pray for discipline, self-control, humility, and consistency. Journal one win and one fix tonight.`,
  ].join('\n')
}

function coachStyleAnswer(args: {
  question: string
  readiness: number
  waterOz: number
  targetOz: number
  protein: number
  calories: number
  hasPractice: boolean
  workoutCompletion: number
  nextMeal: string
  mode: Mode
  minutes: string
}) {
  const q = args.question.toLowerCase()
  const tired = q.includes('tired') || q.includes('work') || q.includes('long day') || args.readiness < 65
  const gym = q.includes('gym') || q.includes('lift') || args.mode === 'Gym'
  const food = q.includes('eat') || q.includes('meal') || q.includes('hungry') || q.includes('food')
  const waterBehind = args.waterOz < args.targetOz * 0.6
  const proteinBehind = args.protein < 120

  const opener = tired
    ? 'Gio, today is a controlled execution day. We are not being lazy, but we are not forcing a bad workout either.'
    : 'Gio, you are clear to execute. Keep it simple: fuel, train clean, log the truth, then shut it down on time.'

  const training = args.hasPractice
    ? 'Training: practice is the main workout. Do mobility after and avoid extra junk volume.'
    : gym && !tired
      ? `Training: run ${args.minutes || '45'} minutes in Gym mode. Stop 1-2 reps before failure and log every set with RPE.`
      : tired
        ? 'Training: do the 25-minute recovery/home plan. Finish mobility, core, and easy movement. Winning today is consistency.'
        : `Training: ${args.mode} mode is fine. Finish the plan before adding anything extra.`

  const nutrition = food || proteinBehind || args.calories < 1800
    ? `Food: ${args.nextMeal}`
    : 'Food: stay steady. Protein at the next meal, carbs around training, no skipped meals.'

  const hydration = waterBehind
    ? `Water: you are behind at ${args.waterOz}/${args.targetOz} oz. Sip steadily for the next 2 hours. Do not chug and do not cut water.`
    : `Water: ${args.waterOz}/${args.targetOz} oz logged. Keep sipping, especially after work or training.`

  const progress = args.workoutCompletion >= 90
    ? 'Progression: next matching session can move up slightly only if form was clean and RPE stayed controlled.'
    : args.workoutCompletion > 0
      ? 'Progression: repeat this level next time until you complete it clean.'
      : 'Progression: log the workout today so the next plan can actually adjust.'

  return [opener, training, nutrition, hydration, progress, 'Faith: pray for discipline and self-control, then write one win and one fix tonight.'].join('\n\n')
}

function weightTrend(logs: DailyGrowthLog[]) {
  const usable = logs
    .map(log => ({ ...log, n: Number(log.weight) }))
    .filter(log => Number.isFinite(log.n) && log.n > 0)
    .slice(0, 7)
    .reverse()

  const average = usable.length
    ? Number((usable.reduce((sum, log) => sum + log.n, 0) / usable.length).toFixed(1))
    : 0
  const status = average > 0 && average < WEIGHT_RANGE.hardFloor
    ? 'red'
    : average >= WEIGHT_RANGE.low && average <= WEIGHT_RANGE.high
      ? 'green'
      : average > 0
        ? 'amber'
        : 'neutral'
  const message = status === 'red'
    ? 'Below floor: parent/coach/doctor conversation, fuel and hydrate.'
    : status === 'green'
      ? 'In range. Hold, fuel, get stronger.'
      : status === 'amber'
        ? 'Outside range. Adjust slowly, no panic.'
        : 'Log 2+ mornings.'

  if (usable.length < 2) return { label: 'Need 2+ logs', values: usable, change: 0, average, status, message }
  const change = Number((usable[usable.length - 1].n - usable[0].n).toFixed(1))
  const sign = change > 0 ? '+' : ''
  return { label: `${sign}${change} lb this trend`, values: usable, change, average, status, message }
}

function streakFromActions(checklist: Record<string, boolean>, actionId: string) {
  let streak = 0
  const cursor = new Date()
  for (let index = 0; index < 30; index += 1) {
    const iso = cursor.toISOString().slice(0, 10)
    if (!checklist[`${iso}-${actionId}`]) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default function GioDashboardPage() {
  const { data: osData, metrics: businessMetrics, ready: businessReady } = useOS()
  const [unlocked, setUnlocked] = useState(true)
  const [passcode, setPasscode] = useState('')
  const [focus, setFocus] = useState<Focus>('Mission')
  const [mode, setMode] = useState<Mode>('Gym')
  const [minutes, setMinutes] = useState('45')
  const [other, setOther] = useState('')
  const [waterDone, setWaterDone] = useState(0)
  const [proteinBlocks, setProteinBlocks] = useState(0)
  const [groceries, setGroceries] = useState('')
  const [fastFood, setFastFood] = useState('Wawa')
  const [logs, setLogs] = useState<DailyGrowthLog[]>([])
  const [currentDay, setCurrentDay] = useState({ iso: '', weekday: '' })
  const [todayLog, setTodayLog] = useState<DailyGrowthLog>({ date: '' })
  const [plan, setPlan] = useState('7:30 wake, weigh in, breakfast, gym, mobility, meals, faith journal, sleep.')
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [waterHistory, setWaterHistory] = useState<Record<string, number>>({})
  const [barcode, setBarcode] = useState('')
  const [barcodeName, setBarcodeName] = useState('')
  const [barcodeServing, setBarcodeServing] = useState('')
  const [barcodeLog, setBarcodeLog] = useState<string[]>([])
  const [scannerActive, setScannerActive] = useState(false)
  const [scanStatus, setScanStatus] = useState('Mobile scanner ready.')
  const [foodLookup, setFoodLookup] = useState<FoodLookup | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([])
  const [selectedFood, setSelectedFood] = useState(QUICK_FOOD_MACROS[0].name)
  const [foodGrams, setFoodGrams] = useState('100')
  const [foodMeal, setFoodMeal] = useState('Meal')
  const [foodSheetOpen, setFoodSheetOpen] = useState(false)
  const [foodAddTab, setFoodAddTab] = useState<FoodAddTab>('Staples')
  const [foodSearch, setFoodSearch] = useState('')
  const [editingFoodId, setEditingFoodId] = useState('')
  const [customFoodName, setCustomFoodName] = useState('')
  const [customCalories, setCustomCalories] = useState('')
  const [customProtein, setCustomProtein] = useState('')
  const [customCarbs, setCustomCarbs] = useState('')
  const [customFat, setCustomFat] = useState('')
  const [groceryStock, setGroceryStock] = useState<Record<string, boolean>>({})
  const [workoutSets, setWorkoutSets] = useState<WorkoutSetEntry[]>([])
  const [activeWorkoutStep, setActiveWorkoutStep] = useState(0)
  const [restSeconds, setRestSeconds] = useState(0)
  const [swappedSteps, setSwappedSteps] = useState<Record<string, string>>({})
  const [sessionCelebration, setSessionCelebration] = useState(false)
  const [setExercise, setSetExercise] = useState('')
  const [setWeight, setSetWeight] = useState('')
  const [setReps, setSetReps] = useState('')
  const [setRpe, setSetRpe] = useState('7')
  const [coachPulse, setCoachPulse] = useState('Waiting for your next log.')
  const [coachQuestion, setCoachQuestion] = useState('')
  const [coachAnswer, setCoachAnswer] = useState('')
  const [trackRange, setTrackRange] = useState<'7' | '30'>('7')
  const [selectedTrackDate, setSelectedTrackDate] = useState('')
  const [claudeResults, setClaudeResults] = useState('')
  const [workoutDone, setWorkoutDone] = useState<Record<string, boolean>>({})
  const [personalSyncMode, setPersonalSyncMode] = useState<'local' | 'cloud-ready'>('local')
  const [memoryEmail, setMemoryEmail] = useState('')
  const [memoryUserEmail, setMemoryUserEmail] = useState('')
  const [memoryStatus, setMemoryStatus] = useState('')
  const [syncingMemory, setSyncingMemory] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const todayTraining = TRAINING_WEEK.find(day => day.day === currentDay.weekday)
  const hasPractice = Boolean(todayTraining?.title.includes('Wrestling'))
  const readiness = readinessScore(todayLog, hasPractice)
  const appleActiveCalories = Number(todayLog.appleActiveCalories || 0)
  const appleWorkoutMinutes = Number(todayLog.appleWorkoutMinutes || 0)
  const appleAvgHr = Number(todayLog.appleAvgHr || 0)
  const appleRestingHr = Number(todayLog.appleRestingHr || 0)
  const watchWaterBoost = appleActiveCalories >= 600 || appleWorkoutMinutes >= 90 ? 16 : appleActiveCalories >= 300 || appleWorkoutMinutes >= 45 ? 8 : 0
  const targetOz = waterTargetOz(hasPractice, Number(minutes)) + watchWaterBoost
  const waterOz = waterDone * 16
  const waterPct = Math.min(100, Math.round((waterOz / targetOz) * 100))
  const protein = estimatedProtein(todayLog, proteinBlocks)
  const mealIdeas = useMemo(() => mealIdeasFromGroceries(groceries), [groceries])
  const needs = useMemo(() => groceryNeeds(groceries), [groceries])
  const dayPlan = defaultDayPlan()
  const tomorrow = tomorrowProtocol()
  const verse = verseOfTheDay()
  const bodyTip = bodyTipOfTheDay()
  const workout = workoutFor(mode, minutes, other)
  const fastFoodGuide = FAST_FOOD_GUIDES.find(item => item.place === fastFood) ?? FAST_FOOD_GUIDES[0]
  const trend = weightTrend(logs)
  const personalAgents = AGENT_ROSTER.filter(agent => agent.lane === 'Personal')
  const todayGymPlan = WEEKLY_GYM_PLAN.find(day => day.day === currentDay.weekday) ?? WEEKLY_GYM_PLAN[0]
  const checkInStreak = streakFromActions(checklist, 'weigh')
  const workoutStreak = streakFromActions(checklist, 'train')
  const scoreboard = osData.settings.scoreboard
  const dayKey = currentDay.iso || 'today'
  const todaysFoodEntries = foodEntries.filter(entry => entry.date === dayKey)
  const macroTotals = foodTotals(todaysFoodEntries)
  const workoutCompletion = workoutCompletionForToday(todayGymPlan, workoutDone, dayKey)
  const currentWorkoutStep = workoutStepLabel(Math.min(activeWorkoutStep, Math.max(0, todayGymPlan.plan.length - 1)))
  const exerciseCalories = workoutCompletion >= 90 ? 250 : workoutCompletion >= 50 ? 125 : 0
  const calorieGoal = 2900
  const caloriesRemaining = calorieGoal - macroTotals.calories + exerciseCalories
  const caloriePct = Math.min(100, Math.round(((macroTotals.calories - exerciseCalories) / calorieGoal) * 100))
  const diaryByMeal = MEAL_SECTIONS.reduce<Record<string, FoodEntry[]>>((acc, meal) => {
    acc[meal] = todaysFoodEntries.filter(entry => mealNameForDiary(entry.meal) === meal)
    return acc
  }, {})
  const recentFoods = Array.from(new Map(foodEntries.map(entry => [entry.name, entry])).values()).slice(0, 20)
  const filteredStaples = QUICK_FOOD_MACROS.filter(food => food.name.toLowerCase().includes(foodSearch.toLowerCase()))
  const filteredRecent = recentFoods.filter(food => food.name.toLowerCase().includes(foodSearch.toLowerCase()))
  const trueProtein = Math.max(protein, Math.round(macroTotals.protein))
  const coachSignals = adaptiveCoachSignals({
    log: todayLog,
    readiness,
    hasPractice,
    workoutCompletion,
    protein: trueProtein,
    waterPct,
  })
  const nextMeal = nextMealRecommendation(todaysFoodEntries, trueProtein, hasPractice)
  const weightGuard = weightGuardMessage(todayLog.weight) ?? (trend.average ? weightGuardMessage(trend.average) : null)
  const underFueled = underFueledMessage(macroTotals.calories)
  const todaysWorkoutSets = workoutSets.filter(entry => entry.date === dayKey)
  const setSummary = workoutSetSummary(todaysWorkoutSets)
  const groceryCombos = groceryMealCombos(groceryStock)
  const trackLogs = logs.slice(0, trackRange === '7' ? 7 : 30).reverse()
  const selectedTrackLog = logs.find(log => log.date === selectedTrackDate) || todayLog

  useEffect(() => {
    const day = { iso: todayIso(), weekday: weekdayName() }
    setCurrentDay(day)
    try {
      setGroceries(localStorage.getItem(GROCERY_KEY) || groceryTextFromDefaults())
      const savedLogs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]') as DailyGrowthLog[]
      setLogs(savedLogs)
      setTodayLog(savedLogs.find(log => log.date === day.iso) || { date: day.iso })
      const water = JSON.parse(localStorage.getItem(WATER_KEY) || '{}') as Record<string, number>
      setWaterHistory(water)
      setWaterDone(water[day.iso] || 0)
      const proteinData = JSON.parse(localStorage.getItem(PROTEIN_KEY) || '{}') as Record<string, number>
      setProteinBlocks(proteinData[day.iso] || 0)
      setPlan(localStorage.getItem(PLAN_KEY) || '7:30 wake, weigh in, breakfast, gym, mobility, meals, faith journal, sleep.')
      setChecklist(JSON.parse(localStorage.getItem(CHECKLIST_KEY) || '{}') as Record<string, boolean>)
      setBarcodeLog(JSON.parse(localStorage.getItem(BARCODE_KEY) || '[]') as string[])
      setFoodEntries(JSON.parse(localStorage.getItem(FOOD_LOG_KEY) || '[]') as FoodEntry[])
      setGroceryStock({ ...defaultGroceryStock(), ...(JSON.parse(localStorage.getItem(GROCERY_STOCK_KEY) || '{}') as Record<string, boolean>) })
      setWorkoutSets(JSON.parse(localStorage.getItem(WORKOUT_SETS_KEY) || '[]') as WorkoutSetEntry[])
      setClaudeResults(localStorage.getItem(CLAUDE_RESULTS_KEY) || '')
      setWorkoutDone(JSON.parse(localStorage.getItem(WORKOUT_DONE_KEY) || '{}') as Record<string, boolean>)
      setPersonalSyncMode((localStorage.getItem(PERSONAL_SYNC_PREF_KEY) as 'local' | 'cloud-ready' | null) || 'local')
    } catch {
      setGroceries(groceryTextFromDefaults())
      setGroceryStock(defaultGroceryStock())
    }
  }, [])

  useEffect(() => {
    if (!isPersonalMemoryConnected()) {
      setMemoryStatus('Supabase env keys are not connected yet.')
      return
    }
    getCurrentUser().then(user => {
      setMemoryUserEmail(user?.email ?? '')
      setMemoryStatus(user ? 'Personal memory ready.' : 'Sign in to sync across devices.')
    })
    return onAuthChanged(user => {
      setMemoryUserEmail(user?.email ?? '')
      setMemoryStatus(user ? 'Personal memory ready.' : 'Sign in to sync across devices.')
    })
  }, [])

  useEffect(() => {
    if (!memoryUserEmail || personalSyncMode !== 'cloud-ready') return
    listGioCheckins().then(result => {
      if (result.error || !result.data.length) return
      setLogs(prev => {
        const merged = [...result.data, ...prev]
        const unique = merged.filter((item, index, array) => array.findIndex(other => other.date === item.date) === index)
        try { localStorage.setItem(LOG_KEY, JSON.stringify(unique)) } catch { /* local only */ }
        return unique
      })
      const cloudToday = result.data.find(log => log.date === dayKey)
      if (cloudToday) setTodayLog(prev => ({ ...prev, ...cloudToday }))
    })
  }, [dayKey, memoryUserEmail, personalSyncMode])

  useEffect(() => {
    if (restSeconds <= 0) return
    const timer = window.setInterval(() => {
      setRestSeconds(current => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [restSeconds])

  useEffect(() => {
    if (!scannerActive) return
    let cancelled = false
    let frame = 0

    async function startScanner() {
      try {
        const detectorClass = (window as unknown as { BarcodeDetector?: new (options?: { formats?: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector
        if (!detectorClass || !navigator.mediaDevices?.getUserMedia) {
          setScanStatus('Camera barcode scanning is not supported on this browser. Use manual barcode entry below.')
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        const detector = new detectorClass({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] })
        setScanStatus('Point your phone camera at the barcode.')

        const scan = async () => {
          if (cancelled || !videoRef.current) return
          const codes = await detector.detect(videoRef.current)
          if (codes[0]?.rawValue) {
            setBarcode(codes[0].rawValue)
            lookupFood(codes[0].rawValue)
            setScannerActive(false)
            return
          }
          frame = window.requestAnimationFrame(scan)
        }
        frame = window.requestAnimationFrame(scan)
      } catch {
        setScanStatus('Camera access was blocked. Use manual barcode entry below.')
      }
    }

    startScanner()

    return () => {
      cancelled = true
      if (frame) window.cancelAnimationFrame(frame)
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerActive])

  function saveGroceries(next: string) {
    setGroceries(next)
    try { localStorage.setItem(GROCERY_KEY, next) } catch { /* local only */ }
  }

  function addInventoryLine(line: string) {
    const clean = line.trim()
    if (!clean) return
    const next = groceries.includes(clean) ? groceries : `${groceries}${groceries.trim() ? ', ' : ''}${clean}`
    saveGroceries(next)
  }

  function saveClaudeResults(next: string) {
    setClaudeResults(next)
    try { localStorage.setItem(CLAUDE_RESULTS_KEY, next) } catch { /* local only */ }
  }

  function savePersonalSyncMode(next: 'local' | 'cloud-ready') {
    setPersonalSyncMode(next)
    try { localStorage.setItem(PERSONAL_SYNC_PREF_KEY, next) } catch { /* local only */ }
  }

  function downloadPersonalData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: 'Gio OS personal export. Keep private. Health, faith, food, training, and routine data.',
      logs,
      todayLog,
      groceries,
      plan,
      water: JSON.parse(localStorage.getItem(WATER_KEY) || '{}') as Record<string, number>,
      protein: JSON.parse(localStorage.getItem(PROTEIN_KEY) || '{}') as Record<string, number>,
      checklist,
      barcodeLog,
      foodEntries,
      groceryStock,
      workoutSets,
      workoutDone,
      scannerFood: JSON.parse(localStorage.getItem('gio.food.v1') || '{}') as Record<string, unknown>,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gio-os-personal-export-${dayKey}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function requestMemoryLogin() {
    const email = memoryEmail.trim()
    if (!email) {
      setMemoryStatus('Enter your email first.')
      return
    }
    setMemoryStatus('Sending magic login link...')
    const result = await signInWithEmail(email)
    setMemoryStatus(result.error ? result.error.message : 'Magic link sent. Open your email on this device.')
  }

  async function syncPersonalMemory(log = todayLog, water = waterDone) {
    if (!memoryUserEmail || personalSyncMode !== 'cloud-ready') {
      setMemoryStatus('Turn on cloud-ready mode and sign in first.')
      return
    }
    setSyncingMemory(true)
    setMemoryStatus('Syncing personal memory...')
    const checkin = await saveGioCheckin(log)
    const waterResult = await saveGioWater(dayKey, water)
    const faithResult = log.faith ? await saveGioFaith(dayKey, log.faith) : { error: null }
    const watchResult = await saveGioWatchMetrics(log)
    const error = checkin.error || waterResult.error || faithResult.error || watchResult.error
    setSyncingMemory(false)
    setMemoryStatus(error ? error.message : 'Synced to Supabase personal memory.')
  }

  async function disconnectMemory() {
    await signOutOfMemory()
    setMemoryUserEmail('')
    setMemoryStatus('Signed out. Local dashboard still works.')
  }

  async function lookupFood(value = barcode) {
    const clean = value.trim()
    if (!clean) return
    setLookupLoading(true)
    setScanStatus('Looking up nutrition...')
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json?fields=product_name,brands,serving_size,nutriments`
      const response = await fetch(url)
      const json = await response.json() as {
        status?: number
        product?: {
          product_name?: string
          brands?: string
          serving_size?: string
          nutriments?: {
            'energy-kcal_serving'?: number
            'energy-kcal_100g'?: number
            proteins_serving?: number
            proteins_100g?: number
          }
        }
      }
      if (json.status !== 1 || !json.product) {
        setFoodLookup(null)
        setScanStatus('Food not found. Add the name manually.')
        return
      }
      const product = json.product
      const next: FoodLookup = {
        name: product.product_name || 'Unnamed food',
        brand: product.brands,
        serving: product.serving_size,
        calories: Math.round(product.nutriments?.['energy-kcal_serving'] ?? product.nutriments?.['energy-kcal_100g'] ?? 0),
        protein: Math.round(product.nutriments?.proteins_serving ?? product.nutriments?.proteins_100g ?? 0),
      }
      setFoodLookup(next)
      setBarcodeName(next.name)
      setBarcodeServing(`${next.calories || '?'} cal, ${next.protein || '?'}g protein${next.serving ? `, ${next.serving}` : ''}`)
      setScanStatus('Found nutrition. Review it, then tap Add code.')
    } catch {
      setScanStatus('Lookup failed. Add manually for now.')
    } finally {
      setLookupLoading(false)
    }
  }

  function addBarcode(value = barcode) {
    const clean = value.trim()
    if (!clean) return
    const name = barcodeName.trim()
    const serving = barcodeServing.trim()
    const item = name
      ? `${name} - barcode ${clean}${serving ? ` - ${serving}` : ''}`
      : `barcode ${clean} - name needed`
    const nextLog = [item, ...barcodeLog.filter(code => code !== item)].slice(0, 20)
    setBarcodeLog(nextLog)
    setBarcode('')
    setBarcodeName('')
    setBarcodeServing('')
    setFoodLookup(null)
    addInventoryLine(item)
    try { localStorage.setItem(BARCODE_KEY, JSON.stringify(nextLog)) } catch { /* local only */ }
  }

  function saveFoodEntries(next: FoodEntry[]) {
    setFoodEntries(next)
    try { localStorage.setItem(FOOD_LOG_KEY, JSON.stringify(next.slice(0, 300))) } catch { /* local only */ }
  }

  function saveGroceryStock(next: Record<string, boolean>) {
    setGroceryStock(next)
    try { localStorage.setItem(GROCERY_STOCK_KEY, JSON.stringify(next)) } catch { /* local only */ }
  }

  function toggleGroceryStock(name: string) {
    const id = slugify(name)
    const next = { ...groceryStock, [id]: !groceryStock[id] }
    saveGroceryStock(next)
    setCoachPulse(`${name} marked ${next[id] ? 'in stock' : 'out of stock'}. Meal suggestions updated.`)
  }

  function addFoodByScale(foodName = selectedFood) {
    const grams = Number(foodGrams)
    if (!Number.isFinite(grams) || grams <= 0) {
      setCoachPulse('Put the food on the scale and enter grams first.')
      return
    }
    const base = QUICK_FOOD_MACROS.find(food => food.name === foodName) ?? QUICK_FOOD_MACROS[0]
    const entry = macroEntry(base, grams, foodMeal, dayKey)
    saveFoodEntries([entry, ...foodEntries])
    updateLog({ meals: `${todayLog.meals ? `${todayLog.meals}; ` : ''}${entry.meal}: ${entry.name} ${entry.grams}g (${entry.calories} cal, ${entry.protein}g protein)` })
    setCoachPulse(`Logged ${entry.name}: ${entry.calories} cal, ${entry.protein}g protein. ${nextMeal}`)
  }

  function addCustomFood() {
    const grams = Number(foodGrams)
    if (!customFoodName.trim() || !Number.isFinite(grams) || grams <= 0) {
      setCoachPulse('Add a food name and grams first.')
      return
    }
    const custom: QuickFoodMacro = {
      name: customFoodName.trim(),
      caloriesPer100g: Number(customCalories) || 0,
      proteinPer100g: Number(customProtein) || 0,
      carbsPer100g: Number(customCarbs) || 0,
      fatPer100g: Number(customFat) || 0,
      note: 'Custom scale entry.',
    }
    const entry = macroEntry(custom, grams, foodMeal, dayKey)
    saveFoodEntries([entry, ...foodEntries])
    updateLog({ meals: `${todayLog.meals ? `${todayLog.meals}; ` : ''}${entry.meal}: ${entry.name} ${entry.grams}g (${entry.calories} cal, ${entry.protein}g protein)` })
    setCustomFoodName('')
    setCoachPulse(`Custom food logged. Totals updated. ${nextMeal}`)
  }

  function logMealPreset(preset: typeof TOMORROW_MEAL_PRESETS[number]) {
    const entries = preset.items
      .map(item => {
        const base = QUICK_FOOD_MACROS.find(food => food.name === item.food)
        return base ? macroEntry(base, item.grams, item.meal, dayKey) : null
      })
      .filter((entry): entry is FoodEntry => Boolean(entry))
    if (!entries.length) return

    saveFoodEntries([...entries, ...foodEntries])
    const totals = foodTotals(entries)
    updateLog({
      meals: `${todayLog.meals ? `${todayLog.meals}; ` : ''}${preset.label}: ${totals.calories} cal, ${totals.protein}g protein`,
    })
    setCoachPulse(`${preset.label} logged: ${totals.calories} cal, ${totals.protein}g protein. ${preset.note}`)
  }

  function openFoodSheet(meal: string, tab: FoodAddTab = 'Staples') {
    setFoodMeal(meal)
    setFoodAddTab(tab)
    setFoodSheetOpen(true)
  }

  function relogFood(entry: FoodEntry, meal = foodMeal) {
    const base = QUICK_FOOD_MACROS.find(food => food.name === entry.name)
    const next = base
      ? macroEntry(base, entry.grams, meal, dayKey)
      : { ...entry, id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, date: dayKey, meal }
    saveFoodEntries([next, ...foodEntries])
    setCoachPulse(`Re-logged ${next.name} to ${meal}. Diary updated.`)
  }

  function copyYesterdayMeal(meal: string) {
    const yesterday = yesterdayIso(dayKey)
    const entries = foodEntries.filter(entry => entry.date === yesterday && mealNameForDiary(entry.meal) === meal)
    if (!entries.length) {
      setCoachPulse(`No ${meal.toLowerCase()} entries found yesterday.`)
      return
    }
    const copied = entries.map(entry => ({
      ...entry,
      id: `food-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: dayKey,
      meal,
    }))
    saveFoodEntries([...copied, ...foodEntries])
    setCoachPulse(`Copied yesterday's ${meal.toLowerCase()} into today.`)
  }

  function updateFoodGrams(entry: FoodEntry, grams: number) {
    if (!Number.isFinite(grams) || grams <= 0) return
    const base = QUICK_FOOD_MACROS.find(food => food.name === entry.name)
    const updated = base
      ? macroEntry(base, grams, entry.meal, entry.date)
      : { ...entry, grams: Math.round(grams) }
    saveFoodEntries(foodEntries.map(item => item.id === entry.id ? { ...updated, id: entry.id } : item))
    setCoachPulse(`${entry.name} updated to ${Math.round(grams)}g.`)
  }

  function removeFoodEntry(id: string) {
    saveFoodEntries(foodEntries.filter(entry => entry.id !== id))
    setCoachPulse('Food entry removed. Totals recalculated.')
  }

  function saveWorkoutSets(next: WorkoutSetEntry[]) {
    setWorkoutSets(next)
    try { localStorage.setItem(WORKOUT_SETS_KEY, JSON.stringify(next.slice(0, 500))) } catch { /* local only */ }
  }

  function addWorkoutSet() {
    const reps = Number(setReps)
    const rpe = Number(setRpe)
    const exercise = setExercise.trim()
    if (!exercise || !Number.isFinite(reps) || reps <= 0 || !Number.isFinite(rpe) || rpe <= 0) {
      setCoachPulse('Enter exercise, reps, and RPE to log a set.')
      return
    }
    const entry: WorkoutSetEntry = {
      id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: dayKey,
      session: todayGymPlan.title,
      exercise,
      weight: setWeight.trim() || 'bodyweight',
      reps: Math.round(reps),
      rpe: Math.max(1, Math.min(10, rpe)),
    }
    const next = [entry, ...workoutSets]
    saveWorkoutSets(next)
    updateLog({ workout: `${todayLog.workout ? `${todayLog.workout}\n` : ''}${entry.exercise}: ${entry.weight} x ${entry.reps}, RPE ${entry.rpe}` })
    setSetReps('')
    setCoachPulse(workoutSetSummary(next.filter(set => set.date === dayKey)).signal)
  }

  function workoutStepLabel(index: number) {
    const step = todayGymPlan.plan[index] || todayGymPlan.plan[0] || 'Workout step'
    return swappedSteps[`${dayKey}-${todayGymPlan.day}-${index}`] || step
  }

  function logCurrentWorkoutSet() {
    const exercise = workoutStepLabel(activeWorkoutStep)
    const entry: WorkoutSetEntry = {
      id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: dayKey,
      session: todayGymPlan.title,
      exercise,
      weight: setWeight.trim() || 'bodyweight',
      reps: Math.max(1, Number(setReps) || 8),
      rpe: Math.max(1, Math.min(10, Number(setRpe) || 7)),
    }
    const next = [entry, ...workoutSets]
    saveWorkoutSets(next)
    setRestSeconds(entry.rpe >= 8 ? 120 : 75)
    setCoachPulse(`Logged set for ${exercise}. Rest timer started.`)
    setSetReps('')
  }

  function swapCurrentExercise() {
    const options = ['Push-up variation', 'Dumbbell row', 'Goblet squat', 'RDL variation', 'Bike sprint', 'Core circuit']
    const current = workoutStepLabel(activeWorkoutStep)
    const nextOption = options.find(option => !current.toLowerCase().includes(option.toLowerCase().slice(0, 5))) || options[0]
    setSwappedSteps(currentMap => ({
      ...currentMap,
      [`${dayKey}-${todayGymPlan.day}-${activeWorkoutStep}`]: `${nextOption} - swapped from: ${todayGymPlan.plan[activeWorkoutStep]}`,
    }))
    setCoachPulse(`Exercise swapped to ${nextOption}. Keep the same intent, safer setup.`)
  }

  function finishWorkoutSession() {
    const next = { ...workoutDone }
    todayGymPlan.plan.forEach(step => {
      next[`${dayKey}-${todayGymPlan.day}-${step}`] = true
    })
    setWorkoutDone(next)
    try { localStorage.setItem(WORKOUT_DONE_KEY, JSON.stringify(next)) } catch { /* local only */ }
    const trainKey = `${dayKey}-train`
    const nextChecklist = { ...checklist, [trainKey]: true }
    setChecklist(nextChecklist)
    try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(nextChecklist)) } catch { /* local only */ }
    setSessionCelebration(true)
    setRestSeconds(0)
    setCoachPulse('Session finished. Exercise calories added to Eat, progression unlocked if RPE stayed controlled.')
    window.setTimeout(() => setSessionCelebration(false), 2600)
  }

  function removeWorkoutSet(id: string) {
    saveWorkoutSets(workoutSets.filter(set => set.id !== id))
    setCoachPulse('Set removed. Workout progression recalculated.')
  }

  function generateAdaptivePlan(nextMode = mode, nextMinutes = minutes) {
    const nextPlan = buildAdaptivePlanText({
      mode: nextMode,
      minutes: nextMinutes,
      readiness,
      hasPractice,
      todayTraining,
      workoutCompletion,
      protein: trueProtein,
      waterOz,
      targetOz,
      meal: nextMeal,
    })
    savePlan(nextPlan)
    setCoachPulse('Coach updated today plan from your latest logs.')
  }

  function chooseTrainingAction(nextMode: Mode, nextMinutes: string, note: string) {
    setMode(nextMode)
    setMinutes(nextMinutes)
    setOther(note)
    generateAdaptivePlan(nextMode, nextMinutes)
    setFocus('Train')
  }

  function makeTomorrowBetter() {
    const fixes = [
      trueProtein < 130 ? 'Prep one easy protein before noon.' : 'Keep protein steady across meals.',
      waterPct < 75 ? 'Start water earlier; do not try to catch up at night.' : 'Keep hydration rhythm steady.',
      workoutCompletion < 70 ? 'Use a shorter workout and finish every logged step.' : 'Progress the next matching workout carefully.',
      numeric(todayLog.sleep) > 0 && numeric(todayLog.sleep) < 8 ? 'Protect bedtime like practice.' : 'Repeat the sleep routine.',
      'Write one prayer, one lesson, one win, and one fix.',
    ]
    savePlan(`Tomorrow improvement plan:\n${fixes.map((fix, index) => `${index + 1}. ${fix}`).join('\n')}`)
    setCoachPulse('Tomorrow plan updated from today evidence.')
  }

  function makeWorkdayReady() {
    const text = [
      'Tomorrow work-day protocol:',
      '1. Wake at 8:00 AM. Bathroom, weigh in, log sleep/energy/soreness/mood.',
      '2. Breakfast: 3 eggs, toast with peanut butter, banana, and milk.',
      '3. Pack: Premier shake, tuna/chicken wrap, granola bar, banana if available, water bottle.',
      '4. Mid-shift: eat the packed meal before energy crashes.',
      '5. After work: if readiness is 65+ do Gym 45. If low, do Recovery 25.',
      '6. Dinner: chicken plus rice/fried rice, then faith journal and sleep prep.',
      '7. Business: send or log 10 outreach actions. No new features before money action.',
    ].join('\n')
    savePlan(text)
    setCoachPulse('Tomorrow work-day protocol loaded. Pack food tonight so morning is easy.')
  }

  function askCoach(preset?: string) {
    const question = preset || coachQuestion || 'What should I do next today?'
    const answer = coachStyleAnswer({
      question,
      readiness,
      waterOz,
      targetOz,
      protein: trueProtein,
      calories: macroTotals.calories,
      hasPractice,
      workoutCompletion,
      nextMeal,
      mode,
      minutes,
    })
    setCoachQuestion(question)
    setCoachAnswer(answer)
    setCoachPulse('Coach response updated from your current dashboard data.')
  }

  function toggleWorkoutStep(step: string) {
    const key = `${dayKey}-${todayGymPlan.day}-${step}`
    const next = { ...workoutDone, [key]: !workoutDone[key] }
    setWorkoutDone(next)
    try { localStorage.setItem(WORKOUT_DONE_KEY, JSON.stringify(next)) } catch { /* local only */ }
    const completed = workoutCompletionForToday(todayGymPlan, next, dayKey)
    if (completed >= 90) {
      setCoachPulse('Workout complete. Next matching session can progress only if form stayed clean and RPE was not too high.')
      toggleAction('train')
    } else {
      setCoachPulse(`Workout progress saved: ${completed}%. Finish clean before increasing difficulty.`)
    }
  }

  function saveWater(next: number) {
    const value = Math.max(0, Math.min(12, next))
    setWaterDone(value)
    try {
      const water = JSON.parse(localStorage.getItem(WATER_KEY) || '{}') as Record<string, number>
      const next = { ...water, [dayKey]: value }
      setWaterHistory(next)
      localStorage.setItem(WATER_KEY, JSON.stringify(next))
    } catch { /* local only */ }
    if (memoryUserEmail && personalSyncMode === 'cloud-ready') void saveGioWater(dayKey, value)
  }

  function saveProtein(next: number) {
    const value = Math.max(0, Math.min(8, next))
    setProteinBlocks(value)
    try {
      const proteinData = JSON.parse(localStorage.getItem(PROTEIN_KEY) || '{}') as Record<string, number>
      localStorage.setItem(PROTEIN_KEY, JSON.stringify({ ...proteinData, [dayKey]: value }))
    } catch { /* local only */ }
  }

  function savePlan(next: string) {
    setPlan(next)
    try { localStorage.setItem(PLAN_KEY, next) } catch { /* local only */ }
  }

  function updateLog(patch: Partial<DailyGrowthLog>) {
    const nextLog = { ...todayLog, ...patch, date: dayKey }
    const nextLogs = [nextLog, ...logs.filter(log => log.date !== nextLog.date)].slice(0, 30)
    setTodayLog(nextLog)
    setLogs(nextLogs)
    try { localStorage.setItem(LOG_KEY, JSON.stringify(nextLogs)) } catch { /* local only */ }
    if (memoryUserEmail && personalSyncMode === 'cloud-ready') {
      void saveGioCheckin(nextLog)
      if (patch.faith !== undefined) void saveGioFaith(dayKey, nextLog.faith || '')
      if (
        patch.appleActiveCalories !== undefined ||
        patch.appleWorkoutMinutes !== undefined ||
        patch.appleAvgHr !== undefined ||
        patch.appleRestingHr !== undefined
      ) {
        void saveGioWatchMetrics(nextLog)
      }
    }
  }

  function toggleAction(id: string) {
    const next = { ...checklist, [`${dayKey}-${id}`]: !checklist[`${dayKey}-${id}`] }
    setChecklist(next)
    try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next)) } catch { /* local only */ }
  }

  const completedActions = DAILY_ACTIONS.filter(item => checklist[`${dayKey}-${item.id}`]).length
  const allDailyActionsDone = completedActions === DAILY_ACTIONS.length
  const tomorrowReadyDone = TOMORROW_READY_ACTIONS.filter(item => checklist[`${dayKey}-tomorrow-${item.id}`]).length
  const caloriesEstimate = NUTRITION_TARGETS.calories

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-[#06080c] text-white">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
          <div className="rounded-3xl border border-cyan-300/20 bg-white/[0.06] p-6 shadow-2xl shadow-cyan-950/30">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">Gio OS</h1>
                <p className="text-sm text-white/45">Private athlete command center.</p>
              </div>
            </div>
            <input
              value={passcode}
              onChange={event => setPasscode(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter' && passcode === 'GO23') setUnlocked(true) }}
              type="password"
              placeholder="Passcode"
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 px-4 text-base font-semibold text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60"
            />
            <button
              onClick={() => setUnlocked(passcode === 'GO23')}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl bg-cyan-300 font-black text-slate-950 transition hover:bg-cyan-200"
            >
              Open Gio OS
            </button>
            {passcode && passcode !== 'GO23' && <p className="mt-2 text-xs text-amber-300">Wrong passcode.</p>}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#06080c] text-white">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#06080c]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link href="#top" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-black leading-none">Gio OS</p>
              <p className="mt-1 text-[11px] text-white/40">144 off-season command center</p>
            </div>
          </Link>
          <nav className="flex max-w-full gap-1 overflow-x-auto">
            {NAV.map(item => (
              <a
                key={item.id}
                href={`#${item.id.toLowerCase()}`}
                onClick={() => setFocus(item.id)}
                className={cn(
                  'rounded-full px-3 py-2 text-xs font-black transition',
                  focus === item.id ? 'bg-white text-slate-950' : 'text-white/50 hover:bg-white/10 hover:text-white'
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex gap-2">
            <Link href="/portal" className="rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-white/60 hover:text-white">Portal</Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-xs font-bold text-sky-200">
              <BriefcaseBusiness className="h-4 w-4" /> GR Scale OS
            </Link>
          </div>
        </div>
        <CommandBar />
      </div>

      <div id="top" className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <section className="grid min-h-[520px] gap-6 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-200">
              <Trophy className="h-4 w-4" />
              Future CEO athlete
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.92] tracking-tight md:text-7xl">
              Lean. Strong. Agile. Flexible.
            </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/58">
              Main goal locked: hold 144-148, fuel training, build strength, improve mobility, and stay ready for November.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <button onClick={() => setFocus('Train')} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
                <Dumbbell className="h-4 w-4" /> Train
              </button>
              <button onClick={() => setFocus('Eat')} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 text-sm font-black text-slate-950 transition hover:bg-emerald-200">
                <Utensils className="h-4 w-4" /> Eat
              </button>
              <button onClick={() => setFocus('Mission')} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-200">
                <Zap className="h-4 w-4" /> Lock In
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Today readiness" value={`${readiness}`} sub={readiness >= 80 ? 'Attack the day' : readiness >= 65 ? 'Solid, stay sharp' : 'Recover smart'} />
            <Metric label="Daily actions" value={`${completedActions}/8`} sub="Finish the checklist" tone="green" />
            <Metric label="Water" value={`${waterOz}/${targetOz} oz`} sub="Spread it out, no chugging" tone="cyan" />
            <Metric label="Protein estimate" value={`${trueProtein}g`} sub={`Target ${NUTRITION_TARGETS.proteinRange}`} tone="green" />
            <Metric label="Calories" value={caloriesEstimate} sub="Fuel to maintain and build" tone="amber" />
            <Metric label="Watch" value={appleActiveCalories ? `${appleActiveCalories} cal` : 'Log later'} sub={appleWorkoutMinutes ? `${appleWorkoutMinutes} min workout` : 'Apple Watch manual'} tone="violet" />
            <Metric label="Trend" value={trend.average ? `${trend.average} lb avg` : trend.label} sub={trend.message} tone={trend.status === 'green' ? 'green' : trend.status === 'red' ? 'amber' : 'violet'} />
          </div>
        </section>

        <Section id="mission" eyebrow="Do first" title="Today Mission" icon={Target}>
          {(weightGuard || underFueled) && (
            <Card className={cn(
              'mb-4',
              isBelowHardFloor(todayLog.weight) || (trend.average > 0 && trend.average < HARD_FLOOR_LB)
                ? 'border-red-300/30 bg-red-300/[0.08]'
                : 'border-amber-300/30 bg-amber-300/[0.08]'
            )}>
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-200" />
                <div>
                  <p className="text-sm font-black text-white">Gio OS health guard active</p>
                  {weightGuard && <p className="mt-1 text-sm leading-relaxed text-white/65">{weightGuard}</p>}
                  {underFueled && <p className="mt-1 text-sm leading-relaxed text-amber-100">{underFueled}</p>}
                </div>
              </div>
            </Card>
          )}
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-cyan-300/20 bg-cyan-300/[0.07]">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">Next action</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">Execute the minimum standard.</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Log the truth. Eat protein. Drink water. Train or recover. Stretch. Pray. Sleep. No panic from one scale number.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button onClick={() => generateAdaptivePlan()} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200">
                  Generate Today Plan
                </button>
                <button onClick={() => makeTomorrowBetter()} className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-100 hover:bg-amber-300/15">
                  Make Tomorrow Better
                </button>
                <button onClick={() => chooseTrainingAction('Gym', '45', 'Going to the gym today. Adjust by readiness and complete clean reps.')} className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100 hover:bg-emerald-300/15">
                  I&apos;m Going Gym
                </button>
                <button onClick={() => chooseTrainingAction('Recovery', '25', 'Low-time or low-energy day. Minimum effective work only.')} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-white/65 hover:text-white">
                  Only 20 Minutes / Recovery
                </button>
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                <p className="text-sm font-black text-emerald-100">Live coach pulse</p>
                <p className="mt-1 text-sm leading-relaxed text-white/65">{coachPulse}</p>
                <div className="mt-3 grid gap-2">
                  {coachSignals.map(signal => (
                    <p key={signal} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs leading-relaxed text-white/58">{signal}</p>
                  ))}
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                <p className="text-sm font-black text-amber-100">Do Not Be Lazy Mode</p>
                <p className="mt-1 text-sm text-white/58">Even on a bad day, finish the minimum standard before bed.</p>
              </div>
            </Card>

            <div className="grid gap-2 sm:grid-cols-2">
              {allDailyActionsDone && (
                <button
                  onClick={() => makeTomorrowBetter()}
                  className="col-span-full rounded-2xl border border-emerald-300/35 bg-emerald-300/15 p-4 text-left transition hover:bg-emerald-300/20"
                >
                  <p className="text-xl font-black text-emerald-100">Day won. Streak protected.</p>
                  <p className="mt-1 text-sm text-white/55">Tap to build tomorrow from today&apos;s evidence.</p>
                </button>
              )}
              {DAILY_ACTIONS.map(item => (
                <CheckRow
                  key={item.id}
                  checked={Boolean(checklist[`${dayKey}-${item.id}`])}
                  label={item.label}
                  onClick={() => toggleAction(item.id)}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                <p className="text-sm font-black">Fuel-first rule</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{PERSONAL_PROFILE.nutritionGuardrail}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-black">{bodyTip.title}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{bodyTip.body}</p>
            </Card>
            <Card>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-black">Automatic practice days</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {todayTraining ? `${todayTraining.day}: ${todayTraining.title}, ${todayTraining.time}. ${todayTraining.focus}` : 'No practice loaded today.'}
              </p>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className="border-red-300/20 bg-red-300/[0.055]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-200" />
                <p className="text-sm font-black">Hard floor</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/58">
                If the 7-day average drops below {WEIGHT_RANGE.hardFloor} lb, the app switches to fuel-up mode. No dehydration, no skipped meals, no dashboard-planned weight descent.
              </p>
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4 text-sky-300" />
                  <p className="text-sm font-black">GR Scale money row</p>
                </div>
                <Link href="/workspace" className="inline-flex items-center gap-1 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-black text-sky-200">
                  <Mail className="h-3.5 w-3.5" /> Send today&apos;s 10
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="MRR" value={businessReady ? `$${businessMetrics.mrr}` : '-'} sub="recurring" tone="green" />
                <Metric label="Sent" value={String(scoreboard.sent)} sub="today" tone="cyan" />
                <Metric label="Replies" value={String(scoreboard.replies)} sub="today" tone="amber" />
                <Metric label="Calls" value={String(scoreboard.meetings)} sub="booked" tone="violet" />
              </div>
            </Card>
          </div>

          <Card className="mt-4 border-amber-300/20 bg-amber-300/[0.06]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Tomorrow execution</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight">8:00 AM work-day protocol</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-amber-300/25 bg-black/20 px-3 py-1 text-xs font-black text-amber-100">{tomorrowReadyDone}/{TOMORROW_READY_ACTIONS.length} ready</span>
                <button onClick={makeWorkdayReady} className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-slate-950 hover:bg-amber-200">
                  Load work-day plan
                </button>
              </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="grid gap-2 md:grid-cols-2">
                  {TOMORROW_EXECUTION.map(item => (
                    <div key={`${item.time}-${item.title}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-200">{item.time}</p>
                      <p className="mt-1 text-sm font-black text-white">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/50">{item.action}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.07] p-3">
                  <p className="text-sm font-black text-emerald-100">Work pack list</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {WORK_PACK_LIST.map(item => (
                      <button
                        key={item}
                        onClick={() => toggleAction(`pack-${slugify(item)}`)}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-left text-xs font-bold transition',
                          checklist[`${dayKey}-pack-${slugify(item)}`]
                            ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100'
                            : 'border-white/10 bg-black/20 text-white/52 hover:text-white'
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {TOMORROW_READY_ACTIONS.map(item => (
                    <CheckRow
                      key={item.id}
                      checked={Boolean(checklist[`${dayKey}-tomorrow-${item.id}`])}
                      label={item.label}
                      onClick={() => {
                        const key = `${dayKey}-tomorrow-${item.id}`
                        const next = { ...checklist, [key]: !checklist[key] }
                        setChecklist(next)
                        try { localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next)) } catch { /* local only */ }
                      }}
                    />
                  ))}
                </div>

                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-4">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-cyan-200" />
                    <p className="text-sm font-black text-white">Coach Chat: free rules engine</p>
                  </div>
                  <textarea
                    value={coachQuestion}
                    onChange={event => setCoachQuestion(event.target.value)}
                    placeholder="Example: I work tomorrow and I am tired. Should I still go gym?"
                    className="mt-3 min-h-20 w-full resize-none rounded-xl border border-white/10 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button onClick={() => askCoach()} className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200">
                      Ask Coach
                    </button>
                    <button onClick={() => askCoach('I worked today and feel tired. What is the minimum plan?')} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/58 hover:text-white">
                      Tired work day
                    </button>
                    <button onClick={() => askCoach('I am going to the gym. What should I do?')} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/58 hover:text-white">
                      Gym today
                    </button>
                    <button onClick={() => askCoach('What should I eat next?')} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/58 hover:text-white">
                      Next meal
                    </button>
                  </div>
                  {coachAnswer && (
                    <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-white/68">
                      {coachAnswer}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </Section>

        <Section id="train" eyebrow="Performance" title="Training System" icon={Dumbbell}>
          <Card className="mb-4 border-violet-300/25 bg-violet-300/[0.055]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-200">Session player</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight">{todayGymPlan.title}</h3>
                <p className="mt-1 text-sm text-white/45">{todayGymPlan.focus}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => chooseTrainingAction('Home', '20', '20-minute mode: minimum effective session.')} className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-black text-amber-100 hover:bg-amber-300/15">
                  20-min mode
                </button>
                <button onClick={finishWorkoutSession} className="rounded-full bg-emerald-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-emerald-200">
                  Finish Session
                </button>
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-violet-300 transition-all" style={{ width: `${workoutCompletion}%` }} />
            </div>
            {sessionCelebration && (
              <div className="mt-3 rounded-2xl border border-emerald-300/30 bg-emerald-300/15 p-4 text-center">
                <p className="text-xl font-black text-emerald-100">Session complete. Day won.</p>
                <p className="mt-1 text-sm text-white/55">Exercise calories are now counted in Eat and progression is unlocked.</p>
              </div>
            )}
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/35">
                      Step {Math.min(activeWorkoutStep + 1, todayGymPlan.plan.length)} / {todayGymPlan.plan.length}
                    </p>
                    <p className="mt-2 text-xl font-black text-white">{currentWorkoutStep}</p>
                  </div>
                  <span className={cn(
                    'rounded-full border px-3 py-1 text-xs font-black',
                    restSeconds > 0 ? 'border-amber-300/30 bg-amber-300/10 text-amber-100' : 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100'
                  )}>
                    Rest {Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <input value={setWeight} onChange={event => setSetWeight(event.target.value)} placeholder="Weight" className="h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/25" />
                  <input value={setReps} onChange={event => setSetReps(event.target.value)} inputMode="numeric" placeholder="Reps" className="h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/25" />
                  <input value={setRpe} onChange={event => setSetRpe(event.target.value)} inputMode="decimal" placeholder="RPE" className="h-11 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none placeholder:text-white/25" />
                  <button onClick={logCurrentWorkoutSet} className="rounded-xl bg-violet-300 px-3 py-3 text-sm font-black text-slate-950 hover:bg-violet-200">Log set</button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  <button onClick={swapCurrentExercise} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/58 hover:text-white">Swap exercise</button>
                  <button onClick={() => setRestSeconds(60)} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/58 hover:text-white">60s rest</button>
                  <button onClick={() => setActiveWorkoutStep(step => Math.max(0, step - 1))} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/58 hover:text-white">Prev</button>
                  <button onClick={() => setActiveWorkoutStep(step => Math.min(todayGymPlan.plan.length - 1, step + 1))} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/58 hover:text-white">Next</button>
                </div>
              </div>
              <div className="grid gap-2">
                {todayGymPlan.plan.map((step, index) => {
                  const key = `${dayKey}-${todayGymPlan.day}-${step}`
                  const active = index === activeWorkoutStep
                  return (
                    <button
                      key={`${step}-${index}`}
                      onClick={() => setActiveWorkoutStep(index)}
                      className={cn(
                        'rounded-xl border px-3 py-2 text-left text-xs font-bold transition',
                        active ? 'border-violet-300/45 bg-violet-300/15 text-violet-100' : workoutDone[key] ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100' : 'border-white/10 bg-black/20 text-white/45 hover:text-white'
                      )}
                    >
                      {workoutStepLabel(index)}
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
            <Card>
              <div className="grid gap-2 sm:grid-cols-3">
                {(['Gym', 'Home', 'Recovery'] as Mode[]).map(item => (
                  <PillButton key={item} active={mode === item} onClick={() => setMode(item)}>{item}</PillButton>
                ))}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {['25', '45', '75'].map(item => (
                  <PillButton key={item} active={minutes === item} onClick={() => setMinutes(item)}>{item} min</PillButton>
                ))}
              </div>
              <textarea
                value={other}
                onChange={event => setOther(event.target.value)}
                placeholder="Other: sore, tired, practice later, only dumbbells, want speed, gym is packed..."
                className="mt-3 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60"
              />
              <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] p-4">
                <p className="text-2xl font-black">{workout.name}</p>
                <p className="text-sm text-cyan-200">{workout.duration} - {workout.focus}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Warm-up</p>
                    {workout.warmup.map(item => <p key={item} className="mt-1 text-sm text-white/62">- {item}</p>)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Work</p>
                    {workout.work.map(item => <p key={item} className="mt-1 text-sm text-white/62">- {item}</p>)}
                  </div>
                </div>
                <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-100">{workout.finisher}</p>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="border-emerald-300/20 bg-emerald-300/[0.055]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200">Today&apos;s workout</p>
                    <p className="mt-1 text-sm font-black text-white">{todayGymPlan.day}: {todayGymPlan.title}</p>
                  </div>
                  <span className="rounded-full border border-emerald-300/20 bg-black/20 px-3 py-1 text-xs font-black text-emerald-200">{todayGymPlan.location}</span>
                </div>
                <div className="space-y-2">
                  {todayGymPlan.plan.map(step => {
                    const key = `${dayKey}-${todayGymPlan.day}-${step}`
                    return (
                      <button
                        key={step}
                        onClick={() => toggleWorkoutStep(step)}
                        className={cn(
                          'flex w-full items-start gap-2 rounded-xl border p-3 text-left text-sm transition',
                          workoutDone[key]
                            ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100'
                            : 'border-white/10 bg-black/20 text-white/58 hover:text-white'
                        )}
                      >
                        <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', workoutDone[key] ? 'text-emerald-300' : 'text-white/25')} />
                        {step}
                      </button>
                    )
                  })}
                </div>
                <textarea
                  value={todayLog.workout || ''}
                  onChange={event => updateLog({ workout: event.target.value })}
                  placeholder="Log weights, reps, or notes. Example: squat 95x6, RDL 45s x8..."
                  className="mt-3 min-h-20 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/25 focus:border-emerald-300/60"
                />
                <div className="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-cyan-100">Adaptive progress</p>
                    <span className="rounded-full border border-cyan-300/20 px-2 py-1 text-[10px] font-black text-cyan-100">{workoutCompletion}% done</span>
                  </div>
                  <p className="text-xs leading-relaxed text-white/52">
                    {workoutCompletion >= 90
                      ? 'Next matching session: progress slightly if form stayed clean and RPE was 7 or lower.'
                      : workoutCompletion > 0
                        ? 'Finish the same level clean before adding weight or reps.'
                        : 'Start the workout and tap each completed step. The next plan changes from this.'}
                  </p>
                </div>
                <div className="mt-3 rounded-xl border border-violet-300/20 bg-violet-300/[0.06] p-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-violet-100">Per-set logger</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/42">Log reps, weight, and RPE. RPE 9+ tells the coach to reduce load/volume.</p>
                    </div>
                    <span className="rounded-full border border-violet-300/20 px-2 py-1 text-[10px] font-black text-violet-100">
                      {setSummary.count} sets / avg RPE {setSummary.avgRpe || '-'}
                    </span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-[1fr_0.7fr_0.45fr_0.45fr]">
                    <input
                      value={setExercise}
                      onChange={event => setSetExercise(event.target.value)}
                      placeholder="Exercise"
                      className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/25"
                    />
                    <input
                      value={setWeight}
                      onChange={event => setSetWeight(event.target.value)}
                      placeholder="Weight"
                      className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/25"
                    />
                    <input
                      value={setReps}
                      onChange={event => setSetReps(event.target.value)}
                      inputMode="numeric"
                      placeholder="Reps"
                      className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/25"
                    />
                    <input
                      value={setRpe}
                      onChange={event => setSetRpe(event.target.value)}
                      inputMode="decimal"
                      placeholder="RPE"
                      className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/25"
                    />
                  </div>
                  <button onClick={addWorkoutSet} className="mt-2 rounded-xl bg-violet-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-violet-200">
                    Add Set
                  </button>
                  <p className="mt-2 text-xs leading-relaxed text-violet-100/70">{setSummary.signal}</p>
                  {todaysWorkoutSets.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {todaysWorkoutSets.slice(0, 8).map(entry => (
                        <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                          <p className="text-xs text-white/65">{entry.exercise}: {entry.weight} x {entry.reps}, RPE {entry.rpe}</p>
                          <button onClick={() => removeWorkoutSet(entry.id)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-black text-white/40 hover:text-white">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              <Card className="border-violet-300/20 bg-violet-300/[0.055]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-200">Apple Watch bridge</p>
                    <p className="mt-1 text-sm font-black text-white">Manual sync for now</p>
                  </div>
                  <HeartPulse className="h-5 w-5 text-violet-200" />
                </div>
                <p className="text-xs leading-relaxed text-white/48">
                  Use Apple Watch until Garmin. Open Fitness/Health, then log active calories, workout minutes, average HR, and resting HR here.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    ['appleActiveCalories', 'Active cal'],
                    ['appleWorkoutMinutes', 'Workout min'],
                    ['appleAvgHr', 'Avg HR'],
                    ['appleRestingHr', 'Rest HR'],
                  ].map(([key, label]) => (
                    <label key={key} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/35">{label}</span>
                      <input
                        value={String(todayLog[key as keyof DailyGrowthLog] || '')}
                        onChange={event => updateLog({ [key]: event.target.value } as Partial<DailyGrowthLog>)}
                        inputMode="numeric"
                        className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none placeholder:text-white/20"
                        placeholder="0"
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] p-3 text-xs leading-relaxed text-cyan-100/80">
                  {watchWaterBoost > 0
                    ? `Watch adjustment: add ${watchWaterBoost} oz water today because training output was higher.`
                    : 'Watch adjustment: no extra water added yet. Log workout output after practice or gym.'}
                </p>
              </Card>

              <Card>
                <div className="flex items-center gap-2">
                  <Waves className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-black">Daily mobility and flexibility</p>
                </div>
                <div className="mt-3 grid gap-2">
                  {['Hips: couch stretch 60 sec/side', 'Hamstrings: hinge stretch 60 sec/side', 'Shoulders: wall slides x12', 'Neck: controlled circles x5/side', 'Deep squat breathing 2 min'].map(item => (
                    <div key={item} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/60">{item}</div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-2">
                  <TimerReset className="h-4 w-4 text-amber-300" />
                  <p className="text-sm font-black">Stretching timer</p>
                </div>
                <p className="mt-2 text-sm text-white/55">Run 5 rounds: 60 seconds stretch, 20 seconds switch. Use your phone timer for now.</p>
              </Card>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {WEEKLY_GYM_PLAN.map(day => (
              <Card key={day.day}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-black">{day.day}</p>
                    <p className="mt-1 text-xs text-cyan-200">{day.title}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-black text-white/45">{day.location}</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-white/50">{day.focus}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section id="eat" eyebrow="Nutrition" title="Food, Water, Groceries" icon={Utensils}>
          <Card className="mb-4 border-emerald-300/20 bg-emerald-300/[0.055]">
            <div className="grid gap-4 xl:grid-cols-[0.42fr_1.58fr]">
              <button
                onClick={() => openFoodSheet('Breakfast')}
                className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-emerald-300/20 bg-black/25 p-4 transition hover:border-emerald-300/45"
              >
                <div
                  className="flex h-36 w-36 items-center justify-center rounded-full transition-all"
                  style={{ background: `conic-gradient(#34d399 ${caloriePct}%, rgba(255,255,255,0.12) 0)` }}
                >
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#08100d] text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Remaining</p>
                    <p className={cn('text-3xl font-black', caloriesRemaining < 700 ? 'text-amber-200' : 'text-emerald-200')}>
                      {caloriesRemaining}
                    </p>
                    <p className="text-[10px] text-white/35">of {calorieGoal}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-bold text-white/45">
                  {calorieGoal} - {macroTotals.calories} food + {exerciseCalories} exercise
                </p>
                {macroTotals.calories < 2200 && (
                  <p className="mt-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-black text-amber-100">
                    Under-fuel warning: eat enough to perform and recover.
                  </p>
                )}
              </button>

              <div className="space-y-3">
                <div className="grid gap-2 md:grid-cols-3">
                  {[
                    ['Protein', macroTotals.protein, MACRO_TARGETS.protein, 'bg-emerald-300'],
                    ['Carbs', macroTotals.carbs, MACRO_TARGETS.carbs, 'bg-cyan-300'],
                    ['Fat', macroTotals.fat, MACRO_TARGETS.fat, 'bg-violet-300'],
                  ].map(([label, value, target, color]) => {
                    const pct = Math.min(100, Math.round((Number(value) / Number(target)) * 100))
                    return (
                      <button
                        key={String(label)}
                        onClick={() => askCoach(`My ${label} is at ${value}g. What should I eat next?`)}
                        className="rounded-xl border border-white/10 bg-black/20 p-3 text-left transition hover:border-white/25"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-black text-white">{String(label)}</p>
                          <p className="text-xs font-bold text-white/45">{String(value)}g / {String(target)}g</p>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                          <div className={cn('h-full rounded-full transition-all', String(color))} style={{ width: `${pct}%` }} />
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {MEAL_SECTIONS.map(meal => {
                    const entries = diaryByMeal[meal] || []
                    const totals = foodTotals(entries)
                    return (
                      <div key={meal} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <button onClick={() => openFoodSheet(meal)} className="text-left">
                            <p className="text-sm font-black text-white">{meal}</p>
                            <p className="mt-0.5 text-xs text-white/42">{totals.calories} cal - {totals.protein}g protein</p>
                          </button>
                          <div className="flex gap-2">
                            <button onClick={() => copyYesterdayMeal(meal)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-black text-white/45 hover:text-white">
                              Copy Yesterday
                            </button>
                            <button onClick={() => openFoodSheet(meal)} className="rounded-lg bg-emerald-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-emerald-200">
                              + Add
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          {entries.length ? entries.map(entry => (
                            <div key={entry.id} className="rounded-xl border border-white/10 bg-black/25 p-2">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-black text-white">{entry.name}</p>
                                  <p className="mt-0.5 text-[11px] text-white/42">{entry.grams}g - {entry.calories} cal - {entry.protein}g protein</p>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => setEditingFoodId(editingFoodId === entry.id ? '' : entry.id)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-black text-white/45 hover:text-white">
                                    ...
                                  </button>
                                  <button onClick={() => removeFoodEntry(entry.id)} className="rounded-lg border border-red-300/20 px-2 py-1 text-[10px] font-black text-red-200/70 hover:text-red-100">
                                    Delete
                                  </button>
                                </div>
                              </div>
                              {editingFoodId === entry.id && (
                                <div className="mt-2 flex gap-2">
                                  <input
                                    defaultValue={entry.grams}
                                    inputMode="decimal"
                                    onBlur={event => updateFoodGrams(entry, Number(event.target.value))}
                                    className="h-9 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-white outline-none"
                                  />
                                  <button onClick={() => relogFood(entry, meal)} className="rounded-lg border border-emerald-300/20 px-3 text-[10px] font-black text-emerald-100">
                                    Re-log
                                  </button>
                                </div>
                              )}
                            </div>
                          )) : (
                            <button onClick={() => openFoodSheet(meal)} className="w-full rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-3 text-xs font-black text-white/35 hover:text-white">
                              + Add {meal.toLowerCase()}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {exerciseCalories > 0 && (
                  <button onClick={() => setFocus('Train')} className="w-full rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-left text-xs font-black text-emerald-100">
                    +{exerciseCalories} exercise calories added from completed workout.
                  </button>
                )}
              </div>
            </div>
          </Card>

          {foodSheetOpen && (
            <Card className="mb-4 border-cyan-300/25 bg-cyan-300/[0.055]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">Add food to {foodMeal}</p>
                  <p className="mt-1 text-xs text-white/42">Search, enter grams, preview macros, then commit instantly.</p>
                </div>
                <button onClick={() => setFoodSheetOpen(false)} className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-white/45 hover:text-white">
                  Close
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['Staples', 'Combos', 'Recent', 'Custom'] as FoodAddTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFoodAddTab(tab)}
                    className={cn(
                      'rounded-full border px-3 py-2 text-xs font-black transition',
                      foodAddTab === tab ? 'border-cyan-300 bg-cyan-300 text-slate-950' : 'border-white/10 bg-black/20 text-white/45 hover:text-white'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_0.3fr]">
                <input
                  value={foodSearch}
                  onChange={event => setFoodSearch(event.target.value)}
                  placeholder="Search foods"
                  className="h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/25"
                />
                <input
                  value={foodGrams}
                  onChange={event => setFoodGrams(event.target.value)}
                  inputMode="decimal"
                  placeholder="grams"
                  className="h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/25"
                />
              </div>
              {foodAddTab === 'Staples' && (
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {filteredStaples.map(food => {
                    const grams = Number(foodGrams) || 100
                    const preview = macroEntry(food, grams, foodMeal, dayKey)
                    return (
                      <button key={food.name} onClick={() => addFoodByScale(food.name)} className="rounded-xl border border-white/10 bg-black/20 p-3 text-left transition hover:border-cyan-300/35">
                        <p className="text-sm font-black text-white">{food.name}</p>
                        <p className="mt-1 text-xs text-white/45">{preview.calories} cal - {preview.protein}g protein at {grams}g</p>
                      </button>
                    )
                  })}
                </div>
              )}
              {foodAddTab === 'Combos' && (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {TOMORROW_MEAL_PRESETS.map(preset => (
                    <button key={preset.label} onClick={() => logMealPreset(preset)} className="rounded-xl border border-white/10 bg-black/20 p-3 text-left transition hover:border-emerald-300/35">
                      <p className="text-sm font-black text-white">{preset.label}</p>
                      <p className="mt-1 text-xs text-white/45">{preset.note}</p>
                    </button>
                  ))}
                </div>
              )}
              {foodAddTab === 'Recent' && (
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {filteredRecent.length ? filteredRecent.map(entry => (
                    <button key={`${entry.id}-${entry.name}`} onClick={() => relogFood(entry)} className="rounded-xl border border-white/10 bg-black/20 p-3 text-left transition hover:border-violet-300/35">
                      <p className="text-sm font-black text-white">{entry.name}</p>
                      <p className="mt-1 text-xs text-white/45">{entry.grams}g last time - tap to re-log</p>
                    </button>
                  )) : <p className="text-sm text-white/42">No recent foods yet.</p>}
                </div>
              )}
              {foodAddTab === 'Custom' && (
                <div className="mt-3 grid gap-2 md:grid-cols-5">
                  <input value={customFoodName} onChange={event => setCustomFoodName(event.target.value)} placeholder="Custom food" className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/25" />
                  <input value={customCalories} onChange={event => setCustomCalories(event.target.value)} placeholder="cal/100g" inputMode="decimal" className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/25" />
                  <input value={customProtein} onChange={event => setCustomProtein(event.target.value)} placeholder="protein/100g" inputMode="decimal" className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/25" />
                  <input value={customCarbs} onChange={event => setCustomCarbs(event.target.value)} placeholder="carbs/100g" inputMode="decimal" className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/25" />
                  <button onClick={addCustomFood} className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-cyan-200">Add Custom</button>
                </div>
              )}
            </Card>
          )}

          <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
            <div className="space-y-4">
              <Card>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">Strict meal plan starting tomorrow</p>
                    <p className="mt-1 text-xs text-white/42">Based on groceries you already told me you have.</p>
                  </div>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">Action</span>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {dayPlan.map(item => (
                    <div key={item.label} className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">{item.label}</p>
                      <p className="mt-1 text-sm font-black">{item.meal}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/45">{item.purpose}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-emerald-300/20 bg-emerald-300/[0.055]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">Tomorrow quick meal log</p>
                    <p className="mt-1 text-xs text-white/42">One tap adds estimated food entries. Weigh exact grams when you can.</p>
                  </div>
                  <Utensils className="h-5 w-5 text-emerald-200" />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {TOMORROW_MEAL_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => logMealPreset(preset)}
                      className="rounded-xl border border-white/10 bg-black/20 p-3 text-left transition hover:border-emerald-300/35"
                    >
                      <p className="text-sm font-black text-white">{preset.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/48">{preset.note}</p>
                    </button>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <Apple className="h-4 w-4 text-emerald-300" />
                  <p className="text-sm font-black">Smart food choices</p>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {mealIdeas.map(idea => (
                    <p key={idea} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-relaxed text-white/60">{idea}</p>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-300" />
                  <p className="text-sm font-black">5-second staple logging</p>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {STAPLE_FOODS.map(item => (
                    <button
                      key={item.label}
                      onClick={() => {
                        addInventoryLine(item.line)
                        updateLog({ meals: `${todayLog.meals ? `${todayLog.meals}; ` : ''}${item.line}` })
                      }}
                      className="rounded-xl border border-white/10 bg-black/20 p-3 text-left text-sm font-bold text-white/65 transition hover:border-emerald-300/30 hover:text-white"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="border-cyan-300/20 bg-cyan-300/[0.055]">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4 text-cyan-300" />
                      <p className="text-sm font-black">Food scale tracker</p>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/45">Put food on your scale, enter grams, and the dashboard recalculates the day.</p>
                  </div>
                  <span className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-1 text-xs font-black text-cyan-100">{macroTotals.calories} cal today</span>
                </div>
                <div className="grid gap-2 md:grid-cols-[1fr_0.45fr_0.55fr]">
                  <select
                    value={selectedFood}
                    onChange={event => setSelectedFood(event.target.value)}
                    className="h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none focus:border-cyan-300/60"
                  >
                    {QUICK_FOOD_MACROS.map(food => <option key={food.name}>{food.name}</option>)}
                  </select>
                  <input
                    value={foodGrams}
                    onChange={event => setFoodGrams(event.target.value)}
                    inputMode="decimal"
                    placeholder="grams"
                    className="h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60"
                  />
                  <select
                    value={foodMeal}
                    onChange={event => setFoodMeal(event.target.value)}
                    className="h-11 rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none focus:border-cyan-300/60"
                  >
                    {['Breakfast', 'Snack', 'Lunch', 'Pre-workout', 'Dinner', 'Meal'].map(item => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <button onClick={() => addFoodByScale()} className="rounded-xl bg-cyan-300 px-3 py-3 text-xs font-black text-slate-950 hover:bg-cyan-200">
                    Add Food by Grams
                  </button>
                  <button onClick={() => setFoodGrams('42')} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs font-black text-white/60 hover:text-white">
                    42g tuna packet
                  </button>
                  <button onClick={() => setFoodGrams('325')} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs font-black text-white/60 hover:text-white">
                    325g shake
                  </button>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-5">
                  <input value={customFoodName} onChange={event => setCustomFoodName(event.target.value)} placeholder="Custom food" className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/25" />
                  <input value={customCalories} onChange={event => setCustomCalories(event.target.value)} placeholder="cal/100g" inputMode="decimal" className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/25" />
                  <input value={customProtein} onChange={event => setCustomProtein(event.target.value)} placeholder="protein/100g" inputMode="decimal" className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/25" />
                  <input value={customCarbs} onChange={event => setCustomCarbs(event.target.value)} placeholder="carbs/100g" inputMode="decimal" className="h-10 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-white outline-none placeholder:text-white/25" />
                  <button onClick={addCustomFood} className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-300/15">Add Custom</button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                  <Metric label="Calories" value={String(macroTotals.calories)} sub="logged by grams" tone="amber" />
                  <Metric label="Protein" value={`${macroTotals.protein}g`} sub="from food log" tone="green" />
                  <Metric label="Carbs" value={`${macroTotals.carbs}g`} sub="training fuel" tone="cyan" />
                  <Metric label="Fat" value={`${macroTotals.fat}g`} sub="steady energy" tone="violet" />
                </div>
                <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3">
                  <p className="text-xs font-black text-emerald-100">Nutrition Coach next meal</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">{nextMeal}</p>
                </div>
                {todaysFoodEntries.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {todaysFoodEntries.slice(0, 6).map(entry => (
                      <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                        <div>
                          <p className="text-xs font-black text-white">{entry.meal}: {entry.name} - {entry.grams}g</p>
                          <p className="mt-0.5 text-[11px] text-white/45">{entry.calories} cal, {entry.protein}g protein, {entry.carbs}g carbs, {entry.fat}g fat</p>
                        </div>
                        <button onClick={() => removeFoodEntry(entry.id)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-black text-white/40 hover:text-white">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-amber-300" />
                  <p className="text-sm font-black">If you have to eat out</p>
                </div>
                <select
                  value={fastFood}
                  onChange={event => setFastFood(event.target.value)}
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm font-bold text-white outline-none focus:border-cyan-300/60"
                >
                  {FAST_FOOD_GUIDES.map(item => <option key={item.place}>{item.place}</option>)}
                </select>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <p className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3 text-sm text-white/65">Best: {fastFoodGuide.bestOrder}</p>
                  <p className="rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-3 text-sm text-white/65">Avoid: {fastFoodGuide.avoid}</p>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <GlassWater className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-black">Hydration tracker</p>
                </div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-black">{waterOz} oz done</span>
                  <span className="text-white/45">target {targetOz} oz</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${waterPct}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => saveWater(index + 1)}
                      className={cn(
                        'rounded-xl border px-2 py-3 text-xs font-black transition',
                        waterDone > index ? 'border-cyan-300 bg-cyan-300 text-slate-950' : 'border-white/10 bg-black/20 text-white/45 hover:text-white'
                      )}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-white/42">Practice/gym days increase the target. We will refine this later with Garmin and before/after practice weight.</p>
                <p className="mt-2 text-xs leading-relaxed text-cyan-100/70">Daily target from Claude: {NUTRITION_TARGETS.water}. Use Propel/electrolytes on training days. Max 1 Celsius, none after 2 PM.</p>
              </Card>

              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-300" />
                  <p className="text-sm font-black">Protein tracker</p>
                </div>
                <p className="text-3xl font-black text-emerald-200">{trueProtein}g</p>
                <p className="mt-1 text-xs text-white/45">Tap a block when you eat a protein serving. Target: {NUTRITION_TARGETS.proteinRange}.</p>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-emerald-300 transition-all" style={{ width: `${Math.min(100, Math.round((trueProtein / NUTRITION_TARGETS.protein) * 100))}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => saveProtein(index + 1)}
                      className={cn(
                        'rounded-xl border px-2 py-3 text-xs font-black transition',
                        proteinBlocks > index ? 'border-emerald-300 bg-emerald-300 text-slate-950' : 'border-white/10 bg-black/20 text-white/45 hover:text-white'
                      )}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-violet-300" />
                  <p className="text-sm font-black">Grocery inventory editor</p>
                </div>
                <textarea
                  value={groceries}
                  onChange={event => saveGroceries(event.target.value)}
                  className="min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60"
                />
                <div className="mt-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Grocery list generator</p>
                  {needs.length ? needs.map(item => <p key={item} className="mt-1 text-sm text-white/58">- {item}</p>) : <p className="mt-1 text-sm text-white/58">Inventory looks balanced enough for now.</p>}
                </div>
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/35">In-stock toggles</p>
                    <button onClick={() => saveGroceryStock(defaultGroceryStock())} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black text-cyan-100">
                      Reset full
                    </button>
                  </div>
                  <div className="grid max-h-56 gap-2 overflow-auto pr-1 sm:grid-cols-2">
                    {DEFAULT_GROCERIES.map(item => {
                      const id = slugify(item.name)
                      const active = groceryStock[id] ?? true
                      return (
                        <button
                          key={item.name}
                          onClick={() => toggleGroceryStock(item.name)}
                          className={cn(
                            'rounded-xl border px-3 py-2 text-left text-xs font-bold transition',
                            active
                              ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100'
                              : 'border-white/10 bg-black/20 text-white/30'
                          )}
                        >
                          {active ? 'In: ' : 'Out: '}{item.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3">
                  <p className="text-xs font-black text-emerald-100">Best meals from current stock</p>
                  <div className="mt-2 grid gap-2">
                    {groceryCombos.length ? groceryCombos.map(combo => (
                      <p key={combo.label} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs leading-relaxed text-white/62">
                        <span className="font-black text-white">{combo.label}</span> - {combo.use}
                      </p>
                    )) : <p className="text-xs text-white/45">Toggle foods in stock to unlock meal combos.</p>}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => addInventoryLine('Carb Balance tortillas')} className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-200">
                    Add tortillas
                  </button>
                  <button onClick={() => addInventoryLine('digital food/body scale available')} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-200">
                    Add scale
                  </button>
                </div>
              </Card>

              <Card className="md:hidden">
                <div className="mb-3 flex items-center gap-2">
                  <ScanBarcode className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-black">Mobile barcode scanner</p>
                </div>
                <p className="text-xs leading-relaxed text-white/45">
                  Scan food barcodes on your phone, then add the food name if the app needs it.
                </p>
                <Link href="/gio/scan" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-3 py-3 text-xs font-black text-slate-950">
                  Open full food scanner
                </Link>
                <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  <video ref={videoRef} muted playsInline className={cn('aspect-video w-full object-cover', scannerActive ? 'block' : 'hidden')} />
                  {!scannerActive && (
                    <div className="flex aspect-video items-center justify-center text-center text-xs text-white/35">
                      Camera preview appears here on mobile.
                    </div>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setScannerActive(active => !active)}
                    className="rounded-xl bg-cyan-300 px-3 py-3 text-xs font-black text-slate-950"
                  >
                    {scannerActive ? 'Stop scan' : 'Start scan'}
                  </button>
                  <button
                    onClick={() => lookupFood()}
                    className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 py-3 text-xs font-black text-cyan-100"
                  >
                    {lookupLoading ? 'Looking...' : 'Lookup'}
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addBarcode()}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-xs font-black text-white/70"
                  >
                    Add code
                  </button>
                  <button
                    onClick={() => {
                      setBarcode('')
                      setBarcodeName('')
                      setBarcodeServing('')
                      setFoodLookup(null)
                    }}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-xs font-black text-white/45"
                  >
                    Clear
                  </button>
                </div>
                <input
                  value={barcode}
                  onChange={event => setBarcode(event.target.value)}
                  placeholder="Manual barcode number"
                  className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    value={barcodeName}
                    onChange={event => setBarcodeName(event.target.value)}
                    placeholder="Food name"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60"
                  />
                  <input
                    value={barcodeServing}
                    onChange={event => setBarcodeServing(event.target.value)}
                    placeholder="Serving/protein"
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/25 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60"
                  />
                </div>
                <p className="mt-2 text-xs text-cyan-200/70">{scanStatus}</p>
                {foodLookup && (
                  <div className="mt-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3">
                    <p className="text-sm font-black text-emerald-100">{foodLookup.name}</p>
                    <p className="mt-1 text-xs text-white/50">
                      {foodLookup.brand ? `${foodLookup.brand} - ` : ''}{foodLookup.calories || '?'} cal, {foodLookup.protein || '?'}g protein{foodLookup.serving ? `, ${foodLookup.serving}` : ''}
                    </p>
                  </div>
                )}
                {barcodeLog.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {barcodeLog.slice(0, 4).map(item => <p key={item} className="text-xs text-white/45">{item}</p>)}
                  </div>
                )}
              </Card>

              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-amber-300" />
                  <p className="text-sm font-black">Scale system</p>
                </div>
                <p className="text-sm leading-relaxed text-white/55">
                  Use your scale every morning after the bathroom, before food or water. Track the weekly trend, not one random number.
                </p>
              </Card>
            </div>
          </div>
        </Section>

        <Section id="track" eyebrow="Progress" title="Check-ins, Trends, Calendar" icon={LineChart}>
          <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
            <Card>
              <div className="grid gap-3 md:grid-cols-3">
                <InputField label="Morning weight" value={todayLog.weight || ''} onChange={value => updateLog({ weight: value })} placeholder="145" />
                <InputField label="Sleep hours" value={todayLog.sleep || ''} onChange={value => updateLog({ sleep: value })} placeholder="8" />
                <InputField label="Energy 1-10" value={todayLog.energy || ''} onChange={value => updateLog({ energy: value })} placeholder="7" />
                <InputField label="Soreness 1-10" value={todayLog.soreness || ''} onChange={value => updateLog({ soreness: value })} placeholder="3" />
                <InputField label="Mood" value={todayLog.mood || ''} onChange={value => updateLog({ mood: value })} placeholder="locked in" />
                <InputField label="Injury notes" value={todayLog.injury || ''} onChange={value => updateLog({ injury: value })} placeholder="none" />
                <InputField label="Pushups" value={todayLog.pushups || ''} onChange={value => updateLog({ pushups: value })} />
                <InputField label="Pullups" value={todayLog.pullups || ''} onChange={value => updateLog({ pullups: value })} />
                <InputField label="Plank" value={todayLog.plank || ''} onChange={value => updateLog({ plank: value })} placeholder="1:30" />
              </div>
              <textarea
                value={todayLog.workout || ''}
                onChange={event => updateLog({ workout: event.target.value })}
                placeholder="Workout, conditioning, meals, or what happened today..."
                className="mt-3 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60"
              />
            </Card>

            <div className="space-y-4">
              <Card>
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-violet-300" />
                  <p className="text-sm font-black">Weekly weigh-in trend</p>
                </div>
                <div className="mt-3 flex gap-2">
                  {(['7', '30'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => setTrackRange(range)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-black',
                        trackRange === range ? 'border-violet-300 bg-violet-300 text-slate-950' : 'border-white/10 bg-black/20 text-white/45 hover:text-white'
                      )}
                    >
                      {range} days
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex h-28 items-end gap-2">
                  {trackLogs.length ? trackLogs.map(item => {
                    const weight = Number(item.weight)
                    return (
                    <button key={item.date} onClick={() => setSelectedTrackDate(item.date)} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className={cn(
                          'w-full rounded-t-xl',
                          selectedTrackDate === item.date ? 'bg-cyan-300' : trend.status === 'green' ? 'bg-emerald-300/80' : trend.status === 'red' ? 'bg-red-300/80' : 'bg-amber-300/80'
                        )}
                        style={{ height: `${Number.isFinite(weight) ? Math.max(12, Math.min(100, (weight - 120) * 4)) : 12}%` }}
                      />
                      <span className="text-[10px] text-white/35">{Number.isFinite(weight) ? weight : '-'}</span>
                    </button>
                  )}) : <p className="text-sm text-white/45">Log morning weight for two days to activate the trend.</p>}
                </div>
                <p className="mt-3 text-sm font-black text-white">{trend.average ? `${trend.average} lb 7-day average` : 'No average yet'}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/42">{trend.message} React only to the 7-day average moving 2+ lb.</p>
              </Card>

              <Card>
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-red-300" />
                  <p className="text-sm font-black">Garmin plan later</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/55">When you get the heart-rate monitor, add calories burned, resting heart rate, sleep, and practice load here.</p>
              </Card>

              <Card className="border-cyan-300/20 bg-cyan-300/[0.055]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">Personal memory</p>
                    <p className="mt-1 text-sm font-black text-white">Hosted anywhere, private by default</p>
                  </div>
                  <Cloud className="h-5 w-5 text-cyan-200" />
                </div>
                <p className="text-xs leading-relaxed text-white/50">
                  Vercel hosts Gio OS anywhere. Supabase sync turns on only after you connect keys, run the tables, and sign in.
                </p>
                <div className="mt-3 grid gap-2">
                  <button
                    onClick={() => savePersonalSyncMode('local')}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-left text-xs font-black transition',
                      personalSyncMode === 'local' ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-100' : 'border-white/10 bg-black/20 text-white/45'
                    )}
                  >
                    Local-only mode: safest for personal health data
                  </button>
                  <button
                    onClick={() => savePersonalSyncMode('cloud-ready')}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-left text-xs font-black transition',
                      personalSyncMode === 'cloud-ready' ? 'border-amber-300/35 bg-amber-300/10 text-amber-100' : 'border-white/10 bg-black/20 text-white/45'
                    )}
                  >
                    Cloud-ready mode: prepare Supabase after login/auth is protected
                  </button>
                </div>
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/35">Status</p>
                  <p className="mt-1 text-xs font-bold text-cyan-100">{memoryStatus || 'Checking memory connection...'}</p>
                  {memoryUserEmail ? (
                    <div className="mt-3 grid gap-2">
                      <p className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100">
                        Signed in: {memoryUserEmail}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button onClick={() => syncPersonalMemory()} disabled={syncingMemory} className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-50">
                          {syncingMemory ? 'Syncing...' : 'Sync now'}
                        </button>
                        <button onClick={disconnectMemory} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-white/55 hover:text-white">
                          Sign out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-2">
                      <input
                        value={memoryEmail}
                        onChange={event => setMemoryEmail(event.target.value)}
                        type="email"
                        placeholder="your email for magic link"
                        className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25"
                      />
                      <button onClick={requestMemoryLogin} disabled={!isPersonalMemoryConnected()} className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
                        Send login link
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={downloadPersonalData} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 hover:bg-cyan-300/15">
                  <Download className="h-4 w-4" /> Download my personal data
                </button>
              </Card>
            </div>
          </div>

          <Card className="mt-4 border-cyan-300/20 bg-cyan-300/[0.055]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">Tap-to-inspect analytics</p>
                <p className="mt-1 text-sm font-black text-white">{selectedTrackLog.date || dayKey} full log</p>
              </div>
              <button onClick={() => setSelectedTrackDate(dayKey)} className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-1 text-xs font-black text-cyan-100">
                Today
              </button>
            </div>
            <div className="grid gap-3 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Weight" value={selectedTrackLog.weight || '-'} sub="morning" tone="violet" />
                <Metric label="Sleep" value={selectedTrackLog.sleep || '-'} sub="hours" tone="cyan" />
                <Metric label="Energy" value={selectedTrackLog.energy || '-'} sub="1-10" tone="green" />
                <Metric label="Soreness" value={selectedTrackLog.soreness || '-'} sub="1-10" tone="amber" />
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="mb-2 text-xs font-black text-white">Workout completion heatmap</p>
                  <div className="grid grid-cols-7 gap-1">
                    {trackLogs.slice(-28).map(log => {
                      const complete = DAILY_ACTIONS.filter(action => checklist[`${log.date}-${action.id}`]).length
                      return (
                        <button
                          key={`heat-${log.date}`}
                          onClick={() => setSelectedTrackDate(log.date)}
                          title={`${log.date}: ${complete}/8`}
                          className={cn(
                            'aspect-square rounded-md border text-[10px] font-black transition',
                            complete >= 8 ? 'border-emerald-300 bg-emerald-300 text-slate-950' : complete >= 4 ? 'border-cyan-300/30 bg-cyan-300/20 text-cyan-100' : 'border-white/10 bg-black/25 text-white/25'
                          )}
                        >
                          {complete}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    ['Pushups', selectedTrackLog.pushups || '-'],
                    ['Pullups', selectedTrackLog.pullups || '-'],
                    ['Plank', selectedTrackLog.plank || '-'],
                  ].map(([label, value]) => (
                    <button key={label} onClick={() => setCoachQuestion(`${label} test is ${value}. How do I improve?`)} className="rounded-xl border border-white/10 bg-black/20 p-3 text-left hover:border-cyan-300/30">
                      <p className="text-xs font-black text-white">{label}</p>
                      <p className="mt-1 text-xl font-black text-cyan-100">{value}</p>
                    </button>
                  ))}
                </div>
                <div>
                  <p className="mb-2 text-xs font-black text-white">Water history</p>
                  <div className="flex h-20 items-end gap-1">
                    {trackLogs.map(log => {
                      const blocks = waterHistory[log.date] || 0
                      return (
                        <button
                          key={`water-${log.date}`}
                          onClick={() => setSelectedTrackDate(log.date)}
                          className="flex flex-1 flex-col items-center gap-1"
                        >
                          <div className="w-full rounded-t bg-cyan-300/75" style={{ height: `${Math.max(8, blocks * 10)}%` }} />
                          <span className="text-[9px] text-white/30">{blocks}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-cyan-300" />
                <p className="text-sm font-black">Calendar and day planner</p>
              </div>
              <textarea
                value={plan}
                onChange={event => savePlan(event.target.value)}
                className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-relaxed text-white outline-none focus:border-cyan-300/60"
              />
              <p className="mt-2 text-xs text-white/42">Later this can connect to your phone calendar. For now, it keeps the day simple.</p>
            </Card>

            <Card>
              <div className="mb-3 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-amber-300" />
                <p className="text-sm font-black">Reminders</p>
              </div>
              <div className="grid gap-2">
                {REMINDERS.map(item => <p key={item} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/58">{item}</p>)}
              </div>
            </Card>
          </div>

          <Card className="mt-4 border-emerald-300/20 bg-emerald-300/[0.055]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-black">Google Calendar rhythm active</p>
              </div>
              <a href="https://calendar.google.com/calendar/u/0/r" target="_blank" rel="noopener noreferrer" className="rounded-full border border-emerald-300/20 bg-black/20 px-3 py-1 text-xs font-black text-emerald-100">
                Open Calendar
              </a>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              {[
                '7:30 AM check-in',
                'Meals + water reminders',
                'Wrestling practice + recovery',
                'GR Scale send desk + 8 PM strategy',
              ].map(item => (
                <p key={item} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-white/62">{item}</p>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/45">
              Phone notifications come from Google Calendar. Keep Google Calendar notifications turned on in your phone settings.
            </p>
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="border-emerald-300/20 bg-emerald-300/[0.055]">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-300" />
                <p className="text-sm font-black">Streak tracker</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Metric label="Check-in" value={`${checkInStreak}`} sub="days" tone="green" />
                <Metric label="Workout" value={`${workoutStreak}`} sub="days" tone="cyan" />
              </div>
            </Card>

            <Card className="lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-amber-300" />
                <p className="text-sm font-black">Sunday review screen</p>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                <Metric label="Avg weight" value={trend.average ? `${trend.average}` : '-'} sub="7-day" tone="violet" />
                <Metric label="Actions" value={`${completedActions}/8`} sub="today" tone="green" />
                <Metric label="Protein" value={`${trueProtein}g`} sub="target 150g" tone="green" />
                <Metric label="Sends" value={String(scoreboard.sent)} sub="business" tone="cyan" />
              </div>
              <textarea
                value={todayLog.businessWin || ''}
                onChange={event => updateLog({ businessWin: event.target.value })}
                placeholder="Sunday review: wins, losses, lesson, next week's focus..."
                className="mt-3 min-h-20 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/25 focus:border-amber-300/60"
              />
            </Card>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {BODYWEIGHT_TESTS.map(item => (
              <Card key={item}>
                <p className="text-sm font-black">{item}</p>
                <p className="mt-2 text-xs leading-relaxed text-white/45">Test weekly. Beat yourself with clean form.</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section id="faith" eyebrow="Identity" title="Faith, Reflection, AI Employees" icon={BookOpen}>
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4">
              <Card className="border-violet-300/20 bg-violet-300/[0.06]">
                <p className="text-sm font-black text-violet-200">{verse.ref}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/68">{verse.text}</p>
              </Card>
              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <NotebookPen className="h-4 w-4 text-violet-300" />
                  <p className="text-sm font-black">Prayer and weekly reflection</p>
                </div>
                <textarea
                  value={todayLog.faith || ''}
                  onChange={event => updateLog({ faith: event.target.value })}
                  placeholder="Prayer, verse, win, loss, lesson, what to fix tomorrow..."
                  className="min-h-36 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60"
                />
              </Card>
              <Card>
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-300" />
                  <p className="text-sm font-black">Sleep tracker</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/55">Sleep is treated like training. Low sleep lowers readiness so the plan does not overpush you.</p>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-black">Personal AI employees</p>
                </div>
                <div className="mb-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3">
                  <p className="text-xs font-black text-amber-100">Phase 1 honesty</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/52">
                    These coaches are local rules engines using your logs and templates. Real AI generation is a later integration; nothing sends or changes accounts.
                  </p>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {personalAgents.map(agent => (
                    <div key={agent.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-sm font-black">{agent.name}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/50">{agent.role}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">{agent.mode}</span>
                        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-200">Rules engine</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-violet-300" />
                  <p className="text-sm font-black">Claude work lane</p>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-white/45">
                  Open Claude, paste one of these jobs, then bring the answer back here so I can turn it into the app.
                </p>
                <div className="space-y-2">
                  {CLAUDE_WORK_LANE.map(job => (
                    <div key={job.title} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-sm font-black text-white">{job.title}</p>
                      <p className="mt-2 text-xs leading-relaxed text-white/50">{job.prompt}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-amber-300" />
                  <p className="text-sm font-black">Tomorrow protocol</p>
                </div>
                <div className="grid gap-2">
                  {tomorrow.map(item => (
                    <div key={`${item.time}-${item.title}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-200">{item.time}</p>
                      <p className="mt-1 text-sm font-black">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/48">{item.action}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </Section>

        <Section id="claude" eyebrow="Parallel work" title="Claude Results Intake" icon={Bot}>
          <div className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
            <Card className="border-violet-300/20 bg-violet-300/[0.055]">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-white">Paste Claude&apos;s answer here</p>
                  <p className="mt-1 text-xs leading-relaxed text-white/45">
                    This is the handoff box. Claude reports are external and paste-in until a true integration exists.
                  </p>
                </div>
                <span className={cn(
                  'rounded-full border px-3 py-1 text-xs font-black',
                  claudeResults.trim()
                    ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200'
                    : 'border-amber-300/25 bg-amber-300/10 text-amber-200'
                )}>
                  {claudeResults.trim() ? 'Ready to review' : 'Waiting'}
                </span>
              </div>
              <textarea
                value={claudeResults}
                onChange={event => saveClaudeResults(event.target.value)}
                placeholder="Paste Claude's nutrition, workout, dashboard, or business plan here..."
                className="min-h-64 w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-relaxed text-white outline-none placeholder:text-white/25 focus:border-violet-300/60"
              />
            </Card>

            <div className="space-y-4">
              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-emerald-300" />
                  <p className="text-sm font-black">Merge checklist</p>
                </div>
                <div className="space-y-2">
                  {[
                    'Pull useful meal upgrades into Eat.',
                    'Pull safe workout upgrades into Train.',
                    'Pull dashboard ideas into Mission or Track.',
                    'Pull HVAC actions into GR Scale OS later.',
                    'Reject anything unsafe, confusing, or too feature-heavy.',
                  ].map(item => (
                    <p key={item} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/58">{item}</p>
                  ))}
                </div>
              </Card>

              <Card>
                <div className="mb-3 flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-cyan-300" />
                  <p className="text-sm font-black">Next prompt for Claude</p>
                </div>
                <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-relaxed text-white/55">
                  Now critique your own answer. Remove anything unsafe, unrealistic, or not action-based. Return only the top 10 things Codex should add to Gio OS next.
                </p>
              </Card>
            </div>
          </div>
        </Section>

        <footer className="border-t border-white/10 py-8 text-center text-xs leading-relaxed text-white/35">
          Private local dashboard. Upgrade later: real login, phone reminders, Google Calendar, Garmin, and stronger medical guardrails with parent/coach/doctor input.
        </footer>
      </div>
    </main>
  )
}

