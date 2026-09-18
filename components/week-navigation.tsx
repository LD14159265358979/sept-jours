import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Day } from '@/lib/types';
import { formatWeekRange } from '@/lib/date-utils';

type Props = {
  days: Day[];
  isCurrent: boolean;
  className?: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function WeekNavigation({ days, isCurrent, className = '', onPrevious, onNext, onToday }: Props) {
  return (
    <div className={`period-navigation ${className}`.trim()}>
      <button type="button" onClick={onPrevious} aria-label="Afficher les sept jours précédents" title="Sept jours précédents"><ChevronLeft aria-hidden="true" /></button>
      <div><span className="eyebrow">Ma semaine</span><strong>{formatWeekRange(days)}</strong></div>
      <button type="button" onClick={onNext} disabled={isCurrent} aria-label="Afficher les sept jours suivants" title="Sept jours suivants"><ChevronRight aria-hidden="true" /></button>
      {!isCurrent && <button className="today-button" type="button" onClick={onToday}>Aujourd’hui</button>}
    </div>
  );
}
