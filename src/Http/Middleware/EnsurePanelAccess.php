<?php

declare(strict_types=1);

namespace Padosoft\Rebel\Admin\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Access\Gate;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Web-facing access gate for the panel: unauthenticated users are redirected to login,
 * and authenticated users without the configured ability get a 403. Mirrors the
 * fail-closed posture of the Admin API (default ability 'rebel-admin').
 */
final class EnsurePanelAccess
{
    public function __construct(
        private readonly AuthFactory $auth,
        private readonly Gate $gate,
        private readonly Repository $config,
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $guard = $this->stringConfig('rebel-admin.guard');
        $user = $this->auth->guard($guard === '' ? null : $guard)->user();

        if ($user === null) {
            $redirect = $this->stringConfig('rebel-admin.login_redirect');

            // Only allow a same-site relative path (no scheme/host, no protocol-relative
            // '//host') so a misconfigured value can't become an open redirect.
            $safe = str_starts_with($redirect, '/') && ! str_starts_with($redirect, '//')
                ? $redirect
                : '/login';

            return redirect()->to($safe);
        }

        $ability = $this->stringConfig('rebel-admin.ability');

        if ($ability !== '' && $this->gate->forUser($user)->denies($ability)) {
            abort(403);
        }

        return $next($request);
    }

    private function stringConfig(string $key): string
    {
        $value = $this->config->get($key);

        return is_string($value) ? $value : '';
    }
}
