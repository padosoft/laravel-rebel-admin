# Laravel Rebel — Admin Panel: specifica template grafico

> Documento per realizzare il **template grafico** dell'admin (`padosoft/laravel-rebel-admin`) **prima** dell'implementazione PHP. Definisce shell, sezioni/screen, componenti, **endpoint API chiamati** (con request/response), stati (loading/empty/error) e design tokens. Quando il template è pronto, l'implementazione PHP lo consumerà.

Versione: 1.0 · Stack target: **Blade + AJAX (fetch) + vanilla JS**, **Bootstrap-compatible**, **nessun** framework JS obbligatorio (no Alpine/Livewire/React/Vue). jQuery opzionale solo se già presente.

---

## 0. Principi non negoziabili

```text
- UI consuma SOLO la Admin API (nessuna query diretta da Blade)
- tenant-aware (tutte le viste filtrano per tenant selezionato)
- read-model: i dati vengono da aggregati/bucket, non da scan pesanti
- performance budget: prima pittura utile < 1.5s; ogni chiamata API con AbortController
- progressive enhancement: la pagina rende lo scheletro, i widget si idratano via fetch
- stati espliciti per OGNI widget: loading (skeleton) / empty / error / success
- accessibilità: focus visibile, aria-live per aggiornamenti, contrasto AA, navigabile da tastiera
- i18n-ready: nessuna stringa hardcoded nel JS (usa data-attributes / dictionary)
```

---

## 1. Shell / layout globale

```
┌───────────────────────────────────────────────────────────────────────────┐
│ TOPBAR:  [banner Rebel]   [Tenant ▼]   [Periodo: 24h|7g|30g|custom ▼]      │
│                                  [🔔 alerts]  [tema ◐]  [utente ▼]          │
├───────────┬───────────────────────────────────────────────────────────────┤
│ SIDEBAR   │  CONTENT AREA                                                   │
│ (nav)     │  ┌───────────────── breadcrumb + titolo sezione ────────────┐  │
│           │  │  filter-bar (contestuale)                [Export ⤓]      │  │
│ Overview  │  ├──────────────────────────────────────────────────────────┤  │
│ Funnels   │  │  griglia widget / tabella / dettaglio                     │  │
│ Channels  │  └──────────────────────────────────────────────────────────┘  │
│ Providers │                                                                 │
│ Audit     │                                                                 │
│ Devices   │                                                                 │
│ Risk      │                                                                 │
│ Anomalies │                                                                 │
│ AI Copilot│                                                                 │
│ Compliance│                                                                 │
└───────────┴───────────────────────────────────────────────────────────────┘
```

**Componenti shell:**
- **Topbar**: banner (`resources/screenshoots/Laravel-Rebel-banner.png`), **Tenant switcher** (dropdown), **Period selector** globale (`24h | 7d | 30d | custom`), **Alerts bell** (badge contatore anomalie aperte), **Theme toggle** (light/dark via CSS variables), **User menu**.
- **Sidebar**: voci di navigazione = le 10 sezioni (§3). Voce attiva evidenziata. Collapsible su mobile.
- **Toast/notification host** (in alto a destra) per esiti azioni.
- **Modal/drawer host** (dettagli, conferme, simulazioni).

**Stato globale (in `window.RebelAdmin.state`)**: `tenant`, `period {from,to,granularity}`, `csrfToken`, `baseUrl`. Cambiare tenant/periodo emette un evento `rebel:context-changed` a cui ogni widget si ri-sottoscrive (refetch).

---

## 2. Convenzioni comuni (valgono per tutte le sezioni)

### 2.1 Parametri query condivisi
Ogni endpoint lista accetta: `tenant`, `from`, `to`, `granularity` (`minute|hour|day`), `cursor`, `limit`, più filtri specifici. La UI li compone dal context globale + filter-bar.

### 2.2 Paginazione (cursor)
```json
{ "data": [ /* ... */ ], "meta": { "next_cursor": "eyJpZCI6...", "has_more": true } }
```
La data-table mostra "Load more" o paginazione cursor (no offset/page numbers).

### 2.3 Stati widget (OBBLIGATORI, da disegnare nel template)
- **loading**: skeleton shimmer della forma del widget.
- **empty**: icona + messaggio + eventuale CTA ("Nessun evento nel periodo").
- **error**: icona + messaggio + bottone "Riprova" (rifa la fetch).
- **partial/stale**: badge "dati aggiornati alle HH:MM" se da cache/bucket.

### 2.4 Export
Bottone **Export ⤓** per le viste tabellari: apre modal con formato (CSV/JSON) e avvia un **job** (export asincrono). Risposta `202 { "export_id": "...", "status": "queued" }`; polling su `GET .../exports/{id}`.

