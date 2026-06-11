const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export async function analyseMeal(
  description: string,
  imageBase64?: string
): Promise<{
  meal_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  iron: number
  folate: number
  zinc: number
  ai_advice: string
}> {
  const prompt = `You are FoodDoc, an expert Nigerian nutritionist AI. Analyse this meal and return ONLY a JSON object with no markdown, no explanation, just raw JSON.

Meal: ${description}

Return this exact JSON structure:
{
  "meal_name": "name of the meal",
  "calories": number,
  "protein": number in grams,
  "carbs": number in grams,
  "fat": number in grams,
  "iron": number in mg,
  "folate": number in mcg,
  "zinc": number in mg,
  "ai_advice": "2-3 sentences of practical Nigerian nutrition advice about this meal in a friendly casual tone"
}

Use Nigerian food composition data where relevant. Be accurate for common Nigerian foods like jollof rice, eba, egusi soup, suya, pounded yam, moi moi, akara, pepper soup etc.`

  const parts: object[] = [{ text: prompt }]

  if (imageBase64) {
    parts.unshift({
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
      body: JSON.stringify({ contents: [{ parts }] }),
    }
  )

  const data = await response.json()
  const text = data.candidates[0].content.parts[0].text
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
