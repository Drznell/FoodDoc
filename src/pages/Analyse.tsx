import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { analyseMeal } from '../lib/gemini'
import type { NutritionResult, Language } from '../types/index'
import { Camera, Send, Loader2, Mic, MicOff, Volume2, X } from 'lucide-react'

const LANGUAGES: { value: Language; flag: string; label: string }[] = [
  { value: 'english', flag: '🇳🇬', label: 'English' },
  { value: 'pidgin', flag: '🗣️', label: 'Pidgin' },
  { value: 'yoruba', flag: '🌿', label: 'Yoruba' },
  { value: 'hausa', flag: '☀️', label: 'Hausa' },
  { value: 'igbo', flag: '🦅', label: 'Igbo' },
]

const LANG_VOICES: Record<Language, string> = {
  english: 'en-NG', pidgin: 'en-NG', yoruba: 'yo', hausa: 'ha', igbo: 'ig',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

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
    if (!SR) { setError('Voice input not supported. Try Chrome.'); return }
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = 'en-NG'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event: { results: { 0: { 0: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript
      setDescription(prev => prev ? prev + ' ' + transcript : transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognition.start()
    setListening(true)
  }

  function stopListening() { recognitionRef.current?.stop(); setListening(false) }

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
    if (!description && !imageBase64) { setError('Please describe your meal or upload a photo.'); return }
    setLoading(true); setError(''); setResult(null); setSaved(false)
    try {
      const data = await analyseMeal(description, language, imageBase64 || undefined)
      setResult(data)
    } catch { setError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  async function handleSave() {
    if (!result) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('meal_logs').insert({
      user_id: user.id, meal_name: result.meal_name, meal_description: description,
      calories: result.calories, protein: result.protein, carbs: result.carbs,
      fat: result.fat, iron: result.iron, folate: result.folate, zinc: result.zinc,
      ai_advice: result.ai_advice, language: result.language,
    })
    setSaved(true); setSaving(false)
  }

  function handleReset() {
    setDescription(''); setImage(null); setImageBase64(null)
    setResult(null); setError(''); setSaved(false)
    window.speechSynthesis?.cancel()
  }

  return (
    <div className="ambient-bg min-h-screen pb-28">
      <div className="content-layer max-w-md mx-auto px-5 pt-12 space-y-4">

        <div>
          <h1 className="text-2xl font-bold text-white">Analyse Meal</h1>
          <p className="text-gray-400 text-sm mt-1">Snap or describe — FoodDoc go sort you out</p>
        </div>

        <div className="glass rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Response Language</p>
          <div className="flex gap-2 flex-wrap">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => setLanguage(lang.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                  language === lang.value
                    ? 'bg-primary text-white border-primary shadow-glow-sm'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-primary/50'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
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
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="py-5">
                <Camera className="mx-auto text-gray-600 mb-2" size={28} />
                <p className="text-gray-500 text-sm">Tap to upload a photo</p>
                <p className="text-gray-700 text-xs mt-1">Optional — describe below if no photo</p>
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
                {listening ? 'Listening...' : 'Voice'}
              </button>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. A plate of eba and egusi soup with stockfish and periwinkle..."
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
            <h2 className="text-lg font-bold text-white">{result.meal_name}</h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories', value: result.calories, unit: 'kcal', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: 'Protein', value: result.protein, unit: 'g', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Carbs', value: result.carbs, unit: 'g', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                { label: 'Fat', value: result.fat, unit: 'g', color: 'text-red-400', bg: 'bg-red-500/10' },
              ].map(item => (
                <div key={item.label} className={`${item.bg} rounded-xl p-3 text-center border border-white/5`}>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}{item.unit !== 'kcal' ? item.unit : ''}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.label}{item.unit === 'kcal' ? ' (kcal)' : ''}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Micronutrients</p>
              {[
                { label: 'Iron', value: `${result.iron} mg` },
                { label: 'Folate', value: `${result.folate} mcg` },
                { label: 'Zinc', value: `${result.zinc} mg` },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">FoodDoc Says 🧠</p>
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
                {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save to Log'}
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
