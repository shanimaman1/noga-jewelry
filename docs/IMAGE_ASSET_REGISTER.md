# Image Asset Register

רישום משותף ל־Codex, ל־Claude Code ולכל כלי עתידי שעובד על נכסי התמונות באתר.
הטקסט ונתוני המוצר הם המקור הקובע; תמונה קיימת שסותרת אותם אינה מקור למפרט.

## כללי עבודה

- כל תמונה חדשה היא מועמדת בלבד עד לאישור מפורש של מספר המועמד.
- אין למחוק או לדרוס תמונות מקוריות.
- אין להשתמש בתמונה קיימת כיעד לעריכה או כמודל לחיקוי כאשר הזכויות אינן ברורות.
- כל מועמד נוצר בקריאה נפרדת של מחולל התמונות ובמפרט נפרד.
- סטטוס `אושר` מותר רק לאחר ניסוח מפורש: `אני מאשרת את מועמד מספר ___`.
- שינוי באתר נחשב מושלם רק לאחר בדיקות ועדכון רישום זה.

## מיפוי נכסים קיים

תאריך מיפוי: 2026-08-18. כל נכס קיים בשתי גרסאות WebP ביחס 1:1:
`1000×1000` ו־`600×600` עם הסיומת `@600`. אין קובץ רסטר נפרד למובייל.

| מזהה | קובץ בסיס | מוצר / שימוש | סוג | מקור מתועד |
| --- | --- | --- | --- | --- |
| IMG-001 | `ring-solitaire-yellow` | סוליטר קלאסי, זהב צהוב | מוצר | Unsplash `photo-1716511956048-e0532bd9746e` |
| IMG-002 | `ring-solitaire-rose` | סוליטר קלאסי, זהב אדום | מוצר | Unsplash `photo-1726256677740-dfd61fa1af26` |
| IMG-003 | `ring-fine-band` | טבעת יהלומים דקה | מוצר | Unsplash `photo-1708222170603-12471477b1d9` |
| IMG-004 | `ring-thin-stack` | טבעת יומיום דקה | מוצר | Unsplash `photo-1608042314453-ae338d80c427` |
| IMG-005 | `ring-worn-stack` | טבעות שכבות | מוצר, על גוף | Unsplash `photo-1596944924616-7b38e7cfac36` |
| IMG-006 | `necklace-small-pendant` | שרשרת יהלום בודד | מוצר | Unsplash `photo-1589128777073-263566ae5e4d` |
| IMG-007 | `necklace-heart-white` | תליון לב | מוצר | Unsplash `photo-1588444837495-c6cfeb53f32d` |
| IMG-008 | `necklace-gold-pendant` | תליון זהב | מוצר, על גוף | Unsplash `photo-1620656798579-1984d9e87df7` |
| IMG-009 | `necklace-pearl-drop` | שרשרת פנינה | מוצר, על גוף | Unsplash `photo-1611085583191-a3b181a88401` |
| IMG-010 | `necklace-layered-fine` | שרשרת שכבות | מוצר, על גוף | Unsplash `photo-1675113495242-09e2616a4aa2` |
| IMG-011 | `necklace-bezel-chain` | שרשרת נקודות | מוצר | Unsplash `photo-1631050165155-421c47e306f7` |
| IMG-012 | `necklace-floral-chain` | שרשרת פרחים | מוצר ואווירה | Unsplash `photo-1625792508553-5e66a81659fa` |
| IMG-013 | `earrings-fine-hoops` | עגילי חישוק קטנים | מוצר | Unsplash `photo-1777999763640-b228fe3192de` |
| IMG-014 | `earrings-tiny-studs` | עגילים צמודים זעירים | מוצר | Unsplash `photo-1761479271790-c7327d1bc5b3` |
| IMG-015 | `bracelet-fine-chain` | צמיד חוליות דק | מוצר, על גוף | Unsplash `photo-1744472457504-f99a96ecbd3e` |
| IMG-016 | `bracelet-thin-beaded` | צמיד חרוזים | מוצר, על גוף | Unsplash `photo-1740567389909-b36e9cadbef9` |
| IMG-017 | `bracelet-slim-bangle` | צמיד קשיח דק | מוצר | Unsplash `photo-1655707063513-a08dad26440e` |
| IMG-018 | `editorial-necklace-onbody` | כיסוי קטגוריית שרשראות ואינסטגרם | אווירה | Unsplash `photo-1611652022419-a9419f74343d` |

