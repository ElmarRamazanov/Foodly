import { supabase } from '@/lib/supabase';
import { Food } from '@/lib/types';
import { PostgrestError } from '@supabase/supabase-js';

// ---- Virtual Food Classification (Since DB schema cannot change) ----
// In a real app, these would be columns in the 'foods' table.

type FoodCategory =
    | 'protein' | 'carb' | 'vegetable' | 'fruit'
    | 'dairy' | 'fat' | 'sweet' | 'main' | 'light';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface FoodMetadata {
    meal_types: MealType[];
    category: FoodCategory;
}

const FOOD_METADATA: Record<string, FoodMetadata> = {
    // Breakfast Items
    'Yumurta': { meal_types: ['breakfast', 'lunch', 'dinner'], category: 'protein' },
    'Yulaf Ezmesi': { meal_types: ['breakfast'], category: 'carb' },
    'Beyaz Peynir': { meal_types: ['breakfast', 'snack'], category: 'dairy' }, // Also protein
    'Bal': { meal_types: ['breakfast'], category: 'sweet' },
    'Tam Buğday Ekmeği': { meal_types: ['breakfast', 'lunch', 'dinner'], category: 'carb' },
    'Zeytin': { meal_types: ['breakfast'], category: 'fat' },
    'Domates': { meal_types: ['breakfast', 'lunch', 'dinner'], category: 'vegetable' },
    'Salatalık': { meal_types: ['breakfast', 'lunch', 'dinner', 'snack'], category: 'vegetable' },
    'Tereyağı': { meal_types: ['breakfast'], category: 'fat' },
    'Süt': { meal_types: ['breakfast', 'snack'], category: 'dairy' },

    // Main Dishes
    'Tavuk Göğsü': { meal_types: ['lunch', 'dinner'], category: 'protein' },
    'Kıyma (Dana)': { meal_types: ['lunch', 'dinner'], category: 'protein' },
    'Somon': { meal_types: ['lunch', 'dinner'], category: 'protein' },
    'Pirinç': { meal_types: ['lunch', 'dinner'], category: 'carb' },
    'Bulgur': { meal_types: ['lunch', 'dinner'], category: 'carb' },
    'Makarna': { meal_types: ['lunch', 'dinner'], category: 'carb' },
    'Mercimek': { meal_types: ['lunch', 'dinner'], category: 'main' }, // Plant protein
    'Nohut': { meal_types: ['lunch', 'dinner'], category: 'main' },
    'Brokoli': { meal_types: ['lunch', 'dinner'], category: 'vegetable' },
    'Ispanak': { meal_types: ['lunch', 'dinner'], category: 'vegetable' },
    'Havuç': { meal_types: ['lunch', 'dinner', 'snack'], category: 'vegetable' },
    'Patates': { meal_types: ['lunch', 'dinner'], category: 'carb' },
    'Zeytinyağı': { meal_types: ['lunch', 'dinner'], category: 'fat' },
    'Soğan': { meal_types: ['lunch', 'dinner'], category: 'vegetable' }, // Flavor base
    'Sarımsak': { meal_types: ['lunch', 'dinner'], category: 'vegetable' },
    'Biber (Yeşil)': { meal_types: ['lunch', 'dinner', 'breakfast'], category: 'vegetable' },
    'Kuru Fasulye': { meal_types: ['lunch', 'dinner'], category: 'main' },
    'Ton Balığı (Konserve)': { meal_types: ['lunch', 'dinner'], category: 'protein' },

    // Snacks / Fruits
    'Elma': { meal_types: ['snack', 'breakfast'], category: 'fruit' },
    'Muz': { meal_types: ['snack', 'breakfast'], category: 'fruit' },
    'Portakal': { meal_types: ['snack'], category: 'fruit' },
    'Çilek': { meal_types: ['snack', 'breakfast'], category: 'fruit' },
    'Ceviz': { meal_types: ['snack', 'breakfast'], category: 'fat' },
    'Badem': { meal_types: ['snack', 'breakfast'], category: 'fat' },
    'Yoğurt': { meal_types: ['snack', 'breakfast', 'lunch', 'dinner'], category: 'dairy' },
    'Kuru Üzüm': { meal_types: ['snack', 'breakfast'], category: 'fruit' },
    'Kuru Kayısı': { meal_types: ['snack'], category: 'fruit' },
    'Bitter Çikolata': { meal_types: ['snack'], category: 'sweet' },
    'Pirinç Patlağı': { meal_types: ['snack'], category: 'carb' }, // Light carb
    'Havuç (Çiğ)': { meal_types: ['snack'], category: 'vegetable' },
};

