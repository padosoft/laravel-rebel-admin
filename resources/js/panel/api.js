// ============== Laravel Rebel — live Admin API layer ==============
// Replaces the template's mock RebelData with data fetched from laravel-rebel-admin-api.
// Defensive: where an endpoint returns nothing (a fresh install with little telemetry),
// the template's illustrative sample value is kept so no widget ever breaks.
(function () {
  const boot = window.RebelAdminBoot || {};
  const apiBase = boot.apiBase || '/rebel/admin/api/v1';
  const csrf = boot.csrfToken || '';

  async function req(path, opts) {
    opts = opts || {};
    const res = await fetch(apiBase + path, {
      method: opts.method || 'GET',
      credentials: 'same-origin',
      headers: Object.assign(
        { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf },
        opts.body ? { 'Content-Type': 'application/json' } : {}
      ),
      body: opts.body ? JSON.stringify(opts.body) : null,
    });
    if (!res.ok) { const e = new Error('HTTP ' + res.status); e.status = res.status; throw e; }
    return res.json();
  }

  window.RebelApi = {
    get: (p) => req(p),
    post: (p, body) => req(p, { method: 'POST', body }),
    put: (p, body) => req(p, { method: 'PUT', body }),
  };

  const INTENT = { login_requests: 'neutral', otp_sent: 'info', otp_verified: 'good', step_up_required: 'neutral', step_up_verified: 'good', high_risk_events: 'bad' };
  const FUNNEL_LABEL = { start: 'Login request', sent: 'OTP sent', delivered: 'OTP delivered', verified: 'OTP verified', login: 'Authenticated' };
  const hourLabel = (t) => { const d = new Date(t); return String(d.getUTCHours()).padStart(2, '0') + ':00'; };
  const prettyKey = (k) => String(k || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const nonEmpty = (a) => Array.isArray(a) && a.length > 0;

  const overviewCache = {};

  async function hydrate(periodKey) {
    const period = periodKey || '24h';
    const D = window.RebelData;
    const settled = await Promise.allSettled([
      RebelApi.get('/security/overview?period=' + period), // 0
      RebelApi.get('/otp/funnel'),                          // 1
      RebelApi.get('/risk-rules'),                          // 2
      RebelApi.get('/anomalies'),                           // 3
      RebelApi.get('/compliance/overview'),                 // 4
      RebelApi.get('/channels/performance'),                // 5
      RebelApi.get('/step-up/funnel'),                      // 6
      RebelApi.get('/auth-events?limit=60'),                // 7
      RebelApi.get('/providers/health'),                    // 8
    ]);
    const val = (i) => (settled[i].status === 'fulfilled' ? settled[i].value : null);

    // ── Security Overview ──
    const ov = val(0), of = val(1);
    if (ov && ov.kpis) {
      const ts = (ov.timeseries || []).map((r) => ({
        label: hourLabel(r.t), logins: r.logins, otp_sent: r.otp_sent, otp_verified: r.otp_verified, high_risk: r.high_risk,
      }));
      const kpis = {};
      Object.keys(ov.kpis).forEach((k) => {
        const x = ov.kpis[k];
        kpis[k] = { value: x.value, delta_pct: x.delta_pct, rate: x.rate, intent: INTENT[k] || 'neutral', spark: x.sparkline || [] };
      });
      const funnel = (of && nonEmpty(of.stages))
        ? of.stages.map((s) => ({ key: s.key, label: FUNNEL_LABEL[s.key] || s.label, count: s.count }))
        : [{ key: 'login', label: 'Login request', count: kpis.login_requests ? kpis.login_requests.value : 0 }];
      overviewCache[period] = { generated_at: ov.generated_at, ts, kpis, funnel };
      D.overview = (p) => overviewCache[p || period] || overviewCache[period];
    }

    // ── Anomalies (list level; detail is fetched lazily by the page) ──
    const an = val(3);
    if (an && Array.isArray(an.data)) {
      const cases = an.data.map((a) => ({
        id: a.id, type: a.type, severity: a.severity, status: a.status,
        events: a.events_count, opened_at: a.opened_at, tenant: null,
        signals: a.signals || {}, geo: null, timeline: [], actions: [],
      }));
      if (cases.length) { D.anomalyCases = cases; D.openAnomalies = cases.filter((c) => c.status === 'open'); }
      // keep anomalyTypes labels, add any unknown type as a Title-Cased label
      cases.forEach((c) => { if (!D.anomalyTypes[c.type]) D.anomalyTypes[c.type] = prettyKey(c.type); });
    }

    // ── Risk rules ──
    const rr = val(2);
    if (rr && Array.isArray(rr.rules)) {
      D.riskRules = rr.rules.map((r) => ({
        key: r.key, name: r.name || prettyKey(r.key), signal: r.signal, operator: r.operator,
        value: r.value, action: r.action, aal: r.required_assurance || r.aal || 'aal1',
        phishing: !!(r.phishing_resistant != null ? r.phishing_resistant : r.phishing), status: r.status,
      }));
    }

    // ── Compliance ──
    const co = val(4);
    if (co && co.nist) {
      const dist = co.nist.aal_distribution || {};
      const ex = co.psd2 && co.psd2.exemptions;
      D.compliance = {
        nist: { aal1: dist.aal1 || 0, aal2: dist.aal2 || 0, aal3: dist.aal3 || 0 },
        amr: D.compliance.amr,
        psd2: {
          sca_events: co.psd2 ? co.psd2.sca_events : 0,
          dynamic_linked: co.psd2 ? co.psd2.dynamic_linked : 0,
          exemptions: (ex && !Array.isArray(ex)) ? ex : { low_value: 0, tra: 0, trusted_beneficiary: 0 },
        },
        gdpr: {
          retention: (co.gdpr && nonEmpty(co.gdpr.retention_tiers))
            ? co.gdpr.retention_tiers.map((t) => ({ name: t.name, days: t.days, rows: '—', next_prune: '—' }))
            : D.compliance.gdpr.retention,
          pending_erasures: co.gdpr ? co.gdpr.pending_erasures : 0,
          last_prune: (co.gdpr && co.gdpr.last_prune_at) || '—',
        },
      };
    }

    // ── Step-up by purpose ──
    const su = val(6);
    if (su && nonEmpty(su.by_purpose)) {
      D.stepUpByPurpose = su.by_purpose.map((p) => ({
        purpose: p.purpose, required: p.required, challenged: p.challenged,
        verified: p.verified, rate: p.rate, aal: p.avg_assurance || 'aal1',
      }));
    }

    // ── Channels (honest: show exactly what the API reports, even if empty/zero —
    //    delivery telemetry capture is a roadmap item, so a fresh app shows no traffic). ──
    const ch = val(5);
    if (ch && Array.isArray(ch.rows)) {
      D.channels = ch.rows.map((r) => ({
        channel: r.channel, provider: r.provider || '—', sent: r.sent || 0,
        delivered: r.delivered_rate || 0, fallback: r.fallback_rate || 0, p50: r.latency_p50_ms, p95: r.latency_p95_ms,
        cost: r.cost_amount || 0, cur: r.cost_currency || 'EUR', conv: r.verify_conversion || 0, fraud: !!r.fraud_flag,
      }));
      // Flat-zero series (truthful "no traffic"), not empty arrays — an empty series
      // makes the trend LineChart emit an invalid SVG path.
      const zeros = [0, 0, 0, 0, 0, 0, 0];
      D.channelTrend = { labels: 7, email: zeros, sms: zeros, whatsapp: zeros, voice: zeros };
    }

    // ── Providers (honest: real health rows only; empty until telemetry exists) ──
    const pr = val(8);
    if (pr && Array.isArray(pr.providers)) {
      D.providers = pr.providers.map((p) => ({
        key: p.key, name: p.name || prettyKey(p.key), kind: p.kind || '', status: p.status,
        uptime: p.uptime_pct, error_rate: p.error_rate, p95: p.latency_p95_ms, p50: p.latency_p50_ms,
        checked: p.checked_at, spark: p.spark || [], errors: p.recent_errors || [],
      }));
      D.incidents = [];
    }

    // ── Audit events ──
    const ae = val(7);
    if (ae && Array.isArray(ae.data)) {
      const rows = ae.data.map((e) => ({
        id: e.id, created_at: e.created_at, event_type: e.event_type, guard: e.guard || '—',
        subject: { type: 'subject', masked: e.identifier_hmac ? (e.identifier_hmac.slice(0, 10) + '…') : '—' },
        aal: e.aal || '—', amr: e.amr || [], channel: e.channel, purpose: e.purpose,
        risk_score: e.risk_score != null ? e.risk_score : 0,
        ip_masked: '—', outcome: /fail|failed|high_score/.test(e.event_type) ? 'failed' : 'success',
        ua: '—', country: '—',
      }));
      if (rows.length) { D.auditEvents = () => rows; }
    }
  }

  // ── Interactive actions (persist / mutate via the API) ──
  window.RebelActions = {
    saveRiskRule: (rule) => RebelApi.post('/risk-rules', rule),
    simulate: (signals) => RebelApi.post('/risk-rules/simulate', { signals }),
    anomalyAction: (caseId, action, params, confirm) => RebelApi.post('/anomalies/' + caseId + '/actions', { action, params: params || {}, confirm: !!confirm }),
    explainCase: (caseId) => RebelApi.post('/ai/anomalies/' + caseId + '/explain', {}),
    suggestPolicy: () => RebelApi.post('/ai/policies/suggest', {}),
    revokeSession: (subject, id) => RebelApi.post('/subjects/' + subject + '/sessions/' + id + '/revoke', {}),
    logoutEverywhere: (subject) => RebelApi.post('/subjects/' + subject + '/logout-everywhere', {}),
    untrustDevice: (subject, id) => RebelApi.post('/subjects/' + subject + '/devices/' + id + '/untrust', {}),
    saveSetting: (key, value) => RebelApi.put('/settings/' + key, { value }),
  };

  window.rebelHydrate = hydrate;
})();
