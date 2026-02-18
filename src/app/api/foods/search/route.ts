import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { query, listAll } = await request.json();

        // List all foods mode (for dropdown)
        if (listAll) {
            const { data: foods, error } = await supabase
                .from('foods')
                .select('*')
                .not('meal_types', 'eq', '{}')
                .order('name');

            if (error) {
                return NextResponse.json({ error: 'Veritabanı hatası.' }, { status: 500 });
            }

            return NextResponse.json({ foods: foods || [], source: 'database' });
        }

        if (!query || query.trim().length < 2) {
            return NextResponse.json(
                { error: 'Arama terimi en az 2 karakter olmalıdır.' },
                { status: 400 }
            );
        }

        const searchTerm = query.trim();

        // 1. Search by name
        const { data: nameResults, error: nameError } = await supabase
            .from('foods')
            .select('*')
            .ilike('name', `%${searchTerm}%`)
            .limit(20);

        // 2. Search by search_hint
        const { data: hintResults, error: hintError } = await supabase
            .from('foods')
            .select('*')
            .ilike('search_hint', `%${searchTerm}%`)
            .limit(20);

        if (nameError && hintError) {
            return NextResponse.json({ error: 'Veritabanı hatası.' }, { status: 500 });
        }

        // Merge and deduplicate
        const allResults = [...(nameResults || []), ...(hintResults || [])];
        const uniqueFoods = allResults.filter(
            (food, index, self) => index === self.findIndex((f) => f.id === food.id)
        );

        return NextResponse.json({ foods: uniqueFoods, source: 'database' });
    } catch {
        return NextResponse.json(
            { error: 'Yiyecek arama sırasında bir hata oluştu.' },
            { status: 500 }
        );
    }
}
