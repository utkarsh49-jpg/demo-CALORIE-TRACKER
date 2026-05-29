import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

const FOOD_PROMPT = `You are a precise nutritionist AI. Analyze this food image and return ONLY valid JSON (no markdown, no backticks, no explanation).

Return this exact structure:
{"name":"specific food name","calories":450,"protein":42,"carbs":38,"fat":8,"servingSize":"1 plate (~350g)","description":"Brief description of what you see."}

Rules:
- calories in kcal (number), protein/carbs/fat in grams (numbers)
- Be accurate for the visible portion size
- If multiple foods, give combined totals
- If image is unclear, give your best estimate`;

router.post("/analyze", async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: FOOD_PROMPT },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64,
              },
            },
          ],
        },
      ],
      config: { maxOutputTokens: 8192 },
    });

    const content = response.text ?? "{}";
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

  // Try Open Food Facts first (free, no key needed)
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

    if (offData.status === 1 && offData.product?.product_name) {
      const p = offData.product;
      const n = p.nutriments ?? {};
      res.json({
        name: p.product_name ?? "Unknown Product",
        calories: Math.round(n["energy-kcal_100g"] ?? 0),
        protein: Math.round(n["proteins_100g"] ?? 0),
        carbs: Math.round(n["carbohydrates_100g"] ?? 0),
        fat: Math.round(n["fat_100g"] ?? 0),
        servingSize: p.serving_size ?? p.quantity ?? "100g",
        description: `Scanned from barcode ${barcode}`,
      });
      return;
    }
  } catch {
    // fall through to AI
  }

  // AI fallback via Gemini
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Product barcode: ${barcode}. Identify this product and estimate nutrition per standard serving. Return ONLY JSON: {"name":"product name","calories":200,"protein":5,"carbs":30,"fat":3,"servingSize":"1 serving (30g)","description":"brief description"}`,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 8192 },
    });

    const content = response.text ?? "{}";
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are an encouraging, concise nutrition coach. Give personalized advice in 1-2 sentences. Be specific, motivating, and action-oriented. Never use emojis.

Today's progress: ${Math.round(totalCalories)}/${goalCalories} kcal, ${Math.round(totalProtein)}/${goalProtein}g protein, ${Math.round(totalCarbs)}/${goalCarbs}g carbs, ${Math.round(totalFat)}/${goalFat}g fat. Meals logged: ${mealCount}. Streak: ${streak} days. Calories remaining: ${Math.round(goalCalories - totalCalories)}. Protein remaining: ${Math.round(goalProtein - totalProtein)}g.`,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 8192 },
    });

    const message =
      response.text?.trim() ??
      "Keep tracking your meals to reach your daily goals!";

    res.json({ message });
  } catch (err) {
    req.log.error({ err }, "Coach advice failed");
    res.json({
      message:
        "Stay consistent with your meals today — every logged entry brings you closer to your goal!",
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
    todayMeals?: string[];
  };

  try {
    const eaten =
      (todayMeals ?? []).length > 0
        ? (todayMeals ?? []).join(", ")
        : "nothing yet";

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a nutrition coach. Suggest 3 specific meal ideas. Return ONLY a JSON array of 3 strings, each under 80 characters.

Remaining today: ${Math.round(remainingCalories)} kcal, ${Math.round(remainingProtein)}g protein, ${Math.round(remainingCarbs)}g carbs, ${Math.round(remainingFat)}g fat.
Already eaten: ${eaten}.

Example format: ["Eat 200g Greek yogurt with berries for 20g protein","Add a chicken wrap for balanced macros","Have a handful of almonds for healthy fats"]`,
            },
          ],
        },
      ],
      config: { maxOutputTokens: 8192 },
    });

    const content = response.text ?? "[]";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    let suggestions: string[] = [];

    try {
      suggestions = JSON.parse(cleaned);
      if (!Array.isArray(suggestions)) suggestions = [];
    } catch {
      suggestions = [];
    }

    if (suggestions.length === 0) {
      suggestions = [
        `Try ${Math.round(remainingProtein)}g of protein — chicken, fish, or tofu work well`,
        `A balanced meal with ${Math.round(remainingCalories / 2)} kcal would hit tonight's target`,
        "A protein shake or cottage cheese can quickly boost your protein intake",
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