לפי `scripts/build-catalog-images.mjs`, התמונות נבחרו מ־Unsplash תחת רישיון
המתיר שימוש מסחרי ללא ייחוס. הצהרה זו לא אומתה משפטית מחוץ לפרויקט.

## סתירות ידועות

- `ring-solitaire-yellow` ו־`ring-solitaire-rose` אינם נראים כאותו עיצוב בשתי מתכות.
- `ring-thin-stack` אינו מציג את טבעת היומיום הדקה המתוארת במוצר.
- `ring-worn-stack` אינו מציג בבירור סט מוגדר של שלוש רצועות דקות.
- `necklace-small-pendant` מציג תליון מרובה אבנים במקום יהלום בודד.
- בלוק החומרים בעמוד המוצר הוא גנרי ומייחס יהלומים גם לפריטים ללא יהלום.

## מועמדים

### מועמד 001 — טבעת יומיום דקה

- **תאריך יצירה:** 2026-08-18
- **עמוד:** `/product/thin-band-daily`
- **עמוד חי:** `https://noga-jewelry.netlify.app/product/thin-band-daily`
- **מוצר:** טבעת יומיום דקה
- **מק״ט:** לא קיים
- **סוג ומיקום:** תמונת מוצר ראשית; משמשת גם בכרטיסי קטלוג ובתמונות ממוזערות
- **נכס מקורי:** `public/products/ring-thin-stack.webp` ו־`ring-thin-stack@600.webp`
- **נתיב המועמד:** `docs/image-candidates/candidate-001-ring-thin-daily-v1.png`
- **מידות:** 1254×1254, יחס 1:1, PNG, ‏sRGB
- **גרסה:** 1
- **נוצר באמצעות AI:** כן, באמצעות כלי `image_gen` המובנה
- **סטטוס:** נדחה/הוחלף בתהליך — המשתמשת ביקשה התאמה למפרט קנוני מדויק;
  המועמד לא שולב באתר
- **נתוני מוצר ששימשו:** טבעת יחידה ודקה בעבודת יד; זהב צהוב; עמוד המוצר מציין
  זהב מלא 14 קראט ואפשרות ל־18 קראט לפי בקשה; ללא אבן או קישוט בתיאור המוצר.
- **חוסר ודאות:** רוחב הטבעת והגימור אינם נמסרים במספרים. המועמד מפרש את
  המילים “דקה” ו“בעבודת יד” כפרופיל עדין וגימור מלוטש מאופק. ה־alt הקיים כתוב
  בלשון רבים ומתאר מספר טבעות; אם המועמד יאושר, יהיה צורך לעדכן אותו לטבעת יחידה.

#### הפרומפט המדויק

```text
Use case: product-mockup
Asset type: square primary product photograph for a luxury jewelry product page and catalog card
Primary request: create an original, photorealistic commercial product photograph of the exact described product: one single very thin handcrafted everyday ring made from solid 14-karat yellow gold
Scene/backdrop: clean warm-cream neutral studio surface with a subtle pale stone texture; restrained, elegant, uncluttered
Subject: exactly one continuous thin yellow-gold band, physically plausible and comfortable for daily wear; uniform delicate profile; no center setting
Style/medium: real high-end jewelry product photography, not CGI or illustration
Composition/framing: square 1:1 composition, centered three-quarter view, the full ring clearly visible, generous clean padding for responsive crops
Lighting/mood: soft controlled studio softbox lighting, natural balanced reflections, gentle contact shadow, quiet luxury
Materials/textures: believable solid 14k yellow gold with subtle hand-polished finish and realistic micro-imperfections
Constraints: exactly one ring; yellow gold; very thin plain band; no stones; no engraving; no decorative pattern; no extra bands; physically connected and geometrically possible; sharp focus on the ring; no text, logo, brand name, or watermark
Avoid: gemstones, signet shapes, colored stones, multiple rings, hands, models, props, packaging, liquid or melted metal, plastic appearance, artificial 3D-render look, excessive mirror shine, warped or asymmetrical geometry
```

