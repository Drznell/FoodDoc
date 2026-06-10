import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { analyseMeal } from '../lib/gemini'
import type { NutritionResult } from '../types'
import { Camera, Send, Loader2 } from 'lucide-react'

export default function Analyse() {
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [result, setResult] = useState<NutritionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

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
      const data = await analyseMeal(description, imageBase64 || undefined)
      setResult(data)
    } catch (e) {
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
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-primary text-white px-6 pt-10 pb-8">
        <h1 className="text-2xl font-bold">Analyse a Meal</h1>
        <p className="text-green-100 text-sm mt-1">Describe or photo your food — let FoodDoc do the rest</p>
      </div>

      <div className="max-w-md mx-auto px-6 -mt-4 space-y-4">

        {/* Input card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">

          {/* Image upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors"
          >
            {image ? (
              <img src={image} alt="meal" className="w-full h-40 object-cover rounded-lg" />
            ) : (
              <div className="py-4">
                <Camera className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-400 text-sm">Tap to upload a photo of your meal</p>
                <p className="text-gray-300 text-xs mt-1">Optional — you can also just describe it</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

          {/* Text description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Describe your meal</label>
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
            {loading ? 'Analysing...' : 'Analyse Meal'}
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Iron</span>
                  <span className="font-medium text-gray-800">{result.iron} mg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Folate</span>
                  <span className="font-medium text-gray-800">{result.folate} mcg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Zinc</span>
                  <span className="font-medium text-gray-800">{result.zinc} mg</span>
                </div>
              </div>
            </div>

            {/* AI Advice */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary uppercase mb-2">FoodDoc Says 🧠</p>
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