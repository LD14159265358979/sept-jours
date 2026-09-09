import { describe, expect, it } from 'vitest';
import { getWeeklyVerse } from '@/lib/weekly-verses';

describe('citation hebdomadaire', () => {
  it('reste identique pendant toute une semaine', () => {
    expect(getWeeklyVerse('2026-09-07')).toEqual(getWeeklyVerse('2026-09-07'));
  });

  it('change au lundi suivant et ne revient pas immédiatement', () => {
    expect(getWeeklyVerse('2026-09-07')).not.toEqual(getWeeklyVerse('2026-09-14'));
  });
});
