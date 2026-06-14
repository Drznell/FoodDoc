import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { analyseMeal } from '../lib/gemini'
import type { Language, NutritionResult } from '../types/index'
import {
  AlertTriangle,
  Camera,
  Droplets,
  Leaf,
  Loader2,
  Mic,
  MicOff,
  Send,
  ShieldCheck,
  Utensils,
  Volume2,
  Wallet,
  X,
} from 'lucide-react'

const LANGUAGES: { value: Language; code: string; label: string; native: string }[] = [
  { value: 'english', code: 'EN', label: 'English', native: 'Nigerian English' },
  { value: 'pidgin', code: 'PG', label: 'Pidgin', native: 'Naija Pidgin' },
  { value: 'yoruba', code: 'YO', label: 'Yoruba', native: 'Yoruba' },
  { value: 'hausa', code: 'HA', label: 'Hausa', native: 'Hausa' },
  { value: 'igbo', code: 'IG', label: 'Igbo', native: 'Igbo' },
]

const LANG_VOICES: Record<Language, string> = {
  english: 'en-NG',
  pidgin: 'en-NG',
  yoruba: 'yo',
  hausa: 'ha',
  igbo: 'ig',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

function MetricCard({ label, value, unit, tone }: {
  label: string
  value: number
  unit: string
  tone: string
}) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/5 min-h-[88px]">
      <p className={`text-2xl font-bold ${tone}`}>{Math.round(value * 10) / 10}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      <p className="text-[11px] text-gray-600">{unit}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3 text-sm py-2 border-b border-white/5 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-white text-right">{value}</span>
    </div>
  )
}

function InsightBlock({ icon: Icon, title, children }: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-primary" />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      <div className="text-sm text-gray-300 leading-relaxed">{children}</div>
    </div>
  )
}