### 2.5 JS client contract
```js
window.RebelAdmin = {
  state: { tenant: null, period: {from,to,granularity}, csrfToken, baseUrl },
  request(path, { method='GET', query={}, body=null, signal } = {}) {
    const url = new URL(RebelAdmin.state.baseUrl + path);
    Object.entries({ ...RebelAdmin.contextQuery(), ...query }).forEach(([k,v]) => v!=null && url.searchParams.set(k,v));
    return fetch(url, {
      method,
      signal,
      headers: {
        'Accept':'application/json',
        'X-Requested-With':'XMLHttpRequest',
        'X-CSRF-TOKEN': RebelAdmin.state.csrfToken,
        ...(body ? {'Content-Type':'application/json'} : {})
      },
      body: body ? JSON.stringify(body) : null
    }).then(RebelAdmin.handle);
  },
  contextQuery() { const p = RebelAdmin.state.period; return { tenant: RebelAdmin.state.tenant, from:p.from, to:p.to, granularity:p.granularity }; },
  handle(res) { if (res.status===401||res.status===403) { /* redirect/login */ } if(!res.ok) throw new RebelApiError(res); return res.json(); }
};
```
Ogni widget: crea un `AbortController`, mostra loading, chiama `RebelAdmin.request`, gestisce success/empty/error, e si annulla su `rebel:context-changed`.

### 2.6 Sicurezza UI
- CSRF header su ogni richiesta (incl. GET per coerenza), 401/403 → schermata "non autorizzato".
- Le **azioni** (POST) sono dietro permission: la UI nasconde/disabilita i controlli se il permesso manca (i permessi arrivano in `GET /me`).

---

## 3. Sezioni / screen (con componenti + API)

> Per ogni sezione: **Route UI**, **Scopo**, **Componenti**, **Endpoint API** (metodo/path/params + response di esempio), **Stati/Interazioni**.

### 3.1 Security Overview  ·  Route UI: `/admin/rebel`
**Scopo:** colpo d'occhio sullo stato di sicurezza nel periodo.

**Componenti:**
- Riga **KPI cards** (6): Login requests, OTP sent, OTP verified (+%), Step-up required, Step-up verified (+%), High-risk events. Ogni card: valore, delta vs periodo precedente (freccia ▲▼), sparkline.
- **Funnel mini** (login→OTP sent→verified→authenticated).
- **Line chart** "eventi nel tempo" (per `granularity`).
- **Top anomalie aperte** (lista compatta, link a §3.8).
- **Provider health strip** (pallini verde/giallo/rosso, link a §3.4).

**API:** `GET /admin/rebel/api/v1/security/overview`
```json
{
  "period": "24h",
  "generated_at": "2026-06-02T10:00:00Z",
  "kpis": {
    "login_requests": { "value": 1234, "delta_pct": 8.1, "sparkline": [/* n punti */] },
    "otp_sent": { "value": 980, "delta_pct": 3.2, "sparkline": [] },
    "otp_verified": { "value": 760, "rate": 0.776, "delta_pct": 1.0, "sparkline": [] },
    "step_up_required": { "value": 120, "delta_pct": -2.0, "sparkline": [] },
    "step_up_verified": { "value": 100, "rate": 0.833, "sparkline": [] },
    "high_risk_events": { "value": 14, "delta_pct": 40.0, "sparkline": [] }
  },
  "timeseries": [ { "t": "2026-06-02T09:00:00Z", "logins": 50, "otp_sent": 40, "otp_verified": 31, "high_risk": 1 } ],
  "open_anomalies": [ { "id": "case_123", "type": "sms_pumping", "severity": "high", "opened_at": "..." } ],
  "providers": [ { "key": "twilio", "status": "healthy" } ]
}
```
**Stati:** loading=skeleton 6 card + 2 chart; empty=periodo senza dati; error=retry.

---

### 3.2 OTP & Step-up Funnel  ·  Route UI: `/admin/rebel/funnels`
**Scopo:** conversione del login passwordless e dello step-up.

**Componenti:**
- **Funnel chart OTP**: start → sent → delivered → verified → login (con % drop a ogni stadio).
- **Funnel chart Step-up**: required → challenged → verified (per purpose).
- **Breakdown per purpose** (tabella: purpose, required, verified, rate, assurance media).
- **Filtri:** purpose, channel, guard.

