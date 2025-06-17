import axios from 'axios';

// Define the structure for a meal (reuse your MealRecipe type if possible)
export interface LLMMeal {
  name: string;
  description: string;
  imageUrl?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  instructions: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Function to query the LLM for 3 meals
export async function fetchMealsFromLLM(): Promise<LLMMeal[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  const prompt = `Generate 3 healthy meal recipes. For each, provide:\n- name\n- description\n- imageUrl (use a royalty-free placeholder if needed)\n- prepTime (minutes)\n- cookTime (minutes)\n- servings\n- ingredients (array of {name, amount, unit})\n- instructions (array of steps)\n- macros (calories, protein, carbs, fat)`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1200
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // Parse the LLM response to extract meal data
  // (Assume the LLM returns a JSON array of meals)
  try {
    const text = response.data.choices[0].message.content;
    const meals: LLMMeal[] = JSON.parse(text);
    return meals;
  } catch (e) {
    throw new Error('Failed to parse LLM meal data: ' + e);
  }
}
