'use client';

import { PlanMeal, MEAL_TYPES, MealFood, Food, calculateNutrition } from '@/lib/types';
import FoodItem from './FoodItem';
import { useState } from 'react';

interface MealSectionProps {
    meal: PlanMeal;
    onUpdateGrams: (mealFoodId: string, grams: number) => void;
    onDeleteFood: (mealFoodId: string) => void;
    onAddFood: (mealId: string) => void;
}

export default function MealSection({
    meal,
    onUpdateGrams,
    onDeleteFood,
    onAddFood,
}: MealSectionProps) {
    const [collapsed, setCollapsed] = useState(false);

    const mealLabel = MEAL_TYPES[meal.meal_type] || meal.meal_type;
    const foods = meal.meal_foods || [];

    const totalCalories = foods.reduce((sum, mf) => {
        if (!mf.food) return sum;
        return sum + calculateNutrition(mf.food, mf.grams).calories;
    }, 0);

    return (
        <div style={{ marginBottom: 16 }}>
            {/* Öğün başlığı */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                    cursor: 'pointer',
                }}
                onClick={() => setCollapsed(!collapsed)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`meal-badge ${meal.meal_type}`}>{mealLabel}</span>
                    <span
                        style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}
                    >
                        {foods.length} yiyecek
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
                        {totalCalories} kcal
                    </span>
                    <span
                        style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            transition: 'transform 0.2s',
                            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                        }}
                    >
                        ▼
                    </span>
                </div>
            </div>

            {!collapsed && (
                <>
                    {/* Yiyecek listesi */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {foods.map((mf: MealFood) => (
                            <FoodItem
                                key={mf.id}
                                mealFood={mf}
                                onUpdateGrams={onUpdateGrams}
                                onDelete={onDeleteFood}
                            />
                        ))}
                    </div>

                    {/* Yiyecek ekle butonu */}
                    <button
                        onClick={() => onAddFood(meal.id)}
                        style={{
                            marginTop: 8,
                            background: 'transparent',
                            border: '1px dashed var(--border-light)',
                            color: 'var(--text-muted)',
                            padding: '8px 14px',
                            borderRadius: 8,
                            fontSize: 13,
                            cursor: 'pointer',
                            width: '100%',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent)';
                            e.currentTarget.style.color = 'var(--accent)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-light)';
                            e.currentTarget.style.color = 'var(--text-muted)';
                        }}
                    >
                        ➕ Yiyecek Ekle
                    </button>
                </>
            )}
        </div>
    );
}
