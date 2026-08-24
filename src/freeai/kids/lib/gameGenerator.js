/**
 * Kid-friendly HTML games — self-contained, no external deps.
 */

import { pickL } from "./locale.js";

const LABELS = {
  play: { he: "שחק!", en: "Play!", ar: "العب!" },
  score: { he: "ניקוד", en: "Score", ar: "النقاط" },
  next: { he: "הבא", en: "Next", ar: "التالي" },
  win: { he: "כל הכבוד! 🎉", en: "Great job! 🎉", ar: "أحسنت! 🎉" },
  tryAgain: { he: "נסה שוב", en: "Try again", ar: "حاول مرة أخرى" },
};

/**
 * @param {{ gameType: string; theme: string; questions: object[]; lang: string }} opts
 */
export function buildKidsGameHtml(opts) {
  const { gameType = "quiz", theme, questions = [], lang = "he" } = opts;
  const rtl = lang !== "en";
  const data = JSON.stringify(questions.slice(0, 10));
  const L = (k) => pickL(LABELS[k], lang);

  if (gameType === "click") {
    return clickGameHtml({ theme, lang, rtl, L });
  }

  return quizGameHtml({ theme, data, lang, rtl, L });
}

function quizGameHtml({ theme, data, lang, rtl, L }) {
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(theme)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:linear-gradient(135deg,#667eea,#764ba2);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;color:#fff}
.card{background:rgba(255,255,255,.15);backdrop-filter:blur(12px);border-radius:1.5rem;padding:2rem;max-width:420px;width:100%;border:2px solid rgba(255,255,255,.3)}
h1{font-size:1.5rem;margin-bottom:.5rem;text-align:center}
.score{text-align:center;opacity:.9;margin-bottom:1rem;font-size:1.1rem}
.q{font-size:1.15rem;margin:1rem 0;line-height:1.5;text-align:center}
.btn{display:block;width:100%;padding:.85rem;margin:.4rem 0;border:none;border-radius:1rem;font-size:1rem;font-weight:700;cursor:pointer;background:#fff;color:#764ba2;transition:transform .15s}
.btn:hover{transform:scale(1.03)}
.btn.correct{background:#4ade80;color:#064e3b}
.btn.wrong{background:#f87171;color:#450a0a}
.end{text-align:center;font-size:1.3rem;padding:1rem}
</style>
</head>
<body>
<div class="card">
<h1>🎮 ${escapeHtml(theme)}</h1>
<div class="score">${L("score")}: <span id="sc">0</span></div>
<div id="game"></div>
</div>
<script>
const Q=${data};
let i=0,sc=0;
function render(){
  const g=document.getElementById('game');
  if(i>=Q.length){g.innerHTML='<div class="end">${L("win")}<br/>${L("score")}: '+sc+'</div><button class="btn" onclick="location.reload()">${L("tryAgain")}</button>';return;}
  const q=Q[i];
  g.innerHTML='<div class="q">'+q.q+'</div>'+q.choices.map((c,j)=>'<button class="btn" data-j="'+j+'">'+c+'</button>').join('');
  g.querySelectorAll('.btn').forEach(b=>b.onclick=()=>{
    const j=+b.dataset.j;
    if(j===q.correct){sc++;b.classList.add('correct');}
    else b.classList.add('wrong');
    document.getElementById('sc').textContent=sc;
    setTimeout(()=>{i++;render();},800);
  });
}
render();
</script>
</body>
</html>`;
}

function clickGameHtml({ theme, lang, rtl, L }) {
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(theme)}</title>
<style>
body{margin:0;background:#1e1b4b;font-family:system-ui;color:#fff;text-align:center;overflow:hidden;touch-action:manipulation}
h1{padding:1rem;font-size:1.3rem}
#area{position:relative;height:70vh;max-width:500px;margin:0 auto}
.star{position:absolute;font-size:2.5rem;cursor:pointer;user-select:none;animation:pop .3s ease}
@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
#sc{font-size:1.5rem;padding:.5rem}
</style>
</head>
<body>
<h1>⭐ ${escapeHtml(theme)} — ${L("play")}</h1>
<div id="sc">${L("score")}: 0</div>
<div id="area"></div>
<script>
let sc=0,t;
const area=document.getElementById('area');
const emojis=['⭐','🌟','💫','🎯','🎈','🦋','🌈'];
function spawn(){
  const el=document.createElement('div');
  el.className='star';
  el.textContent=emojis[Math.floor(Math.random()*emojis.length)];
  el.style.left=(10+Math.random()*80)+'%';
  el.style.top=(10+Math.random()*70)+'%';
  el.onclick=()=>{sc++;document.getElementById('sc').textContent='${L("score")}: '+sc;el.remove();};
  area.appendChild(el);
  setTimeout(()=>el.remove(),1500);
}
t=setInterval(spawn,900);
setTimeout(()=>{clearInterval(t);alert('${L("win")} '+sc);},30000);
</script>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const GAME_TYPES = [
  { id: "quiz", icon: "❓", name: { he: "חידון", en: "Quiz", ar: "اختبار" } },
  { id: "click", icon: "⭐", name: { he: "תפוס כוכב", en: "Catch stars", ar: "امسك النجوم" } },
];

export const DRAW_TEMPLATES = [
  { id: "hero", icon: "🦸", name: { he: "גיבור/גיבורה", en: "Superhero", ar: "بطل خارق" } },
  { id: "animal", icon: "🐱", name: { he: "חיה חמודה", en: "Cute animal", ar: "حيوان لطيف" } },
  { id: "planet", icon: "🪐", name: { he: "כוכב לכת", en: "Planet", ar: "كوكب" } },
  { id: "room", icon: "🏠", name: { he: "חדר חלומות", en: "Dream room", ar: "غرفة الأحلام" } },
  { id: "dragon", icon: "🐉", name: { he: "דרקון ידידותי", en: "Friendly dragon", ar: "تنين ودود" } },
];

export const STORY_STEPS = [
  { key: "hero", label: { he: "מי הגיבור/ה?", en: "Who is the hero?", ar: "من البطل؟" } },
  { key: "place", label: { he: "איפה זה קורה?", en: "Where does it happen?", ar: "أين يحدث؟" } },
  { key: "problem", label: { he: "מה הבעיה?", en: "What's the problem?", ar: "ما المشكلة؟" } },
  { key: "ending", label: { he: "איך נגמר?", en: "How does it end?", ar: "كيف ينتهي؟" } },
];
