type WeeklyVerse = { text: string; reference: string; href: string };

const verses: WeeklyVerse[] = [
  { text: 'Soyez toujours dans la joie du Seigneur ; je le redis : soyez dans la joie.', reference: 'Philippiens 4, 4', href: 'https://www.aelf.org/bible/Ph/4' },
  { text: 'Que le Dieu de l’espérance vous remplisse de toute joie et de paix dans la foi.', reference: 'Romains 15, 13', href: 'https://www.aelf.org/bible/Rm/15' },
  { text: 'Le Seigneur est mon berger : je ne manque de rien. Sur des prés d’herbe fraîche, il me fait reposer.', reference: 'Psaume 22, 1-2', href: 'https://www.aelf.org/2026-08-30/romain/none' },
  { text: 'Je vous laisse la paix, je vous donne ma paix. Que votre cœur ne soit pas bouleversé ni effrayé.', reference: 'Jean 14, 27', href: 'https://www.aelf.org/bible/Jn/14' },
  { text: 'Ne vous faites pas de souci pour demain : demain aura souci de lui-même ; à chaque jour suffit sa peine.', reference: 'Matthieu 6, 34', href: 'https://www.aelf.org/bible/Mt/6' },
  { text: 'Soyez toujours dans la joie, priez sans relâche, rendez grâce en toute circonstance.', reference: '1 Thessaloniciens 5, 16-18', href: 'https://www.aelf.org/bible/1Th/5' },
  { text: 'Et que, dans vos cœurs, règne la paix du Christ. Vivez dans l’action de grâce.', reference: 'Colossiens 3, 15', href: 'https://www.aelf.org/bible/Col/3' },
];

export function getWeeklyVerse(firstDay: string) {
  const [year, month, day] = firstDay.split('-').map(Number);
  const weekSeed = Math.floor(Date.UTC(year, month - 1, day) / (7 * 86_400_000));
  return verses[weekSeed % verses.length];
}
