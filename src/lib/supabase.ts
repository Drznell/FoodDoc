import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseAnonKey || 'missing-local-supabase-anon-key'
)

export type Profile = {
  id: string
  full_name: string
  age: number
  weight: number
  height: number
  goal: 'lose_weight' | 'gain_muscle' | 'eat_healthy' | 'manage_condition'
  created_at: string
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
