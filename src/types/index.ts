export type Goal = 'lose_weight' | 'gain_muscle' | 'eat_healthy' | 'manage_condition'

export type NutritionResult = {
  meal_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  iron: number
  folate: number
  zinc: number
  ai_advice: string
}

export type MealLog = {
  id: string
  user_id: string
  meal_name: string
  meal_description: string
  image_url?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  iron: number
  folate: number
  zinc: number
  ai_advice: string
  logged_at: string
}

export type Profile = {
  id: string
  full_name: string
  age: number
  weight: number
  height: number
  goal: Goal
  created_at: string
}
