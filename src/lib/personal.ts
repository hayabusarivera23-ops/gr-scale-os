export type TrainingDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export interface PersonalAgent {
  id: string
  name: string
  role: string
  lane: 'Business' | 'Personal'
  mode: 'Auto low-risk' | 'Draft only' | 'Needs approval'
  schedule: string
  mission: string
}

export interface TrainingBlock {
  day: TrainingDay
  title: string
  time: string
  focus: string
  intensity: 'Low' | 'Medium' | 'High'
}

export interface FastFoodGuide {
  place: string
  bestOrder: string
  backupOrder: string
  avoid: string
}

export interface GroceryItem {
  name: string
  category: 'Protein' | 'Carbs' | 'Fruit/Veg' | 'Fats' | 'Drink' | 'Other'
  amount?: string
  note?: string
}

export interface DailyGrowthLog {
  date: string
  weight?: string
  sleep?: string
  energy?: string
  soreness?: string
  mood?: string
  injury?: string
  pushups?: string
  pullups?: string
  squats?: string
  plank?: string
  conditioning?: string
  workout?: string
  appleActiveCalories?: string
  appleWorkoutMinutes?: string
  appleAvgHr?: string
  appleRestingHr?: string
  meals?: string
  faith?: string
  businessWin?: string
}

export interface WorkoutPlan {
  name: string
  duration: string
  focus: string
  warmup: string[]
  work: string[]
  finisher: string
}

export interface BodyTip {
  title: string
  body: string
}

export interface WeeklyGymDay {
  day: TrainingDay
  title: string
  location: 'Gym' | 'Wrestling' | 'Home' | 'Recovery'
  focus: string
  plan: string[]
}

export const PERSONAL_PROFILE = {
  name: 'Gio',
  age: 16,
  nextBirthday: 'August 22',
  height: '6 ft',
  weight: '145 lb',
  sport: 'Wrestling',
  currentTarget: '144-148 off-season',
  seasonTarget: 'School-certified season weight only',
  goals: ['hold 144-148', 'build wrestling strength', 'agility', 'flexibility', 'lean muscle', 'faith', 'discipline'],
  nutritionGuardrail:
    'Performance first: hold 144-148, fuel training, never use dehydration or skipped meals, and get parent/coach/doctor guidance for any weight-class decision.',
}

export const TRAINING_WEEK: TrainingBlock[] = [
  { day: 'Monday', title: 'Strength Build', time: 'Flexible', focus: 'Full body strength, pull-ups, push, hinge, core', intensity: 'High' },
  { day: 'Tuesday', title: 'Wrestling Practice', time: '6:00 PM - 8:00 PM', focus: 'Skill, conditioning, live rounds', intensity: 'High' },
  { day: 'Wednesday', title: 'Power + Mobility', time: 'Flexible', focus: 'Explosive strength, shoulders, hips, neck, recovery', intensity: 'Medium' },
  { day: 'Thursday', title: 'Wrestling Practice', time: '6:00 PM - 8:00 PM', focus: 'Technique, pace, mat conditioning', intensity: 'High' },
  { day: 'Friday', title: 'Optional Lift or Practice', time: 'TBD', focus: 'Short strength session if recovered; skip if practice is hard', intensity: 'Medium' },
  { day: 'Saturday', title: 'Strength Test + Accessories', time: 'Flexible', focus: 'Pull-ups, push-ups, legs, grip, trunk', intensity: 'Medium' },
  { day: 'Sunday', title: 'Wrestling Practice', time: '2:00 PM - 4:00 PM', focus: 'Skill reps and weekly reset', intensity: 'High' },
]

