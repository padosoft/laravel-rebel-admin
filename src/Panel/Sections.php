<?php

declare(strict_types=1);

namespace Padosoft\Rebel\Admin\Panel;

/**
 * The panel's navigation: the 10 control-plane sections (see
 * docs/admin-panel-template-spec.md). Each entry drives a sidebar link and a page.
 * `endpoint` (when set) is the Admin API path the section's widgets hydrate from;
 * sections without one yet render an "endpoint pending" state.
 */
final class Sections
{
    /**
     * @return list<array{key: string, label: string, path: string, icon: string, endpoint: ?string}>
     */
    public static function all(): array
    {
        return [
            ['key' => 'overview', 'label' => 'Security Overview', 'path' => '', 'icon' => 'shield', 'endpoint' => 'security/overview'],
            ['key' => 'funnels', 'label' => 'OTP & Step-up Funnels', 'path' => 'funnels', 'icon' => 'filter', 'endpoint' => null],
            ['key' => 'channels', 'label' => 'Channel Performance', 'path' => 'channels', 'icon' => 'signal', 'endpoint' => null],
            ['key' => 'providers', 'label' => 'Provider Health', 'path' => 'providers', 'icon' => 'heart', 'endpoint' => null],
            ['key' => 'audit', 'label' => 'Audit Explorer', 'path' => 'audit', 'icon' => 'list', 'endpoint' => 'auth-events'],
            ['key' => 'devices', 'label' => 'Device & Session Trust', 'path' => 'devices', 'icon' => 'device', 'endpoint' => null],
            ['key' => 'risk', 'label' => 'Risk Rules', 'path' => 'risk-rules', 'icon' => 'scale', 'endpoint' => null],
            ['key' => 'anomalies', 'label' => 'Anomaly Detection', 'path' => 'anomalies', 'icon' => 'alert', 'endpoint' => null],
            ['key' => 'ai', 'label' => 'AI Security Copilot', 'path' => 'ai', 'icon' => 'sparkles', 'endpoint' => null],
            ['key' => 'compliance', 'label' => 'Compliance Center', 'path' => 'compliance', 'icon' => 'check', 'endpoint' => null],
        ];
    }

    /**
     * @return array{key: string, label: string, path: string, icon: string, endpoint: ?string}|null
     */
    public static function find(string $key): ?array
    {
        foreach (self::all() as $section) {
            if ($section['key'] === $key) {
                return $section;
            }
        }

        return null;
    }
}
