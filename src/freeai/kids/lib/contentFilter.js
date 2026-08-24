/** Kid-safe input/output filtering (client-side guardrail). */

const BLOCK_INPUT = [
  /איך.*להרוג|how to kill|كيف.*قتل/i,
  /סекс|porn|porno|עירום|nude/i,
  /סמים|drugs|cocaine|heroin/i,
  /להתאבד|suicide|self.?harm/i,
];

const BLOCK_OUTPUT = [
  /porn|porno|explicit sexual/i,
];

export function filterKidsInput(text, lang) {
  if (!text) return null;
  for (const re of BLOCK_INPUT) {
    if (re.test(text)) {
      const msg = {
        he: "🛡️ השאלה הזו לא מתאימה לילדים. בוא/י נשאל משהו על לימוד, מדעים, יצירה או משחקים!",
        en: "🛡️ That question isn't for kids. Let's ask about learning, science, creativity, or games!",
        ar: "🛡️ هذا السؤال غير مناسب للأطفال. لنسأل عن التعلم أو العلوم أو الإبداع!",
      };
      return msg[lang] || msg.en;
    }
  }
  return null;
}

export function filterKidsOutput(text, lang) {
  if (!text) return text;
  for (const re of BLOCK_OUTPUT) {
    if (re.test(text)) {
      const msg = {
        he: "🛡️ אני לא יכול לענות על זה — בוא/י נמשיך ללמוד משהו מגניב!",
        en: "🛡️ I can't answer that — let's learn something cool instead!",
        ar: "🛡️ لا أستطيع الإجابة — لنتعلم شيئًا رائعًا!",
      };
      return msg[lang] || msg.en;
    }
  }
  return text;
}