export const WEEKLY_GYM_PLAN: WeeklyGymDay[] = [
  {
    day: 'Monday',
    title: 'Lower Strength',
    location: 'Gym',
    focus: 'Leg drive, hips, posterior chain, trunk.',
    plan: [
      'Warm-up: bike 5 min, hip openers, bodyweight squats',
      'Squat, goblet squat, or leg press: 4x6',
      'Romanian deadlift: 3x8',
      'Walking lunge: 3x10/leg',
      'Calf raises: 3x15',
      'Planks: 3x45 sec',
    ],
  },
  {
    day: 'Tuesday',
    title: 'Wrestling Practice',
    location: 'Wrestling',
    focus: 'Skill, conditioning, live rounds.',
    plan: ['Fuel before practice', 'Hydrate early', 'Log weight/energy after', 'Recover with protein + carbs'],
  },
  {
    day: 'Wednesday',
    title: 'Upper Strength',
    location: 'Gym',
    focus: 'Push, pull, shoulders, grip.',
    plan: [
      'Warm-up: band work, push-up ramp, shoulder circles',
      'Push-ups weighted or bench: 4x8',
      'Rows, dumbbell rows, or backpack rows: 4x8',
      'Overhead press: 3x8',
      'Pull-ups: 3xAMRAP',
      'Farmer carries: 3x40 yd',
    ],
  },
  {
    day: 'Thursday',
    title: 'Wrestling Practice + Recovery',
    location: 'Wrestling',
    focus: 'Technique, pace, mat conditioning, then serious recovery.',
    plan: ['Carbs before practice', 'Water target before 4 PM', 'Post-practice protein + carbs', '10 min stretch', 'In bed by 10 if possible'],
  },
  {
    day: 'Friday',
    title: 'Full Body Power',
    location: 'Gym',
    focus: 'Explosiveness, power, grip, sprint output.',
    plan: [
      'Warm-up: jump rope or treadmill walk 5 min',
      'Trap bar or kettlebell deadlift: 4x5',
      'Dumbbell push press: 3x6',
      'Med-ball slams: 3x10',
      'Sled push, hill sprint, or bike sprint: 5 rounds',
      'Core finisher: dead bug + side plank',
    ],
  },
  {
    day: 'Saturday',
    title: 'Live Wrestling or Shadow/Core',
    location: 'Home',
    focus: 'Open mat if available. If not, movement and core.',
    plan: [
      'Open mat or live wrestling if available',
      'If not: shadow wrestling 30 min',
      'Core circuit: V-ups, Russian twists, back extensions',
      'Long mobility: hips, hamstrings, shoulders',
    ],
  },
  {
    day: 'Sunday',
    title: 'Wrestling Practice + Weekly Reset',
    location: 'Wrestling',
    focus: 'Practice 2-4 PM, then reset the week.',
    plan: ['Eat breakfast', 'Light lunch before practice', 'Recover after practice', 'Review average weight/workouts/protein', 'Plan school/business/training week'],
  },
]

export const AGENT_ROSTER: PersonalAgent[] = [
  {
    id: 'growth-manager',
    name: 'Growth Manager',
    role: 'Chooses the highest-profit move for GR Scale each day.',
    lane: 'Business',
    mode: 'Auto low-risk',
    schedule: 'Daily morning brief',
    mission: 'Prioritize HVAC profit, pipeline, and what needs approval.',
  },
  {
    id: 'hvac-lead-finder',
    name: 'HVAC Lead Finder',
    role: 'Finds HVAC businesses with weak websites and strong buying signals.',
    lane: 'Business',
    mode: 'Auto low-risk',
    schedule: 'Daily lead batch',
    mission: 'Prepare lead lists and research. Do not contact without approval.',
  },
  {
    id: 'audit-builder',
    name: 'Audit Builder',
    role: 'Turns a lead website into a clear audit and offer angle.',
    lane: 'Business',
    mode: 'Auto low-risk',
    schedule: 'After new leads arrive',
    mission: 'Draft audits, identify conversion issues, and prepare demo ideas.',
  },
  {
    id: 'outreach-writer',
    name: 'Outreach Writer',
    role: 'Writes emails, texts, call scripts, and follow-ups.',
    lane: 'Business',
    mode: 'Needs approval',
    schedule: 'Daily',
    mission: 'Draft messages only. Sending requires Gio approval.',
  },
  {
    id: 'website-builder',
    name: 'Website Builder',
    role: 'Builds demos, landing pages, and client site changes.',
    lane: 'Business',
    mode: 'Needs approval',
    schedule: 'On work order',
    mission: 'Prepare changes and previews. Publishing public changes requires approval.',
  },
  {
    id: 'sales-manager',
    name: 'Sales Manager',
    role: 'Tracks follow-ups, proposals, and close-ready opportunities.',
    lane: 'Business',
    mode: 'Auto low-risk',
    schedule: 'Afternoon check',
    mission: 'Report closest-to-cash items and draft approval requests.',
  },
  {
    id: 'finance-tracker',
    name: 'Finance Tracker',
    role: 'Watches Stripe, payment links, revenue goals, and close rate.',
    lane: 'Business',
    mode: 'Auto low-risk',
    schedule: 'Daily evening',
    mission: 'Track numbers. Never move money or change bank settings.',
  },
  {
    id: 'strength-coach',
    name: 'Strength Coach',
    role: 'Plans safe strength work around wrestling.',
    lane: 'Personal',
    mode: 'Auto low-risk',
    schedule: 'Training days',
    mission: 'Adjust workouts from soreness, practice load, and recovery.',
  },
  {
    id: 'nutrition-coach',
    name: 'Nutrition Coach',
    role: 'Builds meal options from groceries, training, and schedule.',
    lane: 'Personal',
    mode: 'Auto low-risk',
    schedule: 'Every morning and pre-practice',
    mission: 'Fuel performance, keep protein high, and avoid unsafe weight drops.',
  },
  {
    id: 'recovery-coach',
    name: 'Recovery Coach',
    role: 'Tracks sleep, soreness, calories burned, and readiness.',
    lane: 'Personal',
    mode: 'Auto low-risk',
    schedule: 'Nightly',
    mission: 'Use logs now; connect Garmin data later when available.',
  },
  {
    id: 'faith-coach',
    name: 'Faith Coach',
    role: 'Gives a daily verse, prayer, and discipline reflection.',
    lane: 'Personal',
    mode: 'Auto low-risk',
    schedule: 'Morning and night',
    mission: 'Keep faith practical: discipline, humility, peace, purpose.',
  },
  {
    id: 'schedule-coach',
    name: 'Schedule Coach',
    role: 'Combines school, business, workouts, meals, and rest.',
    lane: 'Personal',
    mode: 'Auto low-risk',
    schedule: 'Daily',
    mission: 'Create a realistic day plan and flag overload.',
  },
]

