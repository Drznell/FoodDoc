export type Goal = 'lose_weight' | 'gain_muscle' | 'eat_healthy' | 'manage_condition'

export type Language = 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo'

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
  language: Language
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
  language: Language
  logged_at: string
}

export type Profile = {
  id: string
  full_name: string
  age: number
  weight: number
  height: number
  goal: Goal
  preferred_language: Language
  created_at: string
}
