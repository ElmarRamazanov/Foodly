'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Food } from '@/lib/types';

interface FoodSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (food: Food, grams: number) => void;
}

const MEAL_TYPE_LABELS: Record<string, string> = {
    breakfast: '🌅 Kahvaltı',
    lunch: '☀️ Öğle',
    dinner: '🌙 Akşam',
    snack: '🍎 Ara Öğün',
};

const MEAL_TYPE_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function FoodSearchModal({
    isOpen,
    onClose,
    onSelect,
}: FoodSearchModalProps) {
    const [query, setQuery] = useState('');
    const [allFoods, setAllFoods] = useState<Food[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [grams, setGrams] = useState(100);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Load ALL foods once when modal opens
    useEffect(() => {
        if (isOpen && allFoods.length === 0) {
            setLoading(true);
            fetch('/api/foods/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: '', listAll: true }),
            })
                .then((res) => res.json())
                .then((data) => setAllFoods(data.foods || []))
                .catch(() => setAllFoods([]))
                .finally(() => setLoading(false));
        }
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
        if (!isOpen) {
            setQuery('');
            setSelectedFood(null);
            setGrams(100);
            setActiveCategory('all');
        }
    }, [isOpen, allFoods.length]);

    // Filter foods by query and category
    const filteredFoods = useMemo(() => {
        let foods = allFoods;

        // Category filter
        if (activeCategory !== 'all') {
            foods = foods.filter(
                (f) => f.meal_types && f.meal_types.includes(activeCategory)
            );
        }

        // Text filter
        const q = query.trim().toLowerCase();
        if (q.length > 0) {
            foods = foods.filter(
                (f) =>
                    f.name.toLowerCase().includes(q) ||
                    (f.search_hint && f.search_hint.toLowerCase().includes(q)) ||
                    (f.tags && f.tags.some((t) => t.toLowerCase().includes(q)))
            );
        }

        return foods;
    }, [allFoods, query, activeCategory]);

    // Group by meal type for display (only when no filter active)
    const groupedFoods = useMemo(() => {
        if (activeCategory !== 'all' || query.trim().length > 0) return null;

        const groups: Record<string, Food[]> = {};
        for (const food of filteredFoods) {
            const primaryType =
                food.meal_types?.find((t) => MEAL_TYPE_ORDER.includes(t)) || 'snack';
            if (!groups[primaryType]) groups[primaryType] = [];
            groups[primaryType].push(food);
        }
        return groups;
    }, [filteredFoods, activeCategory, query]);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (selectedFood && grams > 0) {
            onSelect(selectedFood, grams);
            onClose();
        }
    };

    const calcCalories = (food: Food) =>
        Math.round((food.calories_per_100g * grams) / 100);

    const renderFoodItem = (food: Food) => (
        <div
            key={food.id}
            onClick={() => {
                setSelectedFood(food);
                setGrams(food.portion_grams || 100);
            }}
            style={{
                padding: '10px 14px',
                borderRadius: 10,
                cursor: 'pointer',
                border:
                    selectedFood?.id === food.id
                        ? '1px solid var(--accent)'
                        : '1px solid transparent',
                background:
                    selectedFood?.id === food.id
                        ? 'var(--accent-glow)'
                        : 'transparent',
                marginBottom: 2,
                transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
                if (selectedFood?.id !== food.id) {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                }
            }}
            onMouseLeave={(e) => {
                if (selectedFood?.id !== food.id) {
                    e.currentTarget.style.background = 'transparent';
                }
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <span style={{ fontWeight: 500, fontSize: 14 }}>{food.name}</span>
                <span
                    style={{
                        color: 'var(--accent)',
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        marginLeft: 8,
                    }}
                >
                    {food.calories_per_100g} kcal/100g
                </span>
            </div>
            <div
                style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginTop: 3,
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                }}
            >
                <span>P: {food.protein}g</span>
                <span>K: {food.carbs}g</span>
                <span>Y: {food.fat}g</span>
                {food.portion_grams > 0 && (
                    <span>📦 {food.portion_grams}g</span>
                )}
                {food.gluten_free && (
                    <span style={{ color: 'var(--success)' }}>🌾</span>
                )}
            </div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}
                >
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>🍽️ Yemek Seç</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: 24,
                            cursor: 'pointer',
                            lineHeight: 1,
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Search + Category filters */}
                <div style={{ padding: '12px 24px 0', flexShrink: 0 }}>
                    <input
                        ref={inputRef}
                        type="text"
                        className="input-field"
                        placeholder="Yemek ara veya aşağıdan seç..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ fontSize: 14 }}
                    />
                    <div
                        style={{
                            display: 'flex',
                            gap: 6,
                            marginTop: 10,
                            marginBottom: 8,
                            overflowX: 'auto',
                        }}
                    >
                        <button
                            onClick={() => setActiveCategory('all')}
                            style={{
                                padding: '5px 12px',
                                borderRadius: 20,
                                border:
                                    activeCategory === 'all'
                                        ? '1px solid var(--accent)'
                                        : '1px solid var(--border)',
                                background:
                                    activeCategory === 'all'
                                        ? 'var(--accent-glow)'
                                        : 'var(--bg-secondary)',
                                color:
                                    activeCategory === 'all'
                                        ? 'var(--accent-light)'
                                        : 'var(--text-muted)',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            Tümü ({allFoods.length})
                        </button>
                        {MEAL_TYPE_ORDER.map((type) => {
                            const count = allFoods.filter(
                                (f) => f.meal_types?.includes(type)
                            ).length;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={type}
                                    onClick={() => setActiveCategory(type)}
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: 20,
                                        border:
                                            activeCategory === type
                                                ? '1px solid var(--accent)'
                                                : '1px solid var(--border)',
                                        background:
                                            activeCategory === type
                                                ? 'var(--accent-glow)'
                                                : 'var(--bg-secondary)',
                                        color:
                                            activeCategory === type
                                                ? 'var(--accent-light)'
                                                : 'var(--text-muted)',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {MEAL_TYPE_LABELS[type] || type} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Food list — scrollable */}
                <div
                    ref={listRef}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '4px 24px 12px',
                        minHeight: 0,
                    }}
                >
                    {loading && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                padding: 30,
                            }}
                        >
                            <div className="spinner" />
                        </div>
                    )}

                    {!loading && filteredFoods.length === 0 && (
                        <p
                            style={{
                                color: 'var(--text-muted)',
                                textAlign: 'center',
                                padding: 30,
                                fontSize: 14,
                            }}
                        >
                            Eşleşen yemek bulunamadı.
                        </p>
                    )}

                    {!loading && groupedFoods
                        ? /* Grouped view */
                          MEAL_TYPE_ORDER.map((type) => {
                              const foods = groupedFoods[type];
                              if (!foods || foods.length === 0) return null;
                              return (
                                  <div key={type} style={{ marginBottom: 12 }}>
                                      <div
                                          style={{
                                              fontSize: 12,
                                              fontWeight: 700,
                                              color: 'var(--text-muted)',
                                              padding: '8px 4px 4px',
                                              borderBottom: '1px solid var(--border)',
                                              marginBottom: 4,
                                              position: 'sticky',
                                              top: 0,
                                              background: 'var(--bg-card)',
                                              zIndex: 1,
                                          }}
                                      >
                                          {MEAL_TYPE_LABELS[type] || type}
                                      </div>
                                      {foods.map(renderFoodItem)}
                                  </div>
                              );
                          })
                        : /* Flat view (filtered) */
                          !loading && filteredFoods.map(renderFoodItem)}
                </div>

                {/* Selected food — gram and add */}
                {selectedFood && (
                    <div
                        style={{
                            padding: '14px 24px 18px',
                            borderTop: '1px solid var(--border)',
                            background: 'rgba(16, 185, 129, 0.05)',
                            flexShrink: 0,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 10,
                            }}
                        >
                            <span style={{ fontWeight: 600, fontSize: 14 }}>
                                {selectedFood.name}
                            </span>
                            <span
                                style={{
                                    color: 'var(--accent)',
                                    fontWeight: 700,
                                    fontSize: 16,
                                }}
                            >
                                {calcCalories(selectedFood)} kcal
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <label
                                    style={{
                                        fontSize: 12,
                                        color: 'var(--text-muted)',
                                        marginBottom: 4,
                                        display: 'block',
                                    }}
                                >
                                    Gram
                                </label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={grams}
                                    onChange={(e) => setGrams(Number(e.target.value))}
                                    min={10}
                                    max={1000}
                                    step={10}
                                />
                            </div>
                            <button
                                className="btn-primary"
                                onClick={handleAdd}
                                style={{ marginTop: 18, whiteSpace: 'nowrap' }}
                            >
                                ➕ Öğüne Ekle
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
