/**
 * MedScan — מילון קליני תלת-לשוני (he / en / ar)
 * טיוטה לאימות. אינו תרגום מאושר של נלסון/חוזר.
 */

export const CLINICAL_DICTIONARY = Object.freeze({
  'disclaimer.clinical': {
    he: 'MedScan הוא כלי תמיכה בהחלטות בלבד. אינו מהווה אבחנה או תחליף לשיקול דעת רפואי. כל החלטה טעונה אימות ע"י רופא/ה מוסמך/ת.',
    en: 'MedScan is decision support only. It is not a diagnosis or a substitute for clinical judgment. A licensed physician must verify every decision.',
    ar: 'MedScan أداة لدعم القرار فقط. ليست تشخيصاً وليست بديلاً عن التقدير الطبي. يجب أن يتحقق طبيب مرخّص من كل قرار.',
  },
  'emergency.ed': {
    he: 'פנה מיד לחדר מיון / רפואה דחופה לפי פרוטוקול מקומי.',
    en: 'Go to the emergency department immediately per local protocol.',
    ar: 'توجه فوراً إلى قسم الطوارئ وفق البروتوكول المحلي.',
  },
  'tox.opioid.title': {
    he: 'טוקסידרום אופיואידי — כיוון',
    en: 'Opioid toxidrome — direction',
    ar: 'متلازمة سمية أفيونية — اتجاه',
  },
  'tox.anticholinergic.title': {
    he: 'טוקסידרום אנטיכולינרגי — כיוון',
    en: 'Anticholinergic toxidrome — direction',
    ar: 'متلازمة سمية مضادة للكولين — اتجاه',
  },
  'tox.cholinergic.title': {
    he: 'טוקסידרום כולינרגי — כיוון',
    en: 'Cholinergic toxidrome — direction',
    ar: 'متلازمة سمية كولينية — اتجاه',
  },
  'tox.sympathomimetic.title': {
    he: 'טוקסידרום סימפתומימטי — כיוון',
    en: 'Sympathomimetic toxidrome — direction',
    ar: 'متلازمة سمية محاكية للودي — اتجاه',
  },
  'tox.sedative.title': {
    he: 'טוקסידרום סדטיבי-היפנוטי — כיוון',
    en: 'Sedative-hypnotic toxidrome — direction',
    ar: 'متلازمة سمية مهدئة-منومة — اتجاه',
  },
  'tox.battery.action': {
    he: 'סוללת כפתור — חירום: אל תגרה הקאה. צילום דחוף וייעוץ לפי פרוטוקול מקומי מאומת. אין מינון במנוע.',
    en: 'Button battery — emergency: do not induce vomiting. Urgent imaging and specialist care per local verified protocol. No doses in this engine.',
    ar: 'بطارية زر — طارئ: لا تحرض القيء. تصوير عاجل واستشارة وفق بروتوكول محلي موثّق. لا جرعات في هذه المحرك.',
  },
  'tox.magnet.action': {
    he: 'מגנטים (יותר מאחד או מגנט+מתכת) — ייעוץ כירורגי דחוף. אין להמתין לתסמינים.',
    en: 'Magnets (more than one, or magnet plus metal) — urgent surgical consult. Do not wait for symptoms.',
    ar: 'مغناطيسات (أكثر من واحد أو مغناطيس مع معدن) — استشارة جراحية عاجلة. لا تنتظر الأعراض.',
  },
  'pecarn.ct': {
    he: 'PECARN: סיכון גבוה — CT ראש לפי פרוטוקול מקומי (לא חובה אוטומטית בלי קליניקה).',
    en: 'PECARN: higher risk — head CT per local protocol (not an automatic mandate without clinical context).',
    ar: 'PECARN: خطر أعلى — أشعة مقطعية للرأس وفق البروتوكول المحلي.',
  },
  'pecarn.observe': {
    he: 'PECARN: סיכון ביניים — השגחה מול CT לפי שיקול קליני ופרוטוקול מקומי.',
    en: 'PECARN: intermediate risk — observation versus CT per clinician and local protocol.',
    ar: 'PECARN: خطر متوسط — مراقبة مقابل أشعة مقطعية وفق التقدير السريري.',
  },
  'pecarn.no_ct': {
    he: 'PECARN: ללא מאפייני סיכון שסומנו — CT אינו מומלץ על פי הכלל (טיוטה).',
    en: 'PECARN: no marked risk features — CT not recommended by the rule (draft).',
    ar: 'PECARN: لا سمات خطر معلّمة — الأشعة المقطعية غير موصى بها وفق القاعدة (مسودة).',
  },
  'formula.standard': { he: 'תמ"ל רגיל (Standard)', en: 'Standard infant formula', ar: 'حليب صناعي عادي' },
  'formula.comfort': { he: 'תמ"ל עדין / Comfort', en: 'Comfort / sensitive formula', ar: 'حليب مريح/لطيف الهضم' },
  'formula.soy': { he: 'תמ"ל סויה / צמחי', en: 'Soy / plant-based formula', ar: 'حليب الصويا/نباتي' },
  'formula.ar': { he: 'תמ"ל אנטי-ריפלוקס (AR)', en: 'Anti-reflux (AR) formula', ar: 'حليب مضاد للارتجاع' },
  'formula.ehf': { he: 'תמ"ל מפורק היטב (eHF) — CMPA', en: 'Extensively hydrolyzed formula (eHF) for CMPA', ar: 'حليب محلل بدرجة عالية (eHF) لحساسية حليب البقر' },
  'formula.aaf': { he: 'תמ"ל חומצות אמינו (AAF)', en: 'Amino-acid formula (AAF)', ar: 'حليب أحماض أمينية (AAF)' },
  'flag.anaphylaxis': { he: 'אנפילקסיס / תגובה אלרגית קשה', en: 'Anaphylaxis / severe allergic reaction', ar: 'تأق / تفاعل تحسسي شديد' },
  'flag.fpies': { he: 'חשד FPIES', en: 'Suspected FPIES', ar: 'اشتباه FPIES' },
  'flag.projectile': { he: 'הקאות הקשתיות — חשד היצרות שוער', en: 'Projectile vomiting — consider pyloric stenosis', ar: 'قيء قذفي — يُشتبه تضيق البواب' },
  'flag.fft': { he: 'כשל לשגשג (FTT) — כיוון סקירה', en: 'Failure to thrive (FTT) — screening direction', ar: 'فشل النمو — اتجاه مسح' },
  'flag.dehydration': { he: 'סימני התייבשות', en: 'Dehydration signs', ar: 'علامات تجفاف' },
  'ms.gross': { he: 'מוטוריקה גסה', en: 'Gross motor', ar: 'حركية جسيمة' },
  'ms.fine': { he: 'מוטוריקה עדינה', en: 'Fine motor', ar: 'حركية دقيقة' },
  'ms.language': { he: 'שפה ותקשורת', en: 'Language and communication', ar: 'لغة وتواصل' },
  'ms.social': { he: 'חברתי-קוגניטיבי', en: 'Social-cognitive', ar: 'اجتماعي-معرفي' },
  'ms.delay': {
    he: 'עיכוב התפתחותי אפשרי — הפניה למכון להתפתחות הילד לפי פרוטוקול מקומי',
    en: 'Possible developmental delay — refer to child development services per local protocol',
    ar: 'تأخر نمائي محتمل — إحالة إلى خدمات تطور الطفل وفق البروتوكول المحلي',
  },
  'refer.pt': { he: 'פיזיותרפיה התפתחותית', en: 'Developmental physiotherapy', ar: 'علاج طبيعي نمائي' },
  'refer.ot': { he: 'ריפוי בעיסוק', en: 'Occupational therapy', ar: 'علاج وظيفي' },
  'refer.slp': { he: 'קלינאות תקשורת', en: 'Speech-language pathology', ar: 'علاج نطق ولغة' },
  'refer.cdu': { he: 'מכון להתפתחות הילד', en: 'Child development unit', ar: 'مركز تطور الطفل' },
  'audio.stridor': { he: 'Stridor (פס גבוה יחסי)', en: 'Stridor (relative high band)', ar: 'صرير (نطاق مرتفع نسبيًا)' },
  'audio.wheeze': { he: 'Wheeze (פס מוזיקלי יחסי)', en: 'Wheeze (relative musical band)', ar: 'أزيز (نطاق موسيقي نسبي)' },
  'audio.crackles': { he: 'Crackles (פס טרנזיינט גבוה)', en: 'Crackles (high transient band)', ar: 'خراخر (نطاق عابر مرتفع)' },
  'audio.choking_croup_cough': { he: 'שיעול חנקני/קרופי (פס נמוך-בינוני)', en: 'Choking/croup cough (low–mid band)', ar: 'سعال خانق/خانوق (نطاق منخفض-متوسط)' },
  'audio.note': {
    he: 'אנרגיה יחסית בפסים בלבד. אינו מזהה Stridor/Wheeze/Crackles כקביעה קלינית ואינו מחליף האזנה. טיוטה לאימות.',
    en: 'Relative band energy only. This does not identify Stridor/Wheeze/Crackles as a clinical determination and does not replace auscultation. Draft pending verification.',
    ar: 'طاقة نطاق نسبية فقط. لا يحدد الصرير/الأزيز/الخراخر كحكم سريري ولا يغني عن الإصغاء. مسودة للتحقق.',
  },
  'pathway.no_match': {
    he: 'לא הותאם מסלול בירור לטקסט ולגיל שסופקו.',
    en: 'No workup pathway matched the supplied text and age.',
    ar: 'لم يُطابق مسار استقصاء النص والعمر المقدَّمين.',
  },
  'pathway.no_query': {
    he: 'לא סופקה שאילתה להתאמת מסלול.',
    en: 'No query was supplied to match a pathway.',
    ar: 'لم تُقدَّم استعلام لمطابقة مسار.',
  },
  'ddx.empty': {
    he: 'לא הוזנו ממצאים או תוצאות מעבדה. אין ממה לבנות אבחנה מבדלת.',
    en: 'No findings or lab results were entered. There is nothing from which to build a differential.',
    ar: 'لم تُدخل موجودات أو نتائج مختبر. لا أساس لبناء تشخيص تفريقي.',
  },
  'ui.md.morphology': { he: 'תיאור מורפולוגי', en: 'Morphologic description', ar: 'وصف شكلي' },
  'ui.md.dermoscopy': { he: 'ניקוד דרמוסקופי (מחושב בקוד)', en: 'Dermoscopic score (computed in code)', ar: 'درجة تنظير الجلد (محسوبة برمجيًا)' },
  'ui.md.morph_measure': { he: 'מאפיינים מורפולוגיים (מדידה דטרמיניסטית)', en: 'Morphologic features (deterministic measurement)', ar: 'سمات شكلية (قياس حتمي)' },
  'ui.md.red_flags': { he: 'דגלים אדומים', en: 'Red flags', ar: 'أعلام حمراء' },
  'ui.md.red_flags_banner': { he: '🚩 דגלים אדומים', en: '🚩 Red flags', ar: '🚩 أعلام حمراء' },
  'ui.md.allergens': { he: 'אלרגנים אפשריים לפי פיזור', en: 'Possible allergens by distribution', ar: 'مُؤَرِّجات محتملة حسب التوزع' },
  'ui.md.next_steps': { he: 'המלצות המשך', en: 'Next-step recommendations', ar: 'توصيات المتابعة' },
  'ui.md.exam_type': { he: 'סוג הבדיקה', en: 'Study type', ar: 'نوع الفحص' },
  'ui.md.systematic': { he: 'סריקה שיטתית', en: 'Systematic review', ar: 'مسح منهجي' },
  'ui.md.key_findings': { he: 'ממצאים עיקריים', en: 'Key findings', ar: 'موجودات رئيسية' },
  'ui.md.measurements': { he: 'מדידות (מול נורמות-גיל בקוד)', en: 'Measurements (vs age norms in code)', ar: 'قياسات (مقابل معايير العمر برمجيًا)' },
  'ui.md.imaging_features': { he: 'מאפייני הדמיה (מדידה דטרמיניסטית, יחסית)', en: 'Imaging features (deterministic, relative)', ar: 'سمات تصويرية (قياس حتمي نسبي)' },
  'ui.md.kb_compare': { he: 'השוואה למאגר הידע (אבחנות מבדלות)', en: 'Knowledge-base comparison (differential)', ar: 'مقارنة بقاعدة المعرفة (تشخيص تفريقي)' },
  'ui.md.kb_compare_short': { he: 'השוואה למאגר הידע', en: 'Knowledge-base comparison', ar: 'مقارنة بقاعدة المعرفة' },
  'ui.md.ecg_patterns': { he: 'דפוסים שקריטריוניהם התקיימו (מנוע דטרמיניסטי)', en: 'Patterns whose criteria were met (deterministic engine)', ar: 'أنماط استُوفيت معاييرها (محرك حتمي)' },
  'ui.normal_limits': {
    he: 'בגבולות הנורמה / ללא ממצא חד-משמעי',
    en: 'Within normal limits / no unequivocal finding',
    ar: 'ضمن الحدود الطبيعية / دون موجودات قاطعة',
  },
  'ui.decision_support': {
    he: 'כלי תמיכה בהחלטות קליניות — אינו אבחנה סופית ואינו תחליף לשיקול דעת רפואי.',
    en: 'Clinical decision support only — not a final diagnosis and not a substitute for medical judgment.',
    ar: 'أداة لدعم القرار السريري فقط — ليست تشخيصاً نهائياً وليست بديلاً عن التقدير الطبي.',
  },
});

export function dictionaryEntry(key) {
  return CLINICAL_DICTIONARY[key] ?? null;
}
