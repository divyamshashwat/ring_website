/**
 * Sidereal (Vedic) Sun signs.
 *
 * Dates are approximate for the Lahiri ayanamsa and shift by a day between
 * years. A traditional recommendation is made from the full birth chart
 * (ascendant, planetary periods and more), which needs birth time and place —
 * the finder says so and offers a consultation.
 */
export interface Rashi {
  slug: string;
  name: string;
  western: string;
  /** [month (1-12), day] inclusive start */
  start: [number, number];
  lord: 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
}

export const RASHIS: Rashi[] = [
  { slug: 'mesha', name: 'Mesha', western: 'Aries', start: [4, 14], lord: 'Mars', element: 'Fire' },
  { slug: 'vrishabha', name: 'Vrishabha', western: 'Taurus', start: [5, 15], lord: 'Venus', element: 'Earth' },
  { slug: 'mithuna', name: 'Mithuna', western: 'Gemini', start: [6, 15], lord: 'Mercury', element: 'Air' },
  { slug: 'karka', name: 'Karka', western: 'Cancer', start: [7, 17], lord: 'Moon', element: 'Water' },
  { slug: 'simha', name: 'Simha', western: 'Leo', start: [8, 17], lord: 'Sun', element: 'Fire' },
  { slug: 'kanya', name: 'Kanya', western: 'Virgo', start: [9, 17], lord: 'Mercury', element: 'Earth' },
  { slug: 'tula', name: 'Tula', western: 'Libra', start: [10, 18], lord: 'Venus', element: 'Air' },
  { slug: 'vrischika', name: 'Vrischika', western: 'Scorpio', start: [11, 17], lord: 'Mars', element: 'Water' },
  { slug: 'dhanu', name: 'Dhanu', western: 'Sagittarius', start: [12, 16], lord: 'Jupiter', element: 'Fire' },
  { slug: 'makara', name: 'Makara', western: 'Capricorn', start: [1, 14], lord: 'Saturn', element: 'Earth' },
  { slug: 'kumbha', name: 'Kumbha', western: 'Aquarius', start: [2, 13], lord: 'Saturn', element: 'Air' },
  { slug: 'meena', name: 'Meena', western: 'Pisces', start: [3, 14], lord: 'Jupiter', element: 'Water' },
];

export const PLANET_STONE: Record<Rashi['lord'], string> = {
  Sun: 'manik',
  Moon: 'moti',
  Mars: 'moonga',
  Mercury: 'panna',
  Jupiter: 'pukhraj',
  Venus: 'heera',
  Saturn: 'neelam',
};

const ordinal = (m: number, d: number) => m * 100 + d;

export function rashiForDate(month: number, day: number): Rashi {
  const value = ordinal(month, day);
  // walk the signs in calendar order and keep the last start we have passed
  const sorted = [...RASHIS].sort((a, b) => ordinal(...a.start) - ordinal(...b.start));
  let current = sorted[sorted.length - 1];
  for (const r of sorted) if (value >= ordinal(...r.start)) current = r;
  return current;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function rashiDateRange(r: Rashi) {
  const idx = RASHIS.indexOf(r);
  const next = RASHIS[(idx + 1) % RASHIS.length];
  const end = new Date(2001, next.start[0] - 1, next.start[1] - 1);
  return `${r.start[1]} ${MONTHS[r.start[0] - 1].slice(0, 3)} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)}`;
}
