import type { Language, NutritionResult } from '../types/index'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  english: 'Respond in clear, friendly Nigerian English.',
  pidgin: 'Respond in Nigerian Pidgin English. Keep it natural, practical, and relatable.',
  yoruba: 'Respond in Yoruba. Mix naturally with a little English for nutrition terms if needed.',
  hausa: 'Respond in Hausa. Mix naturally with a little English for nutrition terms if needed.',
  igbo: 'Respond in Igbo. Mix naturally with a little English for nutrition terms if needed.',
}

function numberValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function stringValue(value: unknown, fallback = 'Not specified') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

function normalizeNutritionResult(data: Partial<NutritionResult>, language: Language): NutritionResult {
  return {
    meal_name: stringValue(data.meal_name, 'Analysed meal'),
    calories: numberValue(data.calories),
    protein: numberValue(data.protein),
    carbs: numberValue(data.carbs),
    fat: numberValue(data.fat),
    fiber: numberValue(data.fiber),
    sugar: numberValue(data.sugar),
    sodium: numberValue(data.sodium),
    iron: numberValue(data.iron),
    folate: numberValue(data.folate),
    zinc: numberValue(data.zinc),
    vitamin_a: numberValue(data.vitamin_a),
    vitamin_c: numberValue(data.vitamin_c),
    calcium: numberValue(data.calcium),
    portion_estimate: stringValue(data.portion_estimate, 'Estimated from the photo and description'),
    local_names: stringArray(data.local_names),
    region: stringValue(data.region, 'Nigeria'),
    ingredients: stringArray(data.ingredients),
    cooking_method: stringValue(data.cooking_method, 'Not specified'),
    nutrition_score: numberValue(data.nutrition_score),
    quality_assessment: stringValue(data.quality_assessment, 'FoodDoc analysed the meal, but the quality note was incomplete.'),
    processed_food_warning: stringValue(data.processed_food_warning, 'None'),
    hydration_tip: stringValue(data.hydration_tip, 'Drink water with this meal.'),
    protein_adequacy: stringValue(data.protein_adequacy, 'Protein estimate is available above.'),
    nutrient_gap: stringValue(data.nutrient_gap, 'No major gap noticed'),
    healthy_swaps: stringArray(data.healthy_swaps),
    portion_recommendation: stringValue(data.portion_recommendation, 'Keep the portion moderate and add vegetables where possible.'),
    budget_tip: stringValue(data.budget_tip, 'Beans, eggs, groundnuts, and seasonal vegetables are useful affordable add-ons.'),
    meal_suggestion: stringValue(data.meal_suggestion, 'Choose a lighter next meal with vegetables and lean protein.'),
    ai_advice: stringValue(data.ai_advice, 'FoodDoc has analysed your meal.'),
    language: data.language || language,
  }
}

export async function analyseMeal(
  description: string,
  language: Language,
  imageBase64?: string,
  imageMimeType = 'image/jpeg'
): Promise<NutritionResult> {
  if (!GEMINI_API_KEY) {
    throw new Error('AI analysis is not configured yet. Add VITE_GEMINI_API_KEY to your environment variables and redeploy the app.')
  }

  const langInstruction = LANGUAGE_INSTRUCTIONS[language]

  const prompt = `You are FoodDoc, an expert Nigerian and African food nutritionist AI. Analyse this meal and return ONLY a valid JSON object. Do not include markdown, comments, or extra text.

Meal: ${description || 'Analyse the uploaded meal photo.'}

IMPORTANT INSTRUCTIONS:
- You specialise in Nigerian and African traditional foods: jollof rice, eba, egusi soup, suya, pounded yam, moi moi, akara, banga soup, oha soup, afang, ugba, abacha, ofe onugbu, pepper soup, tuwo shinkafa, miyan kuka, tuwon masara, danwake, kilishi, zobo, kunu, ogi, akamu, fufu, amala, stew with assorted meat, ofada rice, boli, roasted corn, garden egg sauce, and similar meals.
- Recognise local names, regional dishes, common ingredient combinations, and cooking methods.
- Use Nigerian food composition knowledge and typical Nigerian portion sizes such as one wrap of eba, a full plate of jollof, one soup bowl, one cup of pap, one medium wrap of moi moi, or one stick of suya.
- Estimate numbers realistically. If uncertain, make a careful best estimate and keep the result useful.
- Nutrition score is from 0 to 100, where 100 means balanced, nutrient-dense, and aligned with healthy portioning.
- quality_assessment should mention whether the meal is balanced, oily, salty, sugary, low-fiber, protein-rich, vegetable-rich, or energy-dense where relevant.
- processed_food_warning should be "None" when not relevant.
- protein_adequacy should say whether the protein is low, moderate, or adequate for one meal.
- nutrient_gap should mention the most likely missing nutrient or "No major gap noticed".
- healthy_swaps, ingredients, and local_names must be arrays of short strings.
- The ai_advice, quality_assessment, hydration_tip, protein_adequacy, nutrient_gap, portion_recommendation, budget_tip, and meal_suggestion fields must follow this language instruction: ${langInstruction}

Return this exact JSON structure:
{
  "meal_name": "name of the meal in its original language",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "sodium": number,
  "iron": number,
  "folate": number,
  "zinc": number,
  "vitamin_a": number,
  "vitamin_c": number,
  "calcium": number,
  "portion_estimate": "short portion estimate",
  "local_names": ["local or regional names"],
  "region": "likely Nigerian region or African origin",
  "ingredients": ["main ingredients detected or inferred"],
  "cooking_method": "main cooking method",
  "nutrition_score": number,
  "quality_assessment": "short assessment",
  "processed_food_warning": "short warning or None",
  "hydration_tip": "short hydration guidance",
  "protein_adequacy": "short protein assessment",
  "nutrient_gap": "short nutrient gap insight",
  "healthy_swaps": ["swap 1", "swap 2", "swap 3"],
  "portion_recommendation": "short portion guidance",
  "budget_tip": "budget-friendly local food tip",
  "meal_suggestion": "next-meal suggestion",
  "ai_advice": "2-3 sentences of practical advice in the requested language",
  "language": "${language}"
}`

  const parts: object[] = [{ text: prompt }]

  if (imageBase64) {
    parts.unshift({
      inline_data: {
        mime_type: imageMimeType,
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
  if (!response.ok) {
    const message = data?.error?.message || 'FoodDoc analysis request failed'
    throw new Error(`AI analysis failed: ${message}`)
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error('FoodDoc did not return an analysis')
  }

  const clean = text.replace(/```json|```/g, '').trim()
  const jsonStart = clean.indexOf('{')
  const jsonEnd = clean.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('FoodDoc returned an unreadable analysis. Please try again.')
  }

  try {
    return normalizeNutritionResult(JSON.parse(clean.slice(jsonStart, jsonEnd + 1)), language)
  } catch {
    throw new Error('FoodDoc returned incomplete nutrition data. Please try again.')
  }
}
