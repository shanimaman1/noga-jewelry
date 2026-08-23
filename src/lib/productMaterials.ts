import type { StoneDetails } from '@/types/catalog';

const formatCarat = (value: number) => value.toFixed(2);

export function stoneDescription(stones: StoneDetails): string {
  if (stones.kind === 'none') return 'ללא אבנים.';

  if (stones.kind === 'pearl') {
    return `פנינה מתורבתת אחת ממים מתוקים, בקוטר ${stones.diameterMm} מ״מ.`;
  }

  if (stones.setComposition) {
    return `טבעת אחת משובצת יהלומי מעבדה, ${formatCarat(stones.totalCarat)} קראט בסך הכול; שתי הטבעות האחרות ללא אבנים.`;
  }

  if (stones.arrangement === 'single') {
    const details = [
      `יהלום ${stones.origin === 'natural' ? 'טבעי' : 'מעבדה'} אחד`,
      `${formatCarat(stones.totalCarat)} קראט`,
      stones.color ? `צבע ${stones.color}` : null,
      stones.clarity ? `ניקיון ${stones.clarity}` : null,
    ].filter(Boolean);
    return `${details.join(', ')}.`;
  }

  const diamondType =
    stones.cut === 'baguette'
      ? 'יהלומי מעבדה בחיתוך בגט'
      : stones.origin === 'natural'
        ? 'יהלומים טבעיים'
        : 'יהלומי מעבדה';
  return `${diamondType}, ${formatCarat(stones.totalCarat)} קראט בסך הכול.`;
}

/** The site policy applies to a single diamond above 0.3ct, not total melee weight. */
export function includesCertifiedDiamond(stones: StoneDetails): boolean {
  return stones.kind === 'diamonds' && stones.arrangement === 'single' && stones.totalCarat > 0.3;
}
