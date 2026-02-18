import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyPlan } from '@/lib/plan-generator';

export async function POST(request: NextRequest) {
    try {
        const { targetCalories, glutenFree, forbiddenFoods, mealCount } = await request.json();

        if (!targetCalories || targetCalories < 800 || targetCalories > 6000) {
            return NextResponse.json(
                { error: 'Kalori hedefi 800-6000 arasında olmalıdır.' },
                { status: 400 }
            );
        }

        const validMealCount = [3, 4, 5].includes(mealCount) ? mealCount : 4;

        // Utilize the improved generator logic
        const result = await generateWeeklyPlan(
            targetCalories,
            glutenFree,
            forbiddenFoods || [],
            validMealCount
        );

        return NextResponse.json(result);
    } catch (err: any) {
        console.error('Plan generation error:', err);
        return NextResponse.json(
            { error: err.message || 'Plan oluşturulurken bir hata oluştu.' },
            { status: 500 }
        );
    }
}