**API:**
- `GET /admin/rebel/api/v1/otp/funnel?channel=&guard=`
```json
{ "stages": [
  { "key":"start","label":"Start","count":1000 },
  { "key":"sent","label":"Sent","count":980 },
  { "key":"delivered","label":"Delivered","count":950 },
  { "key":"verified","label":"Verified","count":760 },
  { "key":"login","label":"Login","count":740 }
], "resend_rate": 0.12 }
```
- `GET /admin/rebel/api/v1/step-up/funnel?purpose=`
```json
{ "by_purpose": [
  { "purpose":"checkout-credit-order","required":120,"challenged":118,"verified":100,"rate":0.833,"avg_assurance":"aal2" }
] }
```
**Interazioni:** click su uno stadio → drill-down in §3.5 (audit) filtrato.

---

### 3.3 Channel Performance  ·  Route UI: `/admin/rebel/channels`
**Scopo:** performance/costo/affidabilità dei canali di delivery.

**Componenti:**
- **Tabella canali** (email/sms/whatsapp/voice): inviati, delivered %, fallback %, latenza p50/p95, costo, conversione request→verify.
- **Bar chart** costo per canale; **line chart** delivery rate nel tempo.
- **Alert toll-fraud** (badge se conversion-rate sotto soglia / spike prefisso).
- **Filtri:** channel, provider, country/prefix.

**API:** `GET /admin/rebel/api/v1/channels/performance?channel=&provider=&country=`
```json
{ "rows": [
  { "channel":"sms","provider":"twilio","sent":500,"delivered_rate":0.97,"fallback_rate":0.03,
    "latency_p50_ms":820,"latency_p95_ms":2400,"cost_amount":12.50,"cost_currency":"EUR",
    "verify_conversion":0.71,"fraud_flag":false } ],
  "timeseries": [ { "t":"...","delivered_rate":0.96 } ]
}
```

---

### 3.4 Provider Health  ·  Route UI: `/admin/rebel/providers`
**Scopo:** stato in tempo (quasi) reale dei provider.

**Componenti:**
- **Griglia card provider**: status (healthy/degraded/down), uptime %, error rate, ultima verifica, gauge latenza.
- **Tabella errori normalizzati** (codice, descrizione, count).
- **Timeline incidenti**.

**API:** `GET /admin/rebel/api/v1/providers/health`
```json
{ "providers": [
  { "key":"twilio","status":"healthy","uptime_pct":99.95,"error_rate":0.004,
    "latency_p95_ms":2400,"checked_at":"...","recent_errors":[{"code":"60200","message":"Invalid parameter","count":3}] }
]}
```
**Stati:** auto-refresh ogni N s (configurabile), badge "aggiornato alle HH:MM".

---

### 3.5 Audit Explorer  ·  Route UI: `/admin/rebel/audit`
**Scopo:** ricerca/ispezione eventi auth.

**Componenti:**
- **Filter-bar**: event_type (multiselect), guard, channel, provider, purpose, subject, esito, range date.
- **Data-table** (cursor): timestamp, event_type, subject (mascherato), aal/amr, channel/provider, purpose, risk_score, ip (mascherato). Riga cliccabile → **drawer dettaglio** (metadata sanitizzata, NIENTE OTP/secret).
- **Export ⤓** (job).

**API:** `GET /admin/rebel/api/v1/auth-events?event_type=&guard=&purpose=&subject=&from=&to=&cursor=&limit=`
```json
{ "data": [
  { "id":"evt_1","created_at":"...","event_type":"email_otp.verified","guard":"customers",
    "subject":{"type":"customer","id_masked":"cus_***1234"},"aal":"aal1","amr":["otp","email"],
    "channel":"email","provider":null,"purpose":"customer-login","risk_score":12,"ip_masked":"151.x.x.x" }
], "meta": { "next_cursor":"...","has_more":true } }
```
Dettaglio: `GET /admin/rebel/api/v1/auth-events/{id}`.
**Stati:** empty="nessun evento per i filtri"; tabella con loading rows skeleton.

---

### 3.6 Device & Session Trust  ·  Route UI: `/admin/rebel/devices`
**Scopo:** dispositivi/sessioni di un subject, trust e revoca.

**Componenti:**
- **Ricerca subject** (email mascherata / id).
- **Lista device**: fingerprint (hash troncato), trusted (badge + scadenza), last_seen, location approssimata.
- **Lista sessioni**: tipo (session/refresh), creata, scadenza, stato (active/revoked/reuse-detected), device collegato.
- **Azioni**: "Revoca sessione", "Logout everywhere", "Revoca trust device" (POST con conferma + permesso).

