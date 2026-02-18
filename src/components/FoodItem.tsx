'use client';

import { MealFood, calculateNutrition, FoodIngredient } from '@/lib/types';
import { useState } from 'react';

interface FoodItemProps {
    mealFood: MealFood;
    onUpdateGrams: (mealFoodId: string, grams: number) => void;
    onDelete: (mealFoodId: string) => void;
}

/**
 * Scale ingredient amounts proportionally based on actual grams vs portion_grams.
 * E.g. if portion_grams = 300 and actual grams = 450, scale each ingredient by 1.5x.
 */
function scaleIngredients(
    ingredients: FoodIngredient[],
    portionGrams: number,
    actualGrams: number
): { name: string; scaledAmount: string }[] {
    if (!ingredients || ingredients.length === 0) return [];
    const ratio = portionGrams > 0 ? actualGrams / portionGrams : 1;

    return ingredients.map((ing) => {
        // Extract numeric value and unit from amount string like "150g", "50 g", "200ml"
        const match = ing.amount.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
        if (match) {
            const originalValue = parseFloat(match[1]);
            const unit = match[2] || 'g';
            const scaled = Math.round(originalValue * ratio);
            return { name: ing.name, scaledAmount: `${scaled}${unit}` };
        }
        return { name: ing.name, scaledAmount: ing.amount };
    });
}

export default function FoodItem({
    mealFood,
    onUpdateGrams,
    onDelete,
}: FoodItemProps) {
    const [editing, setEditing] = useState(false);
    const [tempGrams, setTempGrams] = useState(mealFood.grams);
    const [showIngredients, setShowIngredients] = useState(false);

    const food = mealFood.food;
    if (!food) return null;

    const nutrition = calculateNutrition(food, mealFood.grams);
    const hasIngredients = food.ingredients && Array.isArray(food.ingredients) && food.ingredients.length > 0;
    const scaledIngredients = hasIngredients
        ? scaleIngredients(food.ingredients, food.portion_grams || 300, mealFood.grams)
        : [];

    const handleSave = () => {
        if (tempGrams > 0 && tempGrams !== mealFood.grams) {
            onUpdateGrams(mealFood.id, tempGrams);
        }
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setTempGrams(mealFood.grams);
            setEditing(false);
        }
    };

    return (
        <div
            className="animate-fade-in"
            style={{
                borderRadius: 10,
                background: 'var(--bg-secondary)',
                overflow: 'hidden',
            }}
        >
            {/* Ana satır */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                {/* Sol: Yiyecek adı ve besin */}
                <div style={{ flex: 1, minWidth: 120 }}>
                    <div
                        style={{
                            fontWeight: 500,
                            fontSize: 14,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {food.name}
                        {hasIngredients && (
                            <button
                                onClick={() => setShowIngredients(!showIngredients)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--accent)',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    padding: '0 4px',
                                    opacity: 0.8,
                                    transition: 'opacity 0.2s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                                title={showIngredients ? 'İçerikleri gizle' : 'İçerikleri göster'}
                            >
                                {showIngredients ? '▲' : '▼'}
                            </button>
                        )}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            marginTop: 2,
                            display: 'flex',
                            gap: 8,
                        }}
                    >
                        <span>P: {nutrition.protein}g</span>
                        <span>K: {nutrition.carbs}g</span>
                        <span>Y: {nutrition.fat}g</span>
                    </div>
                </div>

                {/* Orta: Gram */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {editing ? (
                        <input
                            type="number"
                            value={tempGrams}
                            onChange={(e) => setTempGrams(Number(e.target.value))}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            min={10}
                            max={1000}
                            step={10}
                            style={{
                                width: 70,
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: 'var(--bg-card)',
                                border: '1px solid var(--accent)',
                                color: 'var(--text-primary)',
                                fontSize: 13,
                                textAlign: 'center',
                                outline: 'none',
                            }}
                        />
                    ) : (
                        <button
                            onClick={() => {
                                setTempGrams(mealFood.grams);
                                setEditing(true);
                            }}
                            style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 13,
                                cursor: 'pointer',
                                transition: 'border-color 0.2s',
                            }}
                            title="Gramı düzenlemek için tıklayın"
                        >
                            {mealFood.grams}g
                        </button>
                    )}
                </div>

                {/* Sağ: Kalori ve sil */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                        style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: 'var(--accent)',
                            minWidth: 60,
                            textAlign: 'right',
                        }}
                    >
                        {nutrition.calories} kcal
                    </span>
                    <button
                        onClick={() => onDelete(mealFood.id)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontSize: 16,
                            padding: 4,
                            lineHeight: 1,
                            opacity: 0.6,
                            transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                        title="Sil"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* İçerik detayları (expandable) */}
            {showIngredients && scaledIngredients.length > 0 && (
                <div
                    className="animate-fade-in"
                    style={{
                        padding: '6px 14px 10px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 4,
                    }}
                >
                    {scaledIngredients.map((ing, idx) => (
                        <span
                            key={idx}
                            style={{
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                background: 'var(--bg-card)',
                                padding: '3px 8px',
                                borderRadius: 6,
                                border: '1px solid var(--border)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                                {ing.scaledAmount}
                            </span>{' '}
                            {ing.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
