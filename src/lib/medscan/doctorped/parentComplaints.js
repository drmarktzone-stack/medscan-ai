/**
 * Parent complaint templates. Tokens match existing MedScan / triage engines.
 * Multi-select. Not a diagnosis list.
 */

export const PARENT_COMPLAINTS = Object.freeze([
  { id: 'fever', he: 'חום', en: 'Fever', ar: 'حمى', token: 'fever' },
  { id: 'cough', he: 'שיעול', en: 'Cough', ar: 'سعال', token: 'cough' },
  { id: 'cold', he: 'צינון / נזלת', en: 'Cold / runny nose', ar: 'زكام', token: 'cold' },
  { id: 'sore_throat', he: 'כאב גרון', en: 'Sore throat', ar: 'ألم حلق', token: 'pharyngitis' },
  { id: 'ear', he: 'כאב אוזן', en: 'Ear pain', ar: 'ألم أذن', token: 'ear pain' },
  { id: 'wheeze', he: 'צפצופים', en: 'Wheeze', ar: 'صفير', token: 'wheeze' },
  { id: 'breathing', he: 'קושי בנשימה', en: 'Difficulty breathing', ar: 'صعوبة تنفس', token: 'difficulty breathing' },
  { id: 'rash', he: 'פריחה', en: 'Rash', ar: 'طفح', token: 'rash' },
  { id: 'petechiae', he: 'פריחה שאינה מלבינה', en: 'Non-blanching rash', ar: 'طفح لا يبيض', token: 'non-blanching rash' },
  { id: 'vomit', he: 'הקאות', en: 'Vomiting', ar: 'قيء', token: 'vomiting' },
  { id: 'diarrhea', he: 'שלשול', en: 'Diarrhea', ar: 'إسهال', token: 'diarrhea' },
  { id: 'abd', he: 'כאב בטן', en: 'Abdominal pain', ar: 'ألم بطن', token: 'abdominal pain' },
  { id: 'constipation', he: 'עצירות', en: 'Constipation', ar: 'إمساك', token: 'constipation' },
  { id: 'headache', he: 'כאב ראש', en: 'Headache', ar: 'صداع', token: 'headache' },
  { id: 'lethargy', he: 'ישנוניות / לא מגיב', en: 'Lethargy', ar: 'خمول', token: 'lethargy' },
  { id: 'seizure', he: 'פרכוס', en: 'Seizure', ar: 'نوبة', token: 'seizure' },
  { id: 'head_trauma', he: 'חבלת ראש', en: 'Head injury', ar: 'رض رأس', token: 'head trauma' },
  { id: 'battery', he: 'סוללת כפתור', en: 'Button battery', ar: 'بطارية زر', token: 'button battery' },
  { id: 'magnet', he: 'בליעת מגנט', en: 'Swallowed magnet', ar: 'ابتلاع مغناطيس', token: 'magnet' },
  { id: 'ingest', he: 'בליעת תרופה / חומר', en: 'Ingestion', ar: 'ابتلاع مادة', token: 'ingest' },
  { id: 'urine', he: 'צריבה / שתן מוזר', en: 'Urine complaint', ar: 'شكوى بول', token: 'dysuria' },
  { id: 'eye', he: 'עין אדומה / הפרשה', en: 'Red eye', ar: 'عين حمراء', token: 'conjunctivitis' },
  { id: 'limp', he: 'צליעה / סירוב לדרוך', en: 'Limp', ar: 'عرج', token: 'limp' },
  { id: 'feeding', he: 'מיעוט אכילה / שתייה', en: 'Poor feeding', ar: 'قلة أكل', token: 'poor feeding' },
  { id: 'adhd', he: 'קשב / היפראקטיביות', en: 'Attention / hyperactivity', ar: 'انتباه', token: 'adhd' },
  { id: 'asd', he: 'חשש התפתחות / אוטיזם', en: 'Development / autism concern', ar: 'قلق تطور', token: 'autism' },
  { id: 'growth', he: 'גדילה / קומה', en: 'Growth / stature', ar: 'نمو', token: 'short stature' },
  { id: 'allergy', he: 'אלרגיה / נפיחות', en: 'Allergy / swelling', ar: 'حساسية', token: 'urticaria' },
]);

export function complaintLabel(idOrRow, lang = 'he') {
  const row = typeof idOrRow === 'string'
    ? PARENT_COMPLAINTS.find((c) => c.id === idOrRow)
    : idOrRow;
  if (!row) return '';
  if (lang === 'en') return row.en;
  if (lang === 'ar') return row.ar;
  return row.he;
}

export function tokensFromComplaintIds(ids = []) {
  const set = new Set();
  for (const id of ids) {
    const row = PARENT_COMPLAINTS.find((c) => c.id === id);
    if (row?.token) set.add(row.token);
  }
  return [...set];
}

export function needKey(need) {
  if (Array.isArray(need)) return need[0];
  return need;
}
