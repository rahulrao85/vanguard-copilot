import { NATIONS } from '../theme';

const COUNTRY_COLORS: Record<string, { bg: string; text: string }> = {
  USA: { bg: '#1a365d', text: '#ffffff' },
  MEX: { bg: '#006847', text: '#ffffff' },
  CAN: { bg: '#cc0000', text: '#ffffff' },
  ARG: { bg: '#75aadb', text: '#ffffff' },
  BRA: { bg: '#009c3b', text: '#ffdf00' },
  FRA: { bg: '#002395', text: '#ffffff' },
  ENG: { bg: '#cf081f', text: '#ffffff' },
  ESP: { bg: '#c60b1e', text: '#ffc400' },
  GER: { bg: '#000000', text: '#ffcc00' },
  POR: { bg: '#006600', text: '#ff0000' },
  NED: { bg: '#ff6600', text: '#ffffff' },
  ITA: { bg: '#009246', text: '#ffffff' },
  URU: { bg: '#0038a8', text: '#fcd116' },
  COL: { bg: '#fcd116', text: '#003893' },
  MAR: { bg: '#c1272d', text: '#ffffff' },
  JPN: { bg: '#bc002d', text: '#ffffff' },
  KOR: { bg: '#cd2e3a', text: '#003478' },
  SEN: { bg: '#00853f', text: '#fdef42' },
  CRO: { bg: '#ff0000', text: '#ffffff' },
  BEL: { bg: '#000000', text: '#fdda24' },
  DEN: { bg: '#c60c30', text: '#ffffff' },
  SUI: { bg: '#ff0000', text: '#ffffff' },
  AUS: { bg: '#00008b', text: '#ff4d4d' },
  NGA: { bg: '#008751', text: '#ffffff' },
  EGY: { bg: '#ce1126', text: '#ffffff' },
  KSA: { bg: '#006c35', text: '#ffffff' },
  QAT: { bg: '#8a1538', text: '#ffffff' },
  GHA: { bg: '#006b3f', text: '#fcd116' },
  CIV: { bg: '#f77f00', text: '#009e60' },
  TUN: { bg: '#e70013', text: '#ffffff' },
  ECU: { bg: '#fcd116', text: '#003893' },
  CHI: { bg: '#0039a6', text: '#d72b1f' },
};

const FALLBACK_COLOR = { bg: '#3b82f6', text: '#ffffff' };

function getColor(code: string) {
  return COUNTRY_COLORS[code] || FALLBACK_COLOR;
}

export default function NationsBanner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '2.75rem',
        padding: '0.5rem 1.25rem',
        background: 'var(--color-bg-glass)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--color-border)',
        gap: '0.75rem',
        overflow: 'hidden',
      }}
      aria-label="Participating nations"
    >
      <span
        style={{
          fontSize: '0.8rem',
          color: 'var(--color-trophy-gold)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        32 Nations. One Trophy.
      </span>

      <div
        className="nations-scroll"
        style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: '0.1rem',
        }}
      >
        {NATIONS.map((n) => {
          const c = getColor(n.code);
          return (
            <span
              key={n.code}
              title={`${n.name} — Group ${n.group}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.6rem',
                borderRadius: '999px',
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 18,
                  borderRadius: 2,
                  background: c.bg,
                  color: c.text,
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                  flexShrink: 0,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                }}
              >
                {n.code}
              </span>
              <span style={{ fontWeight: 500, fontSize: '0.8rem' }}>
                {n.name}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
