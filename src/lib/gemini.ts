cat > src/lib/gemini.ts << 'ENDOFFILE'
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export type NutritionResult = {
  meal_name: string
  local_names: string
  portion_size: string
  calories: number
  protein: number
  carbs: number
  fat: number
  sodium: number
  sugar: number
  fiber: number
  iron: number
  calcium: number
  folate: number
  zinc: number
  vitamin_a: number
  ingredients: string[]
  cooking_method: string
  health_rating: number
  processed_food: boolean
  ai_advice: string
  smart_recommendations: string[]
}

export async function analyseMeal(
  description: string,
  imageBase64?: string,
  medicalCondition: string = 'None',
  language: string = 'English'
): Promise<NutritionResult> {
  const prompt = `You are FoodDoc, an elite Nigerian Nutrition AI specialising in traditional Nigerian foods. Analyse this meal: "${description}". Medical context: ${medicalCondition}. Respond in: ${language}. Return ONLY raw JSON, no markdown: {"meal_name":"","local_names":"","portion_size":"","calories":0,"protein":0,"carbs":0,"fat":0,"sodium":0,"sugar":0,"fiber":0,"iron":0,"calcium":0,"folate":0,"zinc":0,"vitamin_a":0,"ingredients":[],"cooking_method":"","health_rating":0,"processed_food":false,"ai_advice":"","smart_recommendations":[]}`

  const parts: object[] = [{ text: prompt }]
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: imageBase64 } })
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.3, maxOutputTokens: 2048 } }),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    console.error('Gemini error:', err)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates[0].content.parts[0].text
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function chatWithDietitian(
  messages: { role: 'user' | 'assistant'; content: string }[],
  medicalCondition: string = 'None',
  goal: string = 'Maintenance',
  language: string = 'English'
): Promise<string> {
  const systemPrompt = `You are "Mumi Naija", a warm certified Nigerian Dietitian. User goal: ${goal}. Medical condition: ${medicalCondition}. Language: ${language}. Use Nigerian foods as examples. Give practical budget-friendly advice.`

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } }),
    }
  )

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

export async function generateRecipe(
  request: string,
  goal: string = 'Healthy Eating',
  language: string = 'English'
) {
  const prompt = `Generate a traditional Nigerian recipe for: "${request}". Goal: ${goal}. Language: ${language}. Return ONLY raw JSON: {"title":"","local_names":"","description":"","prep_time":"","cook_time":"","calories":0,"carbs":0,"protein":0,"fat":0,"ingredients":[{"name":"","quantity":"","budget_swap":""}],"instructions":[],"health_benefits":"","budget_friendly_tips":""}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.5, maxOutputTokens: 2048 } }),
    }
  )

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
  const data = await response.json()
  const text = data.candidates[0].content.parts[0].text
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}
ENDOFFILE
