/** Shared facts used by the custom-design page and the shopping assistant. */
export const CUSTOM_DESIGN = {
  available: true,
  intro:
    'טבעת אירוסין, תכשיט לציון רגע, או פשוט משהו שלא מצאת בשום מקום. נתחיל משיחה, ונבנה אותו מהשרטוט הראשון.',
  steps: [
    {
      n: '01',
      title: 'שיחת היכרות',
      text: 'נשב יחד (או בזום) ונבין מה את מחפשת, סגנון, תקציב, אבן, הזדמנות.',
    },
    {
      n: '02',
      title: 'שרטוט והצעה',
      text: 'דנה מכינה שרטוט והדמיה, עם הצעת מחיר מדויקת. מדייקים עד שזה מרגיש נכון.',
    },
    {
      n: '03',
      title: 'יצירה באטלייה',
      text: 'התכשיט נוצר בעבודת יד. בדרך כלל 3–4 שבועות, ואת מעודכנת לאורך הדרך.',
    },
  ],
  formIsDemoOnly: true,
  formSubmissionStored: false,
  formSubmissionSent: false,
} as const;
