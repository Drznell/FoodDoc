import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MealLog, Profile } from '../types/index'
import { Trash2, TrendingUp } from 'lucide-react'

const DAILY_TARGETS = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 65,
  iron: 18,
  folate: 400,
  zinc: 11,
}

function ProgressBar({ value, target, color }: { value: number; target: number; color: string }) {
  const pct = Math.min(Math.round((value / target) * 100), 100)
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1.5">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function Dashboard() {
  const [meals, setMeals] = useState<MealLog[]>([])
  const [todayMeals, setTodayMeals] = useState<MealLog[]>([])
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (profileData) setProfile(profileData)

    const { data: allMeals } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(50)

    if (allMeals) {
      setMeals(allMeals)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      setTodayMeals(allMeals.filter(m => new Date(m.logged_at) >= today))
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('meal_logs').delete().eq('id', id)
    setMeals(prev => prev.filter(m => m.id !== id))
    setTodayMeals(prev => prev.filter(m => m.id !== id))
    setDeleting(null)
  }

  const todayTotals = todayMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
      iron: acc.iron + (meal.iron || 0),
      folate: acc.folate + (meal.folate || 0),
      zinc: acc.zinc + (meal.zinc || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, iron: 0, folate: 0, zinc: 0 }
  )

  const caloriesLeft = Math.max(DAILY_TARGETS.calories - Math.round(todayTotals.calories), 0)
  const firstName = profile.full_name?.split(' ')[0] || 'there'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-primary text-white px-6 pt-10 pb-10">
        <p className="text-green-100 text-sm">Hello, {firstName} 👋</p>
        <h1 className="text-2xl font-bold mt-1">Your Dashboard</h1>

        <div className="mt-5 bg-white/15 rounded-2xl p-4 text-center">
          <p className="text-green-100 text-xs uppercase font-semibold mb-1">Calories Remaining Today</p>
          <p className="text-5xl font-bold">{caloriesLeft}</p>
          <p className="text-green-100 text-xs mt-1">
            {DAILY_TARGETS.calories} target − {Math.round(todayTotals.calories)} eaten
          </p>
          <div className="w-full bg-white/20 rounded-full h-2 mt-3">
            <div
              className="h-2 rounded-full bg-white transition-all duration-500"
              style={{ width: `${Math.min((todayTotals.calories / DAILY_TARGETS.calories) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-2 space-y-4">

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-4">Today's Macros</p>
          <div className="space-y-4">
            {[
              { label: 'Protein', value: Math.round(todayTotals.protein), target: DAILY_TARGETS.protein, unit: 'g', color: 'bg-blue-500' },
              { label: 'Carbohydrates', value: Math.round(todayTotals.carbs), target: DAILY_TARGETS.carbs, unit: 'g', color: 'bg-yellow-500' },
              { label: 'Fat', value: Math.round(todayTotals.fat), target: DAILY_TARGETS.fat, unit: 'g', color: 'bg-red-400' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {item.value}{item.unit}
                    <span className="text-gray-400 font-normal"> / {item.target}{item.unit}</span>
                  </span>
                </div>
                <ProgressBar value={item.value} target={item.target} color={item.color} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-primary" />
            <p className="text-xs font-semibold text-gray-500 uppercase">Micronutrients</p>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Iron', value: Math.round(todayTotals.iron * 10) / 10, target: DAILY_TARGETS.iron, unit: 'mg', color: 'bg-red-500' },
              { label: 'Folate', value: Math.round(todayTotals.folate), target: DAILY_TARGETS.folate, unit: 'mcg', color: 'bg-purple-500' },
              { label: 'Zinc', value: Math.round(todayTotals.zinc * 10) / 10, target: DAILY_TARGETS.zinc, unit: 'mg', color: 'bg-teal-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {item.value}{item.unit}
                    <span className="text-gray-400 font-normal"> / {item.target}{item.unit}</span>
                  </span>
                </div>
                <ProgressBar value={item.value} target={item.target} color={item.color} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'today' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'
              }`}
            >
              Today ({todayMeals.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'
              }`}
            >
              History
            </button>
          </div>

          <div className="p-5">
            {activeTab === 'today' && (
              todayMeals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">🍽️</p>
                  <p className="text-gray-500 text-sm">No meals logged today yet.</p>
                  <p className="text-gray-400 text-xs mt-1">Go to Analyse to log your first meal!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayMeals.map(meal => (
                    <div key={meal.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{meal.meal_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(meal.logged_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-orange-500 text-sm">{meal.calories} kcal</p>
                        <p className="text-xs text-gray-400">{meal.protein}g protein</p>
                      </div>
                      <button
                        onClick={() => handleDelete(meal.id)}
                        disabled={deleting === meal.id}
                        className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'history' && (
              meals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">📋</p>
                  <p className="text-gray-500 text-sm">No meals logged yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {meals.map(meal => (
                    <div key={meal.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{meal.meal_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(meal.logged_at).toLocaleDateString('en-NG', {
                            weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-orange-500 text-sm">{meal.calories} kcal</p>
                        <p className="text-xs text-gray-400">{meal.protein}g protein</p>
                      </div>
                      <button
                        onClick={() => handleDelete(meal.id)}
                        disabled={deleting === meal.id}
                        className="text-gray-300 hover:text-red-400 transition-colors p-1 shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
