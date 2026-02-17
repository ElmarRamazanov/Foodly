import { supabase } from './supabase';

const USDA_API_KEY = process.env.USDA_API_KEY;

if (!USDA_API_KEY) {
    throw new Error(
        'USDA_API_KEY eksik. Lütfen .env.local dosyanıza veya Vercel proje ayarlarınıza USDA_API_KEY ekleyin.'
    );
}
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

interface UsdaFoodNutrient {
    nutrientId: number;
    nutrientName: string;
    value: number;
}

interface UsdaFood {
    fdcId: number;
    description: string;
    foodNutrients: UsdaFoodNutrient[];
}

interface UsdaSearchResult {
    foods: UsdaFood[];
}

function extractNutrient(nutrients: UsdaFoodNutrient[], id: number): number {
    const nutrient = nutrients.find((n) => n.nutrientId === id);
    return nutrient ? Math.round(nutrient.value * 10) / 10 : 0;
}

export async function searchUSDA(query: string): Promise<{
    name: string;
    calories_per_100g: number;
    protein: number;
    carbs: number;
    fat: number;
}[]> {
    try {
        const response = await fetch(
            `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=10&dataType=Foundation,SR Legacy`,
        );

        if (!response.ok) return [];

        const data: UsdaSearchResult = await response.json();

        return data.foods.map((food) => ({
            name: food.description,
            calories_per_100g: extractNutrient(food.foodNutrients, 1008), // Energy (kcal)
            protein: extractNutrient(food.foodNutrients, 1003),
            carbs: extractNutrient(food.foodNutrients, 1005),
            fat: extractNutrient(food.foodNutrients, 1004),
        }));
    } catch {
        console.error('USDA API hatası');
        return [];
    }
}

export async function searchAndSaveFromUSDA(query: string) {
    const results = await searchUSDA(query);

    const saved = [];
    for (const item of results.slice(0, 5)) {
        // DB'ye kaydet
        const { data, error } = await supabase
            .from('foods')
            .insert({
                name: item.name,
                calories_per_100g: item.calories_per_100g,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                gluten_free: true, // varsayılan, kullanıcı düzenleyebilir
                category: 'general',
            })
            .select()
            .single();

        if (!error && data) {
            saved.push(data);
        }
    }

    return saved;
}
