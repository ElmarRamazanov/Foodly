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

// Yiyecek kategorilerine göre öğün eşleştirme
export const MEAL_CATEGORY_MAP: Record<string, string[]> = {
    breakfast: ['breakfast', 'snack'],
    lunch: ['main', 'breakfast'],
    dinner: ['main'],
    snack: ['snack'],
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
