import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Plan bilgisini getir
        const { data: plan, error: planError } = await supabase
            .from('weekly_plans')
            .select('*')
            .eq('id', id)
            .single();

        if (planError || !plan) {
            return NextResponse.json(
                { error: 'Plan bulunamadı.' },
                { status: 404 }
            );
        }

        // Günleri getir
        const { data: days, error: daysError } = await supabase
            .from('plan_days')
            .select('*')
            .eq('weekly_plan_id', id)
            .order('day_order');

        if (daysError || !days) {
            return NextResponse.json(
                { error: 'Plan günleri yüklenemedi.' },
                { status: 500 }
            );
        }

        // Her gün için öğünleri ve yiyecekleri getir
        const fullDays = await Promise.all(
            days.map(async (day) => {
                const { data: meals } = await supabase
                    .from('plan_meals')
                    .select('*')
                    .eq('day_id', day.id)
                    .order('meal_type');

                const fullMeals = meals
                    ? await Promise.all(
                        meals.map(async (meal) => {
                            const { data: mealFoods } = await supabase
                                .from('meal_foods')
                                .select(`
                    *,
                    food:foods(*)
                  `)
                                .eq('meal_id', meal.id);

                            return {
                                ...meal,
                                meal_foods: mealFoods || [],
                            };
                        })
                    )
                    : [];

                return {
                    ...day,
                    plan_meals: fullMeals,
                };
            })
        );

        return NextResponse.json({
            ...plan,
            plan_days: fullDays,
        });
    } catch {
        return NextResponse.json(
            { error: 'Plan yüklenirken bir hata oluştu.' },
            { status: 500 }
        );
    }
}