export const DEFAULT_GROCERIES: GroceryItem[] = [
  { name: 'bananas', category: 'Fruit/Veg', amount: '3' },
  { name: "Nature's Own bread", category: 'Carbs', amount: '2 packs' },
  { name: 'Kirkland chicken breasts', category: 'Protein', amount: '1 big pack' },
  { name: 'Kirkland chicken breast chunks', category: 'Protein', amount: '2 bags' },
  { name: 'chicken fried rice meals', category: 'Carbs', amount: '4 bags, 9 oz each' },
  { name: 'Premier Protein shakes', category: 'Protein', amount: '28' },
  { name: 'peanut butter', category: 'Fats', amount: '4 jars' },
  { name: 'Kirkland tuna packets', category: 'Protein', amount: '30, 42 g each' },
  { name: 'Kirkland soft and chewy granola bars', category: 'Carbs', amount: '50' },
  { name: 'Carb Balance tortillas', category: 'Carbs', note: 'Good wrap option with eggs, chicken, tuna, or cheese.' },
  { name: 'Special K cereal', category: 'Carbs' },
  { name: 'Cheerios', category: 'Carbs' },
  { name: 'Celsius Tropical Vibe energy packets', category: 'Drink' },
  { name: 'Propel Energy Boost packets', category: 'Drink' },
  { name: 'Crystal Light zero sugar', category: 'Drink' },
  { name: 'eggs', category: 'Protein', amount: '48' },
  { name: 'cheese slices', category: 'Protein', amount: 'many' },
  { name: 'milk', category: 'Drink', amount: '1 gallon' },
  { name: 'Kate Farms shakes', category: 'Protein', amount: '4 boxes', note: 'Use as backup calories if you need easy fuel.' },
]

export function groceryTextFromDefaults() {
  return DEFAULT_GROCERIES.map(item => item.amount ? `${item.amount} ${item.name}` : item.name).join(', ')
}

export const FAST_FOOD_GUIDES: FastFoodGuide[] = [
  {
    place: 'Wawa',
    bestOrder: 'Chicken bowl or hoagie bowl with double protein, rice or potatoes, veggies, light sauce, water.',
    backupOrder: 'Turkey or chicken hoagie, fruit, water. Add milk or yogurt if you need more calories.',
    avoid: 'Huge sugary drinks, fried sides as the main meal, and skipping protein before practice.',
  },
  {
    place: 'Chick-fil-A',
    bestOrder: 'Grilled nuggets or grilled sandwich, fruit cup, water. Add a second protein if it is a heavy training day.',
    backupOrder: 'Regular sandwich plus fruit when grilled is not realistic.',
    avoid: 'Making fries and sauce the whole meal before training.',
  },
  {
    place: 'Chipotle',
    bestOrder: 'Bowl with chicken, rice, beans, fajita veggies, salsa, lettuce, and light cheese.',
    backupOrder: 'Two tacos with chicken, beans, salsa, and water.',
    avoid: 'Double sour cream/queso when you need to feel light for practice.',
  },
]

