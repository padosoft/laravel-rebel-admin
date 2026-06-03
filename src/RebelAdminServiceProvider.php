<?php

declare(strict_types=1);

namespace Padosoft\Rebel\Admin;

use Spatie\LaravelPackageTools\Package;
use Spatie\LaravelPackageTools\PackageServiceProvider;

/**
 * Skeleton iniziale di padosoft/laravel-rebel-admin. Implementazione in arrivo.
 */
final class RebelAdminServiceProvider extends PackageServiceProvider
{
    public function configurePackage(Package $package): void
    {
        $package->name('laravel-rebel-admin');
    }
}
