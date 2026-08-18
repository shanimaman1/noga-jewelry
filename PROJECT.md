# מבנה הפרויקט

מסמך זה מתאר את מצב הקוד בפועל. החלטות מותג, עיצוב, 3D ונגישות נמצאות
ב־[CLAUDE.md](CLAUDE.md) — כשיש סתירה, CLAUDE.md מנצח.

## עץ התיקיות

```
src/
├─ components/
│  ├─ agent/       ShoppingAssistant, AssistantProductCard
│  ├─ cart/        CartDrawer, LineItem, FreeShippingBar
│  ├─ catalog/     ProductCard, FilterBar (CATEGORY_LABELS, PRICE_BANDS)
│  ├─ checkout/    שלבי צ׳קאאוט מעוצבים
│  ├─ common/      Container, PageShell, SectionHeading, CatalogImage, Reveal,
│  │               DemoModeBanner
│  ├─ home/        סקשנים של דף הבית
│  ├─ layout/      RootLayout, Header, Footer, WhatsAppFab, ScrollToTop
│  ├─ motion/      עוטפי אנימציה
│  ├─ product/     Gallery, SizeGuideModal, TrustStrip
│  ├─ seo/         Seo (תגיות head לפי עמוד)
│  └─ ui/          Modal, Field
├─ data/           products.ts, collections.ts, sizes.ts, testimonials
├─ hooks/          useLenis, useMediaQuery, useReducedMotion, useReveal
├─ lib/
│  ├─ agent/       types.ts, catalog.ts, wizard.ts, index.ts
│  ├─ cart/        store.ts (zustand + persist)
│  ├─ motion/      קבועי אנימציה
│  ├─ constants.ts BRAND, ROUTES, NAV_LINKS, whatsappUrl
│  ├─ format.ts    formatPrice, installmentNote
│  └─ seo.ts       JSON-LD
├─ pages/          עמוד לכל נתיב
├─ styles/         index.css — טוקני Tailwind v4 + כללי reveal
├─ three/          hero/, lab/, product/, shared/, story/
└─ types/          catalog.ts (Product, Metal, Category, METAL_LABELS)
```

## מקורות אמת לנתונים

| מה | איפה | הערה |
| --- | --- | --- |
| פריטים, מחירים, מתכות | `src/data/products.ts` | 16 פריטים, ₪890–₪8,900 |
| תוויות קטגוריה | `src/components/catalog/FilterBar.tsx` | `CATEGORY_LABELS` |
| טווחי מחירים | `src/components/catalog/FilterBar.tsx` | `PRICE_BANDS` |
| תוויות מתכת | `src/types/catalog.ts` | `METAL_LABELS` |
| מותג, נתיבים, וואטסאפ | `src/lib/constants.ts` | מספר הטלפון פלייסהולדר לא תקין בכוונה |

אין להעתיק נתוני מוצר לשום מקום אחר. כל שכבה שצריכה מחיר או שם קוראת מכאן.

## שכבות (layering)

`pages` → `components` → `hooks`/`lib` → `data`/`types`.

חריגה מכוונת אחת: `src/lib/agent/catalog.ts` מייבא `CATEGORY_LABELS` ו־`PRICE_BANDS`
מ־`components/catalog/FilterBar.tsx`. הסיבה: אלה אוצר המילים הקיים והמוצג
למשתמש עבור קטגוריות וטווחי מחירים. עוזר שיציע טווחים *אחרים* מהסינון בקטלוג
יהיה לא־עקבי, ועותק שני של התוויות בעברית יזלוג עם הזמן. ל־FilterBar אין
תלויות כבדות, ולכן העלות היא כמה KB.

---

## עוזר הבחירה

### ממשק `AgentBrain`

הווידג'ט מדבר **רק** עם `AgentBrain` (`src/lib/agent/types.ts`). הוא לא מייבא את
האשף, לא קורא את מצבו, ולא מסתעף לפי סוג המוח שקיבל. זה מה שיאפשר להוסיף מוח
מבוסס LLM בשלב 2 בלי לגעת בקומפוננטה.

```ts
interface AgentBrain {
  readonly id: string;
  start(): Promise<AgentTurn>;
  send(input: AgentInput): Promise<AgentTurn>;
  back(): Promise<AgentTurn>;
}
```

שתי החלטות תכנוניות שנועדו לשלב 2:

1. **כל המתודות אסינכרוניות**, גם שהאשף עונה מיידית. מוח LLM ימתין לרשת, ולכן
   מצב ה־`pending` בממשק כבר קיים.
2. **תור מחזיר את כל התמליל**, לא דלתא. המוח מחזיק את מצב השיחה; ה־UI הוא רנדרר
   טהור של התור האחרון.

בחירת המוח נמצאת במקום אחד — `createAgentBrain()` ב־`src/lib/agent/index.ts`.

### הקבצים

| קובץ | תפקיד |
| --- | --- |
| `types.ts` | `AgentBrain`, הודעות, בחירות, פעולות, המלצות |
| `catalog.ts` | חיפוש וסינון טהורים מעל `products.ts` |
| `wizard.ts` | זרימת השאלות, חוקי ההמלצה, טיפול בטקסט חופשי |
| `index.ts` | ה־factory — המקום היחיד שבו נבחר מוח |
| `components/agent/ShoppingAssistant.tsx` | Launcher, פאנל, focus trap, חיווט הפעולות |
| `components/agent/AssistantProductCard.tsx` | כרטיס המלצה קומפקטי |

### הזרימה

למי התכשיט → טווח מחירים → קטגוריה → מתכת → עד שלוש המלצות.

