// Laravel Rebel — Admin Panel SPA.
// Ported faithfully from the design template (claude.ai/design handoff). The template's
// files were authored as global <script type="text/babel"> modules; we concatenate them in
// the same load order so their window-scoped cross-references keep working, and build with Vite.
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './styles-components.css';
window.React = React;
window.ReactDOM = ReactDOM;

// ===== data.js =====

/* ============================================================
   Laravel Rebel — mock data (read-model shape per spec)
   Realistic enterprise sample data · EUR, EU/IT context
   ============================================================ */
(function () {
  const rng = (seed) => { let s = seed; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; };
  const series = (n, base, varr, seed) => { const r = rng(seed); return Array.from({ length: n }, (_, i) => Math.max(0, Math.round(base + Math.sin(i / 2.5) * varr * 0.5 + (r() - 0.5) * varr))); };

  const tenants = [
    { id: 'northwind', name: 'Northwind Bank', plan: 'Enterprise', color: '#4493f8', mrr: '€48k/mo' },
    { id: 'aurora', name: 'Aurora Retail Group', plan: 'Enterprise', color: '#3fb950', mrr: '€31k/mo' },
    { id: 'helvetia', name: 'Helvetia Assicurazioni', plan: 'Business', color: '#a371f7', mrr: '€22k/mo' },
    { id: 'volta', name: 'Volta Mobility', plan: 'Business', color: '#e3a008', mrr: '€14k/mo' },
    { id: 'padosoft', name: 'Padosoft (interno)', plan: 'Internal', color: '#f85149', mrr: '—' },
  ];

  const periods = {
    '24h': { label: '24h', granularity: 'hour', points: 24, fmt: (i) => `${String(i).padStart(2,'0')}:00` },
    '7d':  { label: '7g',  granularity: 'day',  points: 7,  fmt: (i) => ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'][i] },
    '30d': { label: '30g', granularity: 'day',  points: 30, fmt: (i) => `${i+1}` },
  };

  // ── Security Overview (per period) ──
  function overview(periodKey) {
    const p = periods[periodKey] || periods['24h'];
    const N = p.points;
    const scale = periodKey === '24h' ? 1 : periodKey === '7d' ? 6.8 : 28;
    const logins = series(N, 52 * (scale/ (periodKey==='24h'?1:N/ (periodKey==='7d'?7:30)) ) , 22, 7).map(v=>Math.round(v*(periodKey==='24h'?1:periodKey==='7d'?7:6)));
    const ts = Array.from({ length: N }, (_, i) => ({
      label: p.fmt(i),
      logins: logins[i],
      otp_sent: Math.round(logins[i] * 0.79),
      otp_verified: Math.round(logins[i] * 0.62),
      high_risk: Math.max(0, Math.round((Math.sin(i/3)+1) * 1.4 + (i===Math.floor(N*0.7)?6:0))),
    }));
    const sum = (k) => ts.reduce((a, r) => a + r[k], 0);
    const lr = sum('logins'), os = sum('otp_sent'), ov = sum('otp_verified'), hr = sum('high_risk');
    return {
      generated_at: '2026-06-02T09:58:00Z',
      ts,
      kpis: {
        login_requests: { value: lr, delta_pct: 8.1, intent: 'neutral', spark: ts.map(r=>r.logins) },
        otp_sent: { value: os, delta_pct: 3.2, intent: 'info', spark: ts.map(r=>r.otp_sent) },
        otp_verified: { value: ov, rate: ov/os, delta_pct: 1.0, intent: 'good', spark: ts.map(r=>r.otp_verified) },
        step_up_required: { value: Math.round(lr*0.097), delta_pct: -2.0, intent: 'neutral', spark: series(N, 6, 4, 21) },
        step_up_verified: { value: Math.round(lr*0.081), rate: 0.833, delta_pct: 4.4, intent: 'good', spark: series(N, 5, 3, 31) },
        high_risk_events: { value: hr, delta_pct: 40.0, intent: 'bad', spark: ts.map(r=>r.high_risk) },
      },
      funnel: [
        { key: 'login', label: 'Login request', count: lr },
        { key: 'sent', label: 'OTP sent', count: os },
        { key: 'delivered', label: 'OTP delivered', count: Math.round(os*0.965) },
        { key: 'verified', label: 'OTP verified', count: ov },
        { key: 'authenticated', label: 'Authenticated', count: Math.round(ov*0.973) },
      ],
    };
  }

  const openAnomalies = [
    { id: 'case_4821', type: 'sms_pumping', severity: 'high', status: 'open', events: 142, opened_at: '2026-06-02T07:12:00Z', tenant: 'volta' },
    { id: 'case_4817', type: 'impossible_travel', severity: 'critical', status: 'open', events: 3, opened_at: '2026-06-02T06:40:00Z', tenant: 'northwind' },
    { id: 'case_4805', type: 'otp_bombing', severity: 'medium', status: 'ack', events: 58, opened_at: '2026-06-01T22:05:00Z', tenant: 'aurora' },
    { id: 'case_4798', type: 'credential_stuffing', severity: 'high', status: 'open', events: 1240, opened_at: '2026-06-01T19:30:00Z', tenant: 'northwind' },
    { id: 'case_4790', type: 'device_anomaly', severity: 'low', status: 'open', events: 7, opened_at: '2026-06-01T15:18:00Z', tenant: 'helvetia' },
  ];

  // ── Providers ──
  const providers = [
    { key: 'twilio', name: 'Twilio', kind: 'SMS · Voice', status: 'healthy', uptime: 99.95, error_rate: 0.004, p95: 2400, p50: 820, checked: '2026-06-02T09:57:40Z', spark: series(28, 99.9, 0.3, 3),
      errors: [{ code: '60200', message: 'Invalid To phone number', count: 3 }, { code: '30007', message: 'Carrier filtered', count: 1 }] },
    { key: 'vonage', name: 'Vonage', kind: 'SMS', status: 'degraded', uptime: 99.21, error_rate: 0.031, p95: 4100, p50: 1380, checked: '2026-06-02T09:57:12Z', spark: series(28, 98.5, 1.4, 9),
      errors: [{ code: 'EC-7', message: 'Throughput throttled', count: 22 }, { code: 'EC-9', message: 'Destination unreachable', count: 8 }] },
    { key: 'ses', name: 'Amazon SES', kind: 'Email', status: 'healthy', uptime: 99.99, error_rate: 0.001, p95: 640, p50: 210, checked: '2026-06-02T09:58:01Z', spark: series(28, 99.98, 0.05, 12),
      errors: [{ code: 'Throttling', message: 'Max send rate exceeded', count: 1 }] },
    { key: 'meta_wa', name: 'WhatsApp Cloud', kind: 'WhatsApp', status: 'healthy', uptime: 99.88, error_rate: 0.006, p95: 1100, p50: 430, checked: '2026-06-02T09:57:55Z', spark: series(28, 99.85, 0.4, 4),
      errors: [{ code: '131049', message: 'Template paused', count: 2 }] },
    { key: 'sinch', name: 'Sinch', kind: 'Voice OTP', status: 'down', uptime: 96.40, error_rate: 0.180, p95: 9800, p50: 5200, checked: '2026-06-02T09:55:02Z', spark: series(28, 97, 5, 17),
      errors: [{ code: 'SIP-503', message: 'Service unavailable', count: 94 }, { code: 'SIP-486', message: 'Busy here', count: 31 }] },
    { key: 'fortify', name: 'Fortify (Passkey)', kind: 'WebAuthn', status: 'healthy', uptime: 100.0, error_rate: 0.0, p95: 180, p50: 90, checked: '2026-06-02T09:58:03Z', spark: series(28, 100, 0.01, 1), errors: [] },
  ];

  const incidents = [
    { t: '2026-06-02T09:42:00Z', provider: 'Sinch', event: 'Outage rilevato — SIP 503 su voice OTP', sev: 'bad' },
    { t: '2026-06-02T08:10:00Z', provider: 'Vonage', event: 'Latenza p95 oltre soglia (4.1s)', sev: 'warn' },
    { t: '2026-06-01T23:55:00Z', provider: 'Twilio', event: 'Recuperato dopo throttling temporaneo', sev: 'good' },
    { t: '2026-06-01T18:20:00Z', provider: 'WhatsApp Cloud', event: 'Template "otp_login_it" riattivato', sev: 'info' },
  ];

  // ── Channels ──
  const channels = [
    { channel: 'email', provider: 'Amazon SES', sent: 18420, delivered: 0.991, fallback: 0.004, p50: 210, p95: 640, cost: 9.21, cur: 'EUR', conv: 0.74, fraud: false },
    { channel: 'sms', provider: 'Twilio', sent: 9240, delivered: 0.972, fallback: 0.028, p50: 820, p95: 2400, cost: 231.00, cur: 'EUR', conv: 0.71, fraud: false },
    { channel: 'sms', provider: 'Vonage', sent: 2110, delivered: 0.918, fallback: 0.082, p50: 1380, p95: 4100, cost: 48.53, cur: 'EUR', conv: 0.49, fraud: true },
    { channel: 'whatsapp', provider: 'WhatsApp Cloud', sent: 6130, delivered: 0.984, fallback: 0.016, p50: 430, p95: 1100, cost: 67.43, cur: 'EUR', conv: 0.81, fraud: false },
    { channel: 'voice', provider: 'Sinch', sent: 640, delivered: 0.742, fallback: 0.258, p50: 5200, p95: 9800, cost: 89.60, cur: 'EUR', conv: 0.58, fraud: false },
  ];
  const channelTrend = {
    labels: periods['7d'].points,
    email: series(7, 99, 0.6, 2), sms: series(7, 96, 2, 5), whatsapp: series(7, 98, 1, 8), voice: series(7, 78, 8, 11),
  };

  // ── Funnels detail ──
  const stepUpByPurpose = [
    { purpose: 'checkout-credit-order', required: 1240, challenged: 1218, verified: 1015, rate: 0.833, aal: 'aal2' },
    { purpose: 'change-payout-iban', required: 420, challenged: 418, verified: 388, rate: 0.928, aal: 'aal3' },
    { purpose: 'admin-impersonate', required: 96, challenged: 96, verified: 91, rate: 0.948, aal: 'aal3' },
    { purpose: 'high-value-transfer', required: 612, challenged: 600, verified: 503, rate: 0.838, aal: 'aal2' },
    { purpose: 'profile-email-change', required: 880, challenged: 851, verified: 742, rate: 0.872, aal: 'aal2' },
  ];

  // ── Audit events ──
  const eventTypes = ['email_otp.sent','email_otp.verified','sms_otp.sent','sms_otp.verified','step_up.required','step_up.verified','passkey.registered','passkey.verified','login.failed','session.revoked','risk.high_score'];
  const guards = ['customers','admin','partners'];
  const channelsList = ['email','sms','whatsapp','voice',null];
  function auditEvents(seed = 1, count = 40) {
    const r = rng(seed);
    return Array.from({ length: count }, (_, i) => {
      const et = eventTypes[Math.floor(r() * eventTypes.length)];
      const risk = Math.floor(r() * 100);
      const ch = channelsList[Math.floor(r() * channelsList.length)];
      const t = REF_TS - i * (1000 * 60 * (3 + r() * 9));
      const failed = et.includes('failed') || et.includes('high_score');
      return {
        id: 'evt_' + (9_421_000 - i),
        created_at: new Date(t).toISOString(),
        event_type: et,
        guard: guards[Math.floor(r() * guards.length)],
        subject: { type: 'customer', masked: 'cus_***' + (1000 + Math.floor(r()*8999)) },
        aal: risk > 70 ? 'aal2' : 'aal1',
        amr: et.includes('passkey') ? ['webauthn'] : et.includes('sms') ? ['otp','sms'] : ['otp','email'],
        channel: ch,
        purpose: ['customer-login','checkout-credit-order','high-value-transfer','profile-email-change'][Math.floor(r()*4)],
        risk_score: risk,
        ip_masked: `${Math.floor(r()*223)+1}.x.x.x`,
        outcome: failed ? 'failed' : 'success',
        ua: ['iOS 18 · Safari','Android 15 · Chrome','macOS · Chrome','Windows · Edge'][Math.floor(r()*4)],
        country: ['IT','DE','FR','CH','NG','RO'][Math.floor(r()*6)],
      };
    });
  }
  const REF_TS = new Date('2026-06-02T09:58:00Z').getTime();

  // ── Devices & Sessions ──
  const subjectSearch = [
    { id: 'cus_8842', masked: 'm****o.rossi@northwind.eu', tenant: 'northwind', devices: 3, sessions: 4 },
    { id: 'cus_2291', masked: 'g****@aurora-retail.it', tenant: 'aurora', devices: 2, sessions: 2 },
    { id: 'cus_5610', masked: 'l****@helvetia.ch', tenant: 'helvetia', devices: 5, sessions: 6 },
  ];
  const devices = [
    { id: 'dev_a1f2', fp: 'a1f2···9c4e', trusted: true, until: '2026-08-31', last_seen: '2026-06-02T09:31:00Z', os: 'iOS 18', browser: 'Safari', loc: 'Milano, IT', current: true },
    { id: 'dev_b7d3', fp: 'b7d3···2e10', trusted: true, until: '2026-07-14', last_seen: '2026-06-01T20:12:00Z', os: 'macOS 15', browser: 'Chrome', loc: 'Milano, IT', current: false },
    { id: 'dev_c9e8', fp: 'c9e8···77a1', trusted: false, until: null, last_seen: '2026-06-02T06:44:00Z', os: 'Android 15', browser: 'Chrome', loc: 'Lagos, NG', current: false, flagged: true },
  ];
  const sessions = [
    { id: 'sess_91a', type: 'session', status: 'active', device: 'dev_a1f2', created: '2026-06-02T08:01:00Z', expires: '2026-06-02T20:01:00Z', current: true },
    { id: 'sess_88c', type: 'refresh', status: 'active', device: 'dev_b7d3', created: '2026-06-01T19:55:00Z', expires: '2026-06-08T19:55:00Z', current: false },
    { id: 'sess_84f', type: 'refresh', status: 'reuse-detected', device: 'dev_c9e8', created: '2026-06-02T06:40:00Z', expires: '2026-06-09T06:40:00Z', current: false },
    { id: 'sess_80b', type: 'session', status: 'revoked', device: 'dev_b7d3', created: '2026-05-30T11:20:00Z', expires: '2026-05-30T23:20:00Z', current: false },
  ];

  // ── Risk rules ──
  const riskRules = [
    { key: 'high_value', name: 'High-value transaction', signal: 'amount', operator: '>', value: 1000, action: 'require_step_up', aal: 'aal2', phishing: true, status: 'active' },
    { key: 'new_device', name: 'New / untrusted device', signal: 'new_device', operator: '=', value: true, action: 'require_step_up', aal: 'aal2', phishing: false, status: 'active' },
    { key: 'b2b_credit', name: 'B2B credit order', signal: 'b2b_credit', operator: '=', value: true, action: 'require_step_up', aal: 'aal3', phishing: true, status: 'active' },
    { key: 'impossible_travel', name: 'Impossible travel', signal: 'velocity', operator: '>', value: 800, action: 'block', aal: 'aal3', phishing: true, status: 'active' },
    { key: 'risky_country', name: 'High-risk geography', signal: 'country', operator: 'in', value: 'NG, RO, BY', action: 'require_step_up', aal: 'aal2', phishing: false, status: 'active' },
    { key: 'velocity_burst', name: 'Velocity burst (draft)', signal: 'velocity', operator: '>', value: 40, action: 'require_step_up', aal: 'aal2', phishing: false, status: 'draft' },
  ];

  function simulate(signals) {
    const matched = [], reasons = [];
    let decision = 'allow', aal = 'aal1', phishing = false, drivers = ['fortify_totp','email_otp','sms_otp'];
    if (signals.amount > 1000) { matched.push('high_value'); reasons.push(`amount > 1000 (€${signals.amount})`); decision = 'require_step_up'; aal = 'aal2'; phishing = true; }
    if (signals.new_device) { matched.push('new_device'); reasons.push('dispositivo nuovo / non trusted'); if (decision==='allow') decision='require_step_up'; if (aal==='aal1') aal='aal2'; }
    if (signals.b2b_credit) { matched.push('b2b_credit'); reasons.push('ordine a credito B2B'); decision = 'require_step_up'; aal = 'aal3'; phishing = true; }
    if (['NG','RO','BY'].includes(signals.country)) { matched.push('risky_country'); reasons.push(`geografia ad alto rischio (${signals.country})`); if (decision==='allow') decision='require_step_up'; if (aal==='aal1') aal='aal2'; }
    if (signals.velocity > 800) { matched.push('impossible_travel'); reasons.push(`velocity ${signals.velocity} km/h → impossible travel`); decision = 'block'; aal = 'aal3'; phishing = true; }
    if (phishing) drivers = ['fortify_passkey_confirm','fortify_security_key'];
    else if (aal === 'aal2') drivers = ['fortify_passkey_confirm','fortify_totp','sms_otp'];
    return { decision, required_assurance: aal, require_phishing_resistant: phishing, allowed_drivers: drivers, matched_rules: matched, reasons: reasons.length ? reasons : ['nessuna regola soddisfatta'] };
  }

  // ── Anomalies (geo coords are % positions on the world map svg) ──
  const anomalyCases = [
    { id: 'case_4821', type: 'sms_pumping', severity: 'high', status: 'open', events: 142, opened_at: '2026-06-02T07:12:00Z', tenant: 'volta',
      signals: { prefix: '+229 (Benin)', velocity: 'x40', cost_impact: '€312' }, geo: { x: 50.5, y: 58 },
      timeline: [
        { t: '2026-06-02T07:12:00Z', event: 'Spike rilevato', detail: 'SMS verso +229 +4000% vs baseline', sev: 'bad' },
        { t: '2026-06-02T07:13:00Z', event: 'Auto-mitigazione suggerita', detail: 'Blocco prefisso +229 in attesa di review', sev: 'warn' },
        { t: '2026-06-02T07:40:00Z', event: 'Conversion-rate crollata', detail: 'request→verify 4.1% (soglia 35%)', sev: 'bad' },
      ],
      actions: [{ key: 'block_prefix', label: 'Blocca prefisso +229', destructive: true }, { key: 'force_email', label: 'Forza fallback email', destructive: false }] },
    { id: 'case_4817', type: 'impossible_travel', severity: 'critical', status: 'open', events: 3, opened_at: '2026-06-02T06:40:00Z', tenant: 'northwind',
      signals: { from: 'Milano, IT', to: 'Lagos, NG', velocity: '6.450 km/h', subject: 'cus_***8842' }, geo: { x: 50, y: 38 }, geo2: { x: 50.5, y: 58 },
      timeline: [
        { t: '2026-06-02T06:01:00Z', event: 'Login da Milano', detail: 'device trusted · aal2', sev: 'good' },
        { t: '2026-06-02T06:40:00Z', event: 'Login da Lagos', detail: 'device nuovo · 39 min dopo', sev: 'bad' },
        { t: '2026-06-02T06:40:30Z', event: 'Step-up forzato e fallito', detail: 'passkey non presentata', sev: 'bad' },
      ],
      actions: [{ key: 'revoke_sessions', label: 'Revoca tutte le sessioni', destructive: true }, { key: 'lock_account', label: 'Blocca account', destructive: true }] },
    { id: 'case_4798', type: 'credential_stuffing', severity: 'high', status: 'open', events: 1240, opened_at: '2026-06-01T19:30:00Z', tenant: 'northwind',
      signals: { ips: '184 unici', pattern: 'login.failed burst', country: 'RO' }, geo: { x: 55, y: 33 },
      timeline: [
        { t: '2026-06-01T19:30:00Z', event: 'Burst login.failed', detail: '1.240 tentativi / 12 min', sev: 'bad' },
        { t: '2026-06-01T19:32:00Z', event: 'Rate-limit attivato', detail: 'IP throttling automatico', sev: 'warn' },
      ],
      actions: [{ key: 'block_asn', label: 'Blocca ASN sorgente', destructive: true }] },
    { id: 'case_4805', type: 'otp_bombing', severity: 'medium', status: 'ack', events: 58, opened_at: '2026-06-01T22:05:00Z', tenant: 'aurora',
      signals: { target: 'cus_***2291', rate: '58 OTP / 9 min' }, geo: { x: 48, y: 36 },
      timeline: [{ t: '2026-06-01T22:05:00Z', event: 'OTP resend abuse', detail: '58 richieste stesso numero', sev: 'warn' }],
      actions: [{ key: 'cooldown', label: 'Applica cooldown 1h', destructive: false }] },
    { id: 'case_4790', type: 'device_anomaly', severity: 'low', status: 'open', events: 7, opened_at: '2026-06-01T15:18:00Z', tenant: 'helvetia',
      signals: { fp_changes: 7, subject: 'cus_***5610' }, geo: { x: 49, y: 35 },
      timeline: [{ t: '2026-06-01T15:18:00Z', event: 'Fingerprint instabile', detail: '7 cambi in 1h', sev: 'info' }],
      actions: [{ key: 'require_reverify', label: 'Richiedi re-verifica device', destructive: false }] },
  ];
  const anomalyTypes = { sms_pumping: 'SMS Pumping', impossible_travel: 'Impossible Travel', otp_bombing: 'OTP Bombing', credential_stuffing: 'Credential Stuffing', device_anomaly: 'Device Anomaly' };

  // ── AI Copilot canned responses ──
  const aiResponses = {
    'case_4821': {
      confidence: 'high',
      paragraphs: [
        "Il case <code>case_4821</code> è un classico pattern di <strong>SMS pumping (toll fraud)</strong>. Un attore sta innescando invii OTP verso il prefisso <code>+229</code> (Benin) per generare traffico fraudolento e ricavare quote di revenue share dall'operatore di destinazione.",
        "I segnali chiave: velocità di invio <strong>×40 rispetto alla baseline</strong>, conversion-rate request→verify crollata al <strong>4,1%</strong> (soglia operativa 35%) e impatto costo stimato di <strong>€312</strong> nelle ultime 5 ore.",
        "<strong>Raccomandazione:</strong> bloccare temporaneamente il prefisso <code>+229</code> e forzare il fallback su email per quella geografia. Suggerisco anche di abbassare la soglia di velocity per i prefissi africani non-core a 10×.",
      ],
      sources: ['channels/performance', 'anomalies/case_4821', 'risk-rules/velocity_burst'],
    },
    'case_4817': {
      confidence: 'high',
      paragraphs: [
        "Il case <code>case_4817</code> indica un <strong>impossible travel</strong> ad alta confidenza sul subject <code>cus_***8842</code>: login da Milano alle 06:01 (device trusted, aal2) seguito da login da Lagos alle 06:40, una velocità implicita di <strong>~6.450 km/h</strong> — fisicamente impossibile.",
        "Lo step-up forzato è <strong>fallito</strong> (passkey non presentata), il che aumenta la probabilità di account takeover in corso. Severity correttamente classificata come <strong>critical</strong>.",
        "<strong>Raccomandazione:</strong> revocare tutte le sessioni del subject e richiedere re-enrollment passkey al prossimo accesso. La mitigazione è distruttiva e richiede human review.",
      ],
      sources: ['auth-events?subject=cus_8842', 'anomalies/case_4817', 'devices/cus_8842'],
    },
    'default': {
      confidence: 'medium',
      paragraphs: [
        "Ho analizzato gli eventi correlati nel periodo selezionato. Nel complesso la postura di sicurezza è <strong>stabile</strong>: i tassi di verifica OTP e step-up restano sopra le soglie target, con l'eccezione del canale voice (Sinch) attualmente in outage.",
        "L'anomalia più urgente da rivedere è <code>case_4817</code> (impossible travel, critical) sul tenant Northwind Bank. Ti consiglio di partire da lì.",
        "<em>Nota: questo output è da rivedere. Le mitigazioni distruttive richiedono human review.</em>",
      ],
      sources: ['security/overview', 'anomalies?status=open'],
    },
    'policy': {
      confidence: 'medium',
      draft: { key: 'sms_pumping_guard', name: 'SMS pumping guard (draft)', signal: 'sms_velocity_by_prefix', operator: '>', value: 10, action: 'force_driver', driver: 'email_otp', aal: 'aal1' },
      paragraphs: [
        "Ho generato una <strong>bozza di regola</strong> per mitigare l'SMS pumping in modo strutturale. La regola forza il fallback su email OTP quando la velocity per prefisso supera 10× la baseline, senza bloccare gli utenti legittimi.",
        "Questa è una <strong>bozza</strong>: non viene applicata automaticamente. Rivedila e salvala come draft regola se sei d'accordo.",
      ],
      sources: ['anomalies?type=sms_pumping', 'channels/performance'],
    },
  };

  // ── Compliance ──
  const compliance = {
    nist: { aal1: 0.70, aal2: 0.28, aal3: 0.02 },
    amr: [{ k: 'otp', v: 0.52 }, { k: 'passkey', v: 0.31 }, { k: 'totp', v: 0.11 }, { k: 'password', v: 0.06 }],
    psd2: { sca_events: 2384, dynamic_linked: 2351, exemptions: { low_value: 412, tra: 96, trusted_beneficiary: 188 } },
    gdpr: { retention: [
      { name: 'auth_events.detail', days: 30, rows: '4.2M', next_prune: '2026-06-03' },
      { name: 'auth_events.aggregate', days: 395, rows: '88K', next_prune: '2026-06-30' },
      { name: 'device_fingerprints', days: 180, rows: '162K', next_prune: '2026-06-12' },
      { name: 'risk_decisions', days: 90, rows: '1.1M', next_prune: '2026-06-08' },
    ], pending_erasures: 2, last_prune: '2026-06-02T03:00:00Z' },
  };

  const RebelData = window.RebelData = {
    tenants, periods, overview, openAnomalies, providers, incidents, channels, channelTrend,
    stepUpByPurpose, auditEvents, eventTypes, guards, subjectSearch, devices, sessions,
    riskRules, simulate, anomalyCases, anomalyTypes, aiResponses, compliance, REF_TS,
  };
})();


// ===== icons.jsx =====

// ============== Laravel Rebel — icons (lucide-style) + brand mark ==============
const Icon = ({ d, size = 16, fill = 'none', children, ...rest }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke="currentColor"
       strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);

// Rebel shield+bolt brand mark
const BrandMark = ({ size = 30 }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
    <defs>
      <linearGradient id="rbShield" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ff3a40"/><stop offset="1" stopColor="#b00d14"/>
      </linearGradient>
    </defs>
    <path d="M16 2.5l11 3.6v8.2c0 7.1-4.7 13-11 15.2-6.3-2.2-11-8.1-11-15.2V6.1L16 2.5z"
          fill="url(#rbShield)" stroke="#ff5057" strokeWidth="0.8"/>
    <path d="M17.3 7.5l-7 9.2h4.4l-1.8 7.8 7.6-10.2h-4.6l1.4-6.8z" fill="#fff" fillOpacity="0.96"/>
  </svg>
);

const I = {
  // nav
  Shield: (p) => <Icon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Icon>,
  Overview: (p) => <Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></Icon>,
  Funnel: (p) => <Icon {...p}><path d="M3 4h18l-7 8v7l-4 2v-9L3 4z"/></Icon>,
  Channels: (p) => <Icon {...p}><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></Icon>,
  Providers: (p) => <Icon {...p}><rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/></Icon>,
  Audit: (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></Icon>,
  Devices: (p) => <Icon {...p}><rect x="2" y="4" width="14" height="11" rx="1.5"/><path d="M2 19h20"/><rect x="18" y="9" width="4" height="8" rx="1"/></Icon>,
  Risk: (p) => <Icon {...p}><path d="M12 2 2 7v6c0 5 4 8 10 9 6-1 10-4 10-9V7L12 2z"/><path d="M12 8v4M12 16h.01"/></Icon>,
  Anomaly: (p) => <Icon {...p}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></Icon>,
  AI: (p) => <Icon {...p}><path d="M12 3a4 4 0 0 0-4 4 3 3 0 0 0-2 5 3 3 0 0 0 2 5 4 4 0 0 0 8 0 3 3 0 0 0 2-5 3 3 0 0 0-2-5 4 4 0 0 0-4-4z"/><path d="M12 7v10M9 10h6"/></Icon>,
  Compliance: (p) => <Icon {...p}><path d="M9 12l2 2 4-4"/><path d="M12 2 4 5v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V5l-8-3z"/></Icon>,
  // ui
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>,
  Sun: (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></Icon>,
  Moon: (p) => <Icon {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Icon>,
  Refresh: (p) => <Icon {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></Icon>,
  Pause: (p) => <Icon {...p}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></Icon>,
  Play: (p) => <Icon {...p} fill="currentColor" stroke="none"><polygon points="6 4 20 12 6 20 6 4"/></Icon>,
  Download: (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  ChevronDown: (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  ChevronRight: (p) => <Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>,
  ChevronLeft: (p) => <Icon {...p}><path d="m15 18-6-6 6-6"/></Icon>,
  ChevronsLeft: (p) => <Icon {...p}><path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/></Icon>,
  X: (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>,
  Check: (p) => <Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>,
  CheckCircle: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></Icon>,
  XCircle: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></Icon>,
  AlertTriangle: (p) => <Icon {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></Icon>,
  AlertCircle: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></Icon>,
  Info: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Icon>,
  Activity: (p) => <Icon {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></Icon>,
  Send: (p) => <Icon {...p}><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"/></Icon>,
  ArrowUp: (p) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7"/></Icon>,
  ArrowDown: (p) => <Icon {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></Icon>,
  ArrowRight: (p) => <Icon {...p}><path d="M5 12h14M12 5l7 7-7 7"/></Icon>,
  TrendingUp: (p) => <Icon {...p}><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></Icon>,
  Mail: (p) => <Icon {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></Icon>,
  Phone: (p) => <Icon {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></Icon>,
  MessageSquare: (p) => <Icon {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Icon>,
  Mic: (p) => <Icon {...p}><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3"/></Icon>,
  Smartphone: (p) => <Icon {...p}><rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M12 18h.01"/></Icon>,
  Key: (p) => <Icon {...p}><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M18 5l2 2M15 8l2 2"/></Icon>,
  Fingerprint: (p) => <Icon {...p}><path d="M12 10a2 2 0 0 0-2 2c0 1.5.5 3 .5 3M12 6a6 6 0 0 1 6 6c0 2 0 3-.5 4M6.5 16c-.5-1-.5-2.5-.5-4a6 6 0 0 1 3-5.2M12 12v2c0 2 .5 3.5 1 4.5"/></Icon>,
  Lock: (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></Icon>,
  User: (p) => <Icon {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>,
  Users: (p) => <Icon {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11"/></Icon>,
  Globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z"/></Icon>,
  MapPin: (p) => <Icon {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></Icon>,
  Hash: (p) => <Icon {...p}><path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/></Icon>,
  Copy: (p) => <Icon {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Icon>,
  External: (p) => <Icon {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></Icon>,
  Filter: (p) => <Icon {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></Icon>,
  Sliders: (p) => <Icon {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></Icon>,
  Zap: (p) => <Icon {...p} fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>,
  Ban: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></Icon>,
  Eye: (p) => <Icon {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></Icon>,
  Logout: (p) => <Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></Icon>,
  Sparkle: (p) => <Icon {...p}><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/></Icon>,
  Database: (p) => <Icon {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></Icon>,
  FileText: (p) => <Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></Icon>,
  Save: (p) => <Icon {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></Icon>,
  Menu: (p) => <Icon {...p}><path d="M3 12h18M3 6h18M3 18h18"/></Icon>,
  Dollar: (p) => <Icon {...p}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></Icon>,
  Gauge: (p) => <Icon {...p}><path d="M12 14 8 9"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></Icon>,
  History: (p) => <Icon {...p}><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></Icon>,
};

Object.assign(window, { Icon, I, BrandMark });


// ===== ui.jsx =====

// ============== Laravel Rebel — UI primitives ==============

// ── formatters ──
const REF_NOW = new Date('2026-06-02T10:00:00Z').getTime();
function fmtRel(ts) {
  const t = typeof ts === 'number' ? ts : new Date(ts).getTime();
  const diff = (REF_NOW - t) / 1000;
  if (diff < 60) return `${Math.max(1, Math.floor(diff))}s fa`;
  if (diff < 3600) return `${Math.floor(diff/60)} min fa`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h fa`;
  return `${Math.floor(diff/86400)}g fa`;
}
function fmtClock(ts) { return new Date(ts).toISOString().slice(11, 19); }
function fmtDateTime(ts) { return new Date(ts).toISOString().slice(0, 16).replace('T', ' '); }
function fmtNum(n) { return n == null ? '—' : n.toLocaleString('en-US'); }
function fmtMoney(n, cur = 'EUR') {
  const sym = cur === 'EUR' ? '€' : cur === 'USD' ? '$' : '';
  return sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n, dec = 1) { return (n * 100).toFixed(dec) + '%'; }
function fmtDelta(n) { return (n > 0 ? '+' : '') + n.toFixed(1) + '%'; }

// ── StatusBadge ──
function StatusBadge({ status, label }) {
  const map = {
    healthy: 'Healthy', degraded: 'Degraded', down: 'Down',
    active: 'Active', revoked: 'Revoked', expired: 'Expired', trusted: 'Trusted',
    open: 'Open', ack: 'Acknowledged', closed: 'Closed',
    verified: 'Verified', delivered: 'Delivered', failed: 'Failed', pending: 'Pending',
    draft: 'Draft', success: 'OK', paused: 'Paused', running: 'Running', dead: 'Dead-letter',
  };
  return <span className={`badge ${status}`}><span className="dot"/>{label || map[status] || status}</span>;
}

// ── SeverityBadge ──
function SeverityBadge({ severity }) {
  const labels = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
  return <span className={`sev ${severity}`}><span className="bar"/>{labels[severity] || severity}</span>;
}

function Aal({ level }) { return <span className={`aal ${level}`}>{level}</span>; }

// ── Delta ──
function Delta({ pct, invert }) {
  const up = pct > 0;
  const good = invert ? !up : up;
  const dir = pct === 0 ? 'flat' : good ? 'up' : 'down';
  return (
    <span className={`kpi-delta ${dir}`}>
      {pct !== 0 && (up ? <I.ArrowUp size={11}/> : <I.ArrowDown size={11}/>)}
      {fmtDelta(pct)}
    </span>
  );
}

// ── Kbd ──
function Kbd({ children }) { return <span className="kbd">{children}</span>; }

// ── States ──
function Skeleton({ className = '', style }) { return <div className={`skel ${className}`} style={style}/>; }
function SkeletonRows({ rows = 6, cols = 5 }) {
  return (
    <div style={{ padding: '4px 16px' }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="skel-line" style={{ flex: c === 0 ? 2 : 1, margin: 0 }}/>
          ))}
        </div>
      ))}
    </div>
  );
}
function EmptyState({ icon, title, hint, cta }) {
  return (
    <div className="state">
      <div className="state-ico">{icon || <I.Database size={20}/>}</div>
      <b>{title || 'Nessun dato nel periodo'}</b>
      {hint && <p>{hint}</p>}
      {cta}
    </div>
  );
}
function ErrorState({ onRetry, message }) {
  return (
    <div className="state error">
      <div className="state-ico"><I.AlertCircle size={20}/></div>
      <b>Errore nel caricamento</b>
      <p>{message || 'Impossibile recuperare i dati dall\'Admin API.'}</p>
      {onRetry && <button className="btn sm" onClick={onRetry}><I.Refresh size={13}/>Riprova</button>}
    </div>
  );
}

// Lazy-loading wrapper: shows skeleton → success, with optional simulated latency.
function Hydrate({ deps = [], delay = 650, skeleton, children, empty, isEmpty }) {
  const [state, setState] = React.useState('loading');
  React.useEffect(() => {
    setState('loading');
    const id = setTimeout(() => setState('done'), delay);
    return () => clearTimeout(id);
  }, deps); // eslint-disable-line
  if (state === 'loading') return skeleton || <SkeletonRows/>;
  if (isEmpty) return empty || <EmptyState/>;
  return <div className="fade-in">{children}</div>;
}

// ── Toast ──
const ToastCtx = React.createContext({ push: () => {} });
function useToast() { return React.useContext(ToastCtx); }
function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const push = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, ...t }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), t.duration || 3800);
  }, []);
  const icons = { success: <I.CheckCircle size={16}/>, error: <I.XCircle size={16}/>, warn: <I.AlertTriangle size={16}/>, info: <I.Info size={16}/> };
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.kind || 'info'}`}>
            <span className="t-ico">{icons[t.kind || 'info']}</span>
            <div style={{ minWidth: 0 }}><b>{t.title}</b>{t.body && <small>{t.body}</small>}</div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ── Modal ──
function Modal({ open, onClose, title, sub, icon, children, footer, width, danger }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose}/>
      <div className={`modal ${danger ? 'danger' : ''}`} style={width ? { width } : null}>
        {title && (
          <div className="modal-head">
            <div>
              <div className="modal-title">{icon}{title}</div>
              {sub && <div className="modal-sub">{sub}</div>}
            </div>
            <button className="iconbtn" onClick={onClose}><I.X size={16}/></button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </>
  );
}

// ── ConfirmModal (destructive actions w/ required note) ──
function ConfirmModal({ open, onClose, onConfirm, title, body, danger, requireNote, confirmLabel }) {
  const [note, setNote] = React.useState('');
  React.useEffect(() => { if (open) setNote(''); }, [open]);
  const blocked = requireNote && note.trim().length < 4;
  return (
    <Modal open={open} onClose={onClose} title={title} danger={danger}
           icon={danger ? <I.AlertTriangle size={17}/> : <I.Info size={17}/>}
           footer={<>
             <button className="btn" onClick={onClose}>Annulla</button>
             <button className={`btn ${danger ? 'danger' : 'primary'}`} disabled={blocked}
                     onClick={() => { onConfirm?.(note); }}>{confirmLabel || 'Conferma'}</button>
           </>}>
      <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{body}</p>
      {requireNote && (
        <div>
          <label className="field-label">Motivazione (obbligatoria · registrata in audit)</label>
          <textarea className="input" rows={3} value={note} placeholder="Es. blocco temporaneo per spike SMS pumping confermato…"
                    onChange={e => setNote(e.target.value)}/>
          {danger && <div className="notice warn" style={{ marginTop: 12 }}><I.AlertTriangle size={15} className="icon"/>Azione distruttiva: richiede human review e doppia conferma. Verrà tracciata con il tuo utente.</div>}
        </div>
      )}
    </Modal>
  );
}

// ── Drawer ──
function Drawer({ open, onClose, title, icon, children, footer }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="drawer">
        <div className="drawer-head">
          <div className="dh-title">{icon}{title}</div>
          <button className="iconbtn" onClick={onClose}><I.X size={16}/></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </>
  );
}

// ── JSON viewer ──
function jsonHighlight(obj) {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (m) => {
      let cls = 'json-num';
      if (/^"/.test(m)) cls = /:$/.test(m) ? 'json-key' : 'json-string';
      else if (/true|false/.test(m)) cls = 'json-bool';
      else if (/null/.test(m)) cls = 'json-null';
      return `<span class="${cls}">${m}</span>`;
    });
}
function JsonViewer({ data }) {
  return <pre className="code-block" dangerouslySetInnerHTML={{ __html: jsonHighlight(data) }}/>;
}

// ── KV list ──
function KV({ rows }) {
  return (
    <dl className="kv">
      {rows.map(([k, v], i) => (<React.Fragment key={i}><dt>{k}</dt><dd>{v}</dd></React.Fragment>))}
    </dl>
  );
}

// ── Section card wrapper ──
function Card({ title, sub, icon, actions, children, flush, className = '', stale }) {
  return (
    <div className={`card hover-lift ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          <div>
            {title && <h3 className="card-title">{icon}{title}</h3>}
            {sub && <div className="card-sub">{sub}</div>}
          </div>
          <div className="flex items-center gap-8">
            {stale && <span className="stale-tag"><I.Clock size={11}/>agg. {stale}</span>}
            {actions}
          </div>
        </div>
      )}
      <div className={`card-body ${flush ? 'flush' : ''}`}>{children}</div>
    </div>
  );
}

Object.assign(window, {
  fmtRel, fmtClock, fmtDateTime, fmtNum, fmtMoney, fmtPct, fmtDelta, REF_NOW,
  StatusBadge, SeverityBadge, Aal, Delta, Kbd,
  Skeleton, SkeletonRows, EmptyState, ErrorState, Hydrate,
  ToastProvider, useToast, Modal, ConfirmModal, Drawer, JsonViewer, KV, Card,
});


// ===== charts.jsx =====

// ============== Laravel Rebel — animated SVG charts ==============

// ── Sparkline ──
function Sparkline({ data, color, height = 30, width = 84, fill = true }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = (max - min) || 1;
  const stepX = width / (data.length - 1 || 1);
  const pts = data.map((v, i) => [i * stepX, height - ((v - min) / range) * (height - 4) - 2]);
  const line = pts.map(p => p.join(',')).join(' ');
  const c = color || 'var(--accent)';
  const area = `0,${height} ${line} ${width},${height}`;
  const len = Math.round(pts.reduce((a, p, i) => i ? a + Math.hypot(p[0]-pts[i-1][0], p[1]-pts[i-1][1]) : 0, 0));
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {fill && <polygon points={area} fill={c} opacity="0.12"/>}
      <polyline className="draw-line" points={line} fill="none" stroke={c} strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" style={{ '--len': len }}/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2" fill={c}/>
    </svg>
  );
}

// ── Multi-series line/area chart with hover crosshair ──
function LineChart({ series, labels, height = 240, yFmt, area = true, animate = true }) {
  const wrapRef = React.useRef(null);
  const [W, setW] = React.useState(720);
  const [hover, setHover] = React.useState(null);
  const H = height, padL = 40, padR = 16, padT = 14, padB = 26;
  React.useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const all = series.flatMap(s => s.data);
  const maxV = Math.max(...all, 1) * 1.1;
  const n = labels.length;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const x = (i) => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v) => padT + plotH - (v / maxV) * plotH;
  const ticks = 4;

  const buildPath = (data) => data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const buildArea = (data) => `${buildPath(data)} L${x(data.length-1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let idx = Math.round(((px - padL) / plotW) * (n - 1));
    idx = Math.max(0, Math.min(n - 1, idx));
    setHover(idx);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <svg className="chart-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={si} id={`grad${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.color} stopOpacity="0.28"/>
              <stop offset="1" stopColor={s.color} stopOpacity="0"/>
            </linearGradient>
          ))}
        </defs>
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = (maxV / ticks) * i;
          return (
            <g key={i}>
              <line className="chart-grid-line" x1={padL} x2={W - padR} y1={y(v)} y2={y(v)}/>
              <text className="chart-axis-lbl" x={padL - 7} y={y(v) + 3} textAnchor="end">{yFmt ? yFmt(v) : Math.round(v)}</text>
            </g>
          );
        })}
        {labels.map((l, i) => ((n <= 12 || i % Math.ceil(n / 8) === 0) && (
          <text key={i} className="chart-axis-lbl" x={x(i)} y={H - 8} textAnchor="middle">{l}</text>
        )))}
        {series.map((s, si) => {
          const path = buildPath(s.data);
          const len = 1600;
          return (
            <g key={si}>
              {area && <path d={buildArea(s.data)} fill={`url(#grad${si})`}/>}
              <path className={animate ? 'draw-line' : ''} d={path} fill="none" stroke={s.color}
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ '--len': len }}/>
            </g>
          );
        })}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 3"/>
            {series.map((s, si) => <circle key={si} cx={x(hover)} cy={y(s.data[hover])} r="3.5" fill="var(--bg-elevated)" stroke={s.color} strokeWidth="2"/>)}
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="chart-tip" style={{ left: Math.min(W - 150, Math.max(0, x(hover) + 10)), top: padT }}>
          <div className="tip-t">{labels[hover]}</div>
          {series.map((s, si) => (
            <div key={si} className="tip-row">
              <span className="tip-k"><span className="lg-dot" style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: 'inline-block' }}/>{s.name}</span>
              <b>{yFmt ? yFmt(s.data[hover]) : fmtNum(s.data[hover])}</b>
            </div>
          ))}
        </div>
      )}
      <div className="chart-legend">
        {series.map((s, si) => (
          <span key={si} className="lg-item"><span className="lg-dot" style={{ background: s.color }}/>{s.name}</span>
        ))}
      </div>
    </div>
  );
}

// ── Bar chart (grouped/single, animated) ──
function BarChart({ data, labels, color, height = 200, yFmt, money }) {
  const wrapRef = React.useRef(null);
  const [W, setW] = React.useState(600);
  const [hover, setHover] = React.useState(null);
  React.useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el); setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const H = height, padL = 42, padR = 12, padT = 12, padB = 26;
  const maxV = Math.max(...data, 1) * 1.15;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const n = data.length;
  const bw = (plotW / n) * 0.6;
  const gap = (plotW / n);
  const y = (v) => padT + plotH - (v / maxV) * plotH;
  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <svg className="chart-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {Array.from({ length: 4 }).map((_, i) => {
          const v = (maxV / 4) * (i + 1) * (4 / 4);
          const vv = (maxV / 4) * i;
          return <g key={i}><line className="chart-grid-line" x1={padL} x2={W-padR} y1={y(vv)} y2={y(vv)}/><text className="chart-axis-lbl" x={padL-7} y={y(vv)+3} textAnchor="end">{yFmt ? yFmt(vv) : Math.round(vv)}</text></g>;
        })}
        {data.map((v, i) => {
          const bx = padL + gap * i + (gap - bw) / 2;
          const bh = (v / maxV) * plotH;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
              <rect className="bar-rise" x={bx} y={y(v)} width={bw} height={bh} rx="3" fill={color || 'var(--accent)'} opacity={hover === null || hover === i ? 1 : 0.45}/>
              <text className="chart-axis-lbl" x={bx + bw/2} y={H - 8} textAnchor="middle">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div className="chart-tip" style={{ left: Math.min(W-130, padL + gap*hover), top: padT }}>
          <div className="tip-t">{labels[hover]}</div>
          <div className="tip-row"><span className="tip-k">{money ? 'Costo' : 'Valore'}</span><b>{yFmt ? yFmt(data[hover]) : fmtNum(data[hover])}</b></div>
        </div>
      )}
    </div>
  );
}

// ── Funnel ──
function FunnelChart({ stages, terminalKey }) {
  const max = Math.max(...stages.map(s => s.count), 1);
  return (
    <div className="funnel">
      {stages.map((s, i) => {
        const w = (s.count / max) * 100;
        const prev = i > 0 ? stages[i-1].count : s.count;
        const drop = i > 0 ? (prev - s.count) / prev : 0;
        const isTerminal = terminalKey ? s.key === terminalKey : i === stages.length - 1;
        return (
          <div key={s.key} className={`funnel-stage ${isTerminal ? 'terminal' : ''}`}>
            <div className="funnel-meta">
              <span className="stage-name">{s.label}</span>
              <span className="flex items-center gap-12">
                <span className="stage-num">{fmtNum(s.count)}</span>
                {i > 0 && <span className={`funnel-drop ${drop < 0.05 ? 'ok' : ''}`}>−{(drop*100).toFixed(1)}%</span>}
              </span>
            </div>
            <div className="funnel-bar-track">
              <div className="funnel-bar" style={{ '--w': `${w}%`, '--d': `${i * 120}ms` }}>
                {fmtPct(s.count / max, 1)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Health gauge (semi-circular) ──
function HealthGauge({ value, max = 100, label, unit = '%', size = 96, thresholds }) {
  const r = size / 2 - 9;
  const circ = Math.PI * r; // semicircle
  const pct = Math.min(1, value / max);
  const offset = circ * (1 - pct);
  let color = 'var(--rebel-good)';
  if (thresholds) {
    if (value >= thresholds.bad) color = 'var(--rebel-bad)';
    else if (value >= thresholds.warn) color = 'var(--rebel-warn)';
  }
  const cx = size / 2, cy = size / 2 + 4;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  return (
    <div className="gauge" style={{ width: size, height: size * 0.66 }}>
      <svg width={size} height={size * 0.66} viewBox={`0 0 ${size} ${size * 0.66}`}>
        <path className="gauge-arc-bg" d={arc} fill="none" strokeWidth="8" stroke="var(--bg-subtle)"/>
        <path className="gauge-arc-fill" d={arc} fill="none" strokeWidth="8" stroke={color}
              strokeDasharray={circ} strokeDashoffset={offset}/>
      </svg>
      <div className="gauge-val">
        <div><b>{value}{unit}</b>{label && <small>{label}</small>}</div>
      </div>
    </div>
  );
}

// ── Donut ──
function Donut({ segments, size = 120, thickness = 16, center }) {
  const r = size / 2 - thickness / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-subtle)" strokeWidth={thickness}/>
      {segments.map((s, i) => {
        const frac = s.value / total;
        const dash = frac * circ;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-acc * circ} strokeLinecap="butt"/>
        );
        acc += frac;
        return el;
      })}
    </svg>
  );
}

Object.assign(window, { Sparkline, LineChart, BarChart, FunnelChart, HealthGauge, Donut });


// ===== shell.jsx =====

// ============== Laravel Rebel — shell: Sidebar · Topbar · Palette ==============

const NAV = [
  { group: 'Monitor', items: [
    { key: 'overview', label: 'Security Overview', icon: I.Overview, route: '/admin/rebel' },
    { key: 'funnels', label: 'OTP & Step-up', icon: I.Funnel, route: '/admin/rebel/funnels' },
    { key: 'channels', label: 'Channel Performance', icon: I.Channels, route: '/admin/rebel/channels' },
    { key: 'providers', label: 'Provider Health', icon: I.Providers, route: '/admin/rebel/providers' },
  ]},
  { group: 'Investigate', items: [
    { key: 'audit', label: 'Audit Explorer', icon: I.Audit, route: '/admin/rebel/audit' },
    { key: 'devices', label: 'Device & Session', icon: I.Devices, route: '/admin/rebel/devices' },
    { key: 'risk', label: 'Risk Rules', icon: I.Risk, route: '/admin/rebel/risk-rules' },
    { key: 'anomalies', label: 'Anomaly Detection', icon: I.Anomaly, route: '/admin/rebel/anomalies', badge: 4, alert: true },
  ]},
  { group: 'Intelligence', items: [
    { key: 'ai', label: 'AI Security Copilot', icon: I.AI, route: '/admin/rebel/ai' },
    { key: 'compliance', label: 'Compliance Center', icon: I.Compliance, route: '/admin/rebel/compliance' },
  ]},
];

function Sidebar({ route, onNavigate, collapsed, onToggle }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark"><BrandMark size={30}/></div>
        <div className="brand-text">
          <b>Laravel <em>Rebel</em></b>
          <small>Admin · Auth Orchestration</small>
        </div>
      </div>
      <button className="sidebar-collapse" onClick={onToggle} title="Comprimi sidebar"><I.ChevronsLeft size={13}/></button>
      <nav className="sidebar-nav">
        {NAV.map(sec => (
          <div className="nav-section" key={sec.group}>
            <div className="nav-label">{sec.group}</div>
            {sec.items.map(it => {
              const Ico = it.icon;
              return (
                <div key={it.key} className={`nav-item ${route === it.key ? 'active' : ''}`}
                     onClick={() => onNavigate(it.key)} title={it.label}>
                  <Ico className="icon" size={17}/>
                  <span>{it.label}</span>
                  {it.badge != null && <span className={`badge ${it.alert ? 'alert' : ''}`}>{it.badge}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar">MR</div>
          <div className="user-info">
            <b>Marco Rossi</b>
            <small>Security Admin · padosoft</small>
          </div>
        </div>
        <button className="iconbtn" title="Account"><I.ChevronDown size={14}/></button>
      </div>
    </aside>
  );
}

function Dropdown({ trigger, children, align = 'left', width = 240 }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div className="card" style={{ position: 'absolute', top: 'calc(100% + 6px)', [align]: 0, width, zIndex: 60, boxShadow: 'var(--shadow-lg)', animation: 'modalIn 120ms ease-out', padding: 6 }}
             onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

function TenantSwitcher({ tenant, onChange }) {
  const t = RebelData.tenants.find(x => x.id === tenant) || RebelData.tenants[0];
  return (
    <Dropdown width={264} trigger={
      <button className="ctrl">
        <span className="tenant-dot" style={{ background: t.color }}/>
        <span>{t.name}</span>
        <I.ChevronDown className="icon" size={14}/>
      </button>
    }>
      <div className="palette-section">Tenant</div>
      {RebelData.tenants.map(x => (
        <div key={x.id} className={`palette-item ${x.id === tenant ? 'active' : ''}`} onClick={() => onChange(x.id)}>
          <span className="tenant-dot" style={{ background: x.color, width: 9, height: 9, borderRadius: 2 }}/>
          <span>{x.name}</span>
          <span className="meta">{x.plan}</span>
        </div>
      ))}
    </Dropdown>
  );
}

function PeriodSelector({ period, onChange }) {
  return (
    <div className="seg">
      {Object.keys(RebelData.periods).map(k => (
        <button key={k} className={period === k ? 'active' : ''} onClick={() => onChange(k)}>{RebelData.periods[k].label}</button>
      ))}
    </div>
  );
}

function Topbar({ route, tenant, onTenant, period, onPeriod, theme, onTheme, onOpenPalette, autoRefresh, onAutoRefresh, lastTick, onAlerts, onMobileMenu }) {
  return (
    <header className="topbar">
      <button className="iconbtn" style={{ display: 'none' }} id="mobileMenuBtn" onClick={onMobileMenu}><I.Menu size={16}/></button>
      <img className="topbar-banner" src="assets/Laravel-Rebel-banner.png" alt="Laravel Rebel"
           style={{ display: 'var(--banner-disp, none)' }}/>
      <TenantSwitcher tenant={tenant} onChange={onTenant}/>
      <span className="ctrl-label" style={{ color: 'var(--text-tertiary)', fontSize: 11, fontWeight: 600 }}>Periodo</span>
      <PeriodSelector period={period} onChange={onPeriod}/>
      <div className="topbar-spacer"/>
      <span className="live-pill" title="Stato auto-refresh">
        <span className="pulse"/><span>Live</span>
        <span style={{ opacity: 0.75 }}>· {fmtClock(lastTick)}Z</span>
      </span>
      <button className="search-trigger" onClick={onOpenPalette}>
        <I.Search size={14}/><span>Cerca…</span><span className="kbd">⌘K</span>
      </button>
      <button className="iconbtn" onClick={() => onAutoRefresh(!autoRefresh)} title={autoRefresh ? 'Pausa auto-refresh' : 'Riprendi'}>
        {autoRefresh ? <I.Pause size={15}/> : <I.Play size={15}/>}
      </button>
      <button className="iconbtn" title="Anomalie aperte" onClick={onAlerts}>
        <I.Bell size={15}/><span className="ping"/>
      </button>
      <button className="iconbtn" onClick={() => onTheme(theme === 'dark' ? 'light' : 'dark')} title="Cambia tema">
        {theme === 'dark' ? <I.Sun size={15}/> : <I.Moon size={15}/>}
      </button>
    </header>
  );
}

function CommandPalette({ open, onClose, onNavigate }) {
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef(null);
  React.useEffect(() => { if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);

  const navItems = NAV.flatMap(s => s.items).map(it => ({
    kind: 'nav', label: it.label, icon: <it.icon size={15}/>, meta: it.route, action: () => onNavigate(it.key),
  }));
  const cases = RebelData.anomalyCases.map(c => ({
    kind: 'case', label: RebelData.anomalyTypes[c.type], icon: <I.Anomaly size={15}/>, meta: c.id, action: () => onNavigate('anomalies'),
  }));

  const results = React.useMemo(() => {
    const ql = q.toLowerCase();
    if (!ql) return [{ section: 'Sezioni', items: navItems }, { section: 'Anomalie aperte', items: cases.slice(0, 4) }];
    const nav = navItems.filter(i => i.label.toLowerCase().includes(ql));
    const cs = cases.filter(c => c.label.toLowerCase().includes(ql) || c.meta.includes(ql));
    const out = [];
    if (nav.length) out.push({ section: 'Sezioni', items: nav });
    if (cs.length) out.push({ section: 'Anomalie', items: cs });
    return out;
  }, [q]);
  const flat = results.flatMap(s => s.items);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(flat.length-1, a+1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a-1)); }
      else if (e.key === 'Enter') { e.preventDefault(); const it = flat[active]; if (it) { it.action(); onClose(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flat, active, onClose]);

  if (!open) return null;
  let idx = -1;
  return (
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="palette">
        <input ref={inputRef} className="palette-input" placeholder="Cerca sezioni, anomalie, subject…"
               value={q} onChange={e => { setQ(e.target.value); setActive(0); }}/>
        <div className="palette-list">
          {results.length === 0 && <div className="state"><b>Nessun risultato</b></div>}
          {results.map((sec, si) => (
            <div key={si}>
              <div className="palette-section">{sec.section}</div>
              {sec.items.map((it, ii) => {
                idx++;
                const a = idx;
                return (
                  <div key={ii} className={`palette-item ${a === active ? 'active' : ''}`}
                       onMouseEnter={() => setActive(a)} onClick={() => { it.action(); onClose(); }}>
                    <span className="icon">{it.icon}</span><span>{it.label}</span>
                    {it.meta && <span className="meta">{it.meta}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span><Kbd>↑↓</Kbd> Naviga</span><span><Kbd>↵</Kbd> Apri</span><span><Kbd>esc</Kbd> Chiudi</span>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { Sidebar, Topbar, CommandPalette, TenantSwitcher, PeriodSelector, Dropdown, NAV });


// ===== pages-monitor.jsx =====

// ============== Laravel Rebel — pages: Monitor group ==============

function PageHead({ crumb, title, sub, badge, actions }) {
  return (
    <div className="page-head">
      <div>
        <div className="crumbs"><b>Laravel Rebel</b><span className="sep"><I.ChevronRight size={12}/></span><span>{crumb}</span></div>
        <h1 className="page-title">{title}{badge}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

function ExportBtn({ onExport }) {
  return <button className="btn" onClick={onExport}><I.Download className="icon"/>Export</button>;
}

function KpiCard({ label, value, suffix, icon, intent, delta, deltaInvert, rate, spark }) {
  const Ico = icon;
  const sparkColor = intent === 'bad' ? 'var(--rebel-bad)' : intent === 'good' ? 'var(--rebel-good)' : intent === 'info' ? 'var(--rebel-info)' : 'var(--text-tertiary)';
  return (
    <div className={`kpi intent-${intent || 'neutral'}`}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-ico"><Ico size={15}/></span>
      </div>
      <div className="kpi-value">{value}{suffix && <small>{suffix}</small>}</div>
      <div className="kpi-foot">
        {delta != null && <Delta pct={delta} invert={deltaInvert}/>}
        {rate != null && <span className="kpi-rate">rate {fmtPct(rate)}</span>}
      </div>
      {spark && <div className="kpi-spark"><Sparkline data={spark} color={sparkColor}/></div>}
    </div>
  );
}

// ── 3.1 Security Overview ──
function OverviewPage({ ctx }) {
  const { tenant, period, lastTick } = ctx;
  const data = React.useMemo(() => RebelData.overview(period), [period, tenant]);
  const k = data.kpis;
  const labels = data.ts.map(r => r.label);
  return (
    <div className="page fade-in">
      <PageHead crumb="Security Overview" title="Security Overview"
                sub="Colpo d'occhio sullo stato di sicurezza dell'autenticazione nel periodo selezionato."
                actions={<><button className="btn"><I.Refresh className="icon"/>Aggiorna</button><ExportBtn onExport={() => ctx.toast({ kind: 'info', title: 'Export avviato', body: 'Job in coda · CSV' })}/></>}/>

      <Hydrate deps={[tenant, period]} delay={500} skeleton={<div className="grid c4">{Array.from({length:6}).map((_,i)=><div key={i} className="skel skel-kpi"/>)}</div>}>
        <div className="grid c4 stagger" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          <KpiCard label="Login requests" value={fmtNum(k.login_requests.value)} icon={I.User} intent="neutral" delta={k.login_requests.delta_pct} spark={k.login_requests.spark}/>
          <KpiCard label="OTP sent" value={fmtNum(k.otp_sent.value)} icon={I.Send} intent="info" delta={k.otp_sent.delta_pct} spark={k.otp_sent.spark}/>
          <KpiCard label="OTP verified" value={fmtNum(k.otp_verified.value)} icon={I.CheckCircle} intent="good" delta={k.otp_verified.delta_pct} rate={k.otp_verified.rate} spark={k.otp_verified.spark}/>
          <KpiCard label="Step-up required" value={fmtNum(k.step_up_required.value)} icon={I.Shield} intent="neutral" delta={k.step_up_required.delta_pct} spark={k.step_up_required.spark}/>
          <KpiCard label="Step-up verified" value={fmtNum(k.step_up_verified.value)} icon={I.Key} intent="good" delta={k.step_up_verified.delta_pct} rate={k.step_up_verified.rate} spark={k.step_up_verified.spark}/>
          <KpiCard label="High-risk events" value={fmtNum(k.high_risk_events.value)} icon={I.AlertTriangle} intent="bad" delta={k.high_risk_events.delta_pct} deltaInvert spark={k.high_risk_events.spark}/>
        </div>
      </Hydrate>

      <div className="grid section-gap" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        <Card title="Eventi nel tempo" icon={<I.Activity size={15}/>} sub={`Granularità ${RebelData.periods[period].granularity}`} stale="09:58">
          <Hydrate deps={[tenant, period]} delay={550} skeleton={<div className="skel skel-chart"/>}>
            <LineChart labels={labels} height={250}
              series={[
                { name: 'Login', color: 'var(--rebel-info)', data: data.ts.map(r => r.logins) },
                { name: 'OTP verified', color: 'var(--rebel-good)', data: data.ts.map(r => r.otp_verified) },
                { name: 'High-risk', color: 'var(--rebel-bad)', data: data.ts.map(r => r.high_risk) },
              ]}/>
          </Hydrate>
        </Card>
        <Card title="Funnel autenticazione" icon={<I.Funnel size={15}/>} sub="Login → autenticato">
          <Hydrate deps={[tenant, period]} delay={620} skeleton={<div style={{padding:8}}>{Array.from({length:5}).map((_,i)=><div key={i} className="skel skel-line" style={{height:38,margin:'8px 0'}}/>)}</div>}>
            <FunnelChart stages={data.funnel} terminalKey="authenticated"/>
          </Hydrate>
        </Card>
      </div>

      <div className="grid c2 section-gap">
        <Card title="Top anomalie aperte" icon={<I.Anomaly size={15}/>} flush
              actions={<button className="btn sm ghost" onClick={() => ctx.go('anomalies')}>Vedi tutte<I.ArrowRight className="icon"/></button>}>
          <Hydrate deps={[tenant]} delay={480} skeleton={<SkeletonRows rows={4} cols={3}/>}>
            <table className="tbl">
              <thead><tr><th>Tipo</th><th>Severity</th><th>Eventi</th><th>Aperto</th><th></th></tr></thead>
              <tbody>
                {RebelData.openAnomalies.map(a => (
                  <tr key={a.id} className="clickable" onClick={() => ctx.go('anomalies')}>
                    <td><div className="cell-main">{RebelData.anomalyTypes[a.type]}</div><div className="cell-sub mono">{a.id}</div></td>
                    <td><SeverityBadge severity={a.severity}/></td>
                    <td className="num">{fmtNum(a.events)}</td>
                    <td className="muted">{fmtRel(a.opened_at)}</td>
                    <td><I.ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Hydrate>
        </Card>

        <Card title="Provider health" icon={<I.Providers size={15}/>} sub="Stato delivery in tempo (quasi) reale"
              actions={<button className="btn sm ghost" onClick={() => ctx.go('providers')}>Dettagli<I.ArrowRight className="icon"/></button>}>
          <Hydrate deps={[tenant]} delay={520} skeleton={<div className="skel skel-line" style={{height:120}}/>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {RebelData.providers.map(p => (
                <div key={p.key} className="flex items-center between" style={{ gap: 12 }}>
                  <div className="flex items-center gap-8">
                    <span className={`badge ${p.status}`}><span className="dot"/></span>
                    <div><div className="cell-main">{p.name}</div><div className="cell-sub mono">{p.kind}</div></div>
                  </div>
                  <div className="flex items-center gap-12">
                    <div style={{ width: 90 }}><Sparkline data={p.spark} width={90} height={22} color={p.status==='down'?'var(--rebel-bad)':p.status==='degraded'?'var(--rebel-warn)':'var(--rebel-good)'}/></div>
                    <span className="mono tnum" style={{ fontSize: 12, width: 54, textAlign: 'right', color: 'var(--text-secondary)' }}>{p.uptime}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Hydrate>
        </Card>
      </div>
    </div>
  );
}

// ── 3.2 OTP & Step-up Funnel ──
function FunnelsPage({ ctx }) {
  const { tenant, period } = ctx;
  const [channel, setChannel] = React.useState('all');
  const data = React.useMemo(() => RebelData.overview(period), [period, tenant]);
  const otpFunnel = [
    { key: 'start', label: 'Start', count: data.funnel[0].count },
    { key: 'sent', label: 'OTP sent', count: data.funnel[1].count },
    { key: 'delivered', label: 'Delivered', count: data.funnel[2].count },
    { key: 'verified', label: 'Verified', count: data.funnel[3].count },
    { key: 'login', label: 'Login', count: Math.round(data.funnel[3].count * 0.973) },
  ];
  const suChallenged = RebelData.stepUpByPurpose.reduce((a,r)=>a+r.challenged,0);
  const suRequired = RebelData.stepUpByPurpose.reduce((a,r)=>a+r.required,0);
  const suVerified = RebelData.stepUpByPurpose.reduce((a,r)=>a+r.verified,0);
  return (
    <div className="page fade-in">
      <PageHead crumb="OTP & Step-up Funnel" title="OTP & Step-up Funnel"
                sub="Conversione del login passwordless e dello step-up, con drop a ogni stadio."
                actions={<ExportBtn onExport={() => ctx.toast({ kind: 'info', title: 'Export avviato' })}/>}/>
      <div className="filter-bar">
        <span className="tertiary" style={{ fontSize: 11.5, fontWeight: 600 }}>Channel:</span>
        {['all','email','sms','whatsapp','voice'].map(c => (
          <button key={c} className={`chip ${channel===c?'active':''}`} onClick={() => setChannel(c)}>{c === 'all' ? 'Tutti' : c}</button>
        ))}
      </div>
      <div className="grid c2">
        <Card title="Funnel OTP" icon={<I.Funnel size={15}/>} sub={`resend rate 12% · channel: ${channel}`}>
          <Hydrate deps={[tenant, period, channel]} delay={500} skeleton={<div style={{padding:8}}>{Array.from({length:5}).map((_,i)=><div key={i} className="skel skel-line" style={{height:38,margin:'8px 0'}}/>)}</div>}>
            <FunnelChart stages={otpFunnel}/>
          </Hydrate>
        </Card>
        <Card title="Funnel Step-up" icon={<I.Shield size={15}/>} sub="required → challenged → verified">
          <Hydrate deps={[tenant, period]} delay={560} skeleton={<div style={{padding:8}}>{Array.from({length:3}).map((_,i)=><div key={i} className="skel skel-line" style={{height:38,margin:'8px 0'}}/>)}</div>}>
            <FunnelChart stages={[
              { key: 'required', label: 'Required', count: suRequired },
              { key: 'challenged', label: 'Challenged', count: suChallenged },
              { key: 'verified', label: 'Verified', count: suVerified },
            ]}/>
          </Hydrate>
        </Card>
      </div>
      <Card className="section-gap" title="Breakdown per purpose" icon={<I.FileText size={15}/>} flush
            sub="Click su una riga per drill-down nell'Audit Explorer filtrato">
        <Hydrate deps={[tenant, period]} delay={600} skeleton={<SkeletonRows rows={5} cols={5}/>}>
          <table className="tbl">
            <thead><tr><th>Purpose</th><th className="num">Required</th><th className="num">Verified</th><th>Conversion</th><th>Assurance media</th></tr></thead>
            <tbody>
              {RebelData.stepUpByPurpose.map(r => (
                <tr key={r.purpose} className="clickable" onClick={() => ctx.go('audit')}>
                  <td className="mono">{r.purpose}</td>
                  <td className="num">{fmtNum(r.required)}</td>
                  <td className="num">{fmtNum(r.verified)}</td>
                  <td><div className="bar-cell"><div className={`minibar ${r.rate<0.85?'warn':''}`}><i style={{ width: `${r.rate*100}%` }}/></div><span className="mono" style={{ width: 44 }}>{fmtPct(r.rate)}</span></div></td>
                  <td><Aal level={r.aal}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Hydrate>
      </Card>
    </div>
  );
}

// ── 3.3 Channel Performance ──
function ChannelsPage({ ctx }) {
  const { tenant, period } = ctx;
  const ch = RebelData.channels;
  return (
    <div className="page fade-in">
      <PageHead crumb="Channel Performance" title="Channel Performance"
                sub="Performance, costo e affidabilità dei canali di delivery OTP."
                actions={<ExportBtn onExport={() => ctx.toast({ kind: 'info', title: 'Export avviato' })}/>}/>
      <div className="grid c2">
        <Card title="Costo per canale" icon={<I.Dollar size={15}/>} sub="periodo corrente · EUR">
          <Hydrate deps={[tenant, period]} delay={480} skeleton={<div className="skel skel-chart"/>}>
            <BarChart data={ch.map(c=>c.cost)} labels={ch.map(c=>c.provider.split(' ')[0])} color="var(--accent)" height={210} money yFmt={(v)=>'€'+Math.round(v)}/>
          </Hydrate>
        </Card>
        <Card title="Delivery rate nel tempo" icon={<I.TrendingUp size={15}/>} sub="ultimi 7 giorni · %">
          <Hydrate deps={[tenant, period]} delay={540} skeleton={<div className="skel skel-chart"/>}>
            <LineChart labels={['Lun','Mar','Mer','Gio','Ven','Sab','Dom']} height={210} yFmt={(v)=>v.toFixed(0)+'%'}
              series={[
                { name: 'Email', color: 'var(--rebel-info)', data: RebelData.channelTrend.email },
                { name: 'SMS', color: 'var(--rebel-good)', data: RebelData.channelTrend.sms },
                { name: 'WhatsApp', color: 'var(--accent)', data: RebelData.channelTrend.whatsapp },
                { name: 'Voice', color: 'var(--rebel-warn)', data: RebelData.channelTrend.voice },
              ]}/>
          </Hydrate>
        </Card>
      </div>
      <Card className="section-gap" title="Performance canali" icon={<I.Channels size={15}/>} flush>
        <Hydrate deps={[tenant, period]} delay={600} skeleton={<SkeletonRows rows={5} cols={7}/>}>
          <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Canale</th><th>Provider</th><th className="num">Inviati</th><th>Delivered</th><th className="num">Fallback</th><th className="num">p50 / p95</th><th className="num">Costo</th><th>Conversion</th></tr></thead>
            <tbody>
              {ch.map((c, i) => {
                const chIco = { email: I.Mail, sms: I.MessageSquare, whatsapp: I.Phone, voice: I.Mic }[c.channel];
                const ChI = chIco || I.Send;
                return (
                  <tr key={i}>
                    <td><span className="flex items-center gap-8"><ChI size={14} style={{ color: 'var(--text-tertiary)' }}/><span className="cell-main" style={{ textTransform: 'capitalize' }}>{c.channel}</span>{c.fraud && <span className="badge failed" title="Toll-fraud sospetto"><I.AlertTriangle size={10}/>fraud</span>}</span></td>
                    <td className="muted">{c.provider}</td>
                    <td className="num">{fmtNum(c.sent)}</td>
                    <td><div className="bar-cell"><div className={`minibar ${c.delivered<0.95?'warn':''} ${c.delivered<0.9?'bad':''}`}><i style={{ width: `${c.delivered*100}%` }}/></div><span className="mono" style={{ width: 48 }}>{fmtPct(c.delivered)}</span></div></td>
                    <td className="num">{fmtPct(c.fallback)}</td>
                    <td className="num">{c.p50}ms / {c.p95}ms</td>
                    <td className="num">{fmtMoney(c.cost, c.cur)}</td>
                    <td><div className="bar-cell"><div className={`minibar ${c.conv<0.6?'warn':''} ${c.conv<0.5?'bad':''}`}><i style={{ width: `${c.conv*100}%` }}/></div><span className="mono" style={{ width: 44 }}>{fmtPct(c.conv)}</span></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </Hydrate>
      </Card>
    </div>
  );
}

// ── 3.4 Provider Health ──
function ProvidersPage({ ctx }) {
  const { tenant, lastTick } = ctx;
  return (
    <div className="page fade-in">
      <PageHead crumb="Provider Health" title="Provider Health"
                sub="Stato in tempo (quasi) reale dei provider di delivery e autenticazione."
                badge={<span className="live-pill" style={{ marginLeft: 4 }}><span className="pulse"/>auto 30s</span>}
                actions={<button className="btn"><I.Refresh className="icon"/>Check now</button>}/>
      <Hydrate deps={[tenant]} delay={500} skeleton={<div className="prov-grid">{Array.from({length:6}).map((_,i)=><div key={i} className="skel skel-kpi" style={{height:180}}/>)}</div>}>
        <div className="prov-grid stagger">
          {RebelData.providers.map(p => {
            const gThresh = { warn: 1000, bad: 3000 };
            return (
              <div key={p.key} className="card prov-card hover-lift">
                <div className="prov-head">
                  <div className="prov-logo">{p.name.slice(0,2)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="prov-name">{p.name}</div>
                    <div className="prov-meta">{p.kind}</div>
                  </div>
                  <StatusBadge status={p.status}/>
                </div>
                <div className="gauge-wrap">
                  <HealthGauge value={p.p95} max={10000} unit="" label="p95 ms" thresholds={gThresh} size={92}/>
                  <div style={{ flex: 1 }}>
                    <Sparkline data={p.spark} width={140} height={42} color={p.status==='down'?'var(--rebel-bad)':p.status==='degraded'?'var(--rebel-warn)':'var(--rebel-good)'}/>
                    <div className="prov-meta" style={{ marginTop: 4 }}>checked {fmtRel(p.checked)}</div>
                  </div>
                </div>
                <div className="prov-stats">
                  <div className="prov-stat"><small>Uptime</small><b>{p.uptime}%</b></div>
                  <div className="prov-stat"><small>Error rate</small><b style={{ color: p.error_rate>0.05?'var(--rebel-bad)':p.error_rate>0.01?'var(--rebel-warn)':'inherit' }}>{(p.error_rate*100).toFixed(2)}%</b></div>
                  <div className="prov-stat"><small>p50</small><b>{p.p50}ms</b></div>
                </div>
              </div>
            );
          })}
        </div>
      </Hydrate>

      <div className="grid c2 section-gap">
        <Card title="Errori normalizzati" icon={<I.AlertCircle size={15}/>} flush>
          <table className="tbl">
            <thead><tr><th>Provider</th><th>Codice</th><th>Descrizione</th><th className="num">Count</th></tr></thead>
            <tbody>
              {RebelData.providers.flatMap(p => p.errors.map((e,i) => (
                <tr key={p.key+i}><td className="muted">{p.name}</td><td className="mono">{e.code}</td><td>{e.message}</td><td className="num">{e.count}</td></tr>
              )))}
            </tbody>
          </table>
        </Card>
        <Card title="Timeline incidenti" icon={<I.History size={15}/>}>
          <div className="timeline">
            {RebelData.incidents.map((inc, i) => (
              <div key={i} className="tl-item">
                <div className="tl-rail"><div className={`tl-node ${inc.sev}`}/><div className="tl-line"/></div>
                <div className="tl-body">
                  <div className="tl-time">{fmtDateTime(inc.t)}Z · {inc.provider}</div>
                  <div className="tl-event">{inc.event}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

Object.assign(window, { PageHead, ExportBtn, KpiCard, OverviewPage, FunnelsPage, ChannelsPage, ProvidersPage });


// ===== pages-investigate.jsx =====

// ============== Laravel Rebel — pages: Investigate group ==============

// ── 3.5 Audit Explorer ──
function AuditPage({ ctx }) {
  const { tenant, period } = ctx;
  const [evType, setEvType] = React.useState('all');
  const [guard, setGuard] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [limit, setLimit] = React.useState(15);
  const [sort, setSort] = React.useState({ key: 'created_at', dir: 'desc' });
  const [selected, setSelected] = React.useState(null);
  const all = React.useMemo(() => RebelData.auditEvents(tenant.length + period.length, 40), [tenant, period]);

  const filtered = all.filter(e =>
    (evType === 'all' || e.event_type === evType) &&
    (guard === 'all' || e.guard === guard) &&
    (!query || e.subject.masked.includes(query) || e.id.includes(query) || (e.ip_masked||'').includes(query))
  ).sort((a, b) => {
    const m = sort.dir === 'asc' ? 1 : -1;
    if (sort.key === 'risk_score') return (a.risk_score - b.risk_score) * m;
    return (new Date(a.created_at) - new Date(b.created_at)) * m;
  });
  const rows = filtered.slice(0, limit);

  const Th = ({ k, children, num }) => (
    <th className={`sortable ${num ? 'num' : ''}`} onClick={() => setSort(s => ({ key: k, dir: s.key === k && s.dir === 'desc' ? 'asc' : 'desc' }))}>
      {children}{sort.key === k && <span className="sort-ico">{sort.dir === 'desc' ? '▾' : '▴'}</span>}
    </th>
  );

  return (
    <div className="page fade-in">
      <PageHead crumb="Audit Explorer" title="Audit Explorer"
                sub="Ricerca e ispezione degli eventi di autenticazione. Metadata sanitizzata — nessun OTP o secret."
                actions={<ExportBtn onExport={() => ctx.toast({ kind: 'info', title: 'Export avviato', body: 'Job asincrono · 202 queued' })}/>}/>

      <Card flush>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-trigger" style={{ width: 260, cursor: 'text' }}>
            <I.Search size={14}/>
            <input className="input" style={{ border: 0, padding: 0, height: 'auto', background: 'transparent' }}
                   placeholder="subject, evt_id, ip…" value={query} onChange={e => { setQuery(e.target.value); setLimit(15); }}/>
          </div>
          <select className="select" style={{ width: 200 }} value={evType} onChange={e => { setEvType(e.target.value); setLimit(15); }}>
            <option value="all">Tutti gli event type</option>
            {RebelData.eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="select" style={{ width: 150 }} value={guard} onChange={e => { setGuard(e.target.value); setLimit(15); }}>
            <option value="all">Tutti i guard</option>
            {RebelData.guards.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <span className="tertiary mono" style={{ marginLeft: 'auto', fontSize: 11.5 }}>{filtered.length} eventi</span>
        </div>

        <Hydrate deps={[tenant, period, evType, guard, query]} delay={420} skeleton={<SkeletonRows rows={8} cols={6}/>}
                 isEmpty={filtered.length === 0} empty={<EmptyState icon={<I.Audit size={20}/>} title="Nessun evento per i filtri" hint="Modifica i filtri o allarga il periodo." cta={<button className="btn sm" onClick={() => { setEvType('all'); setGuard('all'); setQuery(''); }}>Reset filtri</button>}/>}>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr>
                <Th k="created_at">Timestamp</Th><th>Event type</th><th>Subject</th><th>AAL / AMR</th><th>Channel</th><th>Purpose</th><Th k="risk_score" num>Risk</Th><th>IP</th>
              </tr></thead>
              <tbody>
                {rows.map(e => (
                  <tr key={e.id} className="clickable" onClick={() => setSelected(e)}>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(e.created_at)}<span className="cell-sub">{fmtRel(e.created_at)}</span></td>
                    <td><span className="flex items-center gap-8">{e.outcome==='failed' ? <I.XCircle size={13} style={{color:'var(--rebel-bad)'}}/> : <I.CheckCircle size={13} style={{color:'var(--rebel-good)'}}/>}<span className="mono" style={{ fontSize: 11.5 }}>{e.event_type}</span></span></td>
                    <td className="mono muted">{e.subject.masked}</td>
                    <td><span className="flex items-center gap-8"><Aal level={e.aal}/><span className="cell-sub mono">{e.amr.join('·')}</span></span></td>
                    <td className="muted">{e.channel || '—'}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{e.purpose}</td>
                    <td className="num"><span style={{ fontWeight: 700, color: e.risk_score>70?'var(--rebel-bad)':e.risk_score>40?'var(--rebel-warn)':'var(--text-secondary)' }}>{e.risk_score}</span></td>
                    <td className="mono muted">{e.ip_masked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <span>Mostro {rows.length} di {filtered.length} · cursor pagination</span>
            {limit < filtered.length && <button className="btn sm" onClick={() => setLimit(l => l + 15)}>Load more<I.ChevronDown className="icon"/></button>}
          </div>
        </Hydrate>
      </Card>

      <Drawer open={!!selected} onClose={() => setSelected(null)} icon={<I.Audit size={16}/>} title={selected?.id}
              footer={<><button className="btn" onClick={() => { navigator.clipboard?.writeText(selected.id); ctx.toast({kind:'success',title:'ID copiato'}); }}><I.Copy className="icon"/>Copia ID</button><button className="btn primary" onClick={() => setSelected(null)}>Chiudi</button></>}>
        {selected && (<>
          <div className="drawer-section">
            <h5>Evento</h5>
            <KV rows={[
              ['Event type', <span className="mono">{selected.event_type}</span>],
              ['Esito', <StatusBadge status={selected.outcome === 'failed' ? 'failed' : 'verified'}/>],
              ['Timestamp', <span className="mono">{fmtDateTime(selected.created_at)}Z</span>],
              ['Guard', selected.guard],
              ['Purpose', <span className="mono">{selected.purpose}</span>],
            ]}/>
          </div>
          <div className="drawer-section">
            <h5>Assurance & rischio</h5>
            <div className="flex items-center gap-12" style={{ marginBottom: 12 }}>
              <Aal level={selected.aal}/>
              <span className="mono cell-sub">amr: {selected.amr.join(', ')}</span>
              <span className="badge outline" style={{ marginLeft: 'auto' }}>risk {selected.risk_score}/100</span>
            </div>
            <div className="minibar" style={{ height: 7 }}><i className={selected.risk_score>70?'':''} style={{ width: `${selected.risk_score}%`, background: selected.risk_score>70?'var(--rebel-bad)':selected.risk_score>40?'var(--rebel-warn)':'var(--rebel-good)' }}/></div>
          </div>
          <div className="drawer-section">
            <h5>Contesto (sanitizzato)</h5>
            <KV rows={[
              ['Subject', <span className="mono">{selected.subject.masked}</span>],
              ['IP', <span className="mono">{selected.ip_masked}</span>],
              ['Country', selected.country],
              ['User-Agent', selected.ua],
            ]}/>
          </div>
          <div className="drawer-section">
            <h5>Metadata raw</h5>
            <JsonViewer data={{ id: selected.id, event_type: selected.event_type, guard: selected.guard, subject: selected.subject, aal: selected.aal, amr: selected.amr, channel: selected.channel, purpose: selected.purpose, risk_score: selected.risk_score, ip_masked: selected.ip_masked }}/>
          </div>
        </>)}
      </Drawer>
    </div>
  );
}

// ── 3.6 Device & Session Trust ──
function DevicesPage({ ctx }) {
  const [subject, setSubject] = React.useState(RebelData.subjectSearch[0]);
  const [confirm, setConfirm] = React.useState(null);
  const [devices, setDevices] = React.useState(RebelData.devices);
  const [sessions, setSessions] = React.useState(RebelData.sessions);

  const doAction = (note) => {
    if (!confirm) return;
    if (confirm.kind === 'revoke-session') setSessions(s => s.map(x => x.id === confirm.id ? { ...x, status: 'revoked' } : x));
    if (confirm.kind === 'logout-all') setSessions(s => s.map(x => ({ ...x, status: x.current ? x.status : 'revoked' })));
    if (confirm.kind === 'untrust') setDevices(d => d.map(x => x.id === confirm.id ? { ...x, trusted: false, until: null } : x));
    ctx.toast({ kind: 'success', title: 'Azione eseguita', body: confirm.label });
    setConfirm(null);
  };

  return (
    <div className="page fade-in">
      <PageHead crumb="Device & Session Trust" title="Device & Session Trust"
                sub="Dispositivi e sessioni di un subject, gestione trust e revoca."/>
      <div className="filter-bar">
        <div className="search-trigger" style={{ width: 300, cursor: 'text' }}>
          <I.Search size={14}/><input className="input" style={{ border: 0, padding: 0, height: 'auto', background: 'transparent' }} placeholder="Cerca subject (email mascherata / id)…" defaultValue={subject.masked}/>
        </div>
        {RebelData.subjectSearch.map(s => (
          <button key={s.id} className={`chip ${subject.id===s.id?'active':''}`} onClick={() => setSubject(s)}>{s.masked} <span className="count">{s.devices}d·{s.sessions}s</span></button>
        ))}
      </div>

      <div className="grid c2">
        <Card title="Dispositivi" icon={<I.Devices size={15}/>} sub={`${devices.length} device per ${subject.masked}`} flush>
          <Hydrate deps={[subject]} delay={420} skeleton={<SkeletonRows rows={3} cols={3}/>}>
            <div style={{ padding: '4px 0' }}>
              {devices.map(d => (
                <div key={d.id} style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="kpi-ico" style={{ background: d.flagged ? 'var(--rebel-red-bg)' : 'var(--bg-subtle)', color: d.flagged ? 'var(--accent)' : 'var(--text-secondary)' }}>{d.os.includes('iOS')||d.os.includes('Android')?<I.Smartphone size={15}/>:<I.Devices size={15}/>}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-8"><span className="cell-main">{d.os} · {d.browser}</span>{d.current && <span className="badge active" style={{ fontSize: 10 }}>current</span>}{d.flagged && <span className="badge failed" style={{ fontSize: 10 }}><I.AlertTriangle size={9}/>flagged</span>}</div>
                    <div className="cell-sub mono">{d.fp} · {d.loc} · {fmtRel(d.last_seen)}</div>
                  </div>
                  <div className="flex items-center gap-8">
                    {d.trusted ? <span className="badge trusted" title={`Fino al ${d.until}`}><I.Check size={10}/>trusted</span> : <span className="badge neutral">untrusted</span>}
                    {d.trusted && <button className="btn sm ghost" title="Revoca trust" onClick={() => setConfirm({ kind: 'untrust', id: d.id, label: `Revoca trust device ${d.fp}` })}><I.Ban size={13}/></button>}
                  </div>
                </div>
              ))}
            </div>
          </Hydrate>
        </Card>

        <Card title="Sessioni" icon={<I.Activity size={15}/>} sub="session · refresh token"
              actions={<button className="btn sm danger" onClick={() => setConfirm({ kind: 'logout-all', label: 'Logout everywhere (tutte le sessioni tranne la corrente)' })}><I.Logout size={13}/>Logout everywhere</button>} flush>
          <Hydrate deps={[subject]} delay={480} skeleton={<SkeletonRows rows={4} cols={3}/>}>
            <table className="tbl">
              <thead><tr><th>Sessione</th><th>Tipo</th><th>Stato</th><th>Scadenza</th><th></th></tr></thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td className="mono">{s.id}{s.current && <span className="cell-sub">questa sessione</span>}</td>
                    <td><span className="badge outline">{s.type}</span></td>
                    <td>{s.status === 'reuse-detected' ? <span className="badge failed"><I.AlertTriangle size={10}/>reuse</span> : <StatusBadge status={s.status}/>}</td>
                    <td className="mono muted">{fmtDateTime(s.expires)}</td>
                    <td>{s.status === 'active' && !s.current && <button className="btn sm ghost" onClick={() => setConfirm({ kind: 'revoke-session', id: s.id, label: `Revoca sessione ${s.id}` })}>Revoca</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Hydrate>
        </Card>
      </div>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doAction}
                    danger requireNote
                    title={confirm?.label}
                    confirmLabel="Conferma azione"
                    body="Questa azione modifica lo stato di trust/sessione del subject e sarà registrata nell'audit log con la tua identità."/>
    </div>
  );
}

// ── 3.7 Risk Rules + Simulator ──
function RiskPage({ ctx }) {
  const [signals, setSignals] = React.useState({ new_device: true, amount: 1500, country: 'IT', b2b_credit: false, velocity: 60 });
  const set = (k, v) => setSignals(s => ({ ...s, [k]: v }));
  const result = RebelData.simulate(signals);
  const decisionLabel = { allow: 'Allow', require_step_up: 'Step-up richiesto', block: 'Block' }[result.decision];
  const decisionIco = { allow: <I.CheckCircle size={20}/>, require_step_up: <I.Shield size={20}/>, block: <I.Ban size={20}/> }[result.decision];

  return (
    <div className="page fade-in">
      <PageHead crumb="Risk Rules" title="Risk Rules"
                sub="Visualizza e simula le regole di rischio. La simulazione è read-only e sicura — le regole si salvano come draft."
                actions={<button className="btn"><I.Plus className="icon"/>Nuova regola (draft)</button>}/>

      <div className="notice info" style={{ marginBottom: 16 }}><I.Info size={15} className="icon"/>Le modifiche alle regole non vengono mai applicate al volo: si salvano come <b style={{margin:'0 4px'}}>draft</b> e richiedono un permesso elevato per l'attivazione.</div>

      <div className="sim-grid">
        <Card title="Simulatore decisione" icon={<I.Sliders size={15}/>} sub="Modifica i segnali in input — l'esito si aggiorna in tempo reale">
          <div className="sim-input-row">
            <div><div className="lbl">Dispositivo nuovo</div><div className="hint">new_device = true se non trusted</div></div>
            <button className="toggle" data-on={signals.new_device?'1':'0'} onClick={() => set('new_device', !signals.new_device)}><i/></button>
          </div>
          <div className="sim-input-row">
            <div><div className="lbl">Importo transazione</div><div className="hint">amount (EUR)</div></div>
            <div className="range-wrap"><input className="range" type="range" min="0" max="5000" step="50" value={signals.amount} onChange={e => set('amount', +e.target.value)}/><span className="mono" style={{ width: 64, textAlign: 'right', fontWeight: 600 }}>€{fmtNum(signals.amount)}</span></div>
          </div>
          <div className="sim-input-row">
            <div><div className="lbl">Ordine a credito B2B</div><div className="hint">b2b_credit</div></div>
            <button className="toggle" data-on={signals.b2b_credit?'1':'0'} onClick={() => set('b2b_credit', !signals.b2b_credit)}><i/></button>
          </div>
          <div className="sim-input-row">
            <div><div className="lbl">Paese</div><div className="hint">country (ISO)</div></div>
            <select className="select" style={{ width: 120 }} value={signals.country} onChange={e => set('country', e.target.value)}>
              {['IT','DE','FR','CH','NG','RO','BY'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="sim-input-row">
            <div><div className="lbl">Velocity</div><div className="hint">km/h tra login consecutivi</div></div>
            <div className="range-wrap"><input className="range" type="range" min="0" max="2000" step="10" value={signals.velocity} onChange={e => set('velocity', +e.target.value)}/><span className="mono" style={{ width: 64, textAlign: 'right', fontWeight: 600 }}>{fmtNum(signals.velocity)}</span></div>
          </div>
        </Card>

        <div className={`sim-outcome decision-${result.decision}`}>
          <div className="sim-decision">
            <span className="d-ico">{decisionIco}</span>
            <div>{decisionLabel}<div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: 0 }}>decision</div></div>
          </div>
          <div className="divider"/>
          <div className="grid c2" style={{ gap: 10, marginBottom: 14 }}>
            <div><div className="kpi-label">Required assurance</div><div style={{ marginTop: 6 }}><Aal level={result.required_assurance}/></div></div>
            <div><div className="kpi-label">Phishing-resistant</div><div style={{ marginTop: 6 }}>{result.require_phishing_resistant ? <span className="badge verified"><I.Check size={10}/>richiesto</span> : <span className="badge neutral">no</span>}</div></div>
          </div>
          <div className="kpi-label" style={{ marginBottom: 7 }}>Driver ammessi</div>
          <div style={{ marginBottom: 14 }}>{result.allowed_drivers.map(d => <span key={d} className="reason-chip">{d}</span>)}</div>
          <div className="kpi-label" style={{ marginBottom: 7 }}>Regole soddisfatte</div>
          <div style={{ marginBottom: 14 }}>{result.matched_rules.length ? result.matched_rules.map(r => <span key={r} className="reason-chip matched">{r}</span>) : <span className="reason-chip">nessuna</span>}</div>
          <div className="kpi-label" style={{ marginBottom: 7 }}>Motivazioni</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{result.reasons.map((r,i) => <li key={i}>{r}</li>)}</ul>
        </div>
      </div>

      <Card className="section-gap" title="Regole configurate" icon={<I.Risk size={15}/>} flush>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Regola</th><th>Segnale</th><th>Condizione</th><th>Azione</th><th>Assurance</th><th>Phishing-res.</th><th>Stato</th></tr></thead>
            <tbody>
              {RebelData.riskRules.map(r => (
                <tr key={r.key}>
                  <td><div className="cell-main">{r.name}</div><div className="cell-sub mono">{r.key}</div></td>
                  <td className="mono">{r.signal}</td>
                  <td className="mono muted">{r.operator} {String(r.value)}</td>
                  <td><span className={`badge ${r.action==='block'?'failed':'paused'}`}>{r.action === 'block' ? 'block' : r.action === 'require_step_up' ? 'step-up' : r.action}</span></td>
                  <td><Aal level={r.aal}/></td>
                  <td>{r.phishing ? <I.Check size={14} style={{ color: 'var(--rebel-good)' }}/> : <span className="tertiary">—</span>}</td>
                  <td><StatusBadge status={r.status === 'active' ? 'active' : 'draft'}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

Object.assign(window, { AuditPage, DevicesPage, RiskPage });


// ===== pages-anomaly.jsx =====

// ============== Laravel Rebel — page: Anomaly Detection ==============

// Stylized global threat map: graticule + abstract landmasses + animated geo blips + arcs.
function ThreatMap({ cases, onSelect, height = 300 }) {
  const W = 900, H = 460;
  // abstract continent blobs (decorative, not geographically exact) as dotted clusters
  const land = [
    'M120,150 q40,-40 110,-30 q60,5 80,40 q20,40 -10,70 q-50,40 -120,25 q-70,-15 -80,-55 q-8,-35 20,-50z', // americas-ish (N)
    'M210,250 q30,-10 45,20 q15,40 -5,80 q-25,45 -50,30 q-20,-20 -10,-70 q5,-45 20,-60z', // S america
    'M420,130 q60,-25 120,-10 q50,12 60,45 q5,30 -30,45 q-70,25 -140,5 q-40,-15 -40,-45 q3,-25 30,-35z', // eurasia
    'M430,230 q35,-10 55,20 q20,40 0,80 q-25,40 -55,25 q-20,-25 -10,-75 q5,-40 15,-50z', // africa
    'M690,300 q40,-12 60,15 q15,30 -10,50 q-35,22 -65,5 q-15,-22 0,-50 q6,-15 15,-20z', // oceania
  ];
  return (
    <div className="map-wrap" style={{ minHeight: height }}>
      <svg className="map-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="40%" r="70%">
            <stop offset="0" stopColor="var(--rebel-red)" stopOpacity="0.06"/>
            <stop offset="1" stopColor="var(--rebel-red)" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#mapGlow)"/>
        {/* graticule */}
        {Array.from({ length: 11 }).map((_, i) => <line key={'v'+i} x1={W/10*i} y1="0" x2={W/10*i} y2={H} className="chart-grid-line"/>)}
        {Array.from({ length: 7 }).map((_, i) => <line key={'h'+i} x1="0" y1={H/6*i} x2={W} y2={H/6*i} className="chart-grid-line"/>)}
        {/* landmasses */}
        {land.map((d, i) => <path key={i} d={d} className="map-country"/>)}
        {/* arcs (impossible travel) */}
        {cases.filter(c => c.geo2).map((c, i) => {
          const x1 = c.geo.x/100*W, y1 = c.geo.y/100*H, x2 = c.geo2.x/100*W, y2 = c.geo2.y/100*H;
          const mx = (x1+x2)/2, my = Math.min(y1,y2) - 80;
          const len = 900;
          return <path key={'arc'+i} className="map-arc" d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`} style={{ '--len': len }}/>;
        })}
        {/* blips */}
        {cases.map((c, i) => {
          const sevColor = { low: 'var(--rebel-sev-low)', medium: 'var(--rebel-sev-medium)', high: 'var(--rebel-sev-high)', critical: 'var(--rebel-sev-critical)' }[c.severity];
          return [c.geo, c.geo2].filter(Boolean).map((g, gi) => {
            const cx = g.x/100*W, cy = g.y/100*H;
            return (
              <g key={c.id+gi} onClick={() => onSelect(c)} style={{ cursor: 'pointer' }}>
                <circle cx={cx} cy={cy} r="4" fill={sevColor}/>
                <circle cx={cx} cy={cy} r="4" fill="none" stroke={sevColor} strokeWidth="1.5" opacity="0.7">
                  <animate attributeName="r" from="4" to="22" dur="2.2s" begin={`${i*0.3}s`} repeatCount="indefinite"/>
                  <animate attributeName="opacity" from="0.7" to="0" dur="2.2s" begin={`${i*0.3}s`} repeatCount="indefinite"/>
                </circle>
              </g>
            );
          });
        })}
      </svg>
      <div className="map-legend">
        <span className="flex items-center gap-8"><span className="sev critical" style={{ padding: '1px 5px' }}>●</span>critical</span>
        <span className="flex items-center gap-8"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--rebel-sev-high)', display: 'inline-block' }}/>high</span>
        <span className="flex items-center gap-8"><span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--rebel-sev-medium)', display: 'inline-block' }}/>medium</span>
      </div>
    </div>
  );
}

function AnomaliesPage({ ctx }) {
  const [filter, setFilter] = React.useState({ severity: 'all', status: 'all' });
  const [selected, setSelected] = React.useState(null);
  const [confirm, setConfirm] = React.useState(null);
  const [cases, setCases] = React.useState(RebelData.anomalyCases);

  const filtered = cases.filter(c =>
    (filter.severity === 'all' || c.severity === filter.severity) &&
    (filter.status === 'all' || c.status === filter.status));

  const counts = {
    open: cases.filter(c => c.status === 'open').length,
    critical: cases.filter(c => c.severity === 'critical').length,
    events: cases.reduce((a, c) => a + c.events, 0),
  };

  const runAction = (note) => {
    if (!confirm) return;
    if (confirm.act.key.includes('block') || confirm.act.key.includes('lock') || confirm.act.key.includes('revoke')) {
      setCases(cs => cs.map(c => c.id === confirm.caseId ? { ...c, status: 'closed' } : c));
    }
    ctx.toast({ kind: 'success', title: 'Mitigazione applicata', body: `${confirm.act.label} · registrata in audit` });
    setConfirm(null);
    setSelected(null);
  };

  return (
    <div className="page fade-in">
      <PageHead crumb="Anomaly Detection" title="Anomaly Detection"
                sub="Case di anomalie rilevate (SMS pumping, impossible travel, OTP bombing…) e azioni di mitigazione."
                actions={<ExportBtn onExport={() => ctx.toast({ kind: 'info', title: 'Export avviato' })}/>}/>

      <div className="grid c4 stagger" style={{ marginBottom: 18 }}>
        <KpiCard label="Case aperti" value={counts.open} icon={I.Anomaly} intent="bad"/>
        <KpiCard label="Critical" value={counts.critical} icon={I.AlertTriangle} intent="bad"/>
        <KpiCard label="Eventi correlati" value={fmtNum(counts.events)} icon={I.Activity} intent="neutral"/>
        <KpiCard label="MTTR medio" value="42" suffix="min" icon={I.Clock} intent="good" delta={-12.0} deltaInvert/>
      </div>

      <Card title="Mappa minacce globale" icon={<I.Globe size={15}/>} sub="Geolocalizzazione approssimata dei case attivi · click su un blip per il dettaglio" flush>
        <div style={{ padding: 12 }}><ThreatMap cases={filtered} onSelect={setSelected}/></div>
      </Card>

      <Card className="section-gap" title="Case attivi" icon={<I.Anomaly size={15}/>} flush
            actions={<div className="flex items-center gap-8">
              {['all','critical','high','medium','low'].map(s => <button key={s} className={`chip ${filter.severity===s?'active':''}`} onClick={() => setFilter(f => ({...f, severity: s}))}>{s==='all'?'Tutte':s}</button>)}
            </div>}>
        <Hydrate deps={[filter]} delay={420} skeleton={<SkeletonRows rows={5} cols={5}/>} isEmpty={filtered.length === 0} empty={<EmptyState icon={<I.CheckCircle size={20}/>} title="Nessun case per i filtri" hint="Tutto sotto controllo per questa selezione."/>}>
          <table className="tbl">
            <thead><tr><th>Tipo</th><th>Severity</th><th>Stato</th><th className="num">Eventi</th><th>Tenant</th><th>Aperto</th><th></th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="clickable" onClick={() => setSelected(c)}>
                  <td><div className="cell-main">{RebelData.anomalyTypes[c.type]}</div><div className="cell-sub mono">{c.id}</div></td>
                  <td><SeverityBadge severity={c.severity}/></td>
                  <td><StatusBadge status={c.status}/></td>
                  <td className="num">{fmtNum(c.events)}</td>
                  <td className="muted">{(RebelData.tenants.find(t=>t.id===c.tenant)||{}).name || c.tenant}</td>
                  <td className="muted">{fmtRel(c.opened_at)}</td>
                  <td><I.ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Hydrate>
      </Card>

      <Drawer open={!!selected} onClose={() => setSelected(null)} icon={<I.Anomaly size={16}/>}
              title={selected ? RebelData.anomalyTypes[selected.type] : ''}
              footer={selected && <div className="flex items-center gap-8" style={{ width: '100%', justifyContent: 'space-between' }}>
                <button className="btn" onClick={() => { setCases(cs => cs.map(c => c.id===selected.id?{...c,status:'ack'}:c)); ctx.toast({kind:'info',title:'Case acknowledged'}); }}>Acknowledge</button>
                <button className="btn primary" onClick={() => { setCases(cs => cs.map(c => c.id===selected.id?{...c,status:'closed'}:c)); ctx.toast({kind:'success',title:'Case chiuso'}); setSelected(null); }}><I.Check className="icon"/>Chiudi case</button>
              </div>}>
        {selected && (<>
          <div className="drawer-section">
            <div className="flex items-center gap-8" style={{ marginBottom: 12 }}>
              <SeverityBadge severity={selected.severity}/><StatusBadge status={selected.status}/>
              <span className="mono cell-sub" style={{ marginLeft: 'auto' }}>{selected.id}</span>
            </div>
            <KV rows={[
              ['Tenant', (RebelData.tenants.find(t=>t.id===selected.tenant)||{}).name],
              ['Eventi correlati', <b>{fmtNum(selected.events)}</b>],
              ['Aperto', `${fmtDateTime(selected.opened_at)}Z (${fmtRel(selected.opened_at)})`],
            ]}/>
          </div>
          <div className="drawer-section">
            <h5>Segnali</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(selected.signals).map(([k, v]) => (
                <div key={k} className="reason-chip"><span className="tertiary">{k}:</span>&nbsp;<b>{v}</b></div>
              ))}
            </div>
          </div>
          <div className="drawer-section">
            <h5>Timeline eventi</h5>
            <div className="timeline">
              {selected.timeline.map((t, i) => (
                <div key={i} className="tl-item">
                  <div className="tl-rail"><div className={`tl-node ${t.sev}`}/><div className="tl-line"/></div>
                  <div className="tl-body">
                    <div className="tl-time">{fmtDateTime(t.t)}Z</div>
                    <div className="tl-event">{t.event}</div>
                    <div className="tl-detail">{t.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="drawer-section">
            <h5>Azioni suggerite</h5>
            <div className="notice warn" style={{ marginBottom: 12 }}><I.AlertTriangle size={15} className="icon"/>Le mitigazioni distruttive richiedono human review e doppia conferma con nota obbligatoria.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selected.actions.map(a => (
                <button key={a.key} className={`btn ${a.destructive ? 'danger' : ''}`} style={{ justifyContent: 'space-between', height: 40 }}
                        onClick={() => a.destructive ? setConfirm({ act: a, caseId: selected.id }) : (ctx.toast({ kind: 'success', title: 'Azione applicata', body: a.label }))}>
                  <span className="flex items-center gap-8">{a.destructive ? <I.AlertTriangle size={14}/> : <I.Zap size={14}/>}{a.label}</span>
                  {a.destructive && <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>review</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="drawer-section">
            <button className="btn ghost" style={{ width: '100%' }} onClick={() => ctx.go('ai')}><I.AI className="icon"/>Spiega questo case con AI Copilot</button>
          </div>
        </>)}
      </Drawer>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} onConfirm={runAction}
                    danger requireNote
                    title={confirm?.act.label}
                    confirmLabel="Applica mitigazione"
                    body="Mitigazione distruttiva. Verrà applicata immediatamente all'infrastruttura del tenant e registrata nell'audit log con doppia conferma."/>
    </div>
  );
}

Object.assign(window, { AnomaliesPage, ThreatMap });


// ===== pages-intel.jsx =====

// ============== Laravel Rebel — pages: Intelligence group ==============

// ── 3.9 AI Security Copilot ──
function AiPage({ ctx }) {
  const [messages, setMessages] = React.useState([
    { role: 'bot', confidence: 'medium', html: ["Ciao Marco. Sono il <strong>Rebel AI Copilot</strong>. Posso spiegare un case di anomalia, suggerire una bozza di policy o rispondere a domande in linguaggio naturale sui tuoi eventi auth.", "Ricorda: <strong>spiego, non decido</strong>. Ogni mitigazione distruttiva resta soggetta a human review."] },
  ]);
  const [input, setInput] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, thinking]);

  const resolveResponse = (text) => {
    const t = text.toLowerCase();
    if (t.includes('4821') || t.includes('pumping')) return RebelData.aiResponses['case_4821'];
    if (t.includes('4817') || t.includes('travel')) return RebelData.aiResponses['case_4817'];
    if (t.includes('policy') || t.includes('regola') || t.includes('suggest')) return RebelData.aiResponses['policy'];
    return RebelData.aiResponses['default'];
  };

  const send = (text) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: 'user', html: [text] }]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      const r = resolveResponse(text);
      setThinking(false);
      setMessages(m => [...m, { role: 'bot', confidence: r.confidence, html: r.paragraphs, sources: r.sources, draft: r.draft }]);
    }, 1400);
  };

  const suggestions = ['Spiega il case case_4821', 'Perché case_4817 è critical?', 'Suggerisci una policy anti SMS-pumping', 'Qual è l\'anomalia più urgente?'];

  return (
    <div className="page fade-in">
      <PageHead crumb="AI Security Copilot" title={<>AI Security Copilot <span className="badge outline" style={{ verticalAlign: 'middle', fontSize: 10 }}>ai-guard</span></>}
                sub="Spiegazioni e suggerimenti AI sugli eventi di sicurezza. L'AI spiega, non decide."/>

      <div className="ai-banner"><I.AlertTriangle size={16}/>Output AI da rivedere. Le mitigazioni distruttive richiedono sempre human review e doppia conferma.</div>

      <Card flush>
        <div ref={scrollRef} style={{ padding: 18, maxHeight: 'calc(100vh - 380px)', minHeight: 320, overflow: 'auto' }}>
          <div className="ai-chat">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                <div className="ai-av">{m.role === 'bot' ? <BrandMark size={18}/> : 'MR'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ai-bubble">
                    {m.role === 'bot' && m.confidence && <div style={{ marginBottom: 9 }}><span className={`confidence ${m.confidence}`}><I.Sparkle size={11}/>confidence {m.confidence}</span></div>}
                    {m.html.map((p, j) => <p key={j} dangerouslySetInnerHTML={{ __html: p }}/>)}
                    {m.draft && (
                      <div style={{ marginTop: 12 }}>
                        <div className="kpi-label" style={{ marginBottom: 7 }}>Bozza regola generata</div>
                        <JsonViewer data={m.draft}/>
                        <button className="btn primary sm" style={{ marginTop: 10 }} onClick={() => ctx.toast({ kind: 'success', title: 'Salvata come draft', body: m.draft.name })}><I.Save className="icon"/>Salva come draft regola</button>
                      </div>
                    )}
                    {m.sources && <div style={{ marginTop: 11, paddingTop: 10, borderTop: '1px solid var(--border)' }}><span className="tertiary" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Fonti</span><div style={{ marginTop: 6 }}>{m.sources.map(s => <span key={s} className="reason-chip"><I.Database size={10}/>{s}</span>)}</div></div>}
                  </div>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="ai-msg bot">
                <div className="ai-av"><BrandMark size={18}/></div>
                <div className="ai-bubble"><span className="ai-thinking"><i/><i/><i/></span> <span className="tertiary" style={{ marginLeft: 6 }}>sto analizzando gli eventi…</span></div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
          {messages.length <= 1 && (
            <div className="ai-suggest">
              {suggestions.map(s => <button key={s} className="chip" onClick={() => send(s)}><I.Sparkle size={12}/>{s}</button>)}
            </div>
          )}
          <div className="ai-composer" style={{ marginTop: 0, paddingTop: 0, border: 0 }}>
            <textarea className="input" rows={2} placeholder="Chiedi al Copilot… (es. «spiega il case case_4821»)" value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}/>
            <button className="btn primary" style={{ height: 'auto', alignSelf: 'stretch', padding: '0 16px' }} onClick={() => send(input)} disabled={thinking}><I.Send className="icon"/>Invia</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── 3.10 Compliance Center ──
function CompliancePage({ ctx }) {
  const [tab, setTab] = React.useState('nist');
  const c = RebelData.compliance;
  const aalSegs = [
    { k: 'AAL1', v: c.nist.aal1, color: 'var(--rebel-neutral)' },
    { k: 'AAL2', v: c.nist.aal2, color: 'var(--rebel-info)' },
    { k: 'AAL3', v: c.nist.aal3, color: 'var(--rebel-good)' },
  ];
  const amrColors = ['var(--rebel-info)', 'var(--accent)', 'var(--rebel-good)', 'var(--rebel-neutral)'];

  return (
    <div className="page fade-in">
      <PageHead crumb="Compliance Center" title="Compliance Center"
                sub="Evidenze NIST AAL, PSD2/SCA e GDPR retention per audit e dispute."
                actions={<ExportBtn onExport={() => ctx.toast({ kind: 'info', title: 'Export evidenze avviato', body: 'Job asincrono · pacchetto audit' })}/>}/>

      <div className="tabs" style={{ marginBottom: 18 }}>
        {[['nist','NIST AAL'],['psd2','PSD2 / SCA'],['gdpr','GDPR Retention']].map(([k, l]) => (
          <div key={k} className={`tab ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</div>
        ))}
      </div>

      {tab === 'nist' && (
        <div className="grid c2 fade-in">
          <Card title="Distribuzione AAL" icon={<I.Shield size={15}/>} sub="su tutti gli eventi del periodo">
            <div className="dist-bar" style={{ marginBottom: 16 }}>
              {aalSegs.map(s => <div key={s.k} className="dist-seg" style={{ flex: s.v, background: s.color }}>{s.v >= 0.06 ? fmtPct(s.v, 0) : ''}</div>)}
            </div>
            {aalSegs.map(s => (
              <div key={s.k} className="flex items-center between" style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="flex items-center gap-8"><span className="lg-dot" style={{ background: s.color, width: 9, height: 9, borderRadius: 2 }}/>{s.k}</span>
                <b className="mono tnum">{fmtPct(s.v)}</b>
              </div>
            ))}
            <div className="notice info" style={{ marginTop: 14 }}><I.Info size={15} className="icon"/>Il 30% degli eventi raggiunge AAL2+ — coerente con la policy step-up sulle operazioni sensibili.</div>
          </Card>
          <Card title="Distribuzione AMR" icon={<I.Key size={15}/>} sub="authentication methods reference">
            <div className="donut-wrap">
              <Donut segments={c.amr.map((a, i) => ({ value: a.v, color: amrColors[i] }))} size={140} thickness={20}/>
              <div style={{ flex: 1 }}>
                {c.amr.map((a, i) => (
                  <div key={a.k} className="flex items-center between" style={{ padding: '6px 0' }}>
                    <span className="flex items-center gap-8"><span className="lg-dot" style={{ background: amrColors[i] }}/>{a.k}</span>
                    <b className="mono tnum">{fmtPct(a.v)}</b>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'psd2' && (
        <div className="fade-in">
          <div className="grid c3" style={{ marginBottom: 16 }}>
            <KpiCard label="SCA events" value={fmtNum(c.psd2.sca_events)} icon={I.Shield} intent="info"/>
            <KpiCard label="Dynamic linking" value={fmtNum(c.psd2.dynamic_linked)} suffix={`/ ${fmtNum(c.psd2.sca_events)}`} icon={I.Check} intent="good"/>
            <KpiCard label="Esenzioni applicate" value={fmtNum(Object.values(c.psd2.exemptions).reduce((a,b)=>a+b,0))} icon={I.FileText} intent="neutral"/>
          </div>
          <Card title="Esenzioni SCA per tipo" icon={<I.FileText size={15}/>} flush>
            <table className="tbl">
              <thead><tr><th>Tipo esenzione</th><th className="num">Count</th><th>Quota</th></tr></thead>
              <tbody>
                {Object.entries(c.psd2.exemptions).map(([k, v]) => {
                  const total = Object.values(c.psd2.exemptions).reduce((a,b)=>a+b,0);
                  return (
                    <tr key={k}>
                      <td className="mono">{k.replace(/_/g,' ')}</td>
                      <td className="num">{fmtNum(v)}</td>
                      <td><div className="bar-cell"><div className="minibar"><i style={{ width: `${v/total*100}%`, background: 'var(--rebel-info)' }}/></div><span className="mono" style={{ width: 44 }}>{fmtPct(v/total)}</span></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
          <div className="notice info" style={{ marginTop: 16 }}><I.Info size={15} className="icon"/>Il {fmtPct(c.psd2.dynamic_linked/c.psd2.sca_events)} degli eventi SCA include dynamic linking (importo + beneficiario firmati nel challenge), conforme a PSD2 RTS art. 5.</div>
        </div>
      )}

      {tab === 'gdpr' && (
        <div className="fade-in">
          <div className="grid c3" style={{ marginBottom: 16 }}>
            <KpiCard label="Erasure pendenti" value={c.gdpr.pending_erasures} icon={I.User} intent={c.gdpr.pending_erasures>0?'warn':'good'}/>
            <KpiCard label="Tier di retention" value={c.gdpr.retention.length} icon={I.Database} intent="neutral"/>
            <KpiCard label="Ultimo prune" value={fmtRel(c.gdpr.last_prune)} icon={I.Clock} intent="good"/>
          </div>
          <Card title="Retention & pseudonimizzazione" icon={<I.Database size={15}/>} sub="cosa scade quando, per tenant" flush>
            <table className="tbl">
              <thead><tr><th>Dataset</th><th className="num">Retention</th><th className="num">Righe</th><th>Prossimo prune</th><th>Stato</th></tr></thead>
              <tbody>
                {c.gdpr.retention.map(r => (
                  <tr key={r.name}>
                    <td className="mono">{r.name}</td>
                    <td className="num">{r.days}g</td>
                    <td className="num">{r.rows}</td>
                    <td className="mono muted">{r.next_prune}</td>
                    <td><span className="badge success"><I.Check size={10}/>schedulato</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="notice warn" style={{ marginTop: 16 }}><I.AlertTriangle size={15} className="icon"/>{c.gdpr.pending_erasures} richieste di erasure (art. 17 GDPR) in attesa di completamento entro l'SLA di 30 giorni.</div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AiPage, CompliancePage });


// ===== tweaks-panel.jsx =====


// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;width:100%;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*');
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
  };

  const onDragStart = (e) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel" data-noncommentable=""
           style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" aria-label="Close tweaks"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={dismiss}>✕</button>
        </div>
        <div className="twk-body">{children}</div>
      </div>
    </>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({ label, children }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children, inline = false }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <input type="range" className="twk-slider" min={min} max={max} step={step}
             value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </TweakRow>
  );
}

function TweakToggle({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <button type="button" className="twk-toggle" data-on={value ? '1' : '0'}
              role="switch" aria-checked={!!value}
              onClick={() => onChange(!value)}><i /></button>
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;

  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  const segAt = (clientX) => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor(((clientX - r.left - 2) / inner) * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };

  const onPointerDown = (e) => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = (ev) => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <TweakRow label={label}>
      <div ref={trackRef} role="radiogroup" onPointerDown={onPointerDown}
           className={dragging ? 'twk-seg dragging' : 'twk-seg'}>
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
                      width: `calc((100% - 4px) / ${n})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const v = typeof o === 'object' ? o.value : o;
          const l = typeof o === 'object' ? o.label : o;
          return <option key={v} value={v}>{l}</option>;
        })}
      </select>
    </TweakRow>
  );
}

function TweakText({ label, value, placeholder, onChange }) {
  return (
    <TweakRow label={label}>
      <input className="twk-field" type="text" value={value} placeholder={placeholder}
             onChange={(e) => onChange(e.target.value)} />
    </TweakRow>
  );
}

function TweakNumber({ label, value, min, max, step = 1, unit = '', onChange }) {
  const clamp = (n) => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({ x: 0, val: 0 });
  const onScrubStart = (e) => {
    e.preventDefault();
    startRef.current = { x: e.clientX, val: value };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = (ev) => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div className="twk-num">
      <span className="twk-num-lbl" onPointerDown={onScrubStart}>{label}</span>
      <input type="number" value={value} min={min} max={max} step={step}
             onChange={(e) => onChange(clamp(Number(e.target.value)))} />
      {unit && <span className="twk-num-unit">{unit}</span>}
    </div>
  );
}

function TweakColor({ label, value, onChange }) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl"><span>{label}</span></div>
      <input type="color" className="twk-swatch" value={value}
             onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function TweakButton({ label, onClick, secondary = false }) {
  return (
    <button type="button" className={secondary ? 'twk-btn secondary' : 'twk-btn'}
            onClick={onClick}>{label}</button>
  );
}

Object.assign(window, {
  useTweaks, TweaksPanel, TweakSection, TweakRow,
  TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakText, TweakNumber, TweakColor, TweakButton,
});


// ===== app.jsx =====

// ============== Laravel Rebel — App root ==============

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "density": "regular",
  "glow": true
}/*EDITMODE-END*/;

const PAGES = {
  overview: OverviewPage, funnels: FunnelsPage, channels: ChannelsPage, providers: ProvidersPage,
  audit: AuditPage, devices: DevicesPage, risk: RiskPage, anomalies: AnomaliesPage,
  ai: AiPage, compliance: CompliancePage,
};

function AlertsDrawer({ open, onClose, onGo }) {
  return (
    <Drawer open={open} onClose={onClose} icon={<I.Bell size={16}/>} title="Anomalie aperte"
            footer={<button className="btn primary" style={{ width: '100%' }} onClick={() => { onGo('anomalies'); onClose(); }}><I.Anomaly className="icon"/>Apri Anomaly Detection</button>}>
      <div style={{ padding: '4px 0' }}>
        {RebelData.openAnomalies.map(a => (
          <div key={a.id} className="approval-card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '13px 18px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
               onClick={() => { onGo('anomalies'); onClose(); }}>
            <div>
              <div className="flex items-center gap-8" style={{ marginBottom: 4 }}><SeverityBadge severity={a.severity}/><span className="cell-main">{RebelData.anomalyTypes[a.type]}</span></div>
              <div className="cell-sub mono">{a.id} · {fmtNum(a.events)} eventi · {fmtRel(a.opened_at)}</div>
            </div>
            <I.ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }}/>
          </div>
        ))}
      </div>
    </Drawer>
  );
}

function Shell() {
  const fallback = React.useState(TWEAK_DEFAULTS);
  const fallbackSetter = React.useCallback((k, v) => {
    const edits = typeof k === 'object' ? k : { [k]: v };
    fallback[1](prev => ({ ...prev, ...edits }));
  }, []);
  const [tweaks, setTweak] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [fallback[0], fallbackSetter];

  const [route, setRoute] = React.useState('overview');
  const [tenant, setTenant] = React.useState('northwind');
  const [period, setPeriod] = React.useState('24h');
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [alertsOpen, setAlertsOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [lastTick, setLastTick] = React.useState(RebelData.REF_TS);
  const toastApi = useToast();

  React.useEffect(() => {
    const r = document.documentElement;
    r.dataset.theme = tweaks.theme;
    r.dataset.density = tweaks.density;
    r.dataset.glow = tweaks.glow ? 'on' : 'off';
  }, [tweaks]);

  React.useEffect(() => {
    const mark = () => { if (document.visibilityState === 'visible') document.documentElement.classList.add('anim-ready'); };
    mark();
    document.addEventListener('visibilitychange', mark);
    return () => document.removeEventListener('visibilitychange', mark);
  }, []);

  React.useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => setLastTick(t => t + 5000), 5000);
    return () => clearInterval(id);
  }, [autoRefresh]);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ctx = {
    tenant, period, lastTick,
    go: setRoute,
    toast: (t) => toastApi.push(t),
  };
  const Page = PAGES[route] || OverviewPage;

  return (
    <div className={`app ${collapsed ? 'collapsed' : ''}`}>
      <Sidebar route={route} onNavigate={setRoute} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)}/>
      <div className="main">
        <Topbar route={route} tenant={tenant} onTenant={(t) => { setTenant(t); toastApi.push({ kind: 'info', title: 'Tenant cambiato', body: (RebelData.tenants.find(x=>x.id===t)||{}).name }); }}
                period={period} onPeriod={setPeriod}
                theme={tweaks.theme} onTheme={(th) => setTweak('theme', th)}
                onOpenPalette={() => setPaletteOpen(true)}
                autoRefresh={autoRefresh} onAutoRefresh={setAutoRefresh}
                lastTick={lastTick} onAlerts={() => setAlertsOpen(true)}/>
        <div className="content" key={route}>
          <Page ctx={ctx}/>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onNavigate={setRoute}/>
      <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} onGo={setRoute}/>
      <RebelTweaks tweaks={tweaks} setTweak={setTweak}/>
    </div>
  );
}

function RebelTweaks({ tweaks, setTweak }) {
  if (!window.TweaksPanel) return null;
  const { TweaksPanel, TweakSection, TweakRadio, TweakToggle } = window;
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Aspetto">
        <TweakRadio label="Tema" value={tweaks.theme} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} onChange={v => setTweak('theme', v)}/>
        <TweakRadio label="Densità" value={tweaks.density} options={[{ value: 'compact', label: 'Compatta' }, { value: 'regular', label: 'Comoda' }]} onChange={v => setTweak('density', v)}/>
        <TweakToggle label="Glow rosso (brand/critical)" value={tweaks.glow} onChange={v => setTweak('glow', v)}/>
      </TweakSection>
    </TweaksPanel>
  );
}

function App() {
  return <ToastProvider><Shell/></ToastProvider>;
}

const rebelRoot = document.getElementById('rebel-admin-root');
if (rebelRoot) { ReactDOM.createRoot(rebelRoot).render(<App/>); }

