/* Laravel Rebel — Admin Panel client + widget loader (vanilla JS, no deps). */
(function () {
  'use strict';

  var RA = window.RebelAdmin = window.RebelAdmin || {};
  RA.state = RA.state || { apiBase: '/rebel/admin/api/v1', csrfToken: '', tenant: null, period: '7d' };

  var PERIOD_DAYS = { '24h': 1, '7d': 7, '30d': 30 };

  RA.contextQuery = function () {
    var q = {};
    if (RA.state.tenant) { q.tenant = RA.state.tenant; }
    q.days = PERIOD_DAYS[RA.state.period] || 7;
    return q;
  };

  RA.request = function (path, opts) {
    opts = opts || {};
    var url;
    try {
      var base = (RA.state.apiBase || '/rebel/admin/api/v1').replace(/\/$/, '');
      url = new URL(base + '/' + path.replace(/^\//, ''), window.location.origin);
    } catch (e) {
      // Surface an invalid URL as a rejected promise so the widget shows its error state.
      return Promise.reject(e);
    }
    var query = Object.assign({}, RA.contextQuery(), opts.query || {});
    Object.keys(query).forEach(function (k) {
      if (query[k] != null) { url.searchParams.set(k, query[k]); }
    });
    return fetch(url.toString(), {
      method: opts.method || 'GET',
      signal: opts.signal,
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': RA.state.csrfToken
      }
    }).then(function (res) {
      if (!res.ok) { throw new Error('HTTP ' + res.status); }
      return res.json();
    });
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text != null) { n.textContent = text; }
    return n;
  }

  function setError(host, retry) {
    host.innerHTML = '';
    var box = el('div', 'rebel-error');
    box.appendChild(el('p', null, 'Could not load this widget.'));
    var btn = el('button', 'rebel-btn', 'Retry');
    btn.addEventListener('click', retry);
    box.appendChild(btn);
    host.appendChild(box);
  }

  function setEmpty(host, message) {
    host.innerHTML = '';
    var box = el('div', 'rebel-empty');
    box.appendChild(el('p', 'rebel-muted', message));
    host.appendChild(box);
  }

  var WIDGETS = {
    overview: function (host) {
      var raw = this && this.totals;
      var totals = (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) ? raw : {};
      var keys = Object.keys(totals);
      if (!keys.length) { return setEmpty(host, 'No events in the selected period.'); }
      host.innerHTML = '';
      keys.sort().forEach(function (key) {
        var card = el('div', 'rebel-card');
        card.appendChild(el('div', 'kpi-label', key));
        card.appendChild(el('div', 'kpi-value', String(totals[key])));
        host.appendChild(card);
      });
    },
    audit: function (host) {
      var rows = (this && this.data) || [];
      if (!rows.length) { return setEmpty(host, 'No events match the current filters.'); }
      host.innerHTML = '';
      var table = el('table', 'rebel-table');
      var head = el('tr');
      ['Time', 'Event', 'Guard', 'Channel', 'Purpose', 'Risk'].forEach(function (h) { head.appendChild(el('th', null, h)); });
      var thead = el('thead'); thead.appendChild(head); table.appendChild(thead);
      var tbody = el('tbody');
      rows.forEach(function (r) {
        var tr = el('tr');
        [r.created_at, r.event_type, r.guard || '—', r.channel || '—', r.purpose || '—',
          (r.risk_score != null ? r.risk_score : '—')].forEach(function (v) {
          tr.appendChild(el('td', null, String(v)));
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      host.appendChild(table);
    }
  };

  function hydrate(host) {
    var widget = host.getAttribute('data-rebel-widget');
    var endpoint = host.getAttribute('data-endpoint');
    var render = WIDGETS[widget];
    if (!render || !endpoint) { return; }

    if (host._controller) { host._controller.abort(); }
    var controller = host._controller = new AbortController();
    host.innerHTML = '<div class="rebel-skeleton" data-rebel-loading>Loading…</div>';

    RA.request(endpoint, { signal: controller.signal })
      .then(function (payload) { render.call(payload, host); })
      .catch(function (err) {
        if (err && err.name === 'AbortError') { return; }
        setError(host, function () { hydrate(host); });
      });
  }

  function hydrateAll() {
    document.querySelectorAll('[data-rebel-widget]').forEach(hydrate);
  }

  function initTheme() {
    var toggle = document.querySelector('[data-rebel-theme-toggle]');
    if (!toggle) { return; }
    toggle.addEventListener('click', function () {
      var root = document.documentElement;
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('rebel-theme', next); } catch (e) {}
    });
  }

  function initContext() {
    var tenant = document.querySelector('[data-rebel-tenant]');
    var period = document.querySelector('[data-rebel-period]');
    if (tenant) { tenant.addEventListener('change', function () { RA.state.tenant = tenant.value || null; hydrateAll(); }); }
    if (period) { RA.state.period = period.value; period.addEventListener('change', function () { RA.state.period = period.value; hydrateAll(); }); }
  }

  function boot() { initTheme(); initContext(); hydrateAll(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
