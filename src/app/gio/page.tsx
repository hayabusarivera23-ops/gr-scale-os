'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Apple,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flame,
  GlassWater,
  HeartPulse,
  LineChart,
  MessageCircle,
  Moon,
  Plus,
  Scale,
  Search,
  Sparkles,
  Target,
  TimerReset,
  Trophy,
  Utensils,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import DailyPromptsCard from '@/components/shared/DailyPromptsCard'

type View = 'Today' | 'Eat' | 'Train' | 'Track' | 'Faith'
type Meal = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'

interface DayLog {
  date: string
  weight: string
  sleep: number
  energy: number
  soreness: number
  sorenessArea: string
  mood: number
  workoutDone: boolean
  faithDone: boolean
  journal: string
  prayer: string
  waterOz: number
  streak: number
}

interface FoodItem {
  name: string
  serving: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
}

interface FoodEntry {
  id: string
  date: string
  meal: Meal
  foodName: string
  grams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface SetEntry {
  id: string
  date: string
  exercise: string
  weight: string
  reps: number
  rpe: number
}

interface WorkoutMove {
  name: string
  target: string
  cue: string
  alternates: string[]
}

const TODAY = new Date().toISOString().slice(0, 10)
const LOG_KEY = 'gio-os-v5-logs'
const FOOD_KEY = 'gio-os-v5-food'
const SET_KEY = 'gio-os-v5-sets'
const VIEW_KEY = 'gio-os-v5-view'

const meals: Meal[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']
const sorenessAreas = ['None', 'Neck', 'Shoulder', 'Back', 'Hip', 'Knee', 'Ankle']

const targets = {
  calories: 2900,
  protein: 150,
  carbs: 330,
  fat: 90,
  water: 112,
}

const MIN_SAFE_WEIGHT = 142
const CALORIE_FLOOR = 2400

const staples: FoodItem[] = [
  { name: 'Chicken breast', serving: 'Cooked, weighed in grams', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 4 },
  { name: 'Kirkland chicken chunks', serving: 'Freezer chicken chunks', caloriesPer100g: 150, proteinPer100g: 25, carbsPer100g: 1, fatPer100g: 4 },
  { name: 'Eggs', serving: 'Whole eggs', caloriesPer100g: 143, proteinPer100g: 13, carbsPer100g: 1, fatPer100g: 10 },
  { name: 'Kirkland tuna packet', serving: '42 g packet', caloriesPer100g: 276, proteinPer100g: 62, carbsPer100g: 0, fatPer100g: 2 },
  { name: 'Premier Protein shake', serving: 'Bottle, log bottle weight if unsure', caloriesPer100g: 49, proteinPer100g: 9, carbsPer100g: 2, fatPer100g: 1 },
  { name: "Nature's Own bread", serving: 'Bread slices, weigh if possible', caloriesPer100g: 265, proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 4 },
  { name: 'Carb Balance tortilla', serving: 'Tortilla, weigh each one', caloriesPer100g: 218, proteinPer100g: 8, carbsPer100g: 43, fatPer100g: 6 },
  { name: 'Banana', serving: 'Peeled banana', caloriesPer100g: 89, proteinPer100g: 1, carbsPer100g: 23, fatPer100g: 0 },
  { name: 'Peanut butter', serving: 'Use scale, this adds up fast', caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50 },
  { name: 'Chicken fried rice', serving: 'Kirkland 9 oz bag', caloriesPer100g: 150, proteinPer100g: 7, carbsPer100g: 21, fatPer100g: 4 },
  { name: 'Cheese slice', serving: 'Weigh slices together', caloriesPer100g: 350, proteinPer100g: 22, carbsPer100g: 3, fatPer100g: 28 },
  { name: 'Milk', serving: 'Pour and weigh cup', caloriesPer100g: 61, proteinPer100g: 3, carbsPer100g: 5, fatPer100g: 3 },
  { name: 'Kirkland chewy granola bar', serving: 'Snack backup', caloriesPer100g: 430, proteinPer100g: 7, carbsPer100g: 70, fatPer100g: 14 },
]

const quickMeals = [
  {
    name: 'Work breakfast',
    meal: 'Breakfast' as Meal,
    items: [
      ['Eggs', 150],
      ["Nature's Own bread", 70],
      ['Banana', 120],
      ['Milk', 240],
    ],
  },
  {
    name: 'Tuna wrap',
    meal: 'Lunch' as Meal,
    items: [
      ['Kirkland tuna packet', 42],
      ['Carb Balance tortilla', 55],
      ['Cheese slice', 20],
    ],
  },
  {
    name: 'Chicken power wrap',
    meal: 'Dinner' as Meal,
    items: [
      ['Chicken breast', 170],
      ['Carb Balance tortilla', 55],
      ['Cheese slice', 20],
    ],
  },
  {
    name: 'No-excuse snack',
    meal: 'Snacks' as Meal,
    items: [
      ['Premier Protein shake', 325],
      ['Kirkland chewy granola bar', 40],
    ],
  },
]

const fullWorkout: WorkoutMove[] = [
  { name: 'Dynamic warmup', target: '6 min', cue: 'Hips, ankles, shoulders. Move smooth before you load anything.', alternates: ['Bike warmup', 'Jump rope', 'Shadow wrestling'] },
  { name: 'Goblet squat or leg press', target: '3 x 8', cue: 'Control down, drive up, leave 2 reps in the tank.', alternates: ['Split squat', 'Bodyweight squat', 'Step-up'] },
  { name: 'Romanian deadlift', target: '3 x 8', cue: 'Hinge, flat back, hamstrings loaded. No ego reps.', alternates: ['Hip thrust', 'Hamstring curl', 'Single-leg RDL'] },
  { name: 'Pullups or assisted pulls', target: '4 sets', cue: 'Clean reps. If pullups are gone, switch to controlled negatives.', alternates: ['Lat pulldown', 'Inverted row', 'Dead hang'] },
  { name: 'Pushups or dumbbell press', target: '3 x 10', cue: 'Strong line from head to heel. Stop before form breaks.', alternates: ['Bench press', 'Incline pushup', 'Machine press'] },
  { name: 'Carry plus core', target: '4 rounds', cue: 'Carry heavy, then plank. Built for wrestling pressure.', alternates: ['Suitcase carry', 'Farmer carry', 'Pallof press'] },
  { name: 'Mobility close', target: '8 min', cue: 'Hip flexor, hamstrings, calves, upper back. Win recovery.', alternates: ['Couch stretch', '90/90 hips', 'Child pose breathing'] },
]

const shortWorkout: WorkoutMove[] = [
  { name: 'Fast warmup', target: '3 min', cue: 'Hips, shoulders, light sweat.', alternates: ['Bike', 'Jump rope', 'Shadow wrestling'] },
  { name: 'Pushups', target: '3 quality sets', cue: 'Beat good form, not bad numbers.', alternates: ['Incline pushup', 'Dumbbell press', 'Machine press'] },
  { name: 'Pullups or hangs', target: '4 sets', cue: 'Pull if you can, hang if you cannot. Grip matters.', alternates: ['Lat pulldown', 'Inverted row', 'Band pull'] },
  { name: 'Squat or lunge', target: '4 rounds', cue: 'Legs plus lungs. Controlled pace.', alternates: ['Goblet squat', 'Step-up', 'Wall sit'] },
  { name: 'Core finisher', target: '5 min', cue: 'Plank, side plank, dead bug. No lazy reps.', alternates: ['Hollow hold', 'Mountain climber', 'Pallof press'] },
]

function blankLog(date = TODAY): DayLog {
  return {
    date,
    weight: '',
    sleep: 8,
    energy: 7,
    soreness: 3,
    sorenessArea: 'None',
    mood: 7,
    workoutDone: false,
    faithDone: false,
    journal: '',
    prayer: '',
    waterOz: 0,
    streak: 0,
  }
}

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStore<T>(key: string, value: T) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}

function macroFor(food: FoodItem, grams: number) {
  const scale = grams / 100
  return {
    calories: Math.round(food.caloriesPer100g * scale),
    protein: Math.round(food.proteinPer100g * scale),
    carbs: Math.round(food.carbsPer100g * scale),
    fat: Math.round(food.fatPer100g * scale),
  }
}

function percent(value: number, target: number) {
  return Math.min(100, Math.round((value / target) * 100))
}

function readiness(log: DayLog, protein: number, calories: number, setCount: number) {
  let score = 58
  score += (log.sleep - 7) * 6
  score += (log.energy - 5) * 4
  score += (log.mood - 5) * 2
  score -= Math.max(0, log.soreness - 4) * 5
  score += protein >= 80 ? 7 : 0
  score += calories >= 1600 ? 5 : 0
  score += log.waterOz >= 64 ? 5 : 0
  score += log.workoutDone || setCount > 0 ? 5 : 0
  return Math.max(25, Math.min(98, Math.round(score)))
}

function coachLine(log: DayLog, score: number, protein: number, calories: number) {
  const weight = Number(log.weight)
  if (weight && weight < MIN_SAFE_WEIGHT) {
    return 'Hard guard: do not push weight lower. Fuel, hydrate, tell a parent or coach, and keep the plan performance-based.'
  }
  if (!log.weight) return 'First move tomorrow: weigh in, log sleep and soreness, then eat breakfast before the day starts.'
  if (calories > 0 && calories < CALORIE_FLOOR) return 'Fuel floor is active. Keep logging, but do not turn today into a deficit day. Add protein plus carbs before training.'
  if (log.soreness >= 7 && (log.sorenessArea ?? 'None') !== 'None') return `Recovery flag: ${log.sorenessArea} is sore. Train around it, do mobility, and do not force sharp pain.`
  if (isPracticeEve()) return "Practice-eve rule: fuel tonight, do mobility, keep lifting clean, and protect tomorrow's wrestling pace."
  if (score >= 82) return 'Green day. Train hard with clean form, hit protein early, and log every set so next session can progress.'
  if (score >= 65) return 'Build day. Keep the workout controlled, do the main lifts, and do not skip food just because you want results fast.'
  if (protein < 80 || calories < 1600) return 'Fuel is the limiter. Add a real meal before chasing more training. Strength comes from logged reps plus food.'
  return 'Recovery bias today. Move, stretch, hydrate, and protect tomorrow. That still counts as growth.'
}

function readinessReasons(log: DayLog, protein: number, calories: number) {
  const notes = [
    `Sleep ${log.sleep}/10`,
    `Energy ${log.energy}/10`,
    `Soreness ${log.soreness}/10`,
  ]
  if (protein < 80) notes.push('protein low')
  if (calories > 0 && calories < CALORIE_FLOOR) notes.push('fuel floor active')
  if (log.waterOz < 48) notes.push('water behind')
  if (log.soreness >= 8) notes.push('recovery bias')
  return notes
}

function quickMealProtein(plan: (typeof quickMeals)[number]) {
  return plan.items.reduce((sum, [name, amount]) => {
    const item = staples.find((candidate) => candidate.name === name)
    return item ? sum + macroFor(item, Number(amount)).protein : sum
  }, 0)
}

function quickMealCalories(plan: (typeof quickMeals)[number]) {
  return plan.items.reduce((sum, [name, amount]) => {
    const item = staples.find((candidate) => candidate.name === name)
    return item ? sum + macroFor(item, Number(amount)).calories : sum
  }, 0)
}

function recentWeightDrop(logs: Record<string, DayLog>, current: DayLog) {
  const currentWeight = Number(current.weight)
  if (!currentWeight) return 0
  const prior = Object.values(logs)
    .filter((entry) => entry.date !== current.date && Number(entry.weight))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
    .map((entry) => Number(entry.weight))
  if (!prior.length) return 0
  return Math.max(...prior) - currentWeight
}

function painFlag(log: DayLog) {
  return /pain|hurt|injury|injured|sharp|pop|swollen|sprain/i.test(`${log.journal} ${log.prayer}`)
}

function beatLine(sets: SetEntry[], exercise: string) {
  const prior = sets.filter((entry) => entry.exercise === exercise && entry.date !== TODAY)
  if (!prior.length) return 'First time logged. Set a clean baseline.'
  const best = [...prior].sort((a, b) => b.reps - a.reps || b.rpe - a.rpe)[0]
  const nextReps = best.reps + 1
  return `Beat line: ${best.weight} x ${nextReps} with RPE ${Math.min(9, best.rpe)} or cleaner form.`
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatTimer(total: number) {
  const minutes = Math.floor(total / 60)
  const seconds = String(total % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

function yesterdayIso() {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString().slice(0, 10)
}

function isPracticeEve() {
  const day = new Date().getDay()
  return day === 1 || day === 3 || day === 6
}

export default function GioPage() {
  const [view, setView] = useState<View>('Today')
  const [logs, setLogs] = useState<Record<string, DayLog>>({})
  const [log, setLog] = useState<DayLog>(blankLog())
  const [food, setFood] = useState<FoodEntry[]>([])
  const [sets, setSets] = useState<SetEntry[]>([])
  const [query, setQuery] = useState('')
  const [meal, setMeal] = useState<Meal>('Breakfast')
  const [grams, setGrams] = useState('100')
  const [customName, setCustomName] = useState('')
  const [customCalories, setCustomCalories] = useState('')
  const [customProtein, setCustomProtein] = useState('')
  const [customCarbs, setCustomCarbs] = useState('')
  const [customFat, setCustomFat] = useState('')
  const [activeMove, setActiveMove] = useState(0)
  const [twentyMin, setTwentyMin] = useState(false)
  const [setWeight, setSetWeight] = useState('')
  const [setReps, setSetReps] = useState('8')
  const [setRpe, setSetRpe] = useState('7')
  const [rest, setRest] = useState(0)
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [pulse, setPulse] = useState('')
  const [morningStep, setMorningStep] = useState(0)

  useEffect(() => {
    const savedLogs = readStore<Record<string, DayLog>>(LOG_KEY, {})
    const todayLog = savedLogs[TODAY] ?? blankLog()
    setLogs(savedLogs)
    setLog(todayLog)
    setFood(readStore<FoodEntry[]>(FOOD_KEY, []))
    setSets(readStore<SetEntry[]>(SET_KEY, []))
    setView(readStore<View>(VIEW_KEY, 'Today'))
  }, [])

  useEffect(() => {
    if (rest <= 0) return
    const timer = window.setInterval(() => setRest((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [rest])

  function showPulse(message: string) {
    setPulse(message)
    window.setTimeout(() => setPulse(''), 1400)
  }

  function updateLog(patch: Partial<DayLog>) {
    setLog((current) => {
      const next = { ...current, ...patch, date: TODAY }
      setLogs((all) => {
        const updated = { ...all, [TODAY]: next }
        writeStore(LOG_KEY, updated)
        return updated
      })
      return next
    })
  }

  function switchView(next: View) {
    setView(next)
    writeStore(VIEW_KEY, next)
  }

  function saveFood(next: FoodEntry[]) {
    setFood(next)
    writeStore(FOOD_KEY, next)
  }

  function saveSets(next: SetEntry[]) {
    setSets(next)
    writeStore(SET_KEY, next)
  }

  function addFood(item: FoodItem, amount = Number(grams), selectedMeal = meal) {
    const safeGrams = Math.max(1, Math.round(amount || 1))
    const macros = macroFor(item, safeGrams)
    const next = [
      {
        id: uid('food'),
        date: TODAY,
        meal: selectedMeal,
        foodName: item.name,
        grams: safeGrams,
        ...macros,
      },
      ...food,
    ]
    saveFood(next)
    showPulse(`${item.name} logged`)
  }

  function addCustomFood() {
    const amount = Math.max(1, Number(grams) || 100)
    const calories = Math.max(0, Number(customCalories) || 0)
    const protein = Math.max(0, Number(customProtein) || 0)
    const carbs = Math.max(0, Number(customCarbs) || 0)
    const fat = Math.max(0, Number(customFat) || 0)
    if (!customName.trim() || calories === 0) return
    const next: FoodEntry = {
      id: uid('custom'),
      date: TODAY,
      meal,
      foodName: customName.trim(),
      grams: amount,
      calories,
      protein,
      carbs,
      fat,
    }
    saveFood([next, ...food])
    setCustomName('')
    setCustomCalories('')
    setCustomProtein('')
    setCustomCarbs('')
    setCustomFat('')
    showPulse('Custom food logged')
  }

  function addQuickMeal(plan: (typeof quickMeals)[number]) {
    const entries = plan.items
      .map(([name, amount]) => {
        const item = staples.find((candidate) => candidate.name === name)
        if (!item) return null
        return {
          id: uid('meal'),
          date: TODAY,
          meal: plan.meal,
          foodName: item.name,
          grams: Number(amount),
          ...macroFor(item, Number(amount)),
        }
      })
      .filter(Boolean) as FoodEntry[]
    saveFood([...entries, ...food])
    showPulse(`${plan.name} added`)
  }

  function removeFood(id: string) {
    saveFood(food.filter((entry) => entry.id !== id))
    showPulse('Food removed')
  }

  function copyYesterdayMeal(section: Meal) {
    const source = food.filter((entry) => entry.date === yesterdayIso() && entry.meal === section)
    if (!source.length) {
      showPulse(`No ${section.toLowerCase()} from yesterday`)
      return
    }
    const copied = source.map((entry) => ({
      ...entry,
      id: uid('copy'),
      date: TODAY,
    }))
    saveFood([...copied, ...food])
    showPulse(`${section} copied from yesterday`)
  }

  function logSet() {
    const move = workout[activeMove]
    const nextSet: SetEntry = {
      id: uid('set'),
      date: TODAY,
      exercise: move.name,
      weight: setWeight.trim() || 'bodyweight',
      reps: Math.max(1, Number(setReps) || 1),
      rpe: Math.max(1, Math.min(10, Number(setRpe) || 7)),
    }
    saveSets([nextSet, ...sets])
    setRest(75)
    showPulse('Set logged, rest started')
  }

  function finishWorkout() {
    updateLog({ workoutDone: true })
    setRest(0)
    showPulse('Workout complete')
  }

  function addWater() {
    updateLog({ waterOz: Math.min(180, log.waterOz + 16) })
    showPulse('Water logged')
  }

  const todayFood = useMemo(() => food.filter((entry) => entry.date === TODAY), [food])
  const todaySets = useMemo(() => sets.filter((entry) => entry.date === TODAY), [sets])
  const workout = twentyMin ? shortWorkout : fullWorkout
  const activeWorkoutMove = workout[activeMove] ?? workout[0]

  const totals = useMemo(() => {
    return todayFood.reduce(
      (sum, entry) => ({
        calories: sum.calories + entry.calories,
        protein: sum.protein + entry.protein,
        carbs: sum.carbs + entry.carbs,
        fat: sum.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    )
  }, [todayFood])

  const exerciseCalories = log.workoutDone ? 280 : Math.min(180, todaySets.length * 28)
  const remaining = targets.calories - totals.calories + exerciseCalories
  const readyScore = readiness(log, totals.protein, totals.calories, todaySets.length)
  const coach = coachLine(log, readyScore, totals.protein, totals.calories)
  const readinessNotes = readinessReasons(log, totals.protein, totals.calories)
  const weightDrop = recentWeightDrop(logs, log)
  const showSafetyBanner = (Number(log.weight) > 0 && Number(log.weight) < MIN_SAFE_WEIGHT) || weightDrop >= 3 || painFlag(log)
  const proteinGap = Math.max(0, targets.protein - totals.protein)
  const rankedQuickMeals = useMemo(() => {
    return [...quickMeals].sort((a, b) => {
      const aProtein = quickMealProtein(a)
      const bProtein = quickMealProtein(b)
      const aScore = Math.abs(proteinGap - aProtein) - aProtein * 0.15
      const bScore = Math.abs(proteinGap - bProtein) - bProtein * 0.15
      return aScore - bScore
    })
  }, [proteinGap])
  const activeBeatLine = beatLine(sets, activeWorkoutMove.name)

  const filteredFoods = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return staples
    return staples.filter((item) => item.name.toLowerCase().includes(normalized))
  }, [query])

  const recentFoods = useMemo(() => {
    const seen = new Set<string>()
    return food
      .filter((entry) => {
        if (seen.has(entry.foodName)) return false
        seen.add(entry.foodName)
        return true
      })
      .slice(0, 8)
  }, [food])

  const history = useMemo(() => {
    return Object.values(logs)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
  }, [logs])

  const selectedLog = logs[selectedDate] ?? log

  return (
    <main className="min-h-screen bg-[#050607] text-zinc-50">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%),linear-gradient(145deg,#050607_0%,#090d0f_42%,#050607_100%)]" />
      {pulse ? (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-emerald-400/40 bg-emerald-400 px-4 py-2 text-sm font-black text-black shadow-2xl shadow-emerald-500/20">
          {pulse}
        </div>
      ) : null}

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <button onClick={() => switchView('Today')} className="flex min-w-0 items-center gap-3 text-left">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-cyan-300/40 bg-cyan-300 text-black shadow-lg shadow-cyan-400/10">
              <Zap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-black uppercase tracking-[0.28em] text-cyan-200">Gio OS</p>
              <h1 className="truncate text-xl font-black sm:text-2xl">Tomorrow Ready Mode</h1>
            </div>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-cyan-300/50 hover:text-cyan-100"
          >
            <BriefcaseBusiness className="h-4 w-4" />
            GR Scale
          </Link>
        </header>

        <section className="grid gap-4 py-5 lg:grid-cols-[1.15fr_0.85fr]">
          <button
            onClick={() => switchView('Today')}
            className="rounded-lg border border-cyan-300/25 bg-white/[0.035] p-5 text-left shadow-2xl shadow-black/20 transition hover:border-cyan-300/50"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-cyan-200">Coach brief</p>
                <h2 className="text-3xl font-black leading-none sm:text-5xl">Do the next rep.</h2>
              </div>
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-emerald-300/35 bg-emerald-300/10">
                <div className="text-center">
                  <p className="text-3xl font-black text-emerald-200">{readyScore}</p>
                  <p className="text-[10px] font-bold uppercase text-emerald-100/70">ready</p>
                </div>
              </div>
            </div>
            <p className="max-w-2xl text-lg font-semibold leading-relaxed text-zinc-200">{coach}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <ActionPill icon={Scale} label={log.weight ? `${log.weight} lb logged` : 'Weigh in first'} />
              <ActionPill icon={Utensils} label={`${totals.protein}g protein`} />
              <ActionPill icon={Dumbbell} label={`${todaySets.length} sets today`} />
            </div>
          </button>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <QuickAction
              icon={Scale}
              title="Morning log"
              value={log.weight ? `${log.weight} lb` : 'Missing'}
              accent="cyan"
              onClick={() => switchView('Track')}
            />
            <QuickAction
              icon={Utensils}
              title="Food diary"
              value={`${Math.max(0, remaining)} left`}
              accent={remaining < 700 ? 'amber' : 'emerald'}
              onClick={() => switchView('Eat')}
            />
            <QuickAction
              icon={Dumbbell}
              title="Live workout"
              value={log.workoutDone ? 'Done' : twentyMin ? '20 min' : 'Full'}
              accent="violet"
              onClick={() => switchView('Train')}
            />
          </div>
        </section>

        <nav className="sticky top-0 z-20 -mx-4 border-y border-white/10 bg-[#050607]/92 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="grid grid-cols-5 gap-2">
            {(['Today', 'Eat', 'Train', 'Track', 'Faith'] as View[]).map((item) => (
              <button
                key={item}
                onClick={() => switchView(item)}
                className={cn(
                  'rounded-lg px-2 py-3 text-xs font-black uppercase tracking-wide transition sm:text-sm',
                  view === item
                    ? 'bg-cyan-300 text-black shadow-lg shadow-cyan-400/10'
                    : 'border border-white/10 bg-white/[0.025] text-zinc-400 hover:border-white/25 hover:text-white',
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </nav>

        {view === 'Today' ? (
          <section className="grid gap-4 py-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="lg:col-span-2">
              <DailyPromptsCard scope="personal" />
            </div>

            {showSafetyBanner ? (
              <button
                onClick={() => switchView('Faith')}
                className="rounded-lg border border-red-300/35 bg-red-400/10 p-4 text-left text-sm font-bold leading-relaxed text-red-100 lg:col-span-2"
              >
                Safety guard is active. If weight dropped fast, weight is below {MIN_SAFE_WEIGHT} lb, or you logged pain words, do not cut food or water. Tell a parent, coach, or medical professional if anything feels wrong.
              </button>
            ) : null}

            <Panel>
              <div className="mb-4 flex items-center justify-between">
                <Title icon={Flame} label="Calories remaining" />
                <button onClick={() => switchView('Eat')} className="rounded-lg bg-white px-3 py-2 text-xs font-black text-black">
                  Log food
                </button>
              </div>
              <div className="flex items-center gap-5">
                <CalorieDial remaining={remaining} consumed={totals.calories} />
                <div className="grid flex-1 gap-3">
                  <MacroBar label="Protein" value={totals.protein} target={targets.protein} color="bg-emerald-300" />
                  <MacroBar label="Carbs" value={totals.carbs} target={targets.carbs} color="bg-cyan-300" />
                  <MacroBar label="Fat" value={totals.fat} target={targets.fat} color="bg-amber-300" />
                </div>
              </div>
              {remaining > 900 ? (
                <p className="mt-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm font-semibold text-amber-100">
                  Do not under-fuel. Stay above the {CALORIE_FLOOR} calorie suggestion floor and keep water normal.
                </p>
              ) : null}
            </Panel>

            <Panel>
              <div className="mb-4 flex items-center justify-between">
                <Title icon={GlassWater} label="Hydration blocks" />
                <button onClick={addWater} className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-black">
                  +16 oz
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, index) => {
                  const filled = log.waterOz >= (index + 1) * 16
                  return (
                    <button
                      key={index}
                      onClick={() => updateLog({ waterOz: (index + 1) * 16 })}
                      className={cn(
                        'h-14 rounded-lg border text-xs font-black transition',
                        filled ? 'border-cyan-300 bg-cyan-300 text-black' : 'border-white/10 bg-white/[0.03] text-zinc-500',
                      )}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-300">{log.waterOz} oz logged. Target is about {targets.water} oz, more around practice.</p>
            </Panel>

            <Panel className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <Title icon={Zap} label="20-second morning flow" />
                <span className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-zinc-400">Step {morningStep + 1}/4</span>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <button
                  onClick={() => {
                    const current = Number(log.weight) || 145
                    updateLog({ weight: String(current) })
                    setMorningStep(1)
                  }}
                  className={cn('rounded-lg border p-4 text-left transition', morningStep === 0 ? 'border-cyan-300/50 bg-cyan-300/10' : 'border-white/10 bg-black/25')}
                >
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">1. Scale</p>
                  <p className="mt-2 text-2xl font-black">{log.weight || '145'} lb</p>
                  <span className="mt-3 grid grid-cols-2 gap-2">
                    <span onClick={(event) => { event.stopPropagation(); updateLog({ weight: String((Number(log.weight) || 145) - 0.2) }) }} className="rounded-lg bg-white/10 py-2 text-center text-xs font-black">-0.2</span>
                    <span onClick={(event) => { event.stopPropagation(); updateLog({ weight: String((Number(log.weight) || 145) + 0.2) }) }} className="rounded-lg bg-white/10 py-2 text-center text-xs font-black">+0.2</span>
                  </span>
                </button>
                <button
                  onClick={() => {
                    updateLog({ sleep: log.sleep >= 8 ? 7 : 8 })
                    setMorningStep(2)
                  }}
                  className={cn('rounded-lg border p-4 text-left transition', morningStep === 1 ? 'border-cyan-300/50 bg-cyan-300/10' : 'border-white/10 bg-black/25')}
                >
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">2. Sleep</p>
                  <p className="mt-2 text-2xl font-black">{log.sleep}/10</p>
                  <p className="mt-2 text-xs font-bold text-zinc-500">Tap toggles solid / okay</p>
                </button>
                <button
                  onClick={() => {
                    updateLog({ energy: log.energy >= 8 ? 6 : 8, soreness: log.soreness >= 5 ? 3 : 5 })
                    setMorningStep(3)
                  }}
                  className={cn('rounded-lg border p-4 text-left transition', morningStep === 2 ? 'border-cyan-300/50 bg-cyan-300/10' : 'border-white/10 bg-black/25')}
                >
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">3. Body</p>
                  <p className="mt-2 text-2xl font-black">E{log.energy} / S{log.soreness}</p>
                  <p className="mt-2 text-xs font-bold text-zinc-500">Energy and soreness</p>
                </button>
                <button
                  onClick={() => {
                    setMorningStep(0)
                    switchView('Eat')
                    showPulse('Morning flow complete')
                  }}
                  className={cn('rounded-lg border p-4 text-left transition', morningStep === 3 ? 'border-emerald-300/50 bg-emerald-300 text-black' : 'border-white/10 bg-black/25')}
                >
                  <p className="text-xs font-black uppercase tracking-widest opacity-70">4. Next</p>
                  <p className="mt-2 text-2xl font-black">Eat</p>
                  <p className="mt-2 text-xs font-bold opacity-70">Go to breakfast log</p>
                </button>
              </div>
            </Panel>

            <Panel className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <Title icon={Target} label="Tomorrow morning checklist" />
                <span className="rounded-lg border border-emerald-300/30 px-3 py-2 text-xs font-black text-emerald-200">
                  {TODAY}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <MorningField label="Weight" suffix="lb" value={log.weight} onChange={(value) => updateLog({ weight: value })} />
                <SliderField label="Sleep" value={log.sleep} min={4} max={10} onChange={(value) => updateLog({ sleep: value })} />
                <SliderField label="Energy" value={log.energy} min={1} max={10} onChange={(value) => updateLog({ energy: value })} />
                <SliderField label="Soreness" value={log.soreness} min={1} max={10} onChange={(value) => updateLog({ soreness: value })} />
                <SliderField label="Mood" value={log.mood} min={1} max={10} onChange={(value) => updateLog({ mood: value })} />
                <div className="rounded-lg border border-white/10 bg-black/30 p-4 md:col-span-2">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Soreness location</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sorenessAreas.map((area) => (
                      <button
                        key={area}
                        onClick={() => updateLog({ sorenessArea: area })}
                        className={cn(
                          'rounded-lg px-3 py-2 text-xs font-black transition',
                          (log.sorenessArea ?? 'None') === area ? 'bg-cyan-300 text-black' : 'border border-white/10 text-zinc-400',
                        )}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => finishWorkout()}
                  className={cn(
                    'rounded-lg border p-4 text-left transition',
                    log.workoutDone ? 'border-emerald-300 bg-emerald-300 text-black' : 'border-white/10 bg-white/[0.03] hover:border-emerald-300/50',
                  )}
                >
                  <p className="text-xs font-black uppercase tracking-widest opacity-70">Workout</p>
                  <p className="mt-2 text-lg font-black">{log.workoutDone ? 'Done' : 'Tap when done'}</p>
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {readinessNotes.map((note) => (
                  <button key={note} onClick={() => showPulse(note)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-black text-zinc-400">
                    {note}
                  </button>
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {view === 'Eat' ? (
          <section className="grid gap-4 py-5 lg:grid-cols-[0.85fr_1.15fr]">
            <Panel>
              <Title icon={Plus} label="Add food fast" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                {meals.map((item) => (
                  <button
                    key={item}
                    onClick={() => setMeal(item)}
                    className={cn(
                      'rounded-lg px-3 py-3 text-sm font-black transition',
                      meal === item ? 'bg-cyan-300 text-black' : 'border border-white/10 bg-white/[0.03] text-zinc-300',
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <label className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-3">
                <Search className="h-4 w-4 text-zinc-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your groceries"
                  className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-zinc-600"
                />
              </label>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  value={grams}
                  onChange={(event) => setGrams(event.target.value)}
                  className="w-24 rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-sm font-black outline-none"
                />
                <span className="text-sm font-bold text-zinc-400">grams</span>
              </div>

              <div className="mt-4 grid gap-2">
                {filteredFoods.slice(0, 8).map((item) => {
                  const macros = macroFor(item, Number(grams) || 100)
                  return (
                    <button
                      key={item.name}
                      onClick={() => addFood(item)}
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-cyan-300/50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">{item.name}</p>
                          <p className="text-xs font-semibold text-zinc-500">{item.serving}</p>
                        </div>
                        <p className="text-sm font-black text-cyan-200">{macros.calories} cal</p>
                      </div>
                      <p className="mt-2 text-xs font-bold text-zinc-400">{macros.protein}p / {macros.carbs}c / {macros.fat}f</p>
                    </button>
                  )
                })}
              </div>
            </Panel>

            <div className="grid gap-4">
              <Panel>
                <div className="mb-3 flex items-center justify-between">
                  <Title icon={Utensils} label="Diary" />
                  <p className="text-sm font-black text-emerald-200">{totals.calories} calories</p>
                </div>
                <div className="grid gap-3">
                  {meals.map((section) => {
                    const mealEntries = todayFood.filter((entry) => entry.meal === section)
                    const mealCalories = mealEntries.reduce((sum, entry) => sum + entry.calories, 0)
                    return (
                      <div key={section} className="rounded-lg border border-white/10 bg-black/25 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <button onClick={() => setMeal(section)} className="min-w-0 flex-1 text-left">
                            <p className="font-black">{section}</p>
                            <p className="text-sm font-black text-cyan-200">{mealCalories} cal</p>
                          </button>
                          <button
                            onClick={() => copyYesterdayMeal(section)}
                            className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black text-zinc-400 transition hover:border-cyan-300/50 hover:text-white"
                          >
                            Copy Yesterday
                          </button>
                        </div>
                        {mealEntries.length ? (
                          <div className="grid gap-2">
                            {mealEntries.map((entry) => (
                              <button
                                key={entry.id}
                                onClick={() => removeFood(entry.id)}
                                className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.035] px-3 py-2 text-left transition hover:bg-red-400/10"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-bold">{entry.foodName}</span>
                                  <span className="text-xs text-zinc-500">{entry.grams}g, tap to delete</span>
                                </span>
                                <span className="text-sm font-black">{entry.calories}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <button onClick={() => setMeal(section)} className="w-full rounded-lg border border-dashed border-white/10 py-3 text-sm font-bold text-zinc-500">
                            Add {section.toLowerCase()}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Panel>

              <Panel>
                <Title icon={Sparkles} label="One tap meals" />
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {rankedQuickMeals.map((plan) => (
                    <button
                      key={plan.name}
                      onClick={() => addQuickMeal(plan)}
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-emerald-300/50"
                    >
                      <p className="font-black">{plan.name}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        {plan.meal} - {quickMealProtein(plan)}g protein - {quickMealCalories(plan)} cal
                      </p>
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel>
                <Title icon={Apple} label="Custom food" />
                <div className="mt-4 grid gap-2 sm:grid-cols-5">
                  <input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Name" className="rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-sm font-semibold outline-none sm:col-span-2" />
                  <input value={customCalories} onChange={(event) => setCustomCalories(event.target.value)} placeholder="Cal" type="number" className="rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-sm font-semibold outline-none" />
                  <input value={customProtein} onChange={(event) => setCustomProtein(event.target.value)} placeholder="P" type="number" className="rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-sm font-semibold outline-none" />
                  <button onClick={addCustomFood} className="rounded-lg bg-emerald-300 px-3 py-3 text-sm font-black text-black">Add</button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input value={customCarbs} onChange={(event) => setCustomCarbs(event.target.value)} placeholder="Carbs" type="number" className="rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-sm font-semibold outline-none" />
                  <input value={customFat} onChange={(event) => setCustomFat(event.target.value)} placeholder="Fat" type="number" className="rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-sm font-semibold outline-none" />
                </div>
              </Panel>

              {recentFoods.length ? (
                <Panel>
                  <Title icon={TimerReset} label="Recent re-log" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {recentFoods.map((entry) => {
                      const item = staples.find((candidate) => candidate.name === entry.foodName)
                      return (
                        <button
                          key={entry.id}
                          onClick={() => item && addFood(item, entry.grams, meal)}
                          className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-zinc-300 transition hover:border-cyan-300/50 hover:text-white"
                        >
                          {entry.foodName}
                        </button>
                      )
                    })}
                  </div>
                </Panel>
              ) : null}
            </div>
          </section>
        ) : null}

        {view === 'Train' ? (
          <section className="grid gap-4 py-5 lg:grid-cols-[1.05fr_0.95fr]">
            <Panel>
              <div className="mb-4 flex items-center justify-between gap-3">
                <Title icon={Dumbbell} label="Live session" />
                <button onClick={() => setTwentyMin((value) => !value)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-black text-zinc-300">
                  {twentyMin ? 'Full plan' : '20-min mode'}
                </button>
              </div>
              <div className="mb-5 h-2 overflow-hidden rounded-lg bg-white/10">
                <div className="h-full bg-cyan-300 transition-all" style={{ width: `${percent(activeMove + 1, workout.length)}%` }} />
              </div>
              <div className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100">Step {activeMove + 1} of {workout.length}</p>
                <h2 className="mt-2 text-3xl font-black">{activeWorkoutMove.name}</h2>
                <p className="mt-2 text-lg font-black text-emerald-200">{activeWorkoutMove.target}</p>
                <p className="mt-3 text-sm font-semibold leading-relaxed text-zinc-300">{activeWorkoutMove.cue}</p>
                <button onClick={() => showPulse(activeBeatLine)} className="mt-4 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-3 text-left text-sm font-black text-emerald-100">
                  {activeBeatLine}
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <input value={setWeight} onChange={(event) => setSetWeight(event.target.value)} placeholder="Weight" className="rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-sm font-black outline-none" />
                <input value={setReps} onChange={(event) => setSetReps(event.target.value)} placeholder="Reps" type="number" className="rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-sm font-black outline-none" />
                <input value={setRpe} onChange={(event) => setSetRpe(event.target.value)} placeholder="RPE" type="number" className="rounded-lg border border-white/10 bg-black/40 px-3 py-3 text-sm font-black outline-none" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={logSet} className="rounded-lg bg-emerald-300 px-4 py-4 text-sm font-black text-black">
                  Log set
                </button>
                <button onClick={finishWorkout} className="rounded-lg bg-white px-4 py-4 text-sm font-black text-black">
                  Finish workout
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => setActiveMove((value) => Math.max(0, value - 1))} className="rounded-lg border border-white/10 py-3 text-sm font-black text-zinc-300">
                  Back
                </button>
                <button onClick={() => setActiveMove((value) => Math.min(workout.length - 1, value + 1))} className="rounded-lg border border-white/10 py-3 text-sm font-black text-zinc-300">
                  Next
                </button>
              </div>
            </Panel>

            <div className="grid gap-4">
              <Panel>
                <Title icon={TimerReset} label="Rest timer" />
                <button onClick={() => setRest(rest ? 0 : 75)} className="mt-4 grid h-36 w-full place-items-center rounded-lg border border-white/10 bg-black/35 transition hover:border-cyan-300/50">
                  <span className="text-5xl font-black">{formatTimer(rest)}</span>
                </button>
              </Panel>

              <Panel>
                <Title icon={Zap} label="Swap exercise" />
                <div className="mt-4 grid gap-2">
                  {activeWorkoutMove.alternates.map((alternate) => (
                    <button
                      key={alternate}
                      onClick={() => showPulse(`${alternate} selected as alternate`)}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left text-sm font-black transition hover:border-emerald-300/50"
                    >
                      {alternate}
                      <ChevronRight className="h-4 w-4 text-zinc-500" />
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel>
                <Title icon={Trophy} label="Sets today" />
                <div className="mt-4 grid gap-2">
                  {todaySets.length ? todaySets.slice(0, 8).map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => saveSets(sets.filter((item) => item.id !== entry.id))}
                      className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-left transition hover:bg-red-400/10"
                    >
                      <p className="font-black">{entry.exercise}</p>
                      <p className="text-xs font-bold text-zinc-500">{entry.weight} x {entry.reps}, RPE {entry.rpe}. Tap to delete.</p>
                    </button>
                  )) : (
                    <button onClick={logSet} className="rounded-lg border border-dashed border-white/10 py-4 text-sm font-bold text-zinc-500">
                      No sets yet. Tap to log first set.
                    </button>
                  )}
                </div>
              </Panel>
            </div>
          </section>
        ) : null}

        {view === 'Track' ? (
          <section className="grid gap-4 py-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel>
              <Title icon={Scale} label="Morning check-in" />
              <div className="mt-4 grid gap-3">
                <MorningField label="Weight" suffix="lb" value={log.weight} onChange={(value) => updateLog({ weight: value })} />
                <SliderField label="Sleep" value={log.sleep} min={4} max={10} onChange={(value) => updateLog({ sleep: value })} />
                <SliderField label="Energy" value={log.energy} min={1} max={10} onChange={(value) => updateLog({ energy: value })} />
                <SliderField label="Soreness" value={log.soreness} min={1} max={10} onChange={(value) => updateLog({ soreness: value })} />
                <SliderField label="Mood" value={log.mood} min={1} max={10} onChange={(value) => updateLog({ mood: value })} />
                <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Sore spot</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sorenessAreas.map((area) => (
                      <button
                        key={area}
                        onClick={() => updateLog({ sorenessArea: area })}
                        className={cn(
                          'rounded-lg px-3 py-2 text-xs font-black transition',
                          (log.sorenessArea ?? 'None') === area ? 'bg-cyan-300 text-black' : 'border border-white/10 text-zinc-400',
                        )}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>

            <Panel>
              <Title icon={LineChart} label="Weight trend" />
              <div className="mt-5 flex h-56 items-end gap-2 border-b border-white/10 pb-3">
                {(history.length ? history : [log]).map((item) => {
                  const value = Number(item.weight) || 140
                  const height = Math.max(18, Math.min(100, (value - 130) * 5))
                  return (
                    <button
                      key={item.date}
                      onClick={() => setSelectedDate(item.date)}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <span
                        className={cn('w-full rounded-lg transition', selectedDate === item.date ? 'bg-cyan-300' : 'bg-white/15 hover:bg-white/25')}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[10px] font-bold text-zinc-500">{item.date.slice(5)}</span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <MiniStat icon={Scale} label="Weight" value={selectedLog.weight ? `${selectedLog.weight} lb` : 'No log'} />
                <MiniStat icon={Moon} label="Sleep" value={`${selectedLog.sleep}/10`} />
                <MiniStat icon={Activity} label="Energy" value={`${selectedLog.energy}/10`} />
                <MiniStat icon={HeartPulse} label="Sore" value={`${selectedLog.soreness}/10`} />
              </div>
            </Panel>

            <Panel className="lg:col-span-2">
              <Title icon={CheckCircle2} label="Growth log" />
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <MiniStat icon={Utensils} label="Food entries" value={String(todayFood.length)} />
                <MiniStat icon={Dumbbell} label="Sets" value={String(todaySets.length)} />
                <MiniStat icon={GlassWater} label="Water" value={`${log.waterOz} oz`} />
                <MiniStat icon={Trophy} label="Streak" value={`${log.streak} days`} />
              </div>
            </Panel>
          </section>
        ) : null}

        {view === 'Faith' ? (
          <section className="grid gap-4 py-5 lg:grid-cols-[1fr_1fr]">
            <Panel>
              <Title icon={BookOpen} label="Faith prompt" />
              <p className="mt-4 text-2xl font-black leading-tight">Discipline is built today, not someday.</p>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-zinc-300">
                Prayer focus: ask God for self-control, honesty, and the strength to do the small things when nobody is watching.
              </p>
              <button
                onClick={() => updateLog({ faithDone: !log.faithDone })}
                className={cn(
                  'mt-5 w-full rounded-lg px-4 py-4 text-sm font-black transition',
                  log.faithDone ? 'bg-emerald-300 text-black' : 'border border-white/10 bg-white/[0.03] text-zinc-300',
                )}
              >
                {log.faithDone ? 'Faith check complete' : 'Mark faith check complete'}
              </button>
            </Panel>
            <Panel>
              <Title icon={MessageCircle} label="Prayer and journal" />
              <textarea
                value={log.prayer}
                onChange={(event) => updateLog({ prayer: event.target.value })}
                placeholder="Prayer"
                className="mt-4 h-28 w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm font-semibold outline-none placeholder:text-zinc-600"
              />
              <textarea
                value={log.journal}
                onChange={(event) => updateLog({ journal: event.target.value })}
                placeholder="One win. One fix. One promise for tomorrow."
                className="mt-3 h-36 w-full rounded-lg border border-white/10 bg-black/40 p-3 text-sm font-semibold outline-none placeholder:text-zinc-600"
              />
            </Panel>
          </section>
        ) : null}
      </div>
    </main>
  )
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-white/10 bg-white/[0.035] p-4 shadow-xl shadow-black/15 sm:p-5', className)}>
      {children}
    </div>
  )
}

function Title({ icon: Icon, label }: { icon: typeof Target; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-cyan-200" />
      <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-400">{label}</p>
    </div>
  )
}

function ActionPill({ icon: Icon, label }: { icon: typeof Target; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-xs font-black text-zinc-300">
      <Icon className="h-3.5 w-3.5 text-cyan-200" />
      {label}
    </span>
  )
}

function QuickAction({
  icon: Icon,
  title,
  value,
  accent,
  onClick,
}: {
  icon: typeof Target
  title: string
  value: string
  accent: 'cyan' | 'emerald' | 'amber' | 'violet'
  onClick: () => void
}) {
  const colors = {
    cyan: 'text-cyan-200 border-cyan-300/25 hover:border-cyan-300/50',
    emerald: 'text-emerald-200 border-emerald-300/25 hover:border-emerald-300/50',
    amber: 'text-amber-200 border-amber-300/25 hover:border-amber-300/50',
    violet: 'text-violet-200 border-violet-300/25 hover:border-violet-300/50',
  }
  return (
    <button onClick={onClick} className={cn('rounded-lg border bg-white/[0.035] p-4 text-left transition', colors[accent])}>
      <Icon className="mb-4 h-5 w-5" />
      <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">{title}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </button>
  )
}

function CalorieDial({ remaining, consumed }: { remaining: number; consumed: number }) {
  const progress = percent(consumed, targets.calories)
  return (
    <button className="relative grid h-40 w-40 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/40">
      <div
        className="absolute inset-3 rounded-lg"
        style={{
          background: `conic-gradient(#67e8f9 ${progress}%, rgba(255,255,255,0.08) ${progress}% 100%)`,
        }}
      />
      <div className="relative grid h-28 w-28 place-items-center rounded-lg bg-[#060808] text-center">
        <div>
          <p className="text-3xl font-black">{Math.max(0, remaining)}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">left</p>
        </div>
      </div>
    </button>
  )
}

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <button className="w-full text-left">
      <div className="mb-1 flex justify-between text-xs font-black uppercase tracking-wider text-zinc-400">
        <span>{label}</span>
        <span>{value}/{target}g</span>
      </div>
      <div className="h-3 overflow-hidden rounded-lg bg-white/10">
        <div className={cn('h-full transition-all', color)} style={{ width: `${percent(value, target)}%` }} />
      </div>
    </button>
  )
}

function MorningField({ label, suffix, value, onChange }: { label: string; suffix: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="rounded-lg border border-white/10 bg-black/30 p-4">
      <span className="text-xs font-black uppercase tracking-widest text-zinc-500">{label}</span>
      <div className="mt-2 flex items-center gap-2">
        <input value={value} onChange={(event) => onChange(event.target.value)} type="number" className="min-w-0 flex-1 bg-transparent text-2xl font-black outline-none" placeholder="0" />
        <span className="text-sm font-black text-zinc-500">{suffix}</span>
      </div>
    </label>
  )
}

function SliderField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="rounded-lg border border-white/10 bg-black/30 p-4">
      <span className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-zinc-500">
        {label}
        <span className="text-cyan-200">{value}</span>
      </span>
      <input
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        type="range"
        className="mt-4 w-full accent-cyan-300"
      />
    </label>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <button className="rounded-lg border border-white/10 bg-black/30 p-3 text-left">
      <Icon className="mb-3 h-4 w-4 text-cyan-200" />
      <p className="text-xs font-black uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </button>
  )
}
