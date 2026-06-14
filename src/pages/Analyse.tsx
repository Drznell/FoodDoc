import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { analyseMeal } from '../lib/gemini'
import type { NutritionResult, Language } from '../types/index'
import { Camera, Send, Loader2, Mic, MicOff, Volume2 } from 'lucide-react'

const LANGUAGES: { value: Language; flag: string; label: string }[] = [
  { value: 'english', flag: '🇳🇬', label: 'English' },
  { value: 'pidgin', flag: '🗣️', label: 'Pidgin' },
  { value: 'yoruba', flag: '🌿', label: 'Yoruba' },
  { value: 'hausa', flag: '☀️', label: 'Hausa' },
  { value: 'igbo', flag: '🦅', label: 'Igbo' },
]

const LANG_VOICES: Record<Language, string> = {
  english: 'en-NG',
  pidgin: 'en-NG',
  yoruba: 'yo',
  hausa: 'ha',
  igbo: 'ig',
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
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
  const recognitionRef = useRef<SpeechRecognition | null>(null)

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
      const result = reader.result as string
      setImage(result)
      setImageBase64(result.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setError('Voice input is not supported in your browser. Try Chrome.')
      return
    }
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = 'en-NG'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setDescription(prev => prev ? prev + ' ' + transcript : transcript)
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
    const match = voices.find(v => v.lang.startsWith(langCode)) ||
                  voices.find(v => v.lang.startsWith('en'))
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
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!result) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-primary text-white px-6 pt-10 pb-8">
        <h1 className="text-2xl font-bold">Analyse a Meal</h1>
        <p className="text-green-100 text-sm mt-1">Snap or describe your food — FoodDoc go tell you everything</p>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-4 space-y-4">

        {/* Language selector */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Response Language</p>
          <div className="flex gap-2 flex-wrap">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                onClick={() => setLanguage(lang.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  language === lang.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">

          {/* Image upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors"
          >
            {image ? (
              <img src={image} alt="meal" className="w-full h-44 object-cover rounded-lg" />
            ) : (
              <div className="py-4">
                <Camera className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-400 text-sm">Tap to upload a photo of your meal</p>
                <p className="text-gray-300 text-xs mt-1">Optional — you can also just describe it</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

          {/* Text + voice input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Describe your meal</label>
              <button
                onClick={listening ? stopListening : startListening}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  listening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {listening ? <MicOff size={14} /> : <Mic size={14} />}
                {listening ? 'Listening...' : 'Voice'}
              </button>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. A big plate of jollof rice with fried chicken and fried plantain..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

          <button
            onClick={handleAnalyse}
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {loading ? 'Analysing your food...' : 'Analyse Meal'}
          </button>
        </div>

        {/* Results card */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">{result.meal_name}</h2>

            {/* Macros */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-orange-500">{result.calories}</p>
                <p className="text-xs text-gray-500 mt-1">Calories (kcal)</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-500">{result.protein}g</p>
                <p className="text-xs text-gray-500 mt-1">Protein</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-yellow-500">{result.carbs}g</p>
                <p className="text-xs text-gray-500 mt-1">Carbohydrates</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-red-400">{result.fat}g</p>
                <p className="text-xs text-gray-500 mt-1">Fat</p>
              </div>
            </div>

            {/* Micros */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Micronutrients</p>
              <div className="space-y-2">
                {[
                  { label: 'Iron', value: `${result.iron} mg` },
                  { label: 'Folate', value: `${result.folate} mcg` },
                  { label: 'Zinc', value: `${result.zinc} mg` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Advice with voice playback */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-primary uppercase">FoodDoc Says 🧠</p>
                <button
                  onClick={() => speaking ? window.speechSynthesis.cancel() : speakAdvice(result.ai_advice)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    speaking
                      ? 'bg-primary text-white'
                      : 'bg-white border border-green-200 text-green-700 hover:bg-green-100'
                  }`}
                >
                  <Volume2 size={12} />
                  {speaking ? 'Stop' : 'Listen'}
                </button>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{result.ai_advice}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {saved ? '✓ Saved to Log' : saving ? 'Saving...' : 'Save to Log'}
              </button>
              <button
                onClick={handleReset}
                className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Analyse Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
