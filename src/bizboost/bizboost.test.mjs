import assert from 'node:assert/strict';
import { generateLeadResponse, buildWhatsAppLink } from './lib/leadBotEngine.js';
import { generateContent } from './lib/contentFlowEngine.js';
import { auditWebsite } from './lib/convertScanEngine.js';

// LeadBot
const lead = generateLeadResponse({
  businessName: 'Test Biz',
  industry: 'marketing',
  leadName: 'דני',
  leadMessage: 'כמה עולה ייעוץ?',
  budget: 'high',
  urgency: 'urgent',
  hasPhone: true,
});
assert.ok(lead.score >= 80, 'hot lead score');
assert.ok(lead.instantReply.includes('דני'));
assert.ok(lead.followUps.length === 4);
const wa = buildWhatsAppLink({ phone: '972501234567', message: 'test' });
assert.ok(wa.includes('wa.me/972501234567'));

// ContentFlow
const content = generateContent({
  businessName: 'PinkLime',
  industry: 'marketing',
  channel: 'instagram',
  topic: 'לידים',
});
assert.ok(content.hebrew?.post);
assert.ok(content.english?.post);
assert.ok(content.calendar.length === 5);

// ConvertScan — sample HTML
const sampleHtml = `
<html dir="rtl"><head><meta name="viewport" content="width=device-width">
<title>עסק</title></head><body>
<a href="https://wa.me/972501234567">WhatsApp</a>
<a href="tel:+972501234567">Call</a>
<p>150+ לקוחות מרוצים</p>
<p>קבעו ייעוץ חינם</p>
<script type="application/ld+json">{"@type":"LocalBusiness"}</script>
<meta property="og:title" content="test">
<img loading="lazy" src="hero.webp">
</body></html>`;
const audit = auditWebsite({ url: 'https://example.com', html: sampleHtml });
assert.ok(audit.score >= 70, `expected good score, got ${audit.score}`);
assert.ok(audit.recommendations.length >= 0);

// Enterprise email outreach
const { enterpriseWithEmail } = await import('./data/enterpriseProspects.js');
const { buildEnterpriseOutreachBatch } = await import('./lib/outreachEngine.js');
const entBatch = buildEnterpriseOutreachBatch(enterpriseWithEmail());
assert.ok(entBatch.length >= 25, 'enterprise targets');
assert.ok(entBatch[0].emailSubject.includes('BizBoost'));
assert.ok(entBatch[0].emailBody.includes('LeadBot'));
assert.ok(!entBatch[0].whatsappUrl, 'enterprise is email-only');

console.log('bizboost tests passed');