export function verseOfTheDay() {
  const verses = [
    { ref: 'Proverbs 21:5', text: 'The plans of the diligent lead surely to abundance.' },
    { ref: '1 Corinthians 9:24', text: 'Run in such a way as to get the prize.' },
    { ref: 'Isaiah 40:31', text: 'Those who hope in the Lord will renew their strength.' },
    { ref: 'Colossians 3:23', text: 'Whatever you do, work at it with all your heart.' },
    { ref: '2 Timothy 1:7', text: 'God gave us a spirit not of fear but of power, love, and self-control.' },
  ]
  const day = Math.floor(Date.now() / 86400000)
  return verses[day % verses.length]
}

export function bodyTipOfTheDay(): BodyTip {
  const tips = [
    {
      title: 'Hydration changes performance fast',
      body: 'Even small dehydration can make wrestling feel harder. Use water through the day, then add extra before and after hard practice.',
    },
    {
      title: 'Carbs are not the enemy',
      body: 'For wrestling, carbs are fuel. Put bread, rice, cereal, banana, or granola closer to training so your gas tank is not empty.',
    },
    {
      title: 'Protein works best when repeated',
      body: 'One huge protein meal is not as useful as protein spread across breakfast, lunch, pre/post practice, and dinner.',
    },
    {
      title: 'Sleep is the growth multiplier',
      body: 'Strength, reaction time, discipline, and hunger control all get worse when sleep is low. Track it like a lift.',
    },
    {
      title: 'Recovery is still training',
      body: 'A recovery day done right helps you train harder tomorrow. Mobility, food, hydration, and sleep count.',
    },
  ]
  const day = Math.floor(Date.now() / 86400000)
  return tips[day % tips.length]
}

export function readinessScore(log: DailyGrowthLog, hasPractice: boolean) {
  const energy = Number(log.energy || 0)
  const sleep = Number(log.sleep || 0)
  const soreness = Number(log.soreness || 0)
  let score = 62
  if (energy >= 8) score += 18
  else if (energy >= 6) score += 10
  else if (energy > 0) score -= 8
  if (sleep >= 8) score += 15
  else if (sleep >= 7) score += 8
  else if (sleep > 0) score -= 10
  if (log.meals) score += 5
  if (log.faith) score += 4
  if (soreness >= 8) score -= 12
  else if (soreness >= 6) score -= 6
  if (hasPractice) score -= 4
  return Math.max(35, Math.min(98, score))
}

export function waterTargetOz(hasPractice: boolean, extraTrainingMinutes = 0) {
  const baseline = 128
  const trainingExtra = hasPractice ? 16 : 0
  const extra = Math.min(24, Math.max(0, Math.round(extraTrainingMinutes / 30) * 8))
  return baseline + trainingExtra + extra
}

export function workoutFor(mode: 'Gym' | 'Home' | 'Recovery', minutes: string, note: string): WorkoutPlan {
  const short = minutes === '25'
  const long = minutes === '75'
  const lowerNote = note.toLowerCase()
  const sore = lowerNote.includes('sore') || lowerNote.includes('tired') || lowerNote.includes('beat')

  if (mode === 'Recovery' || sore) {
    return {
      name: 'Recovery Protocol',
      duration: short ? '20-25 min' : '30-40 min',
      focus: 'Move blood, restore hips/shoulders/neck, leave better than you arrived.',
      warmup: ['5 min easy walk or bike', 'Neck circles and shoulder CARs', 'Hip openers and ankle rocks'],
      work: ['3 rounds: dead bug x10/side, glute bridge x15, scap push-up x12', 'Couch stretch 60 sec/side', 'Deep squat breathing 2 min'],
      finisher: 'Cold shower or 5 quiet minutes breathing through the nose.',
    }
  }

  if (mode === 'Home') {
    return {
      name: 'Home Wrestler Strength',
      duration: short ? '25 min' : long ? '60-75 min' : '40-45 min',
      focus: 'Push-ups, pull-ups, legs, core, and grip without frying practice.',
      warmup: ['Jumping jacks x60 sec', 'Wrist prep x60 sec', 'World greatest stretch x4/side'],
      work: short
        ? ['4 rounds: push-ups x8-12, pull-ups x3-5, split squats x10/side, plank x40 sec']
        : ['5 rounds: push-ups x8-12, pull-ups x3-6, tempo squats x15, towel grip hang 20 sec', 'Core: hollow hold 3x25 sec, side plank 3x25 sec/side'],
      finisher: 'Beat yesterday by one perfect rep, not sloppy reps.',
    }
  }

  return {
    name: 'Gym Strength for Wrestling',
    duration: short ? '30 min' : long ? '70-80 min' : '50-60 min',
    focus: 'Total body strength: legs, pulls, push, trunk, grip.',
    warmup: ['5 min bike or incline walk', 'Hip openers x8/side', 'Band pull-aparts x20', '2 light ramp-up sets'],
    work: short
      ? ['Trap bar deadlift or squat 3x5', 'Dumbbell bench 3x8', 'Lat pulldown or assisted pull-up 3x8', 'Farmer carry 4 trips']
      : ['Squat or trap bar deadlift 4x5', 'Dumbbell bench 4x8', 'Row 4x10', 'Romanian deadlift 3x8', 'Pull-ups/assisted pull-ups 4 sets', 'Farmer carry 5 trips'],
    finisher: 'Leave with one rep in the tank. Wrestling needs power, not destroyed legs.',
  }
}

