export const RETURNS_POLICY = {
  exchangeDays: 30,
  refundDays: 14,
  atelierCoversReturnShipping: true,
  requiresUnworn: true,
  requiresOriginalPackaging: true,
  specialOrdersFinalAfterProductionStarts: true,
  statutoryRightsApply: true,
} as const;

export const RESIZING_POLICY = {
  appliesTo: 'rings',
  firstResizeFree: true,
  turnaround: '7–10 ימי עסקים',
} as const;

export const AFTERCARE_POLICY = {
  manufacturingDefectsMonths: 12,
  cleaningFree: true,
  settingInspectionFree: true,
  wearRepairsQuotedAfterInspection: true,
} as const;

export function returnsPolicyPoints(): string[] {
  return [
    `החלפה אפשרית בתוך ${RETURNS_POLICY.exchangeDays} יום מקבלת הפריט.`,
    `החזר כספי מלא אפשרי בתוך ${RETURNS_POLICY.refundDays} יום מקבלת הפריט.`,
    ...(RETURNS_POLICY.requiresUnworn && RETURNS_POLICY.requiresOriginalPackaging
      ? ['הפריט צריך להיות ללא סימני ענידה ובאריזה המקורית.']
      : []),
    ...(RETURNS_POLICY.atelierCoversReturnShipping
      ? ['עלות השילוח חזרה היא על חשבון האטלייה.']
      : []),
    'מתחילים בכתיבה ב־WhatsApp, ודנה מתאמת את האיסוף.',
  ];
}

export function returnsPolicyText(): string {
  const statutoryText = RETURNS_POLICY.statutoryRightsApply
    ? ' הזכויות לפי חוק הגנת הצרכן נשמרות.'
    : '';
  return `${returnsPolicyPoints().join(' ')}${statutoryText}`;
}

export function specialOrderReturnsText(): string {
  if (!RETURNS_POLICY.specialOrdersFinalAfterProductionStarts) return '';
  return 'כל פריט שמסומן ״נוצר בהזמנה״ מיוצר לפי מידה או דרישה מיוחדת, כולל גרסת 18 קראט. לאחר תחילת הייצור אין אפשרות להחלפה או להחזר, בכפוף לזכויות לפי חוק הגנת הצרכן.';
}

export function resizingPolicyText(): string {
  const priceText = RESIZING_POLICY.firstResizeFree ? 'ללא עלות' : 'בתשלום';
  return `התאמת המידה הראשונה לטבעת היא ${priceText} ואורכת בדרך כלל ${RESIZING_POLICY.turnaround}.`;
}

export function warrantyPolicyText(): string {
  const repairText = AFTERCARE_POLICY.wearRepairsQuotedAfterInspection
    ? ' בלאי, מכה או קרע נבדקים באטלייה, ואם נדרש תיקון בתשלום נשלחת הצעת מחיר לפני העבודה.'
    : '';
  return `האחריות מכסה פגמי ייצור במשך ${AFTERCARE_POLICY.manufacturingDefectsMonths} חודשים ממועד הקנייה.${repairText}`;
}

export function careServiceText(): string {
  const services = [
    ...(AFTERCARE_POLICY.cleaningFree ? ['ניקוי מקצועי'] : []),
    ...(AFTERCARE_POLICY.settingInspectionFree ? ['בדיקת שיבוץ'] : []),
  ];
  return `${services.join(' ו')} באטלייה ניתנים ללא עלות.`;
}
