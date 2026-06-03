<?php

declare(strict_types=1);

return [

    // Where the web panel is mounted (UI routes).
    'prefix' => env('REBEL_ADMIN_PREFIX', 'admin/rebel'),

    // Base middleware for the panel routes (session/web). EnsurePanelAccess is appended.
    'middleware' => ['web'],

    // Auth guard the panel requires ('' = app default).
    'guard' => env('REBEL_ADMIN_GUARD', ''),

    // Gate ability required to view the panel. Fail-closed by default (define the Gate).
    'ability' => env('REBEL_ADMIN_ABILITY', 'rebel-admin'),

    // Base URL the panel's JS calls for data — the Rebel Admin API prefix.
    'api_base' => env('REBEL_ADMIN_API_BASE', '/rebel/admin/api/v1'),

    // Where unauthenticated users are sent (named route or path).
    'login_redirect' => env('REBEL_ADMIN_LOGIN_REDIRECT', '/login'),

];
