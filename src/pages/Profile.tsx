import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, Language } from '../types/index'

const goalLabels: Record<string, string> = {
  lose_weight: '⚖️ Lose Weight',
  gain_muscle: '💪 Gain Muscle',
  eat_healthy: '🥗 Eat Healthy',
  manage_condition: '🏥 Manage a Condition',
}

const LANGUAGES: { value: Language; flag: string; label: string; native: string }[] = [
  { value: 'english', flag: '🇳🇬', label: 'English', native: 'English' },
  { value: 'pidgin', flag: '🗣️', label: 'Pidgin', native: 'Naija Pidgin' },
  { value: 'yoruba', flag: '🌿', label: 'Yoruba', native: 'Yorùbá' },
  { value: 'hausa', flag: '☀️', label: 'Hausa', native: 'Hausa' },
  { value: 'igbo', flag: '🦅', label: 'Igbo', native: 'Ìgbò' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
      setLoading(false)
    }
    fetchProfile()
  }, [])

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').upsert({ id: user.id, ...profile })
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-primary text-white px-6 pt-10 pb-8">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <p className="text-green-100 text-sm mt-1">Help FoodDoc personalise your advice</p>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-4 space-y-4">

        {/* Language preference */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">Preferred Language</p>
          <p className="text-xs text-gray-400 mb-3">FoodDoc will always reply in this language</p>
          <div className="space-y-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => setProfile({ ...profile, preferred_language: lang.value })}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                  profile.preferred_language === lang.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-primary'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <div>
                  <p className="text-sm font-medium">{lang.label}</p>
                  <p className={`text-xs ${profile.preferred_language === lang.value ? 'text-green-100' : 'text-gray-400'}`}>
                    {lang.native}
                  </p>
                </div>
                {profile.preferred_language === lang.value && (
                  <span className="ml-auto text-white text-lg">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Personal details */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Personal Details</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={profile.full_name || ''}
              onChange={e => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                value={profile.age || ''}
                onChange={e => setProfile({ ...profile, age: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={profile.weight || ''}
                onChange={e => setProfile({ ...profile, weight: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input
              type="number"
              value={profile.height || ''}
              onChange={e => setProfile({ ...profile, height: Number(e.target.value) })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">My Health Goal</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(goalLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setProfile({ ...profile, goal: value as Profile['goal'] })}
                  className={`py-3 px-3 rounded-xl text-sm font-medium border transition-colors text-left ${
                    profile.goal === value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {saved ? '✓ Profile Saved!' : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full border border-red-200 text-red-500 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}
