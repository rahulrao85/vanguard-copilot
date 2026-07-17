import { useState, useEffect } from 'react';
import { STAR_PLAYERS } from '../theme';

const COUNTRY_COLORS: Record<string, string> = {
  Argentina: '#75aadb',
  Portugal: '#006600',
  France: '#002395',
  Brazil: '#009c3b',
  England: '#cf081f',
  Norway: '#ba0c2f',
};

function getCountryColor(country: string): string {
  return COUNTRY_COLORS[country] || '#3b82f6';
}

export default function PlayerCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % STAR_PLAYERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const player = STAR_PLAYERS[index];
  const countryColor = getCountryColor(player.country);

  return (
    <div
      style={{
        position: 'relative',
        padding: '1.25rem',
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        borderLeft: '4px solid var(--color-turf-green)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        overflow: 'hidden',
      }}
      aria-label={`Featured player: ${player.name}`}
    >
      <div
        style={{
          position: 'absolute',
          top: -15,
          right: -15,
          fontSize: '6rem',
          opacity: 0.05,
          lineHeight: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        aria-hidden="true"
      >
        ⚽
      </div>

      <span
        style={{
          display: 'inline-block',
          fontSize: '0.7rem',
          color: 'var(--color-trophy-gold)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 700,
          marginBottom: '0.75rem',
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          background: 'rgba(212, 168, 83, 0.1)',
          border: '1px solid rgba(212, 168, 83, 0.25)',
        }}
      >
        Player to Watch
      </span>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '0.6rem',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-turf-green), #1a5c2a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1,
            border: '2px solid var(--color-trophy-gold)',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
          aria-label={`Jersey number ${player.number}`}
        >
          {player.number}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          <span
            style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
            }}
          >
            {player.name}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.1rem 0.4rem',
                borderRadius: 3,
                background: countryColor,
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                lineHeight: 1.3,
                letterSpacing: '0.04em',
              }}
            >
              {player.country}
            </span>
          </span>
        </div>
      </div>

      <span
        style={{
          display: 'inline-block',
          padding: '0.2rem 0.65rem',
          borderRadius: '999px',
          background: 'rgba(59, 130, 246, 0.12)',
          color: 'var(--color-accent-primary)',
          fontSize: '0.72rem',
          fontWeight: 600,
        }}
      >
        {player.role}
      </span>

      <div
        style={{
          display: 'flex',
          gap: '0.35rem',
          justifyContent: 'center',
          marginTop: '0.7rem',
        }}
      >
        {STAR_PLAYERS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show ${STAR_PLAYERS[i].name}`}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              border: 'none',
              background:
                i === index ? 'var(--color-trophy-gold)' : 'var(--color-border)',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s ease',
              transform: i === index ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
