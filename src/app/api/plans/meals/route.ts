import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'update': {
                // Gram güncelle
                const { mealFoodId, grams } = body;
                if (!mealFoodId || !grams || grams <= 0) {
                    return NextResponse.json(
                        { error: 'Geçersiz parametre.' },
                        { status: 400 }
                    );
                }

                const { data, error } = await supabase
                    .from('meal_foods')
                    .update({ grams })
                    .eq('id', mealFoodId)
                    .select(`*, food:foods(*)`)
                    .single();

                if (error) {
                    return NextResponse.json(
                        { error: 'Güncelleme başarısız.' },
                        { status: 500 }
                    );
                }

                return NextResponse.json(data);
            }

            case 'delete': {
                const { mealFoodId } = body;
                if (!mealFoodId) {
                    return NextResponse.json(
                        { error: 'Geçersiz parametre.' },
                        { status: 400 }
                    );
                }

                const { error } = await supabase
                    .from('meal_foods')
                    .delete()
                    .eq('id', mealFoodId);

                if (error) {
                    return NextResponse.json(
                        { error: 'Silme başarısız.' },
                        { status: 500 }
                    );
                }

                return NextResponse.json({ success: true });
            }

            case 'add': {
                const { mealId, foodId, grams } = body;
                if (!mealId || !foodId) {
                    return NextResponse.json(
                        { error: 'Geçersiz parametre.' },
                        { status: 400 }
                    );
                }

                const { data, error } = await supabase
                    .from('meal_foods')
                    .insert({
                        meal_id: mealId,
                        food_id: foodId,
                        grams: grams || 100,
                    })
                    .select(`*, food:foods(*)`)
                    .single();

                if (error) {
                    return NextResponse.json(
                        { error: 'Ekleme başarısız.' },
                        { status: 500 }
                    );
                }

                return NextResponse.json(data);
            }

            default:
                return NextResponse.json(
                    { error: 'Geçersiz işlem.' },
                    { status: 400 }
                );
        }
    } catch {
        return NextResponse.json(
            { error: 'İşlem sırasında bir hata oluştu.' },
            { status: 500 }
        );
    }
}
