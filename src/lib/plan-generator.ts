import { supabase } from '@/lib/supabase';
import { Food, getMealConfigForCount } from '@/lib/types';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// ---- Helpers ----

function getRandomItem<T>(items: T[]): T | null {
    if (!items || items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
}

/**
 * Adjust portion grams to meet a calorie target.
 * Keeps within ±50% of the default portion for realism.
 */
function adjustPortionToCalories(food: Food, targetCal: number): number {
    if (food.calories_per_100g <= 0) return food.portion_grams;
    const idealGrams = (targetCal / food.calories_per_100g) * 100;

    // Clamp to ±50% of default portion (realistic serving)
    const minGrams = Math.round(food.portion_grams * 0.5);
    const maxGrams = Math.round(food.portion_grams * 1.5);

    const clamped = Math.max(minGrams, Math.min(maxGrams, idealGrams));
    // Round to nearest 10g
    return Math.max(10, Math.round(clamped / 10) * 10);
}

/**
 * Pick a meal that best fits the calorie target, avoiding recently used meals.
 * Returns the food and adjusted portion grams.
 */
function pickMealForSlot(
    availableFoods: Food[],
    targetCalories: number,
    recentlyUsedIds: Set<string>
): { food: Food; grams: number } | null {
    // Filter out recently used meals for variety
    let candidates = availableFoods.filter(f => !recentlyUsedIds.has(f.id));
    if (candidates.length === 0) candidates = availableFoods; // fallback

    // Score each candidate by how close their default portion calories are to target
    const scored = candidates.map(food => {
        const defaultCalories = (food.calories_per_100g * food.portion_grams) / 100;
        const diff = Math.abs(defaultCalories - targetCalories);
        return { food, diff };
    });

    // Sort by closeness to target
    scored.sort((a, b) => a.diff - b.diff);

    // Pick from top 5 closest (with randomness for variety)
    const topCandidates = scored.slice(0, Math.min(5, scored.length));
    const chosen = getRandomItem(topCandidates);
    if (!chosen) return null;

    const grams = adjustPortionToCalories(chosen.food, targetCalories);
    return { food: chosen.food, grams };
}

// ---- Main Generator Function ----

export async function generateWeeklyPlan(
    targetCalories: number,
    glutenFree: boolean,
    forbiddenFoods: string[] = [],
    mealCount: number = 4
) {
    // 1. Fetch all meal-type foods (new complete meals have meal_types set)
    let query = supabase
        .from('foods')
        .select('*')
        .not('meal_types', 'eq', '{}'); // Only foods with meal_types assigned

    if (glutenFree) {
        query = query.eq('gluten_free', true);
    }

    const { data: rawFoods, error } = await query;
    if (error || !rawFoods || rawFoods.length === 0) {
        throw new Error('Yiyecek verisi bulunamadı.');
    }

    let allFoods = rawFoods as Food[];

    // Filter out forbidden foods: check food name and ingredients against forbidden list
    if (forbiddenFoods.length > 0) {
        const forbiddenLower = forbiddenFoods.map(f => f.toLowerCase().trim());
        allFoods = allFoods.filter(food => {
            // Check food name
            const nameLower = food.name.toLowerCase();
            if (forbiddenLower.some(f => nameLower.includes(f))) return false;

            // Check ingredients
            if (food.ingredients && Array.isArray(food.ingredients)) {
                for (const ing of food.ingredients) {
                    const ingName = ing.name.toLowerCase();
                    if (forbiddenLower.some(f => ingName.includes(f))) return false;
                }
            }

            // Check allergens
            if (food.allergens && Array.isArray(food.allergens)) {
                for (const allergen of food.allergens) {
                    const allergenLower = allergen.toLowerCase();
                    if (forbiddenLower.some(f => allergenLower.includes(f))) return false;
                }
            }

            return true;
        });

        if (allFoods.length === 0) {
            throw new Error('Seçilen kısıtlamalarla uyumlu yiyecek bulunamadı.');
        }
    }

    // Group foods by meal type
    const foodsByMealType: Record<MealType, Food[]> = {
        breakfast: allFoods.filter(f => f.meal_types?.includes('breakfast')),
        lunch: allFoods.filter(f => f.meal_types?.includes('lunch')),
        dinner: allFoods.filter(f => f.meal_types?.includes('dinner')),
        snack: allFoods.filter(f => f.meal_types?.includes('snack')),
    };

    // 2. Create Plan Record
    const { data: plan, error: planError } = await supabase
        .from('weekly_plans')
        .insert({
            target_calories: targetCalories,
            gluten_free_only: glutenFree,
            forbidden_foods: forbiddenFoods.length > 0 ? forbiddenFoods : null,
            meal_count: mealCount,
        })
        .select()
        .single();

    if (planError) throw new Error('Plan oluşturulamadı: ' + planError.message);

    // 3. Generate 7 Days
    const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const mealFoodsToInsert: { meal_id: string; food_id: string; grams: number }[] = [];

    // Dynamic meal configs based on meal count
    const mealConfigs = getMealConfigForCount(mealCount);

    // Track recently used meals globally to avoid repetition across days
    const recentBreakfasts = new Set<string>();
    const recentMainMeals = new Set<string>(); // Shared between lunch & dinner
    const recentSnacks = new Set<string>();

    const getRecentSet = (type: string): Set<string> => {
        switch (type) {
            case 'breakfast': return recentBreakfasts;
            case 'lunch': return recentMainMeals;
            case 'dinner': return recentMainMeals;
            case 'snack': return recentSnacks;
            default: return recentSnacks;
        }
    };

    for (let i = 0; i < 7; i++) {
        // Create Day
        const { data: day, error: dayError } = await supabase
            .from('plan_days')
            .insert({ weekly_plan_id: plan.id, day_name: dayNames[i], day_order: i })
            .select()
            .single();

        if (dayError) continue;

        // Track foods used within the same day to avoid lunch=dinner duplicates
        const usedTodayIds = new Set<string>();

        for (const config of mealConfigs) {
            // For DB meal_type, map to valid enum value
            const dbMealType = config.type as MealType;

            // Create Meal slot
            const { data: meal, error: mealError } = await supabase
                .from('plan_meals')
                .insert({ day_id: day.id, meal_type: dbMealType })
                .select()
                .single();

            if (mealError) continue;

            const mealTargetCalories = targetCalories * config.ratio;
            const available = foodsByMealType[dbMealType] || [];
            const recentSet = getRecentSet(config.type);

            // Combine recent + today's used for exclusion
            const excludeIds = new Set([...recentSet, ...usedTodayIds]);

            // Pick one complete meal for this slot
            const picked = pickMealForSlot(available, mealTargetCalories, excludeIds);

            if (picked) {
                mealFoodsToInsert.push({
                    meal_id: meal.id,
                    food_id: picked.food.id,
                    grams: picked.grams,
                });

                usedTodayIds.add(picked.food.id);

                // Track for cross-day rotation (keep last 4 to avoid repeats)
                recentSet.add(picked.food.id);
                if (recentSet.size > 4) {
                    const first = recentSet.values().next().value;
                    if (first) recentSet.delete(first);
                }
            }
        }
    }

    // 4. Bulk insert all meal foods
    if (mealFoodsToInsert.length > 0) {
        const { error: foodError } = await supabase
            .from('meal_foods')
            .insert(mealFoodsToInsert);

        if (foodError) {
            console.error('Food insert error:', foodError);
            throw new Error('Yemekler plana eklenemedi.');
        }
    }

    return { planId: plan.id };
}
