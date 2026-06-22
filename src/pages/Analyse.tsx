import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { analyseMeal } from '../lib/gemini'
import type { NutritionResult } from '../lib/gemini'
import { Camera, Send, Loader2, Star } from 'lucide-react'

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
      console.error(e)
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
      sodium: result.sodium,
      sugar: result.sugar,
      fiber: result.fiber,
      calcium: result.calcium,
      vitamin_a: result.vitamin_a,
      local_names: result.local_names,
      portion_size: result.portion_size,
      ingredients: result.ingredients,
      cooking_method: result.cooking_method,
      health_rating: result.health_rating,
      processed_food: result.processed_food,
      smart_recommendations: result.smart_recommendations,
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

        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{result.meal_name}</h2>
                {result.local_names && (
                  <p className="text-sm text-gray-400 mt-0.5">{result.local_names}</p>
                )}
                {result.portion_size && (
                  <p className="text-xs text-gray-400">{result.portion_size}</p>
                )}
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-xl">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-bold text-yellow-600">{result.health_rating}/10</span>
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Calories', value: result.calories, unit: 'kcal', color: 'orange' },
                { label: 'Protein', value: result.protein, unit: 'g', color: 'blue' },
                { label: 'Carbs', value: result.carbs, unit: 'g', color: 'yellow' },
                { label: 'Fat', value: result.fat, unit: 'g', color: 'red' },
              ].map(item => (
                <div key={item.label} className={`bg-${item.color}-50 rounded-xl p-3 text-center`}>
                  <p className={`text-2xl font-bold text-${item.color}-500`}>{item.value}{item.unit !== 'kcal' ? item.unit : ''}</p>
                  {item.unit === 'kcal' && <p className="text-xs text-gray-400">kcal</p>}
                  <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Micros */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Micronutrients</p>
              <div className="grid grid-cols-2 gap-y-2">
                {[
                  { label: 'Iron', value: result.iron, unit: 'mg' },
                  { label: 'Calcium', value: result.calcium, unit: 'mg' },
                  { label: 'Folate', value: result.folate, unit: 'mcg' },
                  { label: 'Zinc', value: result.zinc, unit: 'mg' },
                  { label: 'Sodium', value: result.sodium, unit: 'mg' },
                  { label: 'Vitamin A', value: result.vitamin_a, unit: 'mcg' },
                  { label: 'Fiber', value: result.fiber, unit: 'g' },
                  { label: 'Sugar', value: result.sugar, unit: 'g' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm pr-4">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium text-gray-800">{item.value} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cooking info */}
            {(result.cooking_method || result.ingredients?.length > 0) && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Details</p>
                {result.cooking_method && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Method:</span> {result.cooking_method}
                    {result.processed_food && <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Processed</span>}
                  </p>
                )}
                {result.ingredients?.length > 0 && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Ingredients:</span> {result.ingredients.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* AI Advice */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-primary uppercase mb-2">FoodDoc Says 🧠</p>
              <p className="text-sm text-gray-700 leading-relaxed">{result.ai_advice}</p>
            </div>

            {/* Smart recommendations */}
            {result.smart_recommendations?.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Smart Tips 💡</p>
                <ul className="space-y-1">
                  {result.smart_recommendations.map((tip, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-blue-400 flex-shrink-0">•</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