interface ExtendedFood extends Food {
    meal_types: MealType[];
    category: FoodCategory;
}

// ---- Helpers ----

/**
 * Assigns virtual metadata to the raw DB food object.
 * Fallback to 'snack'/'light' if not found.
 */
function classifyFood(food: Food): ExtendedFood {
    const meta = FOOD_METADATA[food.name] || { meal_types: ['snack'], category: 'light' };
    return { ...food, ...meta };
}

function getFoodsByMealType(foods: ExtendedFood[], type: MealType): ExtendedFood[] {
    return foods.filter(f => f.meal_types.includes(type));
}

function groupFoodsByCategory(foods: ExtendedFood[]): Record<FoodCategory, ExtendedFood[]> {
    const groups: Record<string, ExtendedFood[]> = {};
    for (const f of foods) {
        if (!groups[f.category]) groups[f.category] = [];
        groups[f.category].push(f);
    }
    return groups as Record<FoodCategory, ExtendedFood[]>;
}

function getRandomItem<T>(items: T[]): T | null {
    if (!items || items.length === 0) return null;
    return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
}

// Adjust grams to meet calorie target
function adjustGramsToCalories(food: ExtendedFood, targetCal: number): number {
    if (food.calories_per_100g <= 0) return 0;
    const grams = (targetCal / food.calories_per_100g) * 100;
    // Round to nearest 10 for realism
    return Math.max(10, Math.round(grams / 10) * 10);
}

// ---- Meal Builders ----

function buildBreakfast(
    availableFoods: ExtendedFood[],
    targetCalories: number,
    usedFoodIds: Set<string> // avoid repetition within meal
): { food: ExtendedFood, grams: number }[] {
    const mealFoods: { food: ExtendedFood, grams: number }[] = [];
    let remainingCalories = targetCalories;

    const foodsByCat = groupFoodsByCategory(availableFoods);

    // Rule: 1 Protein + 1 Carb
    const protein = getRandomItem(foodsByCat['protein'] || foodsByCat['dairy']);
    const carb = getRandomItem(foodsByCat['carb']);

    if (protein && carb) {
        // Distribute calories: 40% protein, 40% carb, 20% others
        const pCals = targetCalories * 0.4;
        const cCals = targetCalories * 0.4;

        mealFoods.push({ food: protein, grams: adjustGramsToCalories(protein, pCals) });
        mealFoods.push({ food: carb, grams: adjustGramsToCalories(carb, cCals) });

        remainingCalories -= (pCals + cCals);
        usedFoodIds.add(protein.id);
        usedFoodIds.add(carb.id);
    }

    // Optional: Veggie/Fruit/Extra
    if (remainingCalories > 50) {
        const extraOptions = [
            ...(foodsByCat['vegetable'] || []),
            ...(foodsByCat['fruit'] || []),
            ...(foodsByCat['fat'] || []), // e.g. olives/butter
            ...(foodsByCat['sweet'] || []) // honey
        ].filter(f => !usedFoodIds.has(f.id));

        const extra = getRandomItem(extraOptions);
        if (extra) {
            mealFoods.push({ food: extra, grams: adjustGramsToCalories(extra, remainingCalories) });
        }
    }

    return mealFoods;
}

