import { AiEstimateResult } from './api';

const SYSTEM_PROMPT = `You are a nutrition estimation expert. Each user message will contain a meal description, and optionally a country:

Country: <country name> (optional)
Meal: <meal description>

If a country is provided, use it to apply regionally relevant food data and portion norms. If no country is provided, estimate using general/international food data.

Always respond with a single JSON object. Do not wrap it in markdown code fences. Output the raw JSON only, starting with { and ending with }. No prose, no explanation, no text outside the JSON. Use this exact schema:
{
  "meal_title": "string (short, human-readable title, e.g. 'Big Mac Meal' or 'Spaghetti Bolognese with Garlic Bread')",
  "liquid": false,
  "per_100g": { "calories_kcal": number, "protein_g": number, "fat_g": number, "carbs_g": number },
  "total_meal": { "weight_g": number, "calories_kcal": number, "protein_g": number, "fat_g": number, "carbs_g": number },
  "confidence": "low | medium | high",
  "notes": "string (assumptions made, e.g. cooking method, portion size, country assumed if not specified)",
  "error": "string or null (null if successful; description of what went wrong if the request could not be fulfilled)"
}

Field rules:
- liquid: set to true if the meal is a drink, smoothie, soup, juice, or any primarily liquid food. When true, weights are interpreted as millilitres instead of grams.
- confidence: set to "high" for well-known branded or standardised items, "medium" for common homemade dishes, "low" for vague or highly variable descriptions.
- If the meal cannot be estimated (description too vague or nonsensical), set error to a clear explanation, set meal_title to null, and set all numeric fields to null.`;

export async function estimateMeal(
  meal: string,
  country: string | null,
  apiKey: string,
): Promise<AiEstimateResult> {
  const userMessage = country?.trim()
    ? `Country: ${country.trim()}\nMeal: ${meal}`
    : `Meal: ${meal}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    let message = `API error ${response.status}`;
    try {
      const err = await response.json() as { error?: { message?: string } };
      if (err?.error?.message) message = err.error.message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const data = await response.json() as { content?: { type: string; text: string }[] };
  const text = data.content?.find((b) => b.type === 'text')?.text ?? '';

  try {
    return JSON.parse(text) as AiEstimateResult;
  } catch {
    throw new Error('Could not parse AI response. Please try again.');
  }
}
