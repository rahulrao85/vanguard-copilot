export interface Stadium {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  flag: string;
  role: string;
}

export const STADIUMS: Stadium[] = [
  { id: 'metlife', name: 'MetLife Stadium', city: 'East Rutherford, NJ', country: 'United States', capacity: 82500, flag: '🇺🇸', role: 'Final' },
  { id: 'att', name: 'AT&T Stadium', city: 'Arlington, TX', country: 'United States', capacity: 80000, flag: '🇺🇸', role: 'Semifinal' },
  { id: 'sofi', name: 'SoFi Stadium', city: 'Inglewood, CA', country: 'United States', capacity: 70000, flag: '🇺🇸', role: 'Quarterfinal' },
  { id: 'mercedes-benz', name: 'Mercedes-Benz Stadium', city: 'Atlanta, GA', country: 'United States', capacity: 71000, flag: '🇺🇸', role: 'Semifinal' },
  { id: 'azteca', name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', capacity: 87523, flag: '🇲🇽', role: 'Group Stage & Round of 32' },
  { id: 'hard-rock', name: 'Hard Rock Stadium', city: 'Miami, FL', country: 'United States', capacity: 65326, flag: '🇺🇸', role: 'Quarterfinal' },
  { id: 'levis', name: "Levi's Stadium", city: 'Santa Clara, CA', country: 'United States', capacity: 68500, flag: '🇺🇸', role: 'Round of 16' },
  { id: 'lincoln', name: 'Lincoln Financial Field', city: 'Philadelphia, PA', country: 'United States', capacity: 67594, flag: '🇺🇸', role: 'Round of 16' },
];

export const GATES_BY_STADIUM: Record<string, Array<{ id: string; label: string; type: string }>> = {
  metlife: [
    { id: 'metlife-gate-a', label: 'Gate A — West VIP', type: 'VIP' },
    { id: 'metlife-gate-b', label: 'Gate B — West General', type: 'General' },
    { id: 'metlife-gate-c', label: 'Gate C — North General', type: 'General' },
    { id: 'metlife-gate-d', label: 'Gate D — East General', type: 'General' },
    { id: 'metlife-gate-e', label: 'Gate E — South General', type: 'General' },
    { id: 'metlife-gate-f', label: 'Gate F — Media Entry', type: 'Media' },
    { id: 'metlife-gate-g', label: 'Gate G — Staff Entry', type: 'Staff' },
  ],
  att: [
    { id: 'att-gate-1', label: 'Gate 1 — North Entry', type: 'General' },
    { id: 'att-gate-2', label: 'Gate 2 — East Entry', type: 'General' },
    { id: 'att-gate-3', label: 'Gate 3 — South Entry', type: 'General' },
    { id: 'att-gate-4', label: 'Gate 4 — West VIP', type: 'VIP' },
    { id: 'att-gate-5', label: 'Gate 5 — Media', type: 'Media' },
  ],
  sofi: [
    { id: 'sofi-gate-1', label: 'Entry 1 — Southeast', type: 'General' },
    { id: 'sofi-gate-2', label: 'Entry 2 — Southwest', type: 'General' },
    { id: 'sofi-gate-3', label: 'Entry 3 — Northwest', type: 'General' },
    { id: 'sofi-gate-4', label: 'Entry 4 — American Airlines Plaza', type: 'VIP' },
    { id: 'sofi-gate-5', label: 'Entry 5 — Northeast', type: 'General' },
  ],
  'mercedes-benz': [
    { id: 'mb-gate-1', label: 'Gate 1 — North', type: 'General' },
    { id: 'mb-gate-2', label: 'Gate 2 — West', type: 'General' },
    { id: 'mb-gate-3', label: 'Gate 3 — South', type: 'General' },
    { id: 'mb-gate-4', label: 'Gate 4 — Delta Sky360 Club', type: 'VIP' },
  ],
  azteca: [
    { id: 'azteca-puerta-1', label: 'Puerta 1 — Norte', type: 'General' },
    { id: 'azteca-puerta-2', label: 'Puerta 2 — Oriente', type: 'General' },
    { id: 'azteca-puerta-3', label: 'Puerta 3 — Sur', type: 'General' },
    { id: 'azteca-puerta-4', label: 'Puerta 4 — Poniente', type: 'General' },
    { id: 'azteca-puerta-5', label: 'Puerta 5 — Palcos VIP', type: 'VIP' },
  ],
  'hard-rock': [
    { id: 'hr-gate-ne', label: 'Northeast Gate', type: 'General' },
    { id: 'hr-gate-nw', label: 'Northwest Gate', type: 'General' },
    { id: 'hr-gate-se', label: 'Southeast Gate', type: 'General' },
    { id: 'hr-gate-sw', label: 'Southwest Gate — Club', type: 'VIP' },
  ],
  levis: [
    { id: 'levis-gate-a', label: 'Gate A — Intel Plaza', type: 'General' },
    { id: 'levis-gate-b', label: 'Gate B — Dignity Health', type: 'General' },
    { id: 'levis-gate-c', label: "Gate C — Levy's", type: 'General' },
    { id: 'levis-gate-d', label: 'Gate D — VIP Suites', type: 'VIP' },
    { id: 'levis-gate-e', label: 'Gate E — Media', type: 'Media' },
  ],
  lincoln: [
    { id: 'lff-gate-n', label: 'North Gate', type: 'General' },
    { id: 'lff-gate-s', label: 'South Gate', type: 'General' },
    { id: 'lff-gate-e', label: 'East Gate', type: 'General' },
    { id: 'lff-gate-w', label: 'West Gate — VIP', type: 'VIP' },
  ],
};

export interface Nation {
  code: string;
  name: string;
  flag: string;
  group: string;
}

export const NATIONS: Nation[] = [
  { code: 'USA', name: 'United States', flag: '🇺🇸', group: 'D' },
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽', group: 'A' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦', group: 'B' },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', group: 'C' },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷', group: 'F' },
  { code: 'FRA', name: 'France', flag: '🇫🇷', group: 'E' },
  { code: 'ENG', name: 'England', flag: '🇬🇧', group: 'G' },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸', group: 'H' },
  { code: 'GER', name: 'Germany', flag: '🇩🇪', group: 'A' },
  { code: 'POR', name: 'Portugal', flag: '🇵🇹', group: 'D' },
  { code: 'NED', name: 'Netherlands', flag: '🇳🇱', group: 'B' },
  { code: 'ITA', name: 'Italy', flag: '🇮🇹', group: 'C' },
  { code: 'URU', name: 'Uruguay', flag: '🇺🇾', group: 'F' },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴', group: 'G' },
  { code: 'MAR', name: 'Morocco', flag: '🇲🇦', group: 'E' },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵', group: 'H' },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷', group: 'B' },
  { code: 'SEN', name: 'Senegal', flag: '🇸🇳', group: 'A' },
  { code: 'CRO', name: 'Croatia', flag: '🇭🇷', group: 'D' },
  { code: 'BEL', name: 'Belgium', flag: '🇧🇪', group: 'E' },
  { code: 'DEN', name: 'Denmark', flag: '🇩🇰', group: 'C' },
  { code: 'SUI', name: 'Switzerland', flag: '🇨🇭', group: 'G' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺', group: 'F' },
  { code: 'NGA', name: 'Nigeria', flag: '🇳🇬', group: 'H' },
  { code: 'EGY', name: 'Egypt', flag: '🇪🇬', group: 'A' },
  { code: 'KSA', name: 'Saudi Arabia', flag: '🇸🇦', group: 'B' },
  { code: 'QAT', name: 'Qatar', flag: '🇶🇦', group: 'C' },
  { code: 'GHA', name: 'Ghana', flag: '🇬🇭', group: 'D' },
  { code: 'CIV', name: "Côte d'Ivoire", flag: '🇨🇮', group: 'E' },
  { code: 'TUN', name: 'Tunisia', flag: '🇹🇳', group: 'F' },
  { code: 'ECU', name: 'Ecuador', flag: '🇪🇨', group: 'G' },
  { code: 'CHI', name: 'Chile', flag: '🇨🇱', group: 'H' },
];

export const STAR_PLAYERS = [
  { name: 'Lionel Messi', country: 'Argentina', flag: '🇦🇷', number: 10, role: 'Forward' },
  { name: 'Cristiano Ronaldo', country: 'Portugal', flag: '🇵🇹', number: 7, role: 'Forward' },
  { name: 'Kylian Mbappé', country: 'France', flag: '🇫🇷', number: 10, role: 'Forward' },
  { name: 'Vinícius Jr.', country: 'Brazil', flag: '🇧🇷', number: 7, role: 'Forward' },
  { name: 'Jude Bellingham', country: 'England', flag: '🇬🇧', number: 10, role: 'Midfielder' },
  { name: 'Erling Haaland', country: 'Norway', flag: '🇳🇴', number: 9, role: 'Forward' },
];

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
];
