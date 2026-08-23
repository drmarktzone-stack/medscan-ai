/**
 * Code scaffold generator — builds real HTML/CSS/JS from description keywords.
 * Used for in-app free code generation without paid APIs.
 */

const SCAFFOLDS = {
  landing: (opts) => landingPage(opts),
  menu: (opts) => menuPage(opts),
  listing: (opts) => listingPage(opts),
  bio: (opts) => bioPage(opts),
  portfolio: (opts) => portfolioPage(opts),
  presentation: (opts) => presentationPage(opts),
  saas: (opts) => saasPage(opts),
  blog: (opts) => blogPage(opts),
};

/**
 * @param {{ prompt: string; type?: string; brand?: object }} input
 */
export function generateCodeScaffold(input) {
  const { prompt, type = "landing", brand } = input;
  const title = extractTitle(prompt) || "My Project";
  const rtl = /עברית|hebrew|rtl|ישראל/i.test(prompt);
  const color = brand?.primaryColor || "#8b5cf6";

  const builder = SCAFFOLDS[type] || SCAFFOLDS.landing;
  const html = builder({ title, prompt, rtl, color, brand });

  return {
    code: html,
    files: {
      "index.html": html,
      "style.css": extractCss(html),
    },
    type,
    language: "html",
  };
}

function extractTitle(prompt) {
  const m = prompt.match(/(?:for|של|עבור)\s+(.{3,40}?)(?:\.|,|$)/i);
  return m?.[1]?.trim();
}

function extractCss(html) {
  const m = html.match(/<style>([\s\S]*?)<\/style>/);
  return m?.[1] || "";
}