**כל אפשרות שמוצגת נגזרת מהנתונים בזמן ריצה**, ורק אם יש לה לפחות פריט אחד:
`availableBands()`, `availableCategories()`, `availableMetals()`. לכן, למשל,
"עגילים" לא מוצע כשנבחר "מעל ₪3,000" (העגיל היקר הוא ₪2,200), ו"זהב לבן" לא
מוצע לטבעות (אין טבעת מצולמת בזהב לבן). מכיוון שכל שלב מצמצם מעל השלב הקודם,
**מסלול מונחה לא יכול להגיע לתוצאה ריקה**.

`relaxationOptions()` הוא רשת ביטחון, לא נתיב רגיל: אם בכל זאת יתקבל סינון ריק
— אם פריט יוסר מהקטלוג, או אם מוח עתידי יקבע סינון בעצמו — הוא מציע לוותר על
תנאי אחד, ורק על תנאים שבאמת מייצרים התאמות. אין מסך ריק ללא המשך.

`back()` נשען על מחסנית snapshots: כל שלב שומר גם את המצב וגם את התמליל, כך
שחזרה משחזרת את שניהם במדויק.

### חוקי תוכן

* שם, מחיר, קטגוריה ומתכת נקראים תמיד מ־`products.ts` — אף אחד מהם לא נכתב
  כליטרל בקוד העוזר. הכרטיס מקבל `slug` בלבד ופותר את השאר בעצמו; slug שלא
  קיים לא מרנדר כלום.
* **אין הצהרות על מלאי, זמני אספקה, מבצעים או דמי משלוח.** אין לפרויקט נתונים
  כאלה. שאלה בנושא מקבלת תשובה כנה ("אין לי נתון אמיתי... בגרסה החיה זה מתחבר
  למערכת של החנות") והפניה לוואטסאפ.
* נימוק ההמלצה נבנה רק ממה שהקונה באמת ביקש. אם לא צומצם כלום, מוצג התיאור
  מהקטלוג — לא טענה מומצאת על התאמה או פופולריות.
* קול המותג: מרוסן, בלי סימני קריאה ובלי סופרלטיבים.

### שכבות z

| שכבה | z-index |
| --- | --- |
| Launcher | 30 |
| Scrim (מובייל בלבד) | 30 |
| פאנל העוזר | 41 |
| Header (sticky) · WhatsApp FAB | 40 |
| מגירת עגלה · מודלים | 50 |

הפאנל מעל ה־FAB כדי שלא ייקרע על ידי כפתור צף, ומתחת למגירת העגלה ולמודלים כדי
שאלה תמיד ינצחו. הפאנל עוגן לתחתית וגובהו `min(82svh, 100svh − 9rem)` במובייל,
ולכן הוא **לעולם לא מגיע ל־header** — גם במסך נמוך, שבו האיבר השני הוא זה שקובע.
נמדד: 375×812 משאיר 27px מתחת ל־header, ו־375×500 משאיר 25px.

### נגישות

`role="dialog"` עם `aria-modal="true"`, focus trap, ESC סוגר ומחזיר פוקוס
ל־launcher, ניווט מלא במקלדת, `aria-label` בעברית, `role="log"` עם
`aria-live="polite"` להכרזת הודעות חדשות.

שתי החלטות מימוש ששווה להכיר:

* **ה־focus trap מוגבל לאלמנט הפאנל**, לא ל־`document`. מגירת העגלה ומודל
  המידות רושמים מאזיני `document` משלהם, ומאזין שני היה מתנגש בהם. מכיוון
  שהפוקוס לכוד בפאנל, מאזין על הקונטיינר רואה כל מקש רלוונטי — וברגע שמודל
  המידות לוקח פוקוס, המאזין הזה משתתק מעצמו.
* **החזרת הפוקוס היא flag + effect ולא `focus()` ישיר.** ה־launcher לא מרונדר
  בזמן שהפאנל פתוח, ולכן ה־ref שלו הוא `null` ברגע הסגירה. רק *נטישה* מסמנת
  את הדגל; סגירה שמעבירה שליטה למגירת העגלה לא מסמנת, כדי שהמגירה תשמור על
  הפוקוס שקיבלה.

נעילת הגלילה נקראת מתוך ה־effect ומתעדכנת בכל שינוי מדיה, ולא מוחזקת ב־state:
ערך מיושן שם היה משאיר את העמוד לא־גליל בדסקטופ. ה־scrim מוגדר ב־CSS בלבד
(`sm:hidden`) מאותה סיבה.

### מה שהעוזר לא עושה

* לא נטען ב־`/lab` — העמוד הזה יושב מחוץ ל־`RootLayout` בכוונה.
* לא נפתח מעצמו, לא מקפץ ולא פועם. Launcher שקט וסטטי.
* לא מבצע רכישה. "הוספה לעגלה" קוראת ל־`useCart.add()` הקיימת בלבד.

---

## נקודות אינטגרציה מדומות

בכל נקודה שבה בייצור היה חיבור אמיתי, יש הערה בקוד שאומרת מה מחליף אותה:

| מה | בייצור |
| --- | --- |
| תשלום | Cardcom / Grow / Tranzila |
| טפסים (קשר, עיצוב אישי) | EmailJS / Formspree |
| מלאי, אספקה, מחירים | מערכת החנות |
| ניתוב SPA | SSR / pre-rendering לצורכי SEO |

## בדיקות

אין ריצת יחידה. הבדיקה היא `npm run verify` — Playwright מול דפדפן אמיתי —
בתוספת `npm run build` (שמריץ `tsc --noEmit`). עוזר הבחירה נבדק ידנית בדפדפן
ב־375×812, 375×500 ו־1280×800: יישור בועות ב־RTL, מראות אייקונים, שלמות
מחירים, ניווט מקלדת מקצה לקצה, ESC והחזרת פוקוס, ואפס שגיאות קונסול.
