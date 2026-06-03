<?php

declare(strict_types=1);
use Illuminate\Auth\GenericUser;
use Padosoft\Rebel\Admin\Panel\Sections;

it('redirects unauthenticated visitors to login', function (): void {
    $this->get('/admin/rebel')->assertRedirect('/login');
});

it('never open-redirects to an absolute login URL', function (): void {
    config()->set('rebel-admin.login_redirect', 'https://evil.example/login');

    $this->get('/admin/rebel')->assertRedirect('/login');
});

it('serves the SPA host for an authorized admin', function (): void {
    actingAsPanelAdmin();

    $this->get('/admin/rebel')
        ->assertOk()
        ->assertSee('Laravel Rebel')
        ->assertSee('Security Overview')          // page <title> = current section label
        ->assertSee('id="rebel-admin-root"', false) // the React mount point
        ->assertSee('RebelAdminBoot', false);       // the client boot object
});

it('references the published asset path (vendor/rebel-admin), not the package name', function (): void {
    actingAsPanelAdmin();

    // spatie/laravel-package-tools publishes hasAssets() to public/vendor/{shortName},
    // and the short name strips the "laravel-" prefix => "rebel-admin".
    $this->get('/admin/rebel')
        ->assertOk()
        ->assertSee('vendor/rebel-admin/rebel-admin.css', false)
        ->assertSee('vendor/rebel-admin/rebel-admin.js', false)
        ->assertDontSee('vendor/laravel-rebel-admin/', false);
});

it('boots the SPA with the requested section and resolves every sidebar URL', function (): void {
    actingAsPanelAdmin();

    // The sidebar links to each section's `path`; the route resolves that segment.
    // 'risk-rules' (path) maps to key 'risk' — it must not 404.
    foreach (Sections::all() as $section) {
        $url = trim('/admin/rebel/'.$section['path'], '/');

        $this->get($url)
            ->assertOk()
            ->assertSee($section['label'])                  // <title> label
            ->assertSee('section: "'.$section['key'].'"', false); // boot picks the right page
    }
});

it('404s an unknown section', function (): void {
    actingAsPanelAdmin();

    $this->get('/admin/rebel/does-not-exist')->assertNotFound();
});

it('is fail-closed for an authenticated user without the ability', function (): void {
    $this->actingAs(new GenericUser(['id' => 2]));

    $this->get('/admin/rebel')->assertForbidden();
});