export function mealIdeasFromGroceries(groceries: string) {
  const text = groceries.toLowerCase()
  const has = (word: string) => text.includes(word)
  const ideas = []

  if (has('egg')) ideas.push('Eggs, toast, banana, and milk. Good morning meal or post-practice recovery.')
  if (has('chicken breast') || has('chicken breasts')) ideas.push('Chicken breast sandwich with cheese plus a banana or milk.')
  if (has('chicken chunks')) ideas.push('Chicken chunks over fried rice. Add water or Propel if it is a practice day.')
  if (has('fried rice')) ideas.push('Chicken fried rice meal plus extra chicken if you need more protein.')
  if (has('tuna')) ideas.push('Tuna sandwich with cheese. Add milk if you need more calories.')
  if (has('tortilla')) ideas.push('Carb Balance tortilla wrap with eggs, chicken, tuna, or cheese. Easy high-protein meal.')
  if (has('protein shake') || has('premier')) ideas.push('Premier Protein shake plus granola bar when you need fast protein.')
  if (has('peanut butter')) ideas.push('Peanut butter toast with milk. Use as a calorie booster, not the whole meal.')
  if (has('cereal') || has('special k') || has('cheerios')) ideas.push('Cereal with milk plus eggs or a protein shake so it is not just carbs.')
  if (has('beef') || has('turkey')) ideas.push('Lean meat bowl with rice/potatoes and vegetables.')

  if (ideas.length === 0) {
    ideas.push('Build a plate: protein first, carb for training fuel, fruit/vegetable, water.')
    ideas.push('If groceries are low, choose Wawa double-protein bowl or chicken hoagie bowl.')
  }

  return ideas.slice(0, 4)
}

export function defaultDayPlan() {
  return [
    {
      label: 'Breakfast',
      meal: '3 eggs, 2 slices toast with peanut butter, banana, and milk',
      purpose: 'Big fuel to hold weight range and build strength.',
    },
    {
      label: 'Snack',
      meal: 'Granola bar plus Premier Protein shake',
      purpose: 'Easy calories and protein so you do not under-eat.',
    },
    {
      label: 'Lunch',
      meal: '2 Carb Balance tortillas with chicken chunks and cheese',
      purpose: 'Fast high-protein quesadilla or wrap from your groceries.',
    },
    {
      label: 'Pre-workout',
      meal: 'Banana plus peanut butter 30-60 minutes before training',
      purpose: 'Carbs plus calories so the gym does not drain you.',
    },
    {
      label: 'Dinner',
      meal: 'Chicken breast or chunks, fried rice meal, and milk',
      purpose: 'Recovery fuel: protein, carbs, fluids, and salt.',
    },
  ]
}

export function tomorrowProtocol() {
  return [
    {
      time: '7:30 AM',
      title: 'Wake + weigh-in',
      action: 'Bathroom, weigh in, log sleep/energy, drink water. No panic from one number.',
    },
    {
      time: '8:00 AM',
      title: 'Breakfast',
      action: '3 eggs, 2 slices toast with peanut butter, banana, and milk.',
    },
    {
      time: '10:30 AM',
      title: 'Snack',
      action: 'Granola bar plus Premier Protein shake. Keep calories up so strength climbs.',
    },
    {
      time: '11:30 AM',
      title: 'Lunch',
      action: '2 Carb Balance tortillas with chicken chunks and cheese. Add Crystal Light or water.',
    },
    {
      time: '2:30 PM',
      title: 'Gym prep',
      action: 'Banana plus peanut butter. Choose Gym mode and 45 minutes unless readiness is low.',
    },
    {
      time: 'After gym',
      title: 'Recovery meal',
      action: 'Premier Protein or Kate Farms shake, then chicken breast or chunks with fried rice for dinner.',
    },
    {
      time: 'Night',
      title: 'Faith + reset',
      action: 'Journal one prayer, one lesson, one win, and one fix for tomorrow.',
    },
  ]
}