**API:**
- `GET /admin/rebel/api/v1/subjects/{subject}/devices`
- `GET /admin/rebel/api/v1/subjects/{subject}/sessions`
```json
{ "devices":[{"id":"dev_1","fingerprint":"a1b2…","trusted":true,"trusted_until":"...","last_seen_at":"..."}],
  "sessions":[{"id":"sess_1","type":"refresh","status":"active","device_id":"dev_1","expires_at":"..."}] }
```
- `POST /admin/rebel/api/v1/subjects/{subject}/sessions/{id}/revoke`
- `POST /admin/rebel/api/v1/subjects/{subject}/logout-everywhere`
- `POST /admin/rebel/api/v1/subjects/{subject}/devices/{id}/untrust`
**Interazioni:** azioni richiedono modal di conferma; toast esito; refetch.

---

### 3.7 Risk Rules  ·  Route UI: `/admin/rebel/risk-rules`
**Scopo:** vedere e **simulare** le regole di rischio (non applicare al volo: simulate prima).

**Componenti:**
- **Tabella regole**: nome, segnale, condizione, azione (step-up/forza driver/blocca), assurance richiesta, stato (attiva/draft).
- **Pannello Simulazione**: form (segnali in input: new_device, amount, country, b2b_credit, velocity…) → mostra outcome (richiede step-up? quale assurance? quali driver ammessi?).
- Editor regola = **draft** (non auto-apply); "Salva come draft".

**API:**
- `GET /admin/rebel/api/v1/risk-rules`
```json
{ "rules":[{"key":"high_value","signal":"amount","operator":">","value":1000,
  "action":"require_step_up","required_assurance":"aal2","phishing_resistant":true,"status":"active"}] }
```
- `POST /admin/rebel/api/v1/risk-rules/simulate`
```json
// request
{ "signals": { "new_device": true, "amount": 1500, "country":"IT", "b2b_credit": true } }
// response
{ "decision":"require_step_up","required_assurance":"aal2","require_phishing_resistant":true,
  "allowed_drivers":["fortify_passkey_confirm","fortify_totp"],"matched_rules":["high_value","b2b_credit"],
  "reasons":["amount>1000","b2b_credit"] }
```
**Interazioni:** simulate è read-only/sicuro; salvataggio regola = draft con permesso elevato.

---

### 3.8 Anomaly Detection  ·  Route UI: `/admin/rebel/anomalies`
**Scopo:** case di anomalie (sms_pumping, impossible_travel, otp_bombing…) e azioni.

**Componenti:**
- **Lista case**: tipo, severity (badge), stato (open/ack/closed), eventi collegati (count), apertura.
- **Dettaglio case (drawer/route)**: timeline eventi, segnali, metriche, mappa (se geo), azioni suggerite.
- **Azioni**: acknowledge, close, "applica mitigazione" (richiede human review se distruttiva → conferma forte + permesso).

**API:**
- `GET /admin/rebel/api/v1/anomalies?type=&severity=&status=&cursor=`
- `GET /admin/rebel/api/v1/anomalies/{case}`
```json
{ "id":"case_123","type":"sms_pumping","severity":"high","status":"open","events_count":142,
  "opened_at":"...","signals":{"prefix":"+229","velocity":"x40"},
  "timeline":[{"t":"...","event":"spike detected"}],
  "suggested_actions":[{"key":"block_prefix","label":"Blocca prefisso +229","destructive":true}] }
```
- `POST /admin/rebel/api/v1/anomalies/{case}/actions`
```json
{ "action":"block_prefix","params":{"prefix":"+229"},"confirm":true }
```
**Stati:** azioni distruttive → modal con doppia conferma + nota obbligatoria.

---

### 3.9 AI Security Copilot  ·  Route UI: `/admin/rebel/ai`  (visibile solo se `ai-guard` installato)
**Scopo:** spiegazioni/suggerimenti AI; **l'AI spiega, non decide**.

**Componenti:**
- **Box "Spiega questo case"** (input: case id) → risposta narrativa.
- **Suggerimento policy** (output = **draft**, mai auto-applicato; bottone "Salva come draft regola").
- **Natural-language query** (campo testo) → risposta + eventuale tabella.
- Banner permanente: "Output AI da rivedere. Le mitigazioni distruttive richiedono human review."

**API:**
- `POST /admin/rebel/api/v1/ai/anomalies/{case}/explain` → `{ "explanation":"...", "confidence":"medium", "sources":[...] }`
- `POST /admin/rebel/api/v1/ai/policies/suggest` → `{ "draft_rule": {...}, "rationale":"..." }`
**Stati:** loading "sto pensando…"; gestire fallback se provider AI assente/non configurato (messaggio chiaro).

---

### 3.10 Compliance Center  ·  Route UI: `/admin/rebel/compliance`
**Scopo:** evidenze NIST/PSD2/GDPR e retention.

