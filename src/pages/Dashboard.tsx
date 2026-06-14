import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MealLog, Profile } from '../types/index'
import { Trash2, TrendingUp, Flame } from 'lucide-react'

const DAILY_TARGETS = {
  calories: 2000,
  protein: 50,
  carbs: 275,
  fat: 65,
  iron: 18,
  folate: 400,
  zinc: 11,
}

function CircleRing({ value, target, color, label, unit }: {
  value: number; target: number; color: string; label: string; unit: string
}) {
  const pct = Math.min((value / target) * 100, 100)
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          <circle
            cx="36" cy="36" r={r} fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-white">{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-white">{Math.round(value)}{unit}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function MicroBar({ label, value, target, unit, color }: {
  label: string; value: number; target: number; unit: string; color: string
}) {
  const pct = Math.min((value / target) * 100, 100)
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-medium text-white">
          {Math.round(value * 10) / 10}{unit}
          <span className="text-gray-600"> / {target}{unit}</span>
        </span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
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

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profileData) setProfile(profileData)

    const { data: allMeals } = await supabase
      .from('meal_logs').select('*').eq('user_id', user.id)
      .order('logged_at', { ascending: false }).limit(50)

    if (allMeals) {
      setMeals(allMeals)
      const today = new Date(); today.setHours(0, 0, 0, 0)
      setTodayMeals(allMeals.filter(m => new Date(m.logged_at) >= today))
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('meal_logs').delete().eq('id', id)
    setMeals(p => p.filter(m => m.id !== id))
    setTodayMeals(p => p.filter(m => m.id !== id))
    setDeleting(null)
  }

  const t = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      iron: acc.iron + (m.iron || 0),
      folate: acc.folate + (m.folate || 0),
      zinc: acc.zinc + (m.zinc || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, iron: 0, folate: 0, zinc: 0 }
  )

  const caloriesLeft = Math.max(DAILY_TARGETS.calories - Math.round(t.calories), 0)
  const firstName = profile.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div className="ambient-bg min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="ambient-bg min-h-screen pb-28">
      <div className="content-layer max-w-md mx-auto px-5 pt-12 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">{greeting},</p>
            <h1 className="text-2xl font-bold text-white">{firstName} 👋</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{firstName[0]?.toUpperCase()}</span>
          </div>
        </div>

        {/* Calories hero card */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={14} className="text-primary" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Daily Calories</p>
          </div>
          <div className="flex items-end gap-3 mb-4">
            <span className="text-6xl font-bold text-white leading-none">{caloriesLeft}</span>
            <div className="pb-1">
              <p className="text-gray-400 text-xs">remaining</p>
              <p className="text-gray-500 text-xs">{Math.round(t.calories)} of {DAILY_TARGETS.calories} eaten</p>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((t.calories / DAILY_TARGETS.calories) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #26B160, #4ade80)'
              }}
            />
          </div>
        </div>

        {/* Macro rings */}
        <div className="glass rounded-3xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">Macros</p>
          <div className="flex justify-around">
            <CircleRing value={t.protein} target={DAILY_TARGETS.protein} color="#60a5fa" label="Protein" unit="g" />
            <CircleRing value={t.carbs} target={DAILY_TARGETS.carbs} color="#fbbf24" label="Carbs" unit="g" />
            <CircleRing value={t.fat} target={DAILY_TARGETS.fat} color="#f87171" label="Fat" unit="g" />
          </div>
        </div>

        {/* Micronutrients */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-primary" />
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Micronutrients</p>
          </div>
          <div className="space-y-4">
            <MicroBar label="Iron" value={t.iron} target={DAILY_TARGETS.iron} unit="mg" color="#ef4444" />
            <MicroBar label="Folate" value={t.folate} target={DAILY_TARGETS.folate} unit="mcg" color="#a855f7" />
            <MicroBar label="Zinc" value={t.zinc} target={DAILY_TARGETS.zinc} unit="mg" color="#14b8a6" />
          </div>
        </div>

        {/* Meal log */}
        <div className="glass rounded-3xl overflow-hidden">
          <div className="flex border-b border-white/5">
            {(['today', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-gray-500'
                }`}
              >
                {tab === 'today' ? `Today (${todayMeals.length})` : 'History'}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'today' && (
              todayMeals.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-3">🍽️</p>
                  <p className="text-gray-400 text-sm">No meals logged today</p>
                  <p className="text-gray-600 text-xs mt-1">Tap Analyse to log your first meal</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayMeals.map(meal => (
                    <div key={meal.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm">🍛</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{meal.meal_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(meal.logged_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary text-sm">{meal.calories} kcal</p>
                        <p className="text-xs text-gray-500">{meal.protein}g protein</p>
                      </div>
                      <button
                        onClick={() => handleDelete(meal.id)}
                        disabled={deleting === meal.id}
                        className="text-gray-700 hover:text-red-400 transition-colors p-1 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
            {activeTab === 'history' && (
              meals.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-3">📋</p>
                  <p className="text-gray-400 text-sm">No meals logged yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {meals.map(meal => (
                    <div key={meal.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm">🍛</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{meal.meal_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(meal.logged_at).toLocaleDateString('en-NG', {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary text-sm">{meal.calories} kcal</p>
                        <p className="text-xs text-gray-500">{meal.protein}g protein</p>
                      </div>
                      <button
                        onClick={() => handleDelete(meal.id)}
                        disabled={deleting === meal.id}
                        className="text-gray-700 hover:text-red-400 transition-colors p-1 shrink-0"
                      >
                        <Trash2 size={14} />
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
