'use client';

import { PlanDay, calculateNutrition } from '@/lib/types';
import MealSection from './MealSection';

interface DayCardProps {
    day: PlanDay;
    targetCalories: number;
    onUpdateGrams: (mealFoodId: string, grams: number) => void;
    onDeleteFood: (mealFoodId: string) => void;
    onAddFood: (mealId: string) => void;
}

export default function DayCard({
    day,
    targetCalories,
    onUpdateGrams,
    onDeleteFood,
    onAddFood,
}: DayCardProps) {
    const meals = day.plan_meals || [];

    // Öğün sıralaması
    const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
    const sortedMeals = [...meals].sort(
        (a, b) => mealOrder.indexOf(a.meal_type) - mealOrder.indexOf(b.meal_type)
    );

    // Gün toplam kalorisi
    const dayCalories = meals.reduce((daySum, meal) => {
        const mealCals = (meal.meal_foods || []).reduce((mealSum, mf) => {
            if (!mf.food) return mealSum;
            return mealSum + calculateNutrition(mf.food, mf.grams).calories;
        }, 0);
        return daySum + mealCals;
    }, 0);

    const ratio = Math.min((dayCalories / targetCalories) * 100, 120);
    const isOver = dayCalories > targetCalories * 1.05;
    const isUnder = dayCalories < targetCalories * 0.9;

    const barColor = isOver
        ? 'var(--danger)'
        : isUnder
            ? 'var(--warning)'
            : 'var(--accent)';

    return (
        <div className="card animate-fade-in">
            {/* Gün başlığı */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}
            >
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{day.day_name}</h3>
                <div style={{ textAlign: 'right' }}>
                    <span
                        style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: barColor,
                        }}
                    >
                        {dayCalories}
                    </span>
                    <span
                        style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 4 }}
                    >
                        / {targetCalories} kcal
                    </span>
                </div>
            </div>

            {/* Kalori barı */}
            <div className="calorie-bar" style={{ marginBottom: 16 }}>
                <div
                    className="calorie-bar-fill"
                    style={{
                        width: `${Math.min(ratio, 100)}%`,
                        background: barColor,
                    }}
                />
            </div>

            {/* Öğünler */}
            {sortedMeals.map((meal) => (
                <MealSection
                    key={meal.id}
                    meal={meal}
                    onUpdateGrams={onUpdateGrams}
                    onDeleteFood={onDeleteFood}
                    onAddFood={onAddFood}
                />
            ))}
        </div>
    );
}