**Componenti:**
- **Schede**: NIST AAL (distribuzione aal/amr negli eventi), PSD2/SCA (step-up con dynamic linking, esenzioni applicate), GDPR (stato retention/pseudonimizzazione, export/erasure log).
- **Tabella retention** per tenant (cosa scade quando).
- **Export evidenze** (job) per audit/dispute.

**API:** `GET /admin/rebel/api/v1/compliance/overview`
```json
{ "nist":{"aal_distribution":{"aal1":0.7,"aal2":0.28,"aal3":0.02}},
  "psd2":{"sca_events":120,"dynamic_linked":118,"exemptions":{"low_value":40,"tra":12}},
  "gdpr":{"retention_tiers":[{"name":"detail","days":30}],"pending_erasures":2,"last_prune_at":"..."} }
```

---

## 4. Libreria componenti riutilizzabili (da realizzare nel template)

```text
KpiCard(value, delta_pct, sparkline, label, intent)         intent: neutral|good|warn|bad
FunnelChart(stages[])                                       con % drop tra stadi
LineChart / BarChart(series[])                              SVG/canvas, no dipendenze pesanti
DataTable(columns, rows, cursor, onRowClick, onLoadMore)    cursor pagination + skeleton
StatusBadge(status)                                         healthy|degraded|down|active|revoked…
SeverityBadge(severity)                                     low|medium|high|critical
HealthGauge(latency, threshold)
Timeline(items[])
Drawer(title, body, actions)                                pannello laterale dettaglio
ConfirmModal(title, body, danger, requireNote)              per azioni distruttive
FilterBar(filters[], onChange)
Toast(type, message)                                        success|error|info
JsonViewer(object)                                          metadata sanitizzata, collassabile
EmptyState(icon, title, hint, cta) / ErrorState(retry) / SkeletonBlock(shape)
PeriodSelector / TenantSwitcher                             nel topbar, emettono rebel:context-changed
```

---

## 5. Design tokens (Bootstrap-compatible, CSS variables)

```css
:root{
  /* intents */
  --rebel-good:#1f9d55; --rebel-warn:#d9822b; --rebel-bad:#cc1f1a; --rebel-info:#2779bd; --rebel-neutral:#606f7b;
  /* severity */
  --rebel-sev-low:#3490dc; --rebel-sev-medium:#f6993f; --rebel-sev-high:#e3342f; --rebel-sev-critical:#9b1c1c;
  /* surface (light) */
  --rebel-bg:#f7f8fa; --rebel-surface:#ffffff; --rebel-border:#e2e8f0; --rebel-text:#1a202c; --rebel-muted:#718096;
  --rebel-radius:10px; --rebel-shadow:0 1px 3px rgba(0,0,0,.08); --rebel-gap:16px;
}
[data-theme="dark"]{
  --rebel-bg:#0f141a; --rebel-surface:#161d26; --rebel-border:#2a3542; --rebel-text:#e6edf3; --rebel-muted:#8b98a5;
  --rebel-shadow:0 1px 3px rgba(0,0,0,.4);
}
```
Mappa risk/assurance ai colori: `aal1=neutral`, `aal2=info`, `aal3/phishing_resistant=good`; risk `low=good, medium=warn, high/critical=bad`.

---

## 6. Asset & struttura (per quando arriverà il package `-admin`)

```text
resources/screenshoots/Laravel-Rebel-banner.png      (banner condiviso)
resources/views/vendor/rebel-admin/layout.blade.php
resources/views/vendor/rebel-admin/<section>.blade.php
public/vendor/rebel-admin/rebel-admin.js             (client + widget loader)
public/vendor/rebel-admin/rebel-admin.css            (design tokens + componenti)
```
Convenzione: ogni sezione = una view Blade che rende lo scheletro + monta i widget via `data-rebel-widget="..."` e `data-endpoint="..."`; `rebel-admin.js` scansiona il DOM e idrata.

---

## 7. Checklist accettazione template
```text
[ ] shell con tenant switcher + period selector + theme toggle funzionanti (mock)
[ ] tutte le 10 sezioni come pagine con layout e widget placeholder
[ ] stati loading/empty/error disegnati per ogni widget
[ ] componenti riutilizzabili (§4) realizzati e documentati
[ ] design tokens light/dark
[ ] responsive (sidebar collapsible) + accessibilità base
[ ] mock JSON conformi agli esempi di questo doc per provare l'idratazione
```

> Quando il template è pronto, indicami **dove l'hai salvato** (path) e procederò con l'implementazione del package `-admin` montandoci sopra l'Admin API reale.
