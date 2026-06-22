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
  const prompt = `You are FoodDoc, an elite Nigerian Nutrition AI and certified dietitian specialising in traditional Nigerian foods (jollof rice, eba, egusi soup, suya, pounded yam, moi moi, akara, pepper soup, amala, ewedu, gbegiri, banga, afang, edikang ikong, tuwo shinkafa, masa, okra soup, yam porridge, etc).

Analyse this meal: "${description}"

Medical context to tailor advice for (if any): ${medicalCondition}
Respond in this language style: ${language}

Return ONLY a raw JSON object, no markdown, no explanation, exactly this structure:
{
  "meal_name": "standard English name",
  "local_names": "Nigerian/local name(s) if applicable",
  "portion_size": "description of portion e.g. 1 medium plate",
  "calories": number,
  "protein": number in grams,
  "carbs": number in grams,
  "fat": number in grams,
  "sodium": number in mg,
  "sugar": number in grams,
  "fiber": number in grams,
  "iron": number in mg,
  "calcium": number in mg,
  "folate": number in mcg,
  "zinc": number in mg,
  "vitamin_a": number in mcg,
  "ingredients": ["ingredient1", "ingredient2"],
  "cooking_method": "e.g. deep-fried, boiled, steamed",
  "health_rating": number from 1 to 10,
  "processed_food": boolean,
  "ai_advice": "2-3 sentences of practical, friendly Nigerian nutrition advice, tailored to the medical condition if one is given",
  "smart_recommendations": ["tip1", "tip2"]
}

Be accurate using real Nigerian food composition data.`

  const parts: object[] = [{ text: prompt }]

  if (imageBase64) {
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: imageBase64,
      },
    })
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Gemini API error:', errorData)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.candidates || data.candidates.length === 0) {
    console.error('No candidates in response:', data)
    throw new Error('No response from AI')
  }

  const text = data.candidates[0].content.parts[0].text
  const clean = text.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    console.error('Failed to parse AI response:', clean)
    throw new Error('Could not parse AI response')
  }
}

export async function chatWithDietitian(
  messages: { role: 'user' | 'assistant'; content: string }[],
  medicalCondition: string = 'None',
  goal: string = 'Maintenance',
  language: string = 'English'
): Promise<string> {
  const systemPrompt = `You are "Mumi Naija", a warm, trusted, certified Nigerian Dietitian and Wellness Coach.

User profile:
- Goal: ${goal}
- Medical condition: ${medicalCondition}
- Preferred language: ${language}

Your style:
- Use Nigerian foods as examples: beans, roast plantain, boiled egg, ugu, shoko, okazi, utazi.
- Give practical, budget-friendly, market-realistic advice (local catfish over imported fish, local rice, groundnut oil in moderation).
- If language is Yoruba, Igbo, Hausa, or Pidgin, speak naturally with common expressions to build trust.
- For serious medical concerns (kidney/liver failure, severe anemia), gently recommend visiting a certified clinic alongside your advice.
- Keep responses concise and use markdown formatting for readability.`

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Gemini chat error:', errorData)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

export async function generateRecipe(
  request: string,
  ingredients: string[] = [],
  goal: string = 'Healthy Eating',
  language: string = 'English'
) {
  const prompt = `Generate a traditional, healthy, localized Nigerian recipe based on:
- Request: "${request}"
- Available ingredients: ${ingredients.length ? ingredients.join(', ') : 'None specified, suggest standard traditional ones'}
- Health goal: ${goal}
- Language: ${language}

Suggest affordable protein swaps and tips for reducing sodium or palm oil.

Return ONLY raw JSON, no markdown:
{
  "title": "dish name",
  "local_names": "native/slang name",
  "description": "short appealing description",
  "prep_time": "e.g. 15 mins",
  "cook_time": "e.g. 40 mins",
  "calories": number,
  "carbs": number,
  "protein": number,
  "fat": number,
  "ingredients": [{"name": "ingredient", "quantity": "amount", "budget_swap": "cheaper alternative"}],
  "instructions": ["step 1", "step 2"],
  "health_benefits": "health commentary",
  "budget_friendly_tips": "where/how to source cheaply"
}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
      }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json()
    console.error('Gemini recipe error:', errorData)
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates[0].content.parts[0].text
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