#### בדיקות לפני הצגה

- הטבעת תואמת לסוג המוצר ולגוון המתכת.
- מופיעה טבעת אחת בלבד, ללא אבנים, חריטה או קישוט שלא נמסרו.
- הגאומטריה רציפה ואפשרית פיזית.
- אין טקסט, לוגו, מותג או סימן מים.
- יחס התמונה 1:1 ומתאים למיקום הקיים.
- הקובץ אינו מחובר לקוד או לנתיב תמונה פעיל באתר.
- העמוד החי נבדק בקריאה בלבד והוא מציג את אותה תמונה סותרת כמו הפרויקט המקומי.

### מועמד 002 — טבעת יומיום דקה, מפרט קנוני

- **תאריך יצירה:** 2026-08-18
- **עמוד:** `/product/thin-band-daily`
- **עמוד חי:** `https://noga-jewelry.netlify.app/product/thin-band-daily`
- **מוצר:** טבעת יומיום דקה
- **מק״ט:** לא קיים
- **סוג ומיקום:** תמונת מוצר ראשית; מיועדת גם לכרטיסי קטלוג ולתמונות ממוזערות
- **נכס מקורי:** `public/products/ring-thin-stack.webp` ו־`ring-thin-stack@600.webp`
- **נתיב המועמד:** `docs/image-candidates/candidate-002-ring-thin-daily-canonical-v1.png`
- **מידות:** 1254×1254, יחס 1:1, PNG, ‏sRGB
- **גרסה:** 1
- **נוצר באמצעות AI:** כן, באמצעות כלי `image_gen` המובנה
- **סטטוס:** אושר ושולב באתר המקומי בלבד
- **נוסח האישור:** `אני מאשרת את מועמד מספר 002`
- **תאריך השילוב:** 2026-08-18
- **מפרט קנוני:** טבעת יחידה; זהב צהוב מלא 14 קראט; רוחב 1.6 מ״מ;
  עובי 1.4 מ״מ; חתך חיצוני חצי־עגול; פנים מעוגל לנוחות; גימור מלוטש
  ומאופק; ללא אבנים, חריטה, קישוט או חיבור נראה.
- **מגבלת דיוק:** מחולל תמונות אינו כלי CAD ואין בתמונה קנה מידה. המידות
  משמשות לקביעת הפרופורציות החזותיות, אך אינן ניתנות למדידה מהפיקסלים בלבד.

#### הפרומפט המדויק

