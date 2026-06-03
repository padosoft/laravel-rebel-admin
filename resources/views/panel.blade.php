<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Laravel Rebel — {{ $current['label'] }}</title>
    <link rel="stylesheet" href="{{ asset('vendor/rebel-admin/rebel-admin.css') }}">
    <script>
        // Apply the saved theme before paint to avoid a flash.
        try {
            var t = localStorage.getItem('rebel-theme');
            if (t) { document.documentElement.setAttribute('data-theme', t); }
        } catch (e) {}
    </script>
</head>
<body class="rebel">
    <div class="rebel-app">
        <header class="rebel-topbar">
            <div class="rebel-brand" aria-label="Laravel Rebel">⚡ <strong>Laravel Rebel</strong></div>
            <div class="rebel-topbar-controls">
                <label class="rebel-field">
                    <span class="rebel-sr">Tenant</span>
                    <select id="rebel-tenant" data-rebel-tenant>
                        <option value="">All tenants</option>
                    </select>
                </label>
                <label class="rebel-field">
                    <span class="rebel-sr">Period</span>
                    <select id="rebel-period" data-rebel-period>
                        <option value="24h">Last 24h</option>
                        <option value="7d" selected>Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                    </select>
                </label>
                <button type="button" class="rebel-btn" data-rebel-theme-toggle aria-label="Toggle theme">◐</button>
                <div class="rebel-user">●</div>
            </div>
        </header>

        <div class="rebel-body">
            <nav class="rebel-sidebar" aria-label="Sections">
                <ul>
                    @foreach ($sections as $section)
                        <li>
                            <a href="{{ url(trim(config('rebel-admin.prefix', 'admin/rebel').'/'.$section['path'], '/')) }}"
                               class="rebel-nav-item @if($section['key'] === $current['key']) is-active @endif"
                               @if($section['key'] === $current['key']) aria-current="page" @endif>
                                {{ $section['label'] }}
                            </a>
                        </li>
                    @endforeach
                </ul>
            </nav>

            <main class="rebel-content" id="rebel-content">
                <div class="rebel-breadcrumb">Rebel · <span>{{ $current['label'] }}</span></div>
                <h1 class="rebel-title">{{ $current['label'] }}</h1>

                @if ($current['endpoint'])
                    @if ($current['key'] === 'overview')
                        <section class="rebel-grid"
                                 data-rebel-widget="overview"
                                 data-endpoint="{{ $current['endpoint'] }}"
                                 aria-live="polite">
                            <div class="rebel-skeleton" data-rebel-loading>Loading…</div>
                        </section>
                    @elseif ($current['key'] === 'audit')
                        <section class="rebel-table-wrap"
                                 data-rebel-widget="audit"
                                 data-endpoint="{{ $current['endpoint'] }}"
                                 aria-live="polite">
                            <div class="rebel-skeleton" data-rebel-loading>Loading events…</div>
                        </section>
                    @endif
                @else
                    <section class="rebel-empty">
                        <p class="rebel-empty-title">{{ $current['label'] }}</p>
                        <p class="rebel-muted">This section's data endpoint ships in an upcoming release of
                            <code>laravel-rebel-admin-api</code>. The panel shell, navigation and theming are ready.</p>
                    </section>
                @endif
            </main>
        </div>
    </div>

    <div class="rebel-toasts" id="rebel-toasts" aria-live="assertive"></div>

    <script>
        window.RebelAdmin = window.RebelAdmin || {};
        window.RebelAdmin.state = {
            apiBase: @json($apiBase),
            csrfToken: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            tenant: null,
            period: '7d',
        };
    </script>
    <script src="{{ asset('vendor/rebel-admin/rebel-admin.js') }}" defer></script>
</body>
</html>
