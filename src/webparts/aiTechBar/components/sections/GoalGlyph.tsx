import * as React from 'react';

// =============================================================================
// GoalGlyph — wypełnione, przestrzenne ikony celów (duotone: gradient w tonacji
// akcentu + świetlne refleksy), spójne z premium/3D charakterem sekcji Cel.
// Rozmiar kontrolowany z CSS (svg dziedziczy width/height od rodzica).
// Każda instancja dostaje unikalne id gradientu, żeby nie kolidowały w DOM.
// =============================================================================

export interface IGoalGlyphProps {
  id: string;
  className?: string;
}

// Kolory gradientu (A -> B) dopasowane do akcentu każdego celu z config.ts.
const GRAD: { [id: string]: [string, string] } = {
  'goal-write': ['#4c8dff', '#22d3ee'],
  'goal-design': ['#22d3ee', '#818cf8'],
  'goal-transcribe': ['#a78bfa', '#ec4899'],
  'goal-meetings': ['#4c8dff', '#6366f1'],
  'goal-data': ['#6366f1', '#22d3ee'],
  'goal-code': ['#a855f7', '#22d3ee']
};

// Kształty ikony (wypełnienie gradientem + refleksy). `g` = url(#gradient).
function shapes(id: string, g: string): React.ReactNode {
  switch (id) {
    // Pisz szybciej — ołówek 3D
    case 'goal-write':
      return (
        <>
          <path d="M15.7 4.1 L19.9 8.3 L8.9 19.3 L4.1 20.2 L5 15.4 Z" fill={g} />
          <path d="M15.7 4.1 L19.9 8.3 L17.8 10.4 L13.6 6.2 Z" fill="#fff" fillOpacity="0.35" />
          <path d="M4.1 20.2 L5 15.4 L7 17.4 Z" fill="#0a0a1a" fillOpacity="0.45" />
          <path d="M13.4 6.7 L17.3 10.6" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.4" fill="none" />
        </>
      );
    // Twórz bez kursu designu — paleta malarska 3D
    case 'goal-design':
      return (
        <>
          <path d="M12 3.3C6.8 3.3 3.1 6.9 3.1 11.3c0 2.8 2.2 5 5 5h1.3c.9 0 1.6.7 1.6 1.6 0 .3-.1.6-.3.9-.5.7 0 1.6.9 1.6h.1C17 20 20.9 16.1 20.9 11.3 20.9 6.6 17 3.3 12 3.3Z" fill={g} />
          <circle cx="7.7" cy="11.4" r="1.15" fill="#fff" fillOpacity="0.92" />
          <circle cx="11.5" cy="7.6" r="1.15" fill="#fff" fillOpacity="0.72" />
          <circle cx="15.8" cy="10.7" r="1.15" fill="#fff" fillOpacity="0.85" />
          <path d="M6.4 6.7C7.9 5.2 9.8 4.4 12 4.4" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.3" fill="none" />
        </>
      );
    // Twórz transkrypcje — mikrofon 3D
    case 'goal-transcribe':
      return (
        <>
          <path d="M6 10.6a6 6 0 0 0 12 0" stroke={g} strokeWidth="2" fill="none" />
          <rect x="8" y="3" width="8" height="11.4" rx="4" fill={g} />
          <rect x="11" y="16.4" width="2" height="4.1" rx="1" fill={g} />
          <rect x="8.4" y="20.2" width="7.2" height="1.7" rx="0.85" fill={g} />
          <path d="M9.7 6.3h4.6M9.7 8.5h4.6" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.1" />
          <ellipse cx="10.4" cy="5.4" rx="1" ry="1.7" fill="#fff" fillOpacity="0.35" />
        </>
      );
    // Wychodź ze spotkań z notatkami — notatnik z „gotowe"
    case 'goal-meetings':
      return (
        <>
          <rect x="5" y="4.4" width="14" height="16.2" rx="2.4" fill={g} />
          <rect x="8.8" y="2.7" width="6.4" height="2.6" rx="1.3" fill="#0a0a1a" fillOpacity="0.4" />
          <path d="M5 6.8a2.4 2.4 0 0 1 2.4-2.4h9.2A2.4 2.4 0 0 1 19 6.8V8.8H5Z" fill="#fff" fillOpacity="0.12" />
          <path d="M8.5 12.5l2.3 2.3 4.4-4.6" stroke="#fff" strokeWidth="1.9" fill="none" />
          <path d="M8.6 17.6h6.8" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
        </>
      );
    // Analizuj dane — wykres słupkowy 3D
    case 'goal-data':
      return (
        <>
          <rect x="4.3" y="11.4" width="3.3" height="7.1" rx="0.9" fill={g} />
          <rect x="10.35" y="7.4" width="3.3" height="11.1" rx="0.9" fill={g} />
          <rect x="16.4" y="4.4" width="3.3" height="14.1" rx="0.9" fill={g} />
          <rect x="3.4" y="19.4" width="17.2" height="1.6" rx="0.8" fill={g} />
          <path d="M4.9 12.4h2.1M10.95 8.4h2.1M17 5.4h2.1" stroke="#fff" strokeOpacity="0.45" strokeWidth="1" />
        </>
      );
    // Koduj szybciej — kafelek z nawiasami kodu
    case 'goal-code':
      return (
        <>
          <rect x="3" y="4" width="18" height="16" rx="4.2" fill={g} />
          <path d="M3 8.2a4.2 4.2 0 0 1 4.2-4.2h9.6A4.2 4.2 0 0 1 21 8.2V9H3Z" fill="#fff" fillOpacity="0.12" />
          <path d="M9.4 9.6 6.7 12l2.7 2.4" stroke="#fff" strokeWidth="1.8" fill="none" />
          <path d="M14.6 9.6 17.3 12l-2.7 2.4" stroke="#fff" strokeWidth="1.8" fill="none" />
          <path d="M13.1 8.5l-2.2 7.1" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.6" />
        </>
      );
    default:
      return null;
  }
}

let uid = 0;

const GoalGlyph: React.FC<IGoalGlyphProps> = ({ id, className }) => {
  const gradId = React.useMemo(() => `gg-${id}-${(uid += 1)}`, [id]);
  const colors = GRAD[id];
  if (!colors) return null;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="12" y1="2.5" x2="12" y2="21.5">
          <stop offset="0" stopColor={colors[0]} />
          <stop offset="1" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      {shapes(id, `url(#${gradId})`)}
    </svg>
  );
};

export default GoalGlyph;
