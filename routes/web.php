<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Padosoft\Rebel\Admin\Http\Controllers\PanelController;
use Padosoft\Rebel\Admin\Http\Middleware\EnsurePanelAccess;

$prefix = config('rebel-admin.prefix', 'admin/rebel');
$middleware = array_merge((array) config('rebel-admin.middleware', ['web']), [EnsurePanelAccess::class]);

Route::prefix(is_string($prefix) ? $prefix : 'admin/rebel')
    ->middleware($middleware)
    ->group(function (): void {
        Route::get('/', fn () => app(PanelController::class)->show('overview'))->name('rebel-admin.home');
        Route::get('/{section}', [PanelController::class, 'show'])->name('rebel-admin.section');
    });