```text
Use case: product-mockup
Asset type: square primary product photograph for a luxury jewelry product page, catalog card, and thumbnails
Primary request: create an original photorealistic commercial product photograph that follows this canonical demo-product specification exactly
Scene/backdrop: clean warm-cream neutral studio surface with very subtle pale stone texture; elegant, quiet, minimal, uncluttered
Subject: exactly one continuous everyday ring made from solid 14-karat yellow gold; band width 1.6 mm; band thickness 1.4 mm; half-round convex exterior cross-section; smoothly rounded comfort-fit interior; proportionally very thin and delicate compared with the ring diameter; no center setting
Style/medium: authentic high-end macro jewelry photography captured with a real camera, not CGI or illustration
Composition/framing: square 1:1; full ring completely visible; centered three-quarter low angle that clearly reveals both the half-round outer profile and rounded inner edge; generous clean padding for responsive crops
Lighting/mood: soft controlled studio softbox lighting; natural balanced reflections; gentle contact shadow; restrained quiet-luxury mood
Materials/textures: believable solid 14k yellow gold; subtle hand-polished high-gloss finish with minute realistic surface variation; accurate gold color without orange or oversaturated yellow cast
Constraints: exactly one ring; 1.6 mm wide and 1.4 mm thick proportions; yellow gold; half-round exterior; comfort-fit interior; plain uninterrupted band; no stones; no engraving; no decorative pattern; no extra rings; no solder seam; physically connected, circular, symmetrical, and manufacturable; sharp focus on the entire ring; no text, logo, hallmark, brand name, or watermark
Avoid: gemstones, settings, signet shapes, flat wide band, square cross-section, colored stones, multiple bands, hands, models, fabric, props, packaging, liquid or melted metal, plastic appearance, artificial 3D-render look, excessive mirror clipping, warped ellipse, impossible or asymmetrical geometry
```

#### בדיקות לפני הצגה

- מופיעה טבעת אחת בלבד, ללא אבנים, חריטה, קישוטים או טבעות נוספות.
- גוון המתכת הוא זהב צהוב והחומר נראה מתכתי ולא פלסטי.
- החתך החיצוני חצי־עגול והקצה הפנימי מעוגל ונראה בבירור.
- הטבעת רציפה, סימטרית ואפשרית לייצור.
- אין טקסט, לוגו, מותג או סימן מים.
- יחס התמונה 1:1 ומתאים לגלריה, לכרטיס ולתמונות הממוזערות.
- הקובץ המועמד נשמר כתיעוד; גרסאות WebP מאושרות חוברו למוצר המקומי.

#### שילוב ובדיקות לאחר האישור

- נוספו, בלי לדרוס קובץ קיים:
  `public/products/ring-thin-daily-main-v1.webp` (‏1000×1000) ו־
  `public/products/ring-thin-daily-main-v1@600.webp` (‏600×600).
- הנכסים המקוריים `ring-thin-stack.webp` ו־`ring-thin-stack@600.webp`
  נשמרו ללא שינוי.
- רק המוצר `thin-band-daily` חובר לתמונה החדשה. ה־alt עודכן ל־
  `טבעת יומיום דקה מזהב צהוב על רקע אבן בגוון קרם`, ותיאור האבנים הוגדר
  עבור מוצר זה בלבד כ־`ללא אבנים.`
- `npm run build` עבר בהצלחה. אזהרת גודל ה־chunk הקיימת אינה קשורה לשינוי.
- פקודת האימות הקיימת הופעלה, אך דפדפן Chromium הפרטי של Playwright אינו
  מותקן בסביבה. לא הותקנה תלות חדשה; בדיקת חלופה עם Chrome המותקן עברה
  בדסקטופ 1280×900, בטאבלט 768×1024 ובמובייל 375×812.
- נבדקו טעינת התמונה הראשית והממוזערות, זום, כרטיס הקטלוג, מגירת העגלה
  והצ׳קאאוט. לא נמצאו שגיאות קונסול, שגיאות HTTP, תמונות חסרות או גלישה
  אופקית.
- לא בוצעה פריסה. האתר החי נשאר ללא שינוי.

#### שחזור

כדי לחזור למצב הקודם, יש לשנות במוצר `thin-band-daily` שב־
`src/data/products.ts` את `image` חזרה ל־`ring-thin-stack`, להחזיר את ה־alt
`טבעות זהב צהוב דקות מונחות על אבן בהירה לצד בד משי`, ולהסיר מאותו מוצר את
`stonesDescription`. אין צורך לשחזר קבצי תמונה שנמחקו, משום שהמקוריים לא
נמחקו ולא שונו. את המועמד והיסטוריית האישור יש להשאיר לצורכי תיעוד.

המספר הבא: `003`.
