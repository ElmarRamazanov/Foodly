'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [calories, setCalories] = useState(2000);
  const [glutenFree, setGlutenFree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleGenerate = async () => {
    if (calories < 800 || calories > 6000) {
      setError('Kalori hedefi 800 ile 6000 arasında olmalıdır.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetCalories: calories,
          glutenFree,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Plan oluşturulamadı.');
        return;
      }

      router.push(`/plan/${data.planId}`);
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background:
          'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.08) 0%, transparent 50%), var(--bg-primary)',
      }}
    >
      {/* Dekoratif elementler */}
      <div
        style={{
          position: 'fixed',
          top: -200,
          right: -200,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo ve başlık */}
      <div
        className="animate-slide-up"
        style={{ textAlign: 'center', marginBottom: 48 }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>🥗</div>
        <h1
          style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          <span className="gradient-text">Beslenme</span> Planlayıcı
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(14px, 2vw, 17px)',
            maxWidth: 480,
            lineHeight: 1.6,
          }}
        >
          Günlük kalori hedefinize göre otomatik haftalık beslenme planı
          oluşturun
        </p>
      </div>

      {/* Form kartı */}
      <div
        className="glass-strong animate-slide-up animate-pulse-glow"
        style={{
          borderRadius: 24,
          padding: 'clamp(24px, 4vw, 40px)',
          width: '100%',
          maxWidth: 460,
          animationDelay: '0.1s',
        }}
      >
        {/* Kalori girişi */}
        <div style={{ marginBottom: 28 }}>
          <label
            style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 8,
            }}
          >
            🔥 Günlük Kalori Hedefi
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              className="input-field"
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              min={800}
              max={6000}
              step={50}
              style={{
                fontSize: 24,
                fontWeight: 700,
                textAlign: 'center',
                padding: '16px 60px 16px 20px',
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              kcal
            </span>
          </div>
          {/* Hızlı seçim butonları */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 10,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {[1500, 1800, 2000, 2500, 3000].map((cal) => (
              <button
                key={cal}
                onClick={() => setCalories(cal)}
                style={{
                  background:
                    calories === cal ? 'var(--accent-glow)' : 'var(--bg-card)',
                  border:
                    calories === cal
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border)',
                  color:
                    calories === cal
                      ? 'var(--accent-light)'
                      : 'var(--text-muted)',
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {cal}
              </button>
            ))}
          </div>
        </div>

        {/* Glütensiz toggle */}
        <div style={{ marginBottom: 32 }}>
          <div
            className="toggle-container"
            onClick={() => setGlutenFree(!glutenFree)}
            style={{
              padding: '14px 18px',
              background: 'var(--bg-secondary)',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}
          >
            <div className={`toggle-track ${glutenFree ? 'active' : ''}`}>
              <div className="toggle-thumb" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                🌾 Glütensiz Mod
              </div>
              <div
                style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}
              >
                Sadece glütensiz yiyecekler kullanılsın
              </div>
            </div>
          </div>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div
            className="animate-fade-in"
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--danger-light)',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Oluştur butonu */}
        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={loading}
          style={{
            width: '100%',
            fontSize: 16,
            padding: '16px 24px',
          }}
        >
          {loading ? (
            <>
              <div
                className="spinner"
                style={{
                  width: 20,
                  height: 20,
                  borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                }}
              />
              Plan Oluşturuluyor...
            </>
          ) : (
            <>🚀 Haftalık Plan Oluştur</>
          )}
        </button>
      </div>

      {/* Alt bilgi */}
      <div
        style={{
          marginTop: 40,
          display: 'flex',
          gap: 24,
          color: 'var(--text-muted)',
          fontSize: 13,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <span>📊 7 Gün</span>
        <span>🍽️ 4 Öğün / Gün</span>
        <span>⚡ Anlık Kalori Hesaplama</span>
      </div>
    </div>
  );
}
