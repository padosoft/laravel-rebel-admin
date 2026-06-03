<!DOCTYPE html>
<html lang="en" data-theme="dark" data-density="regular" data-glow="on">
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
            if (t) { document.documentElement.dataset.theme = t; }
        } catch (e) {}
    </script>
</head>
<body>
    {{-- The full React admin panel SPA mounts here. The Blade layer only renders the
         fail-closed shell + a boot object; all UI + data-fetching happens client-side
         against the Admin API. --}}
    <div id="rebel-admin-root"></div>

    <script>
        window.RebelAdminBoot = {
            apiBase: @json($apiBase),
            csrfToken: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            section: @json($current['key']),
            prefix: @json(config('rebel-admin.prefix', 'admin/rebel')),
        };
    </script>
    <script src="{{ asset('vendor/rebel-admin/rebel-admin.js') }}" defer></script>
</body>
</html>
