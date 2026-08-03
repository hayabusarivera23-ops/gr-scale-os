export const HARD_FLOOR_LB = 142
export const PERFORMANCE_RANGE = { low: 144, high: 148 }
export const UNDER_FUELED_CALORIES_BY_8PM = 2200

export function parseWeightLb(value?: string | number | null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function isBelowHardFloor(value?: string | number | null) {
  const weight = parseWeightLb(value)
  return weight !== null && weight < HARD_FLOOR_LB
}

export function weightGuardMessage(value?: string | number | null) {
  const weight = parseWeightLb(value)
  if (weight === null) return null
  if (weight < HARD_FLOOR_LB) {
    return 'Below floor. This is a parent, coach, doctor, and official certification conversation. Gio OS will only recommend fueling, hydration, recovery, and safety.'
  }
  if (weight < PERFORMANCE_RANGE.low) {
    return 'Below the off-season performance range. Fuel up, hydrate, and protect training quality.'
  }
  if (weight <= PERFORMANCE_RANGE.high) {
    return 'In the off-season performance range. Hold steady, fuel training, and get stronger.'
  }
  return 'Above the off-season range. Adjust slowly through habits, never dehydration or skipped meals.'
}

export function underFueledMessage(calories: number, hour = new Date().getHours()) {
  if (hour < 20 || calories >= UNDER_FUELED_CALORIES_BY_8PM) return null
  return "You're under-fueled for an athlete. Add a real meal with protein, carbs, and steady water."
}
