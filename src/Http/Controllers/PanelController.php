<?php

declare(strict_types=1);

namespace Padosoft\Rebel\Admin\Http\Controllers;

use Illuminate\Http\Response;
use Padosoft\Rebel\Admin\Panel\Sections;

/**
 * Renders the single-page shell for a given section. The Blade output is just the
 * skeleton + widget placeholders; the data is hydrated client-side from the Admin API.
 */
final class PanelController
{
    public function show(string $section = 'overview'): Response
    {
        $current = Sections::find($section);

        if ($current === null) {
            abort(404);
        }

        return response()->view('rebel-admin::panel', [
            'sections' => Sections::all(),
            'current' => $current,
            'apiBase' => $this->apiBase(),
        ]);
    }

    private function apiBase(): string
    {
        $value = config('rebel-admin.api_base');

        return is_string($value) ? $value : '/rebel/admin/api/v1';
    }
}
