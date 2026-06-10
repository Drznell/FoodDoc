import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MealLog } from '../types/index'

export default function Dashboard() {
  const [meals, setMeals] = useState<MealLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMeals() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(20)
      if (data) setMeals(data)
      setLoading(false)
    }
    fetchMeals()
  }, [])

  const totals = meals.slice(0, 3).reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-primary text-white px-6 pt-10 pb-8">
        <h1 className="text-2xl font-bold">Your Dashboard</h1>
        <p className="text-green-100 text-sm mt-1">Today's nutrition at a glance</p>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-4 space-y-4">

        {/* Today's summary */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Last 3 Meals Summary</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'kcal', value: Math.round(totals.calories), color: 'text-orange-500' },
              { label: 'Protein', value: `${Math.round(totals.protein)}g`, color: 'text-blue-500' },
              { label: 'Carbs', value: `${Math.round(totals.carbs)}g`, color: 'text-yellow-500' },
              { label: 'Fat', value: `${Math.round(totals.fat)}g`, color: 'text-red-400' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Meal history */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Meal History</p>
          {meals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="text-gray-500 text-sm">No meals logged yet.</p>
              <p className="text-gray-400 text-xs mt-1">Go to Analyse to log your first meal!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map(meal => (
                <div key={meal.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{meal.meal_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(meal.logged_at).toLocaleDateString('en-NG', {
                        weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-500 text-sm">{meal.calories} kcal</p>
                    <p className="text-xs text-gray-400">{meal.protein}g protein</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}