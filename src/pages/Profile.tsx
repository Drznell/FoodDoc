import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, Language } from '../types/index'
import { LogOut } from 'lucide-react'

const goalLabels: Record<string, string> = {
  lose_weight: '⚖️ Lose Weight',
  gain_muscle: '💪 Gain Muscle',
  eat_healthy: '🥗 Eat Healthy',
  manage_condition: '🏥 Manage Condition',
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
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleLogout() { await supabase.auth.signOut() }

  if (loading) return (
    <div className="ambient-bg min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const firstName = profile.full_name?.split(' ')[0] || '?'

  return (
    <div className="ambient-bg min-h-screen pb-28">
      <div className="content-layer max-w-md mx-auto px-5 pt-12 space-y-4">

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{firstName[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{profile.full_name || 'Your Profile'}</h1>
            <p className="text-gray-400 text-sm">Personalise your FoodDoc</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-sm font-semibold text-white mb-1">Preferred Language</p>
          <p className="text-xs text-gray-500 mb-4">FoodDoc will always reply in this language</p>
          <div className="space-y-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => setProfile({ ...profile, preferred_language: lang.value })}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  profile.preferred_language === lang.value
                    ? 'bg-primary/15 border-primary/40 shadow-glow-sm'
                    : 'bg-white/5 border-white/10 hover:border-primary/30'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <div>
                  <p className={`text-sm font-medium ${profile.preferred_language === lang.value ? 'text-primary' : 'text-gray-200'}`}>
                    {lang.label}
                  </p>
                  <p className="text-xs text-gray-500">{lang.native}</p>
                </div>
                {profile.preferred_language === lang.value && (
                  <span className="ml-auto text-primary text-sm font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold text-white">Personal Details</p>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={profile.full_name || ''}
              onChange={e => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Age</label>
              <input
                type="number"
                value={profile.age || ''}
                onChange={e => setProfile({ ...profile, age: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Weight (kg)</label>
              <input
                type="number"
                value={profile.weight || ''}
                onChange={e => setProfile({ ...profile, weight: Number(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Height (cm)</label>
            <input
              type="number"
              value={profile.height || ''}
              onChange={e => setProfile({ ...profile, height: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Health Goal</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(goalLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setProfile({ ...profile, goal: value as Profile['goal'] })}
                  className={`py-3 px-3 rounded-xl text-xs font-medium border transition-all text-left ${
                    profile.goal === value
                      ? 'bg-primary/15 text-primary border-primary/40'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:border-primary/30'
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
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-glow-sm"
          >
            {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 border border-red-500/20 text-red-400 py-3 rounded-xl font-semibold hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </div>
  )
}
