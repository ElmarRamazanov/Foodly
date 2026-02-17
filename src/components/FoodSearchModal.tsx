'use client';

import { useState, useEffect, useRef } from 'react';
import { Food } from '@/lib/types';

interface FoodSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (food: Food, grams: number) => void;
}

export default function FoodSearchModal({
    isOpen,
    onClose,
    onSelect,
}: FoodSearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Food[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFood, setSelectedFood] = useState<Food | null>(null);
    const [grams, setGrams] = useState(100);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setSelectedFood(null);
            setGrams(100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length < 2) {
            setResults([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/foods/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query }),
                });
                const data = await res.json();
                setResults(data.foods || []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    if (!isOpen) return null;

    const handleAdd = () => {
        if (selectedFood && grams > 0) {
            onSelect(selectedFood, grams);
            onClose();
        }
    };

    const calcCalories = (food: Food) =>
        Math.round((food.calories_per_100g * grams) / 100);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>🔍 Yiyecek Ara</h2>
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

                {/* Arama */}
                <div style={{ padding: '16px 24px' }}>
                    <input
                        ref={inputRef}
                        type="text"
                        className="input-field"
                        placeholder="Yiyecek adı yazın..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {/* Sonuçlar */}
                <div
                    style={{
                        padding: '0 24px 16px',
                        maxHeight: 300,
                        overflowY: 'auto',
                    }}
                >
                    {loading && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                padding: 20,
                            }}
                        >
                            <div className="spinner" />
                        </div>
                    )}

                    {!loading && results.length === 0 && query.length >= 2 && (
                        <p
                            style={{
                                color: 'var(--text-muted)',
                                textAlign: 'center',
                                padding: 20,
                                fontSize: 14,
                            }}
                        >
                            Sonuç bulunamadı.
                        </p>
                    )}

                    {!loading &&
                        results.map((food) => (
                            <div
                                key={food.id}
                                onClick={() => setSelectedFood(food)}
                                style={{
                                    padding: '12px 16px',
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
                                    marginBottom: 4,
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span style={{ fontWeight: 500, fontSize: 14 }}>
                                        {food.name}
                                    </span>
                                    <span
                                        style={{
                                            color: 'var(--accent)',
                                            fontSize: 13,
                                            fontWeight: 600,
                                        }}
                                    >
                                        {food.calories_per_100g} kcal/100g
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: 'var(--text-muted)',
                                        marginTop: 4,
                                        display: 'flex',
                                        gap: 12,
                                    }}
                                >
                                    <span>P: {food.protein}g</span>
                                    <span>K: {food.carbs}g</span>
                                    <span>Y: {food.fat}g</span>
                                    {food.gluten_free && (
                                        <span style={{ color: 'var(--success)' }}>🌾 Glütensiz</span>
                                    )}
                                </div>
                            </div>
                        ))}
                </div>

                {/* Seçili yiyecek — gram ve ekle */}
                {selectedFood && (
                    <div
                        style={{
                            padding: '16px 24px 20px',
                            borderTop: '1px solid var(--border)',
                            background: 'rgba(16, 185, 129, 0.05)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 12,
                            }}
                        >
                            <span style={{ fontWeight: 600, fontSize: 14 }}>
                                {selectedFood.name}
                            </span>
                            <span
                                style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}
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
