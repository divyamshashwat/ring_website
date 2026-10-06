import { gemstones, gemstoneBySlug } from '@/lib/data/gemstones';
import type { Gemstone, Intention } from '@/lib/data/types';
import { PLANET_STONE, rashiForDate, type Rashi } from './zodiac';

export interface FinderInput {
  day: number;
  month: number;
  year: number;
  intentions: Intention[];
}

export interface FinderResult {
  rashi: Rashi;
  primary: Gemstone;
  /** a second stone whose traditional associations match the stated intention */
  companion: Gemstone | null;
  reasoning: string[];
}

export function isValidDate(day: number, month: number, year: number) {
  const now = new Date();
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return false;
  if (year < 1900 || year > now.getFullYear()) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day && d <= now;
}

export function findStone({ day, month, intentions }: FinderInput): FinderResult {
  const rashi = rashiForDate(month, day);
  const primary = gemstoneBySlug(PLANET_STONE[rashi.lord])!;

  const scored = gemstones
    .filter((g) => g.slug !== primary.slug && g.group === 'navratna')
    .map((g) => ({ g, score: g.intentions.filter((i) => intentions.includes(i)).length }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || gemstones.indexOf(a.g) - gemstones.indexOf(b.g));
  const companion = intentions.length ? (scored[0]?.g ?? null) : null;

  const reasoning = [
    `On your date of birth the Sun was in sidereal ${rashi.name} (${rashi.western}).`,
    `${rashi.name} is traditionally ruled by ${rashi.lord}, and in Vedic astrology ${rashi.lord === primary.planet.name ? primary.planet.name : rashi.lord} is associated with ${primary.name} — ${primary.englishName}.`,
  ];
  if (companion) {
    reasoning.push(`For ${intentions.map((i) => i).join(' and ')}, tradition also speaks of ${companion.name}, associated with ${companion.planet.name}.`);
  }
  return { rashi, primary, companion, reasoning };
}
