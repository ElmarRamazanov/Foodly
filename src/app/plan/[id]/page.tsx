'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WeeklyPlan, Food, calculateNutrition } from '@/lib/types';
import DayCard from '@/components/DayCard';
import FoodSearchModal from '@/components/FoodSearchModal';

export default function PlanPage() {
    const params = useParams();
    const router = useRouter();
    const planId = params.id as string;

    const [plan, setPlan] = useState<WeeklyPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [activeMealId, setActiveMealId] = useState<string | null>(null);

    const fetchPlan = useCallback(async () => {
        try {
            const res = await fetch(`/api/plans/${planId}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Plan yüklenemedi.');
                return;
            }

            setPlan(data);
        } catch {
            setError('Plan yüklenirken hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [planId]);

    useEffect(() => {
        fetchPlan();
    }, [fetchPlan]);

    // Gram güncelle
    const handleUpdateGrams = async (mealFoodId: string, grams: number) => {
        try {
            const res = await fetch('/api/plans/meals', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', mealFoodId, grams }),
            });

            if (res.ok) {
                // Lokal state güncelle
                setPlan((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        plan_days: prev.plan_days?.map((day) => ({
                            ...day,
                            plan_meals: day.plan_meals?.map((meal) => ({
                                ...meal,
                                meal_foods: meal.meal_foods?.map((mf) =>
                                    mf.id === mealFoodId ? { ...mf, grams } : mf
                                ),
                            })),
                        })),
                    };
                });
            }
        } catch {
            console.error('Güncelleme hatası');
        }
    };

    // Yiyecek sil
    const handleDeleteFood = async (mealFoodId: string) => {
        try {
            const res = await fetch('/api/plans/meals', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', mealFoodId }),
            });

            if (res.ok) {
                setPlan((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        plan_days: prev.plan_days?.map((day) => ({
                            ...day,
                            plan_meals: day.plan_meals?.map((meal) => ({
                                ...meal,
                                meal_foods: meal.meal_foods?.filter(
                                    (mf) => mf.id !== mealFoodId
                                ),
                            })),
                        })),
                    };
                });
            }
        } catch {
            console.error('Silme hatası');
        }
    };

    // Yiyecek ekle modalı aç
    const handleOpenAddFood = (mealId: string) => {
        setActiveMealId(mealId);
        setModalOpen(true);
    };

    // Yiyecek ekle
    const handleAddFood = async (food: Food, grams: number) => {
        if (!activeMealId) return;

        try {
            const res = await fetch('/api/plans/meals', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add',
                    mealId: activeMealId,
                    foodId: food.id,
                    grams,
                }),
            });

            if (res.ok) {
                const newMealFood = await res.json();

                setPlan((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        plan_days: prev.plan_days?.map((day) => ({
                            ...day,
                            plan_meals: day.plan_meals?.map((meal) => {
                                if (meal.id === activeMealId) {
                                    return {
                                        ...meal,
                                        meal_foods: [...(meal.meal_foods || []), newMealFood],
                                    };
                                }
                                return meal;
                            }),
                        })),
                    };
                });
            }
        } catch {
            console.error('Ekleme hatası');
        }
    };

    // Toplam haftalık kalori
    const weeklyCalories =
        plan?.plan_days?.reduce((total, day) => {
            const dayTotal =
                day.plan_meals?.reduce((daySum, meal) => {
                    const mealTotal =
                        meal.meal_foods?.reduce((mealSum, mf) => {
                            if (!mf.food) return mealSum;
                            return mealSum + calculateNutrition(mf.food, mf.grams).calories;
                        }, 0) || 0;
                    return daySum + mealTotal;
                }, 0) || 0;
            return total + dayTotal;
        }, 0) || 0;

    const weeklyTarget = (plan?.target_calories || 0) * 7;

    if (loading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 16,
                }}
            >
                <div className="spinner" />
                <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
                    Plan yükleniyor...
                </p>
            </div>
        );
    }

    if (error || !plan) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 16,
                    padding: 20,
                }}
            >
                <div style={{ fontSize: 48 }}>😕</div>
                <p style={{ color: 'var(--danger)', fontSize: 16 }}>
                    {error || 'Plan bulunamadı.'}
                </p>
                <button className="btn-secondary" onClick={() => router.push('/')}>
                    ← Ana Sayfaya Dön
                </button>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                background:
                    'radial-gradient(ellipse at top left, rgba(16, 185, 129, 0.06) 0%, transparent 40%), var(--bg-primary)',
            }}
        >
            {/* Header */}
            <header
                className="glass-strong"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 40,
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                }}
            >
                <div
                    style={{
                        maxWidth: 1400,
                        margin: '0 auto',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            className="btn-secondary"
                            onClick={() => router.push('/')}
                            style={{ padding: '8px 14px', fontSize: 13 }}
                        >
                            ← Geri
                        </button>
                        <div>
                            <h1
                                style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}
                            >
                                🥗 Haftalık Beslenme Planı
                            </h1>
                            <p
                                style={{
                                    fontSize: 12,
                                    color: 'var(--text-muted)',
                                    marginTop: 2,
                                }}
                            >
                                Hedef: {plan.target_calories} kcal/gün
                                {plan.gluten_free_only && ' • 🌾 Glütensiz'}
                            </p>
                        </div>
                    </div>

                    {/* Haftalık özet */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ textAlign: 'right' }}>
                            <div
                                style={{
                                    fontSize: 11,
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                }}
                            >
                                Haftalık Toplam
                            </div>
                            <div>
                                <span
                                    style={{
                                        fontWeight: 800,
                                        fontSize: 18,
                                        color: 'var(--accent)',
                                    }}
                                >
                                    {weeklyCalories.toLocaleString('tr-TR')}
                                </span>
                                <span
                                    style={{
                                        color: 'var(--text-muted)',
                                        fontSize: 13,
                                        marginLeft: 4,
                                    }}
                                >
                                    / {weeklyTarget.toLocaleString('tr-TR')} kcal
                                </span>
                            </div>
                        </div>
                        <button className="btn-primary" onClick={() => router.push('/')} style={{ padding: '10px 18px', fontSize: 13 }}>
                            🔄 Yeni Plan
                        </button>
                    </div>
                </div>
            </header>

            {/* Günler grid */}
            <main
                style={{
                    maxWidth: 1400,
                    margin: '0 auto',
                    padding: '24px 20px 60px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                    gap: 20,
                }}
            >
                {plan.plan_days?.map((day) => (
                    <DayCard
                        key={day.id}
                        day={day}
                        targetCalories={plan.target_calories}
                        onUpdateGrams={handleUpdateGrams}
                        onDeleteFood={handleDeleteFood}
                        onAddFood={handleOpenAddFood}
                    />
                ))}
            </main>

            {/* Mobilde sticky kalori özeti */}
            <div
                className="glass-strong"
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '12px 20px',
                    borderTop: '1px solid var(--border)',
                    display: 'none',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 40,
                }}
                id="mobile-summary"
            >
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                    Günlük Ortalama
                </span>
                <span
                    style={{ fontWeight: 800, fontSize: 16, color: 'var(--accent)' }}
                >
                    {Math.round(weeklyCalories / 7)} kcal
                </span>
            </div>

            {/* Yiyecek arama modalı */}
            <FoodSearchModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setActiveMealId(null);
                }}
                onSelect={handleAddFood}
            />

            <style jsx>{`
        @media (max-width: 768px) {
          main {
            grid-template-columns: 1fr !important;
            padding-bottom: 80px !important;
          }
          #mobile-summary {
            display: flex !important;
          }
        }
      `}</style>
        </div>
    );
}
