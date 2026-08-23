# Changelog

כל השינויים המשמעותיים בפרויקט. הפורמט מבוסס על
[Keep a Changelog](https://keepachangelog.com/he/1.1.0/).
הפרויקט הוא אתר הדגמה לתיק עבודות ואינו מנוהל בגרסאות semver.

## [Unreleased]

### Added

* מבנה תיעוד משותף ל־Codex ול־Claude: `PROJECT.md` הוא מקור ההנחיות המשותף,
  `AGENTS.md` ו־`CLAUDE.md` הם קובצי כניסה נפרדים שמפנים אליו, התיעוד הטכני
  הועבר ל־`ARCHITECTURE.md`, ונוסף `docs/IMAGE_ASSET_REGISTER.md` למועמדי
  תמונות, אישורים והוראות שחזור.
* מועמד תמונה 002 שאושר עבור `thin-band-daily`: נוספו גרסאות WebP בגודל
  1000×1000 ו־600×600 של טבעת זהב צהוב 14 קראט יחידה, דקה וללא אבנים.
  התמונה נוצרה ב־AI לפי מפרט קנוני; קובצי התמונה המקוריים נשמרו ללא שינוי.
* זמינות מוצר כמקור אמת ב־`products.ts`: 12 פריטים `ready`, שלושה
  `made-to-order` ופריט אחד `out-of-stock`. המצב מוצג בשקט בכרטיס הקטלוג,
  בעמוד המוצר ובכרטיסי עוזר הבחירה.
* טופס "עדכנו אותי כשחוזר למלאי" לפריט שאזל. הטופס מאמת אימייל ומציג אישור
  מקומי בלבד; אין שמירה ואין קריאת רשת במצב ההדגמה.
* עמוד `/visit` לביקור בסטודיו בשבזי 45: מפה מוטמעת, ניווט ב־Waze, שעות
  פתיחה, המלצה לתאם מראש וקישור WhatsApp עם מספר הפלייסהולדר הקיים.
* בעמוד הסיפור נוסף ההסבר היחיד באתר למקור השם: דנה קראה לאטלייה נוגה על שם
  בתה.
* **עוזר בחירה — שלב 1 (דטרמיניסטי).** ווידג'ט הנחיה שמצמצם מהקטלוג לפי ארבע
  שאלות (למי התכשיט, טווח מחירים, קטגוריה, מתכת) ומציג עד שלוש המלצות.
  * `src/lib/agent/types.ts` — ממשק `AgentBrain` וטיפוסי ההודעות והפעולות.
  * `src/lib/agent/catalog.ts` — חיפוש וסינון טהורים מעל `src/data/products.ts`.
    כל האפשרויות שמוצגות נגזרות מהנתונים ורק אם יש להן פריט אחד לפחות.
  * `src/lib/agent/wizard.ts` — זרימת השאלות, חוקי ההמלצה וטיפול בטקסט חופשי.
  * `src/lib/agent/index.ts` — `createAgentBrain()`, המקום היחיד שבו נבחר מוח.
  * `src/components/agent/ShoppingAssistant.tsx` — launcher, פאנל, focus trap
    וחיווט הפעולות.
  * `src/components/agent/AssistantProductCard.tsx` — כרטיס המלצה קומפקטי.
* **עוזר בחירה — שלב 2 (Gemini עם fallback).** נוסף `llmBrain` מול
  `netlify/functions/agent-chat.ts`, לצד האשף הקיים וללא שינוי בקומפוננטת
  הווידג׳ט. `resilientBrain` מחזיק את שני המוחות ועובר לצמיתות לאשף באותו
  סשן כאשר ה־LLM, המפתח, המכסה או אחסון המכסה אינם זמינים.
* חמשת כלי שלב 2: `search_products`,‏ `get_product`,‏
  `present_recommendations`,‏ `open_size_guide` ו־`offer_whatsapp`. הכלים
  קוראים את הקטלוג הקיים או מציגים כפתור בלבד; אף כלי אינו מבצע פעולה.
* הגנות server-side לעוזר: origin allowlist, עד 500 תווים להודעה, 20 הודעות
  בסשן חתום, עד ארבע קריאות מודל להודעה ומכסה של 200 קריאות Gemini ביום UTC.
  המונים משתמשים ב־Netlify Blobs עם consistency חזק וכתיבות ETag אטומיות.
* פעולות מחוברות לאפליקציה האמיתית: מעבר לעמוד מוצר דרך react-router, הוספה
  לעגלה דרך `useCart.add()` הקיימת, פתיחת `SizeGuideModal` הקיים, והפניה
  לוואטסאפ עם הפלייסהולדר הקיים.
* `README.md`, `PROJECT.md`, `CHANGELOG.md` — לא היו קודם בפרויקט.
* `.claude/launch.json` — הגדרת שרת הפיתוח לאימות בדפדפן.
* `src/components/layout/FloatingActions.tsx` — נקודת העגינה היחידה של
  הלואנצ׳ר וכפתור הוואטסאפ: הסתרה משותפת בצ׳קאאוט, עיגון משותף לאותו צד
  (inline-end) כערימה אנכית, ומרחק תחתית משותף.

### Changed

* `SITE_URL` וכל כתובות ה־SEO הקבועות הועברו מהדומיין הישן של Vercel אל
  `https://noga-jewelry.netlify.app`; ה־canonical, ה־meta, ה־JSON-LD,
  `sitemap.xml` ו־`robots.txt` משתמשים כעת באותו מקור.
* סימני הפיסוק בטקסט העברי שמוצג באתר נורמלו בלי לשנות מילים או משמעות:
  dash של משפט הוחלף בפסיק או במקף רגיל, אליפסיס הוחלף בשלוש נקודות,
  ומרכאות ישרות הוחלפו בגרשיים עבריים. טווחים עם en dash ומקפים עבריים
  בצירופים נשמרו ללא שינוי.
* עמוד המוצר מציג זמינות וזמני מסירה משותפים: משלוח לבית 3–5 ימי עסקים,
  איסוף מהסטודיו עד 2 ימי עסקים, ולפריט בהזמנה כשבועיים ייצור לפני המסירה.
  `Product` JSON-LD משתמש כעת ב־`InStock`,‏ `PreOrder` או `OutOfStock` בהתאם
  לנתון האמיתי.
* הצ׳קאאוט מציע משלוח לבית ואיסוף מהסטודיו ללא עלות, ומציג את זמן הייצור כאשר
  יש בעגלה פריט `made-to-order`.
* עוזר הבחירה עונה על זמינות וזמני מסירה מהקטלוג ומהקבועים המשותפים בלבד.
  דמי משלוח, מבצעים והחזרות נשארים בלתי ידועים ומועברים ל־WhatsApp.
* `createAgentBrain()` מחזיר כעת מוח עמיד: LLM כברירת מחדל והאשף
  הדטרמיניסטי, שהתנהגותו לא שונתה, כ־fallback. כל תור LLM מתחיל בלי עובדות
  קטלוג קודמות ודורש קריאת כלי חדשה לפני טענת מוצר.
* נתוני הכרטיסים אינם מגיעים מטקסט Gemini: השרת מחזיר slugs בלבד, מקבל רק
  slugs שנשלפו באותו תור, והלקוח פותר אותם מחדש מול `products.ts`. זמינות
  וזמני מסירה מורכבים בקוד מרשומת הכלי. סורק היציאה מחליף טענה ללא ראיה
  בשורה כללית ובהפניית WhatsApp.
* עוזר Gemini חזר ל־`AUTO` כברירת מחדל: ברכות מקבלות תשובה טבעית, בקשת קנייה
  פתוחה מקבלת שאלת הבהרה אחת כשהכלים כבויים עבורה, ידע כללי על תכשיטים נענה
  ללא קטלוג, וחיפוש מתחיל רק כשיש די פרטים להמלצה. שאלות מזוהות על מדיניות
  עסקית לא ידועה מחייבות רק את `offer_whatsapp`. ניסוח המעבר אחרי המלצות מגיע מהמודל במקום ממשפט קבוע,
  בלי להפוך אותו למקור לשמות, מחירים או נתוני מוצר. נוסף לוג שרת מינימלי של
  כלים, ארגומנטים בטוחים, מספר תוצאות והאם סורק ההארקה החליף טקסט, ללא תוכן
  משתמשת או מזהים.
* תשובות קצרות לשאלת הבהרה שומרות כעת רצף שיחה באמצעות עד שתי הודעות קודמות
  של הקונה. תשובות העוזר, כרטיסים ועובדות קטלוג קודמות אינם נשלחים; ההקשר
  משמש לכוונה בלבד וכל עובדה עסקית עדיין דורשת כלי חדש באותו תור.
* הניווט, ה־sitemap וה־LocalBusiness JSON-LD כוללים את עמוד הביקור וכתובת
  הסטודיו. ה־hero בעמוד החדש משתמש באותו מנגנון הסתרה/חשיפה של הפעולות הצפות.
* הוחלפו מקומית חמש התאמות תמונה מטעות באמצעות מועמדים שאושרו לבחירה:
  `single-diamond-necklace` (004), שתי מתכות `solitaire-classic` (005),
  `fine-diamond-band` (008), `stacking-rings` (010) ו־
  `bezel-chain-necklace` (012). לכל נכס נוספו גרסאות 1000×1000 ו־600×600
  בשמות חדשים; המקורות נשמרו ללא שינוי.
* ה־alt של חמשת המוצרים עודכן כך שיתאר במדויק את התמונה הפעילה. מועמד 002
  של `thin-band-daily` נשאר פעיל ונבדק שוב. ביקורת חוזרת של כל 16 המוצרים
  מצאה שכל התמונות הפעילות תואמות לשם, לתיאור, למתכת, לאבנים ולכמות הפריטים.
  הסבב נפרס לאתר החי ב־2026-08-19 במסגרת commit `56c04ee`.
* המוצר `thin-band-daily` משתמש במועמד 002 המאושר. ה־alt מתאר כעת
  טבעת יחידה, ושורת האבנים של מוצר זה בלבד מציגה `ללא אבנים.` לא שונו שם,
  מחיר, מידות או נתונים של מוצרים אחרים. המועמד נפרס לאתר החי יחד עם סבב
  חמש ההתאמות ב־2026-08-19 במסגרת commit `56c04ee`.
* `src/components/layout/RootLayout.tsx` — הוספת `<ShoppingAssistant />` ועדכון
  הערת התיעוד. זה השינוי היחיד בקובץ קיים.
* `CLAUDE.md` נשאר קובץ כניסה קצר וניטרלי לכלי ומפנה להחלטות העדכניות
  ב־`PROJECT.md`; החלטות שלב 1 ושלב 2 אינן משוכפלות בו.
* `src/components/layout/RootLayout.tsx` — מרכיב `<FloatingActions />` במקום
  `<WhatsAppFab />` ו־`<ShoppingAssistant />` בנפרד.
* `src/components/layout/WhatsAppFab.tsx` — איבד את מיקום ה־`fixed` העצמאי
  שלו; הוא כעת ילד flex בתוך `FloatingActions`. ההיגיון הקיים שמסתיר אותו
  בעמודי מוצר לא השתנה.
* `src/components/agent/ShoppingAssistant.tsx` — אותו דבר עבור כפתור
  הלואנצ׳ר בלבד; הפאנל עצמו (המתועל דרך portal) לא נגעו בו.
* `src/styles/index.css` — משתנה CSS חדש, `--floating-actions-offset`:
  `env(safe-area-inset-bottom)` ועוד רווח קבוע, משותף לשני האלמנטים.
* `index.html` — נוסף `viewport-fit=cover` ל־meta viewport, נדרש כדי ש־
  `env(safe-area-inset-bottom)` יחזיר ערך שאינו אפס במכשירים עם חריץ.

### Notes

* לעוזר יש כעת backend יחיד ב־Netlify Functions. `GEMINI_API_KEY` נקרא רק
  בצד השרת ואינו נכלל ב־Vite bundle. שאר האתר, האשף, העגלה והצ׳קאאוט נשארים
  במבנה הקודם.
* העוזר מצהיר על זמינות וזמני מסירה רק מתוך `products.ts` והקבועים המשותפים.
  דמי משלוח, מבצעים והחזרות עדיין אינם ידועים; שאלה עליהם מקבלת תשובה כנה
  והפניה לוואטסאפ.
* שכבות z: קבוצת הפעולות הצפות (`FloatingActions`) ו־scrim 30, פאנל 41,
  header 40, מגירת עגלה ומודלים 50.
  הפאנל מעל ה־FAB כדי שלא ייקרע, מתחת למגירה ולמודלים, ואינו מגיע ל־header
  בשום גובה מסך.
* **בדיקה אמפירית של Gemini Flash לקראת שלב 2.** סקריפט חד-פעמי וזמני, שלא הוכנס לגיט (הורץ תחת
  `scripts/gemini-probe/` ונמחק לאחר הריצה), בדק עד כמה `gemini-3.6-flash`
  מציית לכלל אי-ההמצאה כשיש לו גישה לקטלוג האמיתי (`src/data/products.ts`,
  `src/lib/agent/catalog.ts`) דרך function calling. מתוך 7 תגובות אמיתיות
  שהתקבלו לפני שהמכסה נגמרה — **0 דליפות**: אף תגובה לא הכילה מחיר או שם
  מוצר בטקסט חופשי (פרטי מוצר עברו רק דרך קריאה ל־`present_recommendations`),
  ושאלות על מלאי/זמני אספקה/עלות משלוח קיבלו תשובה כנה ("אין לי מידע") עם
  הפניה לוואטסאפ, כנדרש. מדגם קטן מדי כדי להיות מסקנה סופית. הבדיקה נעצרה
  כי מכסת הטוט החינמי של `gemini-3.6-flash` נמדדה בפועל (לא הונחה) כ־**5
  בקשות לדקה / 20 בקשות ליום** — נמוך מדי לעוזר חי. בדיקה נפרדת של
  `gemini-3.5-flash-lite` מדדה **15 בקשות לדקה** וראש מרווח במכסה היומית;
  לכן הוא נבחר לשלב 2, כשה־model ID נשמר כקבוע יחיד להחלפה.

### Fixed during implementation

* שאלת זמינות בניסוח הנשי `זמינה` לא זוהתה, משום ש־ן׳ סופית ו־נ׳ אמצעית הן
  תווים שונים. הביטוי מכסה כעת `זמין`, `זמינה` ו־`זמינות` במפורש.
* מחלקת ה־RTL הקיימת לא הפכה בפועל את חצי העוזר ואת חץ Waze. החצים מוגדרים
  כעת בהיפוך מפורש, ונבדקו לפי ה־transform המחושב בדפדפן אמיתי.
* הפעולות הצפות בעמוד הביקור יכלו לעבור מעל שעות הפתיחה ב־375px. תוכן הפרטים
  קיבל מרווח לוגי בצד ה־inline-end, בלי לשנות את מיקום הקבוצה או את כלל
  ההסתרה/חשיפה שלה.
* ESC סגר את הפאנל אבל הפוקוס נפל ל־`body`: ה־launcher אינו מרונדר בזמן שהפאנל
  פתוח, ולכן ה־ref שלו `null` ברגע הסגירה. הוחלף ב־flag + effect שמחזיר פוקוס
  אחרי שה־launcher חזר לרנדר.
* כפתור הוואטסאפ הצף (`z-40`) הופיע מעל גיליון המובייל (`z-31`). הפאנל הועלה
  ל־`z-41`.
* נעילת גלילת הרקע נשענה על media query ב־React state, שיכול להתיישן בשינוי
  גודל ולהשאיר את העמוד לא־גליל בדסקטופ. הנעילה נקראת כעת מתוך ה־effect
  ומתעדכנת בכל שינוי מדיה; ה־scrim מוגדר ב־CSS בלבד.
* גובה הגיליון במובייל הוגדר `82svh` בלבד, ובמסך נמוך היה מכסה את ה־header.
  הוחלף ב־`min(82svh, 100svh − 9rem)`.
* נימוק ההמלצה הסיק מתכת שהקונה לא ביקש והציג אותה כסיבה. כעת הנימוק נבנה רק
  ממה שנבחר בפועל, ובלי סינון מוצג התיאור מהקטלוג.


### Fixed — חפיפת האלמנטים הצפים ב־Safari מובייל

* **375×812 ב־Safari: שני האלמנטים הצפים ישבו נמוך מדי וחפפו תוכן** — בדף
  הבית את שורת ה־CTA של ה־hero, וב־`/checkout` את שדות הטופס. השורש: פס
  הכלים התחתון של Safari מובייל צורך גובה viewport ודוחף אלמנטים `fixed`
  מעוגני־תחתית לתוך התוכן — תופעה שלא משוחזרת בדסקטופ.
  * שניהם מוסתרים לגמרי ב־`/checkout` — עמוד צ׳קאאוט לא אמור להכיל שום
    דבר מלבד הטופס. בדיקת הנתיב במקום אחד (`FloatingActions`), לא
    משוכפלת בין הקבצים.
  * מרחק התחתית גדל דרך `--floating-actions-offset` החדש. נמדד בדפדפן
    אמיתי (Chromium דרך Playwright — אין דרך לדמות בסביבה הזו את פס הכלים
    הדינמי של Safari עצמו): פער של 60px בין קבוצת האלמנטים לשורת ה־CTA
    ב־375×812, אפס חפיפה. הרווח נבחר בנדיבות במכוון כדי לספוג גם פס כלים
    אמיתי שבסביבת הבדיקה לא קיים.
  * שני האלמנטים אוחדו לצד אחד (inline-end, במקום בפינות מנוגדות) כערימה
    אנכית עם רווח קבוע — כך שיחד הם כבר לא פורשים על פני כל רוחב המסך
    ומובטחים להתנגש בשורת תוכן מלאת־רוחב. כל הפריסה ב־CSS בלבד; אין hook
    חדש שקורא את גודל המסך.


### Fixed — corrected the floating-actions offset (previous fix overcorrected)

* **The previous fix (above) overcorrected.** Its 9rem buffer, sized to
  clear Safari's bottom toolbar, pushed both floating elements to
  mid-viewport height on a real iPhone in Safari at 375px: the launcher
  covered the start of the hero headline, the WhatsApp FAB covered its
  second line. Root cause: the previous fix only measured clearance
  against the CTA row and never checked the H1/subtext above it, so the
  buffer needed to escape the toolbar silently pushed the group into the
  headline instead.
* `--floating-actions-offset` is now `5.75rem` (92px), down from `9rem`
  (144px). Measured in a real browser (Chromium via Playwright) at
  375x812: the 102px-tall stack has a narrow real window — offset
  84–98px — that clears both the H1 (ends at 612px) and the CTA row
  (starts at 728px); 92px sits in the middle, 6px clear of the H1 and 8px
  clear of the CTA.
* **Known, accepted overlap:** the hero's subtext paragraph (636–688px)
  sits inside that same 102px band at every offset in the safe window —
  the stack is taller than the gap between the subtext and the CTA row,
  so a ~52px overlap with the subtext is unavoidable without shrinking
  the stack or the hero. Neither was in scope for this fix.
* **Reported, not silently absorbed — a real conflict remains under a
  simulated Safari toolbar.** Position:fixed elements in real iOS Safari
  track the shrunk visual viewport while regular content still lays out
  against the static one, so a visible bottom toolbar (~110px, per the
  request that drove this fix) shifts the fixed stack up on screen while
  the H1/subtext/CTA stay exactly where they are. Modelled that
  arithmetically (content rects unchanged, the stack's rect shifted up
  110px) rather than assuming: at every offset in the 84–98px safe
  window — not just 92px — the shifted stack overlaps the H1 by
  96–102px, i.e. almost its full height. No non-negative offset avoids
  this: the stack's height (102px) plus the toolbar shift (110px)
  exceeds the room between the H1 and the CTA row at this viewport, so
  the conflict cannot be tuned away by picking a different offset. Fixing
  it for real would mean shrinking the hero or the floating stack —
  both out of scope here ("do not resize or move the hero to make
  room") — flagging for a decision rather than picking one silently.
* Verified unchanged: nothing renders on `/checkout` and every field stays
  reachable; at 1440x900 the stack sits in the bottom corner, 92px from
  the edge, clear of the CTA row; the assistant still opens, completes a
  full flow, and adds to cart; no console errors beyond the pre-existing,
  unrelated THREE.Clock/GPU-driver noise seen in every prior verification
  pass.
* Only `src/styles/index.css` changed (the offset value and its comment).
  No other file touched.

### Changed — hide the floating actions on the hero, reveal on scroll

* **Superseded the offset-tuning approach above.** Measuring proved there
  is no `--floating-actions-offset` value that clears the Home hero's
  H1, subtext, and CTA row simultaneously at 375px — the floating stack
  is taller than the room available. Rather than continuing to chase an
  offset, both elements now hide outright while the hero is on screen
  and reveal together once the user has scrolled past it. The offset
  itself is untouched (`5.75rem`) — it now only positions the stack once
  revealed, not around the hero.
* `src/hooks/useHeroInViewObserver.ts` (new): an `IntersectionObserver`
  on the hero section, not a scroll listener and not a hardcoded pixel
  threshold. "Mostly out of view" is a single 10% threshold — reveal
  once less than a tenth of the hero remains visible.
* `src/lib/heroVisibility.ts` (new): a tiny, non-persisted zustand store
  carrying one boolean. Needed because `Home` (which owns the hero ref)
  and `FloatingActions` (mounted in `RootLayout`) are siblings, not
  parent/child — there is no ref to pass directly between them. Pages
  without a hero never touch the store, so it stays `false` there and
  both elements show immediately; unmounting resets it to `false` so
  navigating away never leaves them stuck hidden.
* `src/pages/Home.tsx`: wires a ref on the hero `<section>` to the new
  observer hook. No other page changed — only Home currently registers a
  hero.
* `src/components/layout/FloatingActions.tsx`: while the hero is in
  view, the wrapper gets `opacity-0` and, imperatively via a ref
  (`toggleAttribute('inert', heroInView)`), the `inert` attribute — not
  opacity alone. `inert` is set via the DOM API rather than as a JSX
  prop on purpose: a boolean-ish HTML attribute passed as `inert={false}`
  in JSX risks rendering the literal string `"false"`, which the
  browser reads as present (i.e. still inert) regardless of the string's
  content. `inert` removes the group from the tab order, the
  accessibility tree, and pointer/click handling immediately — it does
  not wait for the opacity transition, so there is never a window where
  a fading-out element is still clickable.
* The transition (`transition-opacity duration-200`) is not given any
  special reduced-motion handling of its own — the project's existing
  global rule in `styles/index.css` (`transition-duration: 0.01ms
  !important` under `prefers-reduced-motion: reduce`) already collapses
  it, same as every other transition on the site. Verified with
  Playwright's `reducedMotion: 'reduce'` context option: the elements
  appear within ~50ms of scrolling past the hero, no visible fade.
* **An already-open assistant panel is untouched by any of this.** The
  panel is a separate `createPortal` straight to `document.body` (see
  ShoppingAssistant.tsx) — it is not a DOM descendant of the
  `FloatingActions` wrapper. Marking the wrapper `inert` while scrolling
  back up to the hero never reaches an already-open panel, which is what
  keeps it open with no extra logic needed to special-case it.
* Verified in a real browser (Chromium via Playwright) at 375x812 and
  1440x900: hidden and fully inert (opacity 0, `inert` present,
  `aria-hidden="true"`) while the hero is in view, with 8 Tab presses
  never landing on either element; revealed and clickable after
  scrolling past (opacity 1, `inert` removed, launcher opens the panel);
  scrolling back up with the panel open re-hides the launcher/FAB but
  leaves the panel open; nothing renders on `/checkout` at any scroll
  position; pages without a hero (`/catalog`) show both immediately; the
  full flow (open -> 4 questions -> add to cart) completes; no console
  errors beyond the pre-existing, unrelated THREE.Clock/GPU-driver noise
  from the hero's continuous 3D scene.
* Removed the now-resolved "known conflict" note about the hero overlap
  from ARCHITECTURE.md (previously under § אלמנטים צפים) — it no
  longer applies, since the elements are not shown at all while the hero
  is on screen.
---

## [0.1.0] — 2026-08-03

הבסיס: מערכת עיצוב, hero תלת־ממדי scroll-driven ("The Dark Room"), קטלוג,
עמוד מוצר, עגלה וצ׳קאאוט מעוצב, עמודים משניים, SEO ונגישות.

| commit | תיאור |
| --- | --- |
| `2271c8d` | תיקון היהלום השחור ב־hero, מיסגור מחדש של הטבעת, החלפת תמונת עגיל ריקה |
| `445af08` | הפיכת scroll reveals ל־fail-open, והוספת הרנס אימות בדפדפן אמיתי |
| `d6c0b38` | נקודת ביקורת לפני refactor ה־reveal |
