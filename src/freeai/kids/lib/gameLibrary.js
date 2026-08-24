/**
 * FreeAI Kids — Game Library
 * Rich playable HTML5 games. Child builds → plays immediately.
 */

import { pickL } from "../lib/locale.js";

const L = {
  play: { he: "שחק!", en: "Play!", ar: "العب!" },
  score: { he: "ניקוד", en: "Score", ar: "النقاط" },
  lives: { he: "חיים", en: "Lives", ar: "حياة" },
  level: { he: "שלב", en: "Level", ar: "مرحلة" },
  win: { he: "ניצחת! 🏆", en: "You win! 🏆", ar: "فزت! 🏆" },
  tryAgain: { he: "שחק שוב", en: "Play again", ar: "العب مجدداً" },
  start: { he: "התחל", en: "Start", ar: "ابدأ" },
  match: { he: "התאמה!", en: "Match!", ar: "تطابق!" },
  flip: { he: "הפוך קלפים", en: "Flip cards", ar: "اقلب البطاقات" },
  jump: { he: "קפוץ!", en: "Jump!", ar: "اقفز!" },
  tap: { he: "לחץ!", en: "Tap!", ar: "اضغط!" },
};

/** @typedef {{ id: string; icon: string; name: Trilingual; desc: Trilingual; difficulty: 'easy'|'medium'; build: Function }} GameTemplate */

/** @typedef {{ he: string; en: string; ar: string }} Trilingual */

function label(key, lang) {
  return pickL(L[key], lang);
}

