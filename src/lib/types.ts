export interface FoodIngredient {
    name: string;
    amount: string;
}

export interface Food {
    id: string;
    name: string;
    calories_per_100g: number;
    protein: number;
    carbs: number;
    fat: number;
    gluten_free: boolean;
    category: string;
    created_at: string;
    meal_types: string[];
    tags: string[];
    allergens: string[];
    portion_grams: number;
    search_hint: string;
    ingredients: FoodIngredient[];
}

export interface MealFood {
    id: string;
    meal_id: string;
    food_id: string;
    grams: number;
    food?: Food;
    // Hesaplanan değerler
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

export interface PlanMeal {
    id: string;
    day_id: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    meal_foods?: MealFood[];
    // Hesaplanan
    total_calories?: number;
}

export interface PlanDay {
    id: string;
    weekly_plan_id: string;
    day_name: string;
    day_order: number;
    plan_meals?: PlanMeal[];
    // Hesaplanan
    total_calories?: number;
}

export interface WeeklyPlan {
    id: string;
    target_calories: number;
    gluten_free_only: boolean;
    created_at: string;
    plan_days?: PlanDay[];
    forbidden_foods?: string[];
    meal_count?: number;
}

export const MEAL_TYPES = {
    breakfast: 'Kahvaltı',
    lunch: 'Öğle Yemeği',
    dinner: 'Akşam Yemeği',
    snack: 'Atıştırmalık',
} as const;

export const DAY_NAMES = [
    'Pazartesi',
    'Salı',
    'Çarşamba',
    'Perşembe',
    'Cuma',
    'Cumartesi',
    'Pazar',
] as const;

export const MEAL_CALORIE_RATIOS = {
    breakfast: 0.25,
    lunch: 0.30,
    dinner: 0.30,
    snack: 0.15,
} as const;

/**
 * Dynamic calorie ratio configs based on meal count.
 * 3 meals: no snack
 * 4 meals: standard (breakfast + lunch + dinner + snack)
 * 5 meals: breakfast + morning snack + lunch + afternoon snack + dinner
 */
export function getMealConfigForCount(mealCount: number): { type: string; ratio: number }[] {
    switch (mealCount) {
        case 3:
            return [
                { type: 'breakfast', ratio: 0.30 },
                { type: 'lunch', ratio: 0.35 },
                { type: 'dinner', ratio: 0.35 },
            ];
        case 5:
            return [
                { type: 'breakfast', ratio: 0.22 },
                { type: 'snack', ratio: 0.10 },
                { type: 'lunch', ratio: 0.28 },
                { type: 'snack', ratio: 0.12 },
                { type: 'dinner', ratio: 0.28 },
            ];
        case 4:
        default:
            return [
                { type: 'breakfast', ratio: 0.25 },
                { type: 'lunch', ratio: 0.30 },
                { type: 'dinner', ratio: 0.30 },
                { type: 'snack', ratio: 0.15 },
            ];
    }
}

// Yiyecek öğün türü eşleştirme (artık DB'deki meal_types sütunu kullanılıyor)
export const MEAL_CATEGORY_MAP: Record<string, string[]> = {
    breakfast: ['breakfast', 'snack'],
    lunch: ['lunch', 'dinner'],
    dinner: ['dinner', 'lunch'],
    snack: ['snack', 'breakfast'],
};

export function calculateNutrition(food: Food, grams: number) {
    const ratio = grams / 100;
    return {
        calories: Math.round(food.calories_per_100g * ratio),
        protein: Math.round(food.protein * ratio * 10) / 10,
        carbs: Math.round(food.carbs * ratio * 10) / 10,
        fat: Math.round(food.fat * ratio * 10) / 10,
    };
}