function buildLunch(
    availableFoods: ExtendedFood[],
    targetCalories: number,
    usedFoodIds: Set<string>
): { food: ExtendedFood, grams: number }[] {
    const mealFoods: { food: ExtendedFood, grams: number }[] = [];
    let remainingCalories = targetCalories;

    const foodsByCat = groupFoodsByCategory(availableFoods);

    // Rule: 1 Main/Protein + 1 Carb + 1 Veg/Salad
    // Also consider 'main' category as complete dish (like beans) which might need less carb

    // Priorities:
    // 1. Protein source (Chicken, Meat, Fish) OR 'Main' legume dish
    const mainOptions = [...(foodsByCat['protein'] || []), ...(foodsByCat['main'] || [])];
    const mainDish = getRandomItem(mainOptions);

    if (mainDish) {
        // Determine portion
        const mainCals = targetCalories * 0.45;
        mealFoods.push({ food: mainDish, grams: adjustGramsToCalories(mainDish, mainCals) });
        remainingCalories -= mainCals;
        usedFoodIds.add(mainDish.id);
    }

    // 2. Carb source (Rice, Pasta, Bread, Potato)
    const carbOptions = [...(foodsByCat['carb'] || [])].filter(f => !usedFoodIds.has(f.id));
    const carbDish = getRandomItem(carbOptions);

    if (carbDish) {
        const carbCals = targetCalories * 0.35;
        mealFoods.push({ food: carbDish, grams: adjustGramsToCalories(carbDish, carbCals) });
        remainingCalories -= carbCals;
        usedFoodIds.add(carbDish.id);
    }

    // 3. Vegetable / Salad / Soup
    // Add yogurt (dairy) here too as side
    const sideOptions = [
        ...(foodsByCat['vegetable'] || []),
        ...(foodsByCat['dairy'] || [])
    ].filter(f => !usedFoodIds.has(f.id));

    const sideDish = getRandomItem(sideOptions);

    if (sideDish && remainingCalories > 30) {
        mealFoods.push({ food: sideDish, grams: adjustGramsToCalories(sideDish, remainingCalories) });
    }

    return mealFoods;
}

function buildDinner(
    availableFoods: ExtendedFood[],
    targetCalories: number,
    usedFoodIds: Set<string>
): { food: ExtendedFood, grams: number }[] {
    // Dinner similar to lunch but maybe lighter carbs or no carbs if configured (std rule: maintain balance)
    // Rule: 1 Main + 1 Veg + Optional Light Carb

    const mealFoods: { food: ExtendedFood, grams: number }[] = [];
    let remainingCalories = targetCalories;

    const foodsByCat = groupFoodsByCategory(availableFoods);

    // 1. Main Protein
    const mainOptions = [...(foodsByCat['protein'] || []), ...(foodsByCat['main'] || [])];
    const mainDish = getRandomItem(mainOptions);

    if (mainDish) {
        const mainCals = targetCalories * 0.50; // Higher protein ratio for dinner
        mealFoods.push({ food: mainDish, grams: adjustGramsToCalories(mainDish, mainCals) });
        remainingCalories -= mainCals;
        usedFoodIds.add(mainDish.id);
    }

    // 2. Vegetable Side (Important for dinner)
    const vegOptions = [...(foodsByCat['vegetable'] || [])].filter(f => !usedFoodIds.has(f.id));
    const vegDish = getRandomItem(vegOptions);

    if (vegDish) {
        const vegCals = targetCalories * 0.20;
        // Veggies are low cal, so grams might be high. Cap at reasonable amount (e.g. 300g) inside adjust?
        // simple logic:
        let g = adjustGramsToCalories(vegDish, vegCals);
        if (g > 300) g = 300;
        mealFoods.push({ food: vegDish, grams: g });
        remainingCalories -= (vegDish.calories_per_100g * g / 100);
    }

    // 3. Optional Light Carb or Soup/Yogurt
    if (remainingCalories > 50) {
        const fillerOptions = [
            ...(foodsByCat['carb'] || []), // Light carbs
            ...(foodsByCat['dairy'] || []) // Yogurt
        ].filter(f => !usedFoodIds.has(f.id));

        const filler = getRandomItem(fillerOptions);
        if (filler) {
            mealFoods.push({ food: filler, grams: adjustGramsToCalories(filler, remainingCalories) });
        }
    }

    return mealFoods;
}

function buildSnack(
    availableFoods: ExtendedFood[],
    targetCalories: number
): { food: ExtendedFood, grams: number }[] {
    // Rule: ONE item only (Fruit OR Yogurt OR Nuts)
    const foodsByCat = groupFoodsByCategory(availableFoods);

    const snackOptions = [
        ...(foodsByCat['fruit'] || []),
        ...(foodsByCat['dairy'] || []), // Yogurt
        ...(foodsByCat['fat'] || []).filter(f => f.category === 'fat'), // Nuts
        ...(foodsByCat['sweet'] || []), // Dark chocolate
        ...(foodsByCat['carb'] || []).filter(f => f.name.includes('Patlağı')) // Rice cakes
    ];

    const snack = getRandomItem(snackOptions);

    if (snack) {
        return [{ food: snack, grams: adjustGramsToCalories(snack, targetCalories) }];
    }

    return [];
}