function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function shell({ title, lang, body, css = "", script = "" }) {
  const rtl = lang !== "en";
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"/>
<title>${esc(title)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;touch-action:manipulation}
body{font-family:system-ui,-apple-system,sans-serif;min-height:100vh;overflow-x:hidden}
${css}
</style>
</head>
<body>
${body}
<script>${script}<\/script>
</body>
</html>`;
}

/** Full game library */
export const GAME_LIBRARY = [
  {
    id: "quiz",
    icon: "❓",
    difficulty: "easy",
    name: { he: "חידון", en: "Quiz", ar: "اختبار" },
    desc: { he: "שאלות ותשובות על הנושא שלך", en: "Q&A about your theme", ar: "أسئلة وأجوبة" },
    build: buildQuiz,
  },
  {
    id: "memory",
    icon: "🃏",
    difficulty: "easy",
    name: { he: "זיכרון", en: "Memory", ar: "ذاكرة" },
    desc: { he: "הפוך קלפים ומצא זוגות", en: "Flip cards & find pairs", ar: "اقلب البطاقات وابحث عن الأزواج" },
    build: buildMemory,
  },
  {
    id: "catch",
    icon: "⭐",
    difficulty: "easy",
    name: { he: "תפוס כוכבים", en: "Catch stars", ar: "امسك النجوم" },
    desc: { he: "תפוס לפני שהם נעלמים!", en: "Catch before they vanish!", ar: "امسك قبل أن تختفي!" },
    build: buildCatch,
  },
  {
    id: "runner",
    icon: "🏃",
    difficulty: "medium",
    name: { he: "רץ וקופץ", en: "Run & Jump", ar: "اركض واقفز" },
    desc: { he: "דodge מכשולים — לחץ לקפיצה", en: "Dodge obstacles — tap to jump", ar: "تجنب العوائق — اضغط للقفز" },
    build: buildRunner,
  },
  {
    id: "snake",
    icon: "🐍",
    difficulty: "medium",
    name: { he: "נחש", en: "Snake", ar: "ثعبان" },
    desc: { he: "אכל פירות וגדל!", en: "Eat fruit & grow!", ar: "كل الفاكهة وكبر!" },
    build: buildSnake,
  },
  {
    id: "colors",
    icon: "🎨",
    difficulty: "easy",
    name: { he: "צבעים מהירים", en: "Color Rush", ar: "سباق الألوان" },
    desc: { he: "לחץ על הצבע הנכון!", en: "Tap the right color!", ar: "اضغط على اللون الصحيح!" },
    build: buildColors,
  },
  {
    id: "math",
    icon: "➕",
    difficulty: "easy",
    name: { he: "מתמטיקה מהירה", en: "Math Rush", ar: "رياضيات سريعة" },
    desc: { he: "פתור תרגילים בזמן!", en: "Solve fast!", ar: "حل بسرعة!" },
    build: buildMath,
  },
  {
    id: "word",
    icon: "🔤",
    difficulty: "medium",
    name: { he: "מילים מעורבבות", en: "Word Scramble", ar: "كلمات مخلوطة" },
    desc: { he: "סדר את האותיות!", en: "Unscramble letters!", ar: "رتب الحروف!" },
    build: buildWord,
  },
  {
    id: "adventure",
    icon: "🗺️",
    difficulty: "easy",
    name: { he: "הרפתקה", en: "Adventure", ar: "مغامرة" },
    desc: { he: "בחר דרך וגלה סוף!", en: "Choose your path!", ar: "اختر طريقك!" },
    build: buildAdventure,
  },
  {
    id: "bubble",
    icon: "🫧",
    difficulty: "easy",
    name: { he: "פוצץ בועות", en: "Bubble Pop", ar: "فقاعات" },
    desc: { he: "פוצץ בועות צבעוניות!", en: "Pop colorful bubbles!", ar: "فجّر الفقاعات!" },
    build: buildBubble,
  },
];

export function getGameTemplate(id) {
  return GAME_LIBRARY.find((g) => g.id === id) || GAME_LIBRARY[0];
}

export function buildGameFromLibrary({ gameId, theme, lang = "he", questions = [], words = [] }) {
  const tpl = getGameTemplate(gameId);
  return tpl.build({ theme, lang, questions, words });
}

function buildQuiz({ theme, lang, questions = [] }) {
  const data = JSON.stringify(questions.slice(0, 12));
  return shell({
    title: theme,
    lang,
    css: `body{background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;padding:1rem;color:#fff}
.card{background:rgba(255,255,255,.15);backdrop-filter:blur(12px);border-radius:1.5rem;padding:1.5rem;max-width:420px;width:100%;border:2px solid rgba(255,255,255,.3)}
h1{font-size:1.3rem;text-align:center;margin-bottom:.5rem}
.score{text-align:center;margin-bottom:1rem;font-weight:700}
.q{font-size:1.1rem;margin:1rem 0;text-align:center;line-height:1.4}
.btn{display:block;width:100%;padding:.8rem;margin:.35rem 0;border:none;border-radius:1rem;font-size:1rem;font-weight:700;cursor:pointer;background:#fff;color:#764ba2}
.btn.ok{background:#4ade80;color:#064e3b}.btn.no{background:#f87171}`,
    body: `<div class="card"><h1>🎮 ${esc(theme)}</h1><div class="score">${label("score", lang)}: <span id="sc">0</span></div><div id="g"></div></div>`,
    script: `const Q=${data};let i=0,s=0;
function r(){const g=document.getElementById('g');
if(i>=Q.length){g.innerHTML='<h2 style="text-align:center">${label("win", lang)}<br/>'+s+'/'+Q.length+'</h2><button class="btn" onclick="location.reload()">${label("tryAgain", lang)}</button>';return;}
const q=Q[i];g.innerHTML='<div class="q">'+q.q+'</div>'+q.choices.map((c,j)=>'<button class="btn" data-j="'+j+'">'+c+'</button>').join('');
g.querySelectorAll('.btn').forEach(b=>b.onclick=()=>{const j=+b.dataset.j;if(j===q.correct){s++;b.classList.add('ok');}else b.classList.add('no');
document.getElementById('sc').textContent=s;setTimeout(()=>{i++;r();},700);});}r();`,
  });
}

function buildMemory({ theme, lang }) {
  const emojis = ["🌟", "🎈", "🦋", "🌈", "🎮", "🚀", "🐱", "🍎"];
  const cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
  const data = JSON.stringify(cards);
  return shell({
    title: theme,
    lang,
    css: `body{background:linear-gradient(135deg,#f093fb,#f5576c);padding:1rem;color:#fff;text-align:center}
h1{font-size:1.2rem;margin-bottom:.5rem}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:340px;margin:0 auto}
.c{aspect-ratio:1;border-radius:12px;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:1.8rem;cursor:pointer;border:2px solid rgba(255,255,255,.4);transition:transform .2s}
.c.hidden{font-size:0;background:rgba(0,0,0,.2)}.c.match{background:rgba(74,222,128,.5)}`,
    body: `<h1>🃏 ${esc(theme)}</h1><p>${label("flip", lang)}</p><div class="grid" id="grid"></div><p id="sc" style="margin-top:1rem;font-weight:700">${label("score", lang)}: 0</p>`,
    script: `const C=${data};let open=[],matched=0,lock=false;
const g=document.getElementById('grid');
C.forEach((e,i)=>{const d=document.createElement('div');d.className='c hidden';d.dataset.i=i;d.dataset.e=e;
d.onclick=()=>{if(lock||d.classList.contains('match')||open.includes(d))return;
d.classList.remove('hidden');d.textContent=e;open.push(d);
if(open.length===2){lock=true;const[a,b]=open;
if(a.dataset.e===b.dataset.e){a.classList.add('match');b.classList.add('match');matched+=2;
document.getElementById('sc').textContent='${label("score", lang)}: '+matched;
if(matched===C.length)setTimeout(()=>alert('${label("win", lang)}'),300);
open=[];lock=false;}else{setTimeout(()=>{a.classList.add('hidden');a.textContent='';b.classList.add('hidden');b.textContent='';open=[];lock=false;},700);}}};
g.appendChild(d);});`,
  });
}

function buildCatch({ theme, lang }) {
  return shell({
    title: theme,
    lang,
    css: `body{background:#1e1b4b;color:#fff;text-align:center;margin:0}
#area{position:relative;height:75vh;max-width:500px;margin:0 auto;overflow:hidden}
.item{position:absolute;font-size:2.5rem;cursor:pointer;animation:pop .3s ease;user-select:none}
@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}`,
    body: `<h1>⭐ ${esc(theme)}</h1><p id="sc" style="font-size:1.3rem;font-weight:700">${label("score", lang)}: 0</p><div id="area"></div>`,
    script: `let s=0,t;const em=['⭐','🌟','💫','🎯','🎈','🦋','🌈','🍭','🎮'];
const area=document.getElementById('area');
function sp(){const el=document.createElement('div');el.className='item';el.textContent=em[Math.floor(Math.random()*em.length)];
el.style.left=(5+Math.random()*85)+'%';el.style.top=(5+Math.random()*75)+'%';
el.onclick=()=>{s++;document.getElementById('sc').textContent='${label("score", lang)}: '+s;el.remove();};
area.appendChild(el);setTimeout(()=>el.remove(),1400);}
t=setInterval(sp,800);setTimeout(()=>{clearInterval(t);alert('${label("win", lang)} '+s+'!');},45000);`,
  });
}

function buildRunner({ theme, lang }) {
  return shell({
    title: theme,
    lang,
    css: `body{background:linear-gradient(#87CEEB,#E0F6FF);margin:0;overflow:hidden;touch-action:none}
canvas{display:block;width:100%;max-width:500px;margin:0 auto;background:linear-gradient(#87CEEB 70%,#90EE90 70%)}
#ui{position:fixed;top:10px;left:50%;transform:translateX(-50%);font:bold 1.2rem system-ui;color:#333;z-index:5}`,
    body: `<div id="ui">${label("score", lang)}: <span id="sc">0</span> | ${label("tap", lang)}</div><canvas id="c" width="400" height="300"></canvas>`,
    script: `const cv=document.getElementById('c'),x=cv.getContext('2d');
let px=60,py=200,vy=0,g=0.6,jump=-10,ground=200,obs=[],s=0,frame=0,running=true;
function loop(){if(!running)return;frame++;x.fillStyle='#87CEEB';x.fillRect(0,0,400,300);
x.fillStyle='#90EE90';x.fillRect(0,ground+30,400,70);
vy+=g;py+=vy;if(py>=ground){py=ground;vy=0;}
x.font='2rem';x.fillText('🏃',px,py+30);
if(frame%90===0)obs.push({x:400,h:30+Math.random()*20});
obs=obs.filter(o=>{o.x-=4;x.fillStyle='#8B4513';x.fillRect(o.x,ground+30-o.h,20,o.h);
if(o.x<px+30&&o.x+20>px&&py+10>ground-o.h){running=false;alert('${label("score", lang)}: '+s);return false;}
return o.x>-30;});
s=Math.floor(frame/10);document.getElementById('sc').textContent=s;
if(s>0&&s%50===0&&frame%50===0)alert('${label("level", lang)} '+Math.floor(s/50)+'!');
requestAnimationFrame(loop);}
function jump(){if(py>=ground-2)vy=jump;}
cv.onclick=jump;document.onkeydown=e=>{if(e.code==='Space'||e.code==='ArrowUp')jump();};
loop();`,
  });
}

function buildSnake({ theme, lang }) {
  return shell({
    title: theme,
    lang,
    css: `body{background:#0f172a;color:#fff;text-align:center;margin:0;padding:.5rem}
canvas{background:#1e293b;border-radius:12px;max-width:100%;touch-action:none}`,
    body: `<h1 style="font-size:1.1rem">🐍 ${esc(theme)}</h1><canvas id="c" width="320" height="320"></canvas><p id="sc">${label("score", lang)}: 0</p>`,
    script: `const cv=document.getElementById('c'),x=cv.getContext('2d'),S=16;
let sn=[{x:8,y:8}],dir={x:1,y:0},food={x:12,y:8},s=0,alive=true;
function rnd(){return{x:Math.floor(Math.random()*20),y:Math.floor(Math.random()*20)};}
function draw(){x.fillStyle='#1e293b';x.fillRect(0,0,320,320);
x.fillStyle='#4ade80';sn.forEach(p=>x.fillRect(p.x*S,p.y*S,S-1,S-1));
x.fillStyle='#f87171';x.fillRect(food.x*S,food.y*S,S-1,S-1);}
function tick(){if(!alive)return;const h={x:sn[0].x+dir.x,y:sn[0].y+dir.y};
if(h.x<0||h.x>=20||h.y<0||h.y>=20||sn.some(p=>p.x===h.x&&p.y===h.y)){alive=false;alert('${label("score", lang)}: '+s);return;}
sn.unshift(h);if(h.x===food.x&&h.y===food.y){s++;food=rnd();while(sn.some(p=>p.x===food.x&&p.y===food.y))food=rnd();}else sn.pop();
document.getElementById('sc').textContent='${label("score", lang)}: '+s;draw();}
draw();setInterval(tick,120);
document.onkeydown=e=>{const k=e.code;if(k==='ArrowUp'&&dir.y!==1)dir={x:0,y:-1};
if(k==='ArrowDown'&&dir.y!==-1)dir={x:0,y:1};if(k==='ArrowLeft'&&dir.x!==1)dir={x:-1,y:0};
if(k==='ArrowRight'&&dir.x!==-1)dir={x:1,y:0};};
let tx,ty;cv.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;});
cv.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
if(Math.abs(dx)>Math.abs(dy)){dir=dx>0?{x:1,y:0}:{x:-1,y:0};}else{dir=dy>0?{x:0,y:1}:{x:0,y:-1};}});`,
  });
}

function buildColors({ theme, lang }) {
  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ec4899"];
  return shell({
    title: theme,
    lang,
    css: `body{background:linear-gradient(135deg,#6366f1,#8b5cf6);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1rem;color:#fff;text-align:center}
.word{font-size:2rem;font-weight:900;margin:1rem;padding:1rem;background:rgba(255,255,255,.2);border-radius:1rem}
.btns{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:280px}
.b{width:80px;height:80px;border-radius:1rem;border:3px solid #fff;cursor:pointer;transition:transform .15s}
.b:active{transform:scale(.9)}`,
    body: `<h1>🎨 ${esc(theme)}</h1><p id="hint">${label("tap", lang)}</p><div class="word" id="w">?</div><div class="btns" id="btns"></div><p id="sc" style="margin-top:1rem;font-weight:700">${label("score", lang)}: 0</p>`,
    script: `const C=${JSON.stringify(colors)};const N=${JSON.stringify(["Red", "Blue", "Green", "Yellow", "Purple", "Pink"])};let s=0;
function rnd(){const i=Math.floor(Math.random()*C.length);document.getElementById('w').textContent=N[i];
document.getElementById('w').style.color=C[i];return i;}
let target=rnd();const btns=document.getElementById('btns');
C.forEach((c,i)=>{const b=document.createElement('div');b.className='b';b.style.background=c;
b.onclick=()=>{if(i===target){s++;document.getElementById('sc').textContent='${label("score", lang)}: '+s;target=rnd();}else s=Math.max(0,s-1);};btns.appendChild(b);});`,
  });
}

function buildMath({ theme, lang }) {
  return shell({
    title: theme,
    lang,
    css: `body{background:linear-gradient(135deg,#059669,#10b981);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;color:#fff}
.card{background:rgba(255,255,255,.2);border-radius:1.5rem;padding:2rem;text-align:center;max-width:360px;width:100%}
.q{font-size:2.5rem;font-weight:900;margin:1rem 0}
.btn{display:block;width:100%;padding:1rem;margin:.4rem 0;border:none;border-radius:1rem;font-size:1.2rem;font-weight:700;cursor:pointer;background:#fff;color:#059669}`,
    body: `<div class="card"><h1>➕ ${esc(theme)}</h1><div class="q" id="q">?</div><div id="opts"></div><p id="sc">${label("score", lang)}: 0</p></div>`,
    script: `let s=0;function gen(){const a=Math.floor(Math.random()*12)+1,b=Math.floor(Math.random()*12)+1,op=Math.random()>.5?'+':'×';
const ans=op==='+'?a+b:a*b;document.getElementById('q').textContent=a+op+b+'=?';
const w=[ans,ans+Math.floor(Math.random()*5+1),ans-Math.floor(Math.random()*3+1),ans+2].sort(()=>Math.random()-.5);
const o=document.getElementById('opts');o.innerHTML='';
[...new Set(w)].slice(0,4).forEach(v=>{const btn=document.createElement('button');btn.className='btn';btn.textContent=v;
btn.onclick=()=>{if(v===ans){s++;document.getElementById('sc').textContent='${label("score", lang)}: '+s;gen();}else s=Math.max(0,s-1);};o.appendChild(btn);});}
gen();`,
  });
}

function buildWord({ theme, lang, words = [] }) {
  const defaultWords = words.length ? words : ["GAME", "PLAY", "FUN", "STAR", "HAPPY", "LEARN"];
  const data = JSON.stringify(defaultWords);
  return shell({
    title: theme,
    lang,
    css: `body{background:linear-gradient(135deg,#f59e0b,#ef4444);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem;color:#fff;text-align:center}
.scramble{font-size:2rem;font-weight:900;letter-spacing:.3rem;margin:1rem}
input{padding:1rem;border-radius:1rem;border:none;font-size:1.2rem;text-align:center;width:200px;font-weight:700}
.btn{margin-top:1rem;padding:1rem 2rem;border:none;border-radius:1rem;font-weight:900;cursor:pointer;background:#fff;color:#ef4444;font-size:1rem}`,
    body: `<h1>🔤 ${esc(theme)}</h1><div class="scramble" id="scramble">?</div><input id="ans" placeholder="..."/><br/><button class="btn" id="check">${label("tap", lang)}</button><p id="score" style="margin-top:1rem">${label("score", lang)}: 0</p>`,
    script: `const W=${data};let i=0,s=0,cur;
function shuffle(w){return w.split('').sort(()=>Math.random()-.5).join('');}
function next(){cur=W[i%W.length];document.getElementById('scramble').textContent=shuffle(cur);document.getElementById('ans').value='';}
document.getElementById('check').onclick=()=>{const v=document.getElementById('ans').value.toUpperCase().trim();
if(v===cur){s++;i++;document.getElementById('score').textContent='${label("score", lang)}: '+s;next();}};
next();`,
  });
}

function buildAdventure({ theme, lang }) {
  return shell({
    title: theme,
    lang,
    css: `body{background:linear-gradient(135deg,#312e81,#4c1d95);min-height:100vh;padding:1.5rem;color:#fff}
.card{background:rgba(255,255,255,.12);border-radius:1.5rem;padding:1.5rem;max-width:420px;margin:0 auto;border:2px solid rgba(255,255,255,.25)}
.story{line-height:1.6;margin:1rem 0;font-size:1.05rem}
.btn{display:block;width:100%;padding:1rem;margin:.5rem 0;border:none;border-radius:1rem;font-weight:700;cursor:pointer;background:#fff;color:#4c1d95;font-size:1rem}`,
    body: `<div class="card"><h1>🗺️ ${esc(theme)}</h1><div class="story" id="story"></div><div id="choices"></div></div>`,
    script: `const nodes=[
{s:'${esc(theme)} — ${lang === "he" ? "אתה עומד בפני שביל מysterious. לאן תלך?" : lang === "ar" ? "أنت أمام طريق غامض. إلى أين؟" : "You stand at a mysterious path. Where?"}',c:['${lang === "he" ? "יער מואר" : lang === "ar" ? "غابة مضيئة" : "Bright forest"}','${lang === "he" ? "מערה כחולה" : lang === "ar" ? "كهف أزرق" : "Blue cave"}']},
{s:'${lang === "he" ? "מצאת חבר חדש שעוזר לך!" : lang === "ar" ? "وجدت صديقاً جديداً!" : "You found a new friend!"}',c:['${lang === "he" ? "המשך יחד" : lang === "ar" ? "تابع معاً" : "Continue together"}','${lang === "he" ? "חפש אוצר" : lang === "ar" ? "ابحث عن كنز" : "Search treasure"}']},
{s:'${label("win", lang)} 🎉',c:[]}];
let n=0;function render(){const nd=nodes[Math.min(n,nodes.length-1)];document.getElementById('story').textContent=nd.s;
const ch=document.getElementById('choices');ch.innerHTML='';if(!nd.c.length)return;
nd.c.forEach(c=>{const b=document.createElement('button');b.className='btn';b.textContent=c;b.onclick=()=>{n++;render();};ch.appendChild(b);});}
render();`,
  });
}

function buildBubble({ theme, lang }) {
  return shell({
    title: theme,
    lang,
    css: `body{background:linear-gradient(135deg,#06b6d4,#3b82f6);margin:0;overflow:hidden;touch-action:none}
#area{position:relative;width:100%;height:100vh;max-width:500px;margin:0 auto}
.bub{position:absolute;border-radius:50%;background:rgba(255,255,255,.35);border:2px solid rgba(255,255,255,.6);cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff}`,
    body: `<h1 style="position:fixed;top:10px;width:100%;text-align:center;color:#fff;z-index:5;font-size:1.1rem">🫧 ${esc(theme)}</h1><p id="sc" style="position:fixed;top:40px;width:100%;text-align:center;color:#fff;z-index:5;font-weight:700">${label("score", lang)}: 0</p><div id="area"></div>`,
    script: `let s=0;const area=document.getElementById('area');
function mk(){const b=document.createElement('div');b.className='bub';const sz=40+Math.random()*50;
b.style.width=sz+'px';b.style.height=sz+'px';b.style.left=Math.random()*90+'%';b.style.bottom='-'+sz+'px';
b.style.fontSize=(sz/3)+'px';b.textContent='+'+Math.floor(sz/10);
b.onclick=()=>{s+=Math.floor(sz/10);document.getElementById('sc').textContent='${label("score", lang)}: '+s;b.remove();};
area.appendChild(b);let y=0;const anim=setInterval(()=>{y+=2;b.style.bottom=y+'px';if(y>window.innerHeight){clearInterval(anim);b.remove();}},30);}
setInterval(mk,600);`,
  });
}

export const GAME_TYPES = GAME_LIBRARY.map((g) => ({
  id: g.id,
  icon: g.icon,
  name: g.name,
  desc: g.desc,
}));
