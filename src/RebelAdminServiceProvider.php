<?php

declare(strict_types=1);

namespace Padosoft\Rebel\Admin;

use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

/**
 * The Laravel Rebel Web Admin Panel: a Blade + vanilla-JS security-operations dashboard
 * that hydrates entirely from the Rebel Admin API.
 */
final class RebelAdminServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package
            ->name('laravel-rebel-admin')
            ->hasConfigFile('rebel-admin')
            ->hasViews('rebel-admin')
            ->hasAssets()
            ->hasRoute('web');
    }
}