export default function Analyse() {
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [result, setResult] = useState<NutritionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState<Language>('english')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<AnySpeechRecognition>(null)

  useEffect(() => {
    async function loadLanguage() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('preferred_language').eq('id', user.id).single()
      if (data?.preferred_language) setLanguage(data.preferred_language as Language)
    }
    loadLanguage()
  }, [])

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result as string
      setImage(res)
      setImageBase64(res.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError('Voice input is not supported in this browser. Try Chrome.')
      return
    }
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = LANG_VOICES[language]
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event: { results: { 0: { 0: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript
      setDescription(prev => prev ? `${prev} ${transcript}` : transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  function speakAdvice(text: string) {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    const langCode = LANG_VOICES[language]
    const match = voices.find(v => v.lang.startsWith(langCode)) || voices.find(v => v.lang.startsWith('en'))
    if (match) utterance.voice = match
    utterance.rate = 0.9
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  async function handleAnalyse() {
    if (!description && !imageBase64) {
      setError('Please describe your meal or upload a photo.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    setSaved(false)
    try {
      const data = await analyseMeal(description, language, imageBase64 || undefined)
      setResult(data)
    } catch {
      setError('FoodDoc could not analyse that meal yet. Please try again with a clearer photo or more detail.')
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!result) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }
    await supabase.from('meal_logs').insert({
      user_id: user.id,
      meal_name: result.meal_name,
      meal_description: description,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      iron: result.iron,
      folate: result.folate,
      zinc: result.zinc,
      ai_advice: result.ai_advice,
      language: result.language,
    })
    setSaved(true)
    setSaving(false)
  }

  function handleReset() {
    setDescription('')
    setImage(null)
    setImageBase64(null)
    setResult(null)
    setError('')
    setSaved(false)
    window.speechSynthesis?.cancel()
  }

  return (
    <div className="ambient-bg min-h-screen pb-28">
      <div className="content-layer max-w-md mx-auto px-5 pt-12 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analyse Meal</h1>
          <p className="text-gray-400 text-sm mt-1">Snap or describe a Nigerian meal and get practical guidance.</p>
        </div>

        <div className="glass rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Response Language</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => setLanguage(lang.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left border transition-all duration-200 ${
                  language === lang.value
                    ? 'bg-primary text-white border-primary shadow-glow-sm'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-primary/50'
                }`}
              >
                <span className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center text-[11px] font-bold">
                  {lang.code}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">{lang.label}</span>
                  <span className="block text-[11px] opacity-70 truncate">{lang.native}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="border border-dashed border-white/10 rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 transition-colors relative"
          >
            {image ? (
              <div className="relative">
                <img src={image} alt="meal" className="w-full h-44 object-cover rounded-lg" />
                <button
                  onClick={e => { e.stopPropagation(); setImage(null); setImageBase64(null) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center"
                  aria-label="Remove photo"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="py-5">
                <Camera className="mx-auto text-gray-600 mb-2" size={28} />
                <p className="text-gray-500 text-sm">Tap to upload a food photo</p>
                <p className="text-gray-700 text-xs mt-1">Works best with the full plate visible</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Describe your meal</label>
              <button
                onClick={listening ? stopListening : startListening}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  listening
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:border-primary/40'
                }`}
              >
                {listening ? <MicOff size={12} /> : <Mic size={12} />}
                {listening ? 'Listening' : 'Voice'}
              </button>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Example: A plate of eba and egusi soup with stockfish and beef."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-lg">{error}</p>
          )}

          <button
            onClick={handleAnalyse}
            disabled={loading}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-glow"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {loading ? 'Analysing your food...' : 'Analyse Meal'}
          </button>
        </div>

        {result && (
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">{result.meal_name}</h2>
                <p className="text-xs text-gray-500 mt-1">{result.region} - {result.portion_estimate}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/30 flex flex-col items-center justify-center shrink-0">
                <span className="text-xl font-bold text-primary">{result.nutrition_score}</span>
                <span className="text-[10px] text-gray-500">score</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Calories" value={result.calories} unit="kcal" tone="text-orange-400" />
              <MetricCard label="Protein" value={result.protein} unit="grams" tone="text-blue-400" />
              <MetricCard label="Carbs" value={result.carbs} unit="grams" tone="text-yellow-400" />
              <MetricCard label="Fat" value={result.fat} unit="grams" tone="text-red-400" />
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Micronutrients</p>
              <InfoRow label="Iron" value={`${result.iron} mg`} />
              <InfoRow label="Folate" value={`${result.folate} mcg`} />
              <InfoRow label="Zinc" value={`${result.zinc} mg`} />
              <InfoRow label="Vitamin A" value={`${result.vitamin_a} mcg`} />
              <InfoRow label="Vitamin C" value={`${result.vitamin_c} mg`} />
              <InfoRow label="Calcium" value={`${result.calcium} mg`} />
            </div>

            <InsightBlock icon={Utensils} title="Food intelligence">
              <p>{result.quality_assessment}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {result.local_names.map(name => (
                  <span key={name} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs">{name}</span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">Ingredients: {result.ingredients.join(', ')}</p>
              <p className="text-xs text-gray-500 mt-1">Cooking: {result.cooking_method}</p>
            </InsightBlock>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-gray-500">Sugar</p>
                <p className="text-lg font-bold text-white">{result.sugar}g</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-gray-500">Sodium</p>
                <p className="text-lg font-bold text-white">{result.sodium}mg</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <p className="text-xs text-gray-500">Fiber</p>
                <p className="text-lg font-bold text-white">{result.fiber}g</p>
              </div>
            </div>

            <InsightBlock icon={ShieldCheck} title="Health signals">
              <p>{result.protein_adequacy}</p>
              <p className="mt-2">{result.nutrient_gap}</p>
              {result.processed_food_warning !== 'None' && (
                <p className="mt-2 text-amber-300 flex gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{result.processed_food_warning}</span>
                </p>
              )}
            </InsightBlock>

            <InsightBlock icon={Leaf} title="Smart swaps">
              <ul className="space-y-2">
                {result.healthy_swaps.map(swap => <li key={swap}>{swap}</li>)}
              </ul>
            </InsightBlock>

            <InsightBlock icon={Droplets} title="Portion and hydration">
              <p>{result.portion_recommendation}</p>
              <p className="mt-2">{result.hydration_tip}</p>
            </InsightBlock>

            <InsightBlock icon={Wallet} title="Affordable next step">
              <p>{result.budget_tip}</p>
              <p className="mt-2">{result.meal_suggestion}</p>
            </InsightBlock>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">FoodDoc says</p>
                <button
                  onClick={() => speaking ? window.speechSynthesis.cancel() : speakAdvice(result.ai_advice)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    speaking ? 'bg-primary text-white' : 'bg-white/5 border border-primary/30 text-primary hover:bg-primary/10'
                  }`}
                >
                  <Volume2 size={11} />
                  {speaking ? 'Stop' : 'Listen'}
                </button>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{result.ai_advice}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-glow-sm"
              >
                {saved ? 'Saved' : saving ? 'Saving...' : 'Save to Log'}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-white/5 border border-white/10 text-gray-300 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                New Meal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