// ---- Main Generator Function ----

export async function generateWeeklyPlan(targetCalories: number, glutenFree: boolean) {
    // 1. Fetch all foods
    let query = supabase.from('foods').select('*');
    if (glutenFree) {
        query = query.eq('gluten_free', true);
    }

    const { data: rawFoods, error } = await query;
    if (error || !rawFoods || rawFoods.length === 0) {
        throw new Error('Yiyecek verisi bulunamadı.');
    }

    // 2. Classify Foods
    const allFoods: ExtendedFood[] = rawFoods.map(classifyFood);

    // 3. Create Plan Record
    const { data: plan, error: planError } = await supabase
        .from('weekly_plans')
        .insert({ target_calories: targetCalories, gluten_free_only: glutenFree })
        .select()
        .single();

    if (planError) throw new Error('Plan oluşturulamadı: ' + planError.message);

    // 4. Generate Days
    const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    const meals: any[] = [];
    const mealFoodsToInsert: any[] = [];

    // Tracking rotation
    const previousMains: string[] = [];
    // const previousBreakfasts: string[] = []; // Could use for deeper logic

    for (let i = 0; i < 7; i++) {
        // Create Day
        const { data: day, error: dayError } = await supabase
            .from('plan_days')
            .insert({ weekly_plan_id: plan.id, day_name: dayNames[i], day_order: i })
            .select()
            .single();

        if (dayError) continue;

        // Create 4 Meals
        // Calorie Split: 25% - 30% - 30% - 15%
        const mealConfigs = [
            { type: 'breakfast' as MealType, ratio: 0.25 },
            { type: 'lunch' as MealType, ratio: 0.30 },
            { type: 'dinner' as MealType, ratio: 0.30 },
            { type: 'snack' as MealType, ratio: 0.15 }
        ];

        for (const config of mealConfigs) {
            const { data: meal, error: mealError } = await supabase
                .from('plan_meals')
                .insert({ day_id: day.id, meal_type: config.type })
                .select()
                .single();

            if (mealError) continue;

            const mealCalories = targetCalories * config.ratio;
            const available = getFoodsByMealType(allFoods, config.type);

            // Randomize available foods
            const shuffledAvailable = shuffle(available);

            let selectedItems: { food: ExtendedFood, grams: number }[] = [];
            const usedIds = new Set<string>();

            // --- Apply Rotation Logic ---
            // Filter out recently eaten mains for Lunch/Dinner
            let filteredAvailable = shuffledAvailable;
            if (config.type === 'lunch' || config.type === 'dinner') {
                filteredAvailable = shuffledAvailable.filter(f => !previousMains.includes(f.name));
            }
            if (filteredAvailable.length === 0) filteredAvailable = shuffledAvailable; // Fallback

            if (config.type === 'breakfast') {
                selectedItems = buildBreakfast(filteredAvailable, mealCalories, usedIds);
            } else if (config.type === 'lunch') {
                selectedItems = buildLunch(filteredAvailable, mealCalories, usedIds);
                // Record main dish for rotation
                const main = selectedItems.find(i => i.food.category === 'main' || i.food.category === 'protein');
                if (main) previousMains.push(main.food.name);
            } else if (config.type === 'dinner') {
                selectedItems = buildDinner(filteredAvailable, mealCalories, usedIds);
                // Record main dish
                const main = selectedItems.find(i => i.food.category === 'main' || i.food.category === 'protein');
                if (main) previousMains.push(main.food.name);
            } else if (config.type === 'snack') {
                selectedItems = buildSnack(filteredAvailable, mealCalories);
            }

            // Keep rotation buffer small (last 3 items)
            if (previousMains.length > 5) previousMains.shift();

            // Prepare Inserts
            for (const item of selectedItems) {
                mealFoodsToInsert.push({
                    meal_id: meal.id,
                    food_id: item.food.id,
                    grams: item.grams
                });
            }
        }
    }

    // Bulk Insert Foods
    if (mealFoodsToInsert.length > 0) {
        const { error: foodError } = await supabase
            .from('meal_foods')
            .insert(mealFoodsToInsert);

        if (foodError) console.error('Food insert error:', foodError);
    }

    return { planId: plan.id };
}