function baseCss(color, rtl) {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #1e293b; ${rtl ? "direction: rtl;" : ""} }
    .container { max-width: 960px; margin: 0 auto; padding: 2rem; }
    .btn { display: inline-block; padding: 0.75rem 1.5rem; background: ${color}; color: white; border-radius: 0.5rem; text-decoration: none; font-weight: 600; }
    .btn:hover { opacity: 0.9; }
    header { padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; }
    .card { border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.5rem; transition: box-shadow 0.2s; }
    .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .hero { text-align: center; padding: 4rem 2rem; background: linear-gradient(135deg, ${color}22, ${color}44); }
    .hero h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    footer { text-align: center; padding: 2rem; color: #64748b; font-size: 0.875rem; }
  `;
}

function landingPage({ title, prompt, rtl, color }) {
  return `<!DOCTYPE html>
<html lang="${rtl ? "he" : "en"}" ${rtl ? 'dir="rtl"' : ""}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${baseCss(color, rtl)}</style>
</head>
<body>
  <header>
    <strong>${title}</strong>
    <nav><a href="#features">${rtl ? "תכונות" : "Features"}</a> · <a href="#contact">${rtl ? "צור קשר" : "Contact"}</a></nav>
  </header>
  <section class="hero">
    <h1>${title}</h1>
    <p>${prompt.slice(0, 120)}</p>
    <br><a class="btn" href="#contact">${rtl ? "התחל עכשיו" : "Get Started"}</a>
  </section>
  <div class="container" id="features">
    <h2>${rtl ? "למה אנחנו?" : "Why us?"}</h2>
    <div class="grid">
      <div class="card"><h3>${rtl ? "מהיר" : "Fast"}</h3><p>${rtl ? "תוצאות מיידיות" : "Instant results"}</p></div>
      <div class="card"><h3>${rtl ? "איכותי" : "Quality"}</h3><p>${rtl ? "סטנדרט גבוה" : "High standard"}</p></div>
      <div class="card"><h3>${rtl ? "חינם" : "Free"}</h3><p>${rtl ? "ללא עלות" : "No cost"}</p></div>
    </div>
  </div>
  <footer id="contact">${rtl ? "נבנה עם FreeAI Hub" : "Built with FreeAI Hub"} — ${new Date().getFullYear()}</footer>
</body>
</html>`;
}

function menuPage({ title, rtl, color }) {
  const dishes = [
    { name: rtl ? "פizza מרגריטה" : "Margherita Pizza", price: "₪45" },
    { name: rtl ? "סלט יווני" : "Greek Salad", price: "₪38" },
    { name: rtl ? "המבורגר" : "Burger", price: "₪52" },
    { name: rtl ? "פסטה" : "Pasta", price: "₪48" },
  ];
  const items = dishes.map((d) => `<div class="card"><h3>${d.name}</h3><p>${d.price}</p></div>`).join("");
  return `<!DOCTYPE html>
<html lang="${rtl ? "he" : "en"}" ${rtl ? 'dir="rtl"' : ""}>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>${baseCss(color, rtl)}</style></head>
<body>
<header><strong>🍕 ${title}</strong></header>
<section class="hero"><h1>${rtl ? "התפריט שלנו" : "Our Menu"}</h1></section>
<div class="container"><div class="grid">${items}</div></div>
<footer>${rtl ? "הזמנות: 03-1234567" : "Orders: 03-1234567"}</footer>
</body></html>`;
}

function listingPage({ title, rtl, color }) {
  return `<!DOCTYPE html>
<html lang="${rtl ? "he" : "en"}" ${rtl ? 'dir="rtl"' : ""}>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>${baseCss(color, rtl)} .price{color:${color};font-weight:700;font-size:1.25rem}</style></head>
<body>
<header><strong>🏠 ${title}</strong></header>
<div class="container">
  <div class="grid">
    <div class="card"><h3>${rtl ? "דירת 4 חדרים" : "4-room apt"}</h3><p>${rtl ? "תל אביב" : "Tel Aviv"}</p><p class="price">₪2,500,000</p></div>
    <div class="card"><h3>${rtl ? "penthouse" : "Penthouse"}</h3><p>${rtl ? "הרצליה" : "Herzliya"}</p><p class="price">₪5,200,000</p></div>
    <div class="card"><h3>${rtl ? "דירת גן" : "Garden apt"}</h3><p>${rtl ? "רמת גן" : "Ramat Gan"}</p><p class="price">₪1,800,000</p></div>
  </div>
</div>
<footer>${rtl ? "סוכנות נדל\"ן" : "Real Estate Agency"}</footer>
</body></html>`;
}

function bioPage({ title, rtl, color }) {
  return `<!DOCTYPE html>
<html lang="${rtl ? "he" : "en"}" ${rtl ? 'dir="rtl"' : ""}>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>${baseCss(color, rtl)} body{text-align:center;background:#000;color:#fff} .links{display:flex;flex-direction:column;gap:1rem;max-width:400px;margin:2rem auto}</style></head>
<body>
<div class="container">
  <h1>@${title.replace(/\s/g, "").toLowerCase()}</h1>
  <p>${rtl ? "עקבו אחרי" : "Follow me"}</p>
  <div class="links">
    <a class="btn" href="#">Instagram</a>
    <a class="btn" href="#">TikTok</a>
    <a class="btn" href="#">YouTube</a>
  </div>
</div>
</body></html>`;
}

function portfolioPage({ title, rtl, color }) {
  return `<!DOCTYPE html>
<html lang="${rtl ? "he" : "en"}" ${rtl ? 'dir="rtl"' : ""}>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>${baseCss(color, rtl)} body{background:#111;color:#eee}</style></head>
<body>
<section class="hero"><h1>${title}</h1><p>${rtl ? "מפתח / מעצב" : "Developer / Designer"}</p></section>
<div class="container"><h2>${rtl ? "פרויקטים" : "Projects"}</h2>
<div class="grid">
  <div class="card"><h3>Project Alpha</h3><p>React + Node</p></div>
  <div class="card"><h3>Project Beta</h3><p>Mobile App</p></div>
</div></div>
<footer>${rtl ? "צור קשר" : "Contact"}: hello@example.com</footer>
</body></html>`;
}

function presentationPage({ title, rtl, color }) {
  return `<!DOCTYPE html>
<html lang="${rtl ? "he" : "en"}" ${rtl ? 'dir="rtl"' : ""}>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>${baseCss(color, rtl)} .slide{min-height:60vh;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:2rem;border-bottom:2px solid ${color}33}</style></head>
<body>
<div class="slide"><h1>${title}</h1><p>${rtl ? "פרויקט לימודי" : "School Project"}</p></div>
<div class="slide"><h2>${rtl ? "מבוא" : "Introduction"}</h2><p>${rtl ? "נושא הפרויקט..." : "Project topic..."}</p></div>
<div class="slide"><h2>${rtl ? "סיכום" : "Conclusion"}</h2><p>${rtl ? "תודה!" : "Thank you!"}</p></div>
</body></html>`;
}

function saasPage({ title, rtl, color }) {
  return `<!DOCTYPE html>
<html lang="${rtl ? "he" : "en"}" ${rtl ? 'dir="rtl"' : ""}>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>${baseCss(color, rtl)} .pricing{display:flex;gap:1rem;flex-wrap:wrap;justify-content:center}.plan{border:2px solid ${color};border-radius:1rem;padding:2rem;min-width:200px;text-align:center}</style></head>
<body>
<section class="hero"><h1>${title}</h1><p>${rtl ? "הפתרון החכם לעסק שלך" : "The smart solution for your business"}</p><a class="btn" href="#">${rtl ? "נסה חינם" : "Try free"}</a></section>
<div class="container"><h2 style="text-align:center">${rtl ? "מחירים" : "Pricing"}</h2>
<div class="pricing">
  <div class="plan"><h3>Free</h3><p>₪0</p></div>
  <div class="plan"><h3>Pro</h3><p>₪49/${rtl ? "חודש" : "mo"}</p></div>
</div></div>
</body></html>`;
}

function blogPage({ title, rtl, color }) {
  return `<!DOCTYPE html>
<html lang="${rtl ? "he" : "en"}" ${rtl ? 'dir="rtl"' : ""}>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>${baseCss(color, rtl)} article{border-bottom:1px solid #e2e8f0;padding:2rem 0}</style></head>
<body>
<header><strong>📝 ${title}</strong></header>
<div class="container">
  <article><h2>${rtl ? "פוסט ראשון" : "First post"}</h2><p>${rtl ? "תוכן המאמר..." : "Article content..."}</p></article>
  <article><h2>${rtl ? "פוסט שני" : "Second post"}</h2><p>${rtl ? "עוד תוכן..." : "More content..."}</p></article>
</div>
</body></html>`;
}
