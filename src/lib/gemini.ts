import type { Language, NutritionResult } from '../types/index'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  english: 'Respond in clear, friendly Nigerian English.',
  pidgin: 'Respond in Nigerian Pidgin English. Use expressions like "e don ready", "wetin dey inside", "this food sweet well well", "your body go thank you" etc. Keep it natural and relatable.',
  yoruba: 'Respond in Yoruba language. Use proper Yoruba tones and phrases about food and health like "ounjẹ yi dara", "ara rẹ yio dara si". Mix naturally with a little English for nutrition terms if needed.',
  hausa: 'Respond in Hausa language. Use warm, friendly Hausa expressions about food and health. Mix naturally with a little English for nutrition terms if needed.',
  igbo: 'Respond in Igbo language. Use natural Igbo expressions about food and health like "nri a dị mma", "ahụ gị ga-adị mma". Mix naturally with a little English for nutrition terms if needed.',
}

export async function analyseMeal(
  description: string,
  language: Language,
  imageBase64?: string
): Promise<NutritionResult> {
  const langInstruction = LANGUAGE_INSTRUCTIONS[language]

  const prompt = `You are FoodDoc, an expert Nigerian and African food nutritionist AI. Analyse this meal and return ONLY a JSON object — no markdown, no explanation, just raw JSON.

Meal: ${description}

IMPORTANT INSTRUCTIONS:
- You specialise in Nigerian and African traditional foods: jollof rice, eba, egusi soup, suya, pounded yam, moi moi, akara, banga soup, oha soup, afang, ugba, abacha, ofe onugbu, pepper soup, tuwo shinkafa, miyan kuka, tuwon masara, danwake, kilishi, zobo, kunu, ogi, akamu, fufu, amala, stew with assorted meat, ofada rice, boli, roasted corn, garden egg sauce, etc.
- Use Nigerian food composition data and typical Nigerian portion sizes (e.g. one wrap of eba, a full plate of jollof, one bowl of soup).
- The ai_advice field: ${langInstruction} Write 2-3 sentences of warm, practical advice about this specific meal — what's good about it, what to watch out for, and a simple tip.

Return this exact JSON structure:
{
  "meal_name": "name of the meal in its original language (e.g. Eba with Egusi Soup, Jollof Rice, Suya)",
  "calories": number,
  "protein": number in grams,
  "carbs": number in grams,
  "fat": number in grams,
  "iron": number in mg,
  "folate": number in mcg,
  "zinc": number in mg,
  "ai_advice": "advice in the requested language",
  "language": "${language}"
}`

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
