<?php

declare(strict_types=1);
use Illuminate\Auth\GenericUser;

it('redirects unauthenticated visitors to login', function (): void {
    $this->get('/admin/rebel')->assertRedirect('/login');
});

it('never open-redirects to an absolute login URL', function (): void {
    config()->set('rebel-admin.login_redirect', 'https://evil.example/login');

    $this->get('/admin/rebel')->assertRedirect('/login');
});

it('renders the panel shell for an authorized admin', function (): void {
    actingAsPanelAdmin();

    $this->get('/admin/rebel')
        ->assertOk()
        ->assertSee('Laravel Rebel')
        ->assertSee('Security Overview')   // the active section
        ->assertSee('Audit Explorer')      // a sidebar nav entry
        ->assertSee('data-rebel-widget="overview"', false);
});

it('references the published asset path (vendor/rebel-admin), not the package name', function (): void {
    actingAsPanelAdmin();

    // spatie/laravel-package-tools publishes hasAssets() to public/vendor/{shortName},
    // and the short name strips the "laravel-" prefix => "rebel-admin". The panel must
    // point at that exact path or the CSS/JS 404 in a real app.
    $this->get('/admin/rebel')
        ->assertOk()
        ->assertSee('vendor/rebel-admin/rebel-admin.css', false)
        ->assertSee('vendor/rebel-admin/rebel-admin.js', false)
        ->assertDontSee('vendor/laravel-rebel-admin/', false);
});

it('renders a specific section', function (): void {
    actingAsPanelAdmin();

    $this->get('/admin/rebel/audit')
        ->assertOk()
        ->assertSee('Audit Explorer')
        ->assertSee('data-rebel-widget="audit"', false);
});

it('shows an endpoint-pending state for sections without an API yet', function (): void {
    actingAsPanelAdmin();

    $this->get('/admin/rebel/compliance')
        ->assertOk()
        ->assertSee('Compliance Center')
        ->assertSee('upcoming release');
});

it('404s an unknown section', function (): void {
    actingAsPanelAdmin();

    $this->get('/admin/rebel/does-not-exist')->assertNotFound();
});

it('is fail-closed for an authenticated user without the ability', function (): void {
    $this->actingAs(new GenericUser(['id' => 2]));

    $this->get('/admin/rebel')->assertForbidden();
});
