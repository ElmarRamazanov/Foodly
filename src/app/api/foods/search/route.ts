import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { searchAndSaveFromUSDA } from '@/lib/usda';

export async function POST(request: NextRequest) {
    try {
        const { query } = await request.json();

        if (!query || query.trim().length < 2) {
            return NextResponse.json(
                { error: 'Arama terimi en az 2 karakter olmalıdır.' },
                { status: 400 }
            );
        }

        // 1. Önce veritabanında ara
        const { data: dbFoods, error: dbError } = await supabase
            .from('foods')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(20);

        if (dbError) {
            return NextResponse.json({ error: 'Veritabanı hatası.' }, { status: 500 });
        }

        // Yeterli sonuç varsa döndür
        if (dbFoods && dbFoods.length >= 3) {
            return NextResponse.json({ foods: dbFoods, source: 'database' });
        }

        // 2. Yetersizse USDA API'den getir
        const usdaFoods = await searchAndSaveFromUSDA(query);

        // DB sonuçlarını ve USDA sonuçlarını birleştir
        const allFoods = [...(dbFoods || []), ...usdaFoods];

        // Tekrarlananları kaldır
        const uniqueFoods = allFoods.filter(
            (food, index, self) => index === self.findIndex((f) => f.id === food.id)
        );

        return NextResponse.json({ foods: uniqueFoods, source: 'combined' });
    } catch {
        return NextResponse.json(
            { error: 'Yiyecek arama sırasında bir hata oluştu.' },
            { status: 500 }
        );
    }
}
