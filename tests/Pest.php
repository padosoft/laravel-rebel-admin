<?php

declare(strict_types=1);

use Illuminate\Auth\GenericUser;
use Illuminate\Support\Facades\Gate;
use Padosoft\Rebel\Admin\Tests\TestCase;

uses(TestCase::class)->in(__DIR__);

/** Authenticate as an admin who passes the (fail-closed) `rebel-admin` ability. */
function actingAsPanelAdmin(): void
{
    Gate::define('rebel-admin', fn (): bool => true);
    test()->actingAs(new GenericUser(['id' => 1]));
}
