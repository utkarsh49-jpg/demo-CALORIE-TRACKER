import { Router } from "express";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });

const FOOD_ANALYSIS_PROMPT = `You are a precise nutritionist AI. Analyze this food image and return ONLY valid JSON (no markdown, no backticks).

Return this exact JSON structure:
{
  "name": "food name (be specific, e.g. 'Grilled Chicken Breast with Rice')",
  "calories": 450,
  "protein": 42,
  "carbs": 38,
  "fat": 8,
  "servingSize": "1 plate (~350g)",
  "description": "Brief description of what you see and any notable nutrition facts."
}

Rules:
- calories in kcal (number)
- protein, carbs, fat in grams (numbers)  
- Be accurate and realistic for visible portion sizes
- If multiple foods, give combined totals
- If unclear, give reasonable estimates`;

router.post("/analyze", async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: FOOD_ANALYSIS_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json({
      name: parsed.name ?? "Unknown Food",
      calories: Number(parsed.calories) || 0,
      protein: Number(parsed.protein) || 0,
      carbs: Number(parsed.carbs) || 0,
      fat: Number(parsed.fat) || 0,
      servingSize: parsed.servingSize ?? "1 serving",
      description: parsed.description ?? "",
    });
  } catch (err) {
    req.log.error({ err }, "Food analysis failed");
    res.status(500).json({ error: "Food analysis failed" });
  }
});

router.post("/barcode", async (req, res) => {
  const { barcode } = req.body as { barcode?: string };

  if (!barcode) {
    res.status(400).json({ error: "barcode is required" });
    return;
  }

  // First try Open Food Facts (free, no key)
  try {
    const offRes = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );
    const offData = (await offRes.json()) as {
      status: number;
      product?: {
        product_name?: string;
        nutriments?: {
          "energy-kcal_100g"?: number;
          proteins_100g?: number;
          carbohydrates_100g?: number;
          fat_100g?: number;
        };
        serving_size?: string;
        quantity?: string;
      };
    };

    if (offData.status === 1 && offData.product) {
      const p = offData.product;
      const n = p.nutriments ?? {};
      const servingG = 100;

      res.json({
        name: p.product_name ?? "Unknown Product",
        calories: Math.round((n["energy-kcal_100g"] ?? 0) * servingG) / 100,
        protein: Math.round((n["proteins_100g"] ?? 0) * servingG) / 100,
        carbs: Math.round((n["carbohydrates_100g"] ?? 0) * servingG) / 100,
        fat: Math.round((n["fat_100g"] ?? 0) * servingG) / 100,
        servingSize: p.serving_size ?? p.quantity ?? "100g",
        description: `Scanned from barcode ${barcode}`,
      });
      return;
    }
  } catch {
    // Fall through to AI fallback
  }

  // AI fallback
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Barcode: ${barcode}. Identify this product and estimate its nutrition per standard serving. Return ONLY JSON:
{"name":"product name","calories":200,"protein":5,"carbs":30,"fat":3,"servingSize":"1 serving (30g)","description":"brief description"}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json({
      name: parsed.name ?? "Unknown Product",
      calories: Number(parsed.calories) || 0,
      protein: Number(parsed.protein) || 0,
      carbs: Number(parsed.carbs) || 0,
      fat: Number(parsed.fat) || 0,
      servingSize: parsed.servingSize ?? "1 serving",
      description: parsed.description ?? "",
    });
  } catch (err) {
    req.log.error({ err }, "Barcode lookup failed");
    res.status(404).json({ error: "Product not found" });
  }
});

router.post("/coach", async (req, res) => {
  const {
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    goalCalories,
    goalProtein,
    goalCarbs,
    goalFat,
    streak,
    mealCount,
  } = req.body as {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    goalCalories: number;
    goalProtein: number;
    goalCarbs: number;
    goalFat: number;
    streak: number;
    mealCount: number;
  };

  const calRemaining = goalCalories - totalCalories;
  const proRemaining = goalProtein - totalProtein;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content:
            "You are an encouraging, concise AI nutrition coach. Give personalized advice in 1-2 sentences. Be specific, motivating, and action-oriented. Never use emojis.",
        },
        {
          role: "user",
          content: `Today's progress: ${Math.round(totalCalories)}/${goalCalories} kcal, ${Math.round(totalProtein)}/${goalProtein}g protein, ${Math.round(totalCarbs)}/${goalCarbs}g carbs, ${Math.round(totalFat)}/${goalFat}g fat. Meals logged: ${mealCount}. Current streak: ${streak} days. Calories remaining: ${Math.round(calRemaining)}. Protein remaining: ${Math.round(proRemaining)}g. Give me coaching advice.`,
        },
      ],
    });

    const message =
      response.choices[0]?.message?.content?.trim() ??
      "Keep tracking your meals to reach your daily goals!";

    res.json({ message });
  } catch (err) {
    req.log.error({ err }, "Coach advice failed");
    res.json({
      message: "Stay consistent with your meals today — every logged entry brings you closer to your goal!",
    });
  }
});

router.post("/suggest", async (req, res) => {
  const {
    remainingCalories,
    remainingProtein,
    remainingCarbs,
    remainingFat,
    todayMeals,
  } = req.body as {
    remainingCalories: number;
    remainingProtein: number;
    remainingCarbs: number;
    remainingFat: number;
    todayMeals: string[];
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You are a nutrition coach. Suggest 3 specific meal ideas to help hit macro targets. Be concise and practical. Return ONLY a JSON array of strings.",
        },
        {
          role: "user",
          content: `Remaining today: ${Math.round(remainingCalories)} kcal, ${Math.round(remainingProtein)}g protein, ${Math.round(remainingCarbs)}g carbs, ${Math.round(remainingFat)}g fat. Already eaten: ${(todayMeals ?? []).length > 0 ? (todayMeals ?? []).join(", ") : "nothing yet"}. Suggest 3 meal ideas as a JSON array of strings, each under 80 chars. Example: ["Eat 200g Greek yogurt with berries for 20g protein", "Add a chicken wrap for balanced macros"]`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    let suggestions: string[] = [];

    try {
      suggestions = JSON.parse(cleaned);
    } catch {
      suggestions = [
        `Eat ${Math.round(remainingProtein)}g of protein-rich food like chicken or tofu`,
        `Have a balanced meal with ${Math.round(remainingCalories / 2)} kcal for dinner`,
        "Consider a high-protein snack like cottage cheese or a protein shake",
      ];
    }

    res.json({ suggestions: suggestions.slice(0, 3) });
  } catch (err) {
    req.log.error({ err }, "Meal suggestions failed");
    res.json({
      suggestions: [
        "Try a lean protein source like chicken, fish, or tofu with your next meal",
        "Add vegetables to boost nutrition without many calories",
        "Consider a protein shake to help hit your protein goal",
      ],
    });
  }
});

export default router;
