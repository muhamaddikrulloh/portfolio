<?php

namespace App\Support;

class UrlValidator
{
    public const SOCIAL_PLATFORMS = [
        'github' => 'GitHub',
        'linkedin' => 'LinkedIn',
        'instagram' => 'Instagram',
        'facebook' => 'Facebook',
        'youtube' => 'YouTube',
        'tiktok' => 'TikTok',
        'twitter' => 'X (Twitter)',
        'threads' => 'Threads',
    ];

    public static function safeContactHttpsUrl(mixed $value): ?string
    {
        if (! is_string($value) || ! preg_match('/^https:\/\//i', $value) || preg_match('/[\s\\\\]/', $value)) {
            return null;
        }

        $parts = parse_url($value);
        if ($parts === false || empty($parts['scheme']) || strtolower($parts['scheme']) !== 'https' || empty($parts['host'])) {
            return null;
        }

        if (! empty($parts['user']) || ! empty($parts['pass'])) {
            return null;
        }

        return $value;
    }

    /**
     * @param  array{label?: string, value?: string, type?: string|null, url?: string|null}  $row
     */
    public static function contactRowHref(array $row): ?string
    {
        $label = (string) ($row['label'] ?? '');
        $value = (string) ($row['value'] ?? '');
        $url = isset($row['url']) && is_string($row['url']) && trim($row['url']) !== '' ? trim($row['url']) : null;
        $type = isset($row['type']) && is_string($row['type']) && $row['type'] !== ''
            ? $row['type']
            : (str_contains(strtolower($label), 'email') ? 'email' : 'text');

        if ($type === 'location' || $type === 'text') {
            return null;
        }

        if ($type === 'email') {
            $email = $url !== null ? (string) preg_replace('/^mailto:/i', '', $url) : $value;

            return preg_match('/^[^\s@?&#%:]+@[^\s@?&#%:]+\.[^\s@?&#%:]+$/', $email)
                ? 'mailto:'.$email
                : null;
        }

        if ($type === 'phone') {
            $phone = $url !== null ? (string) preg_replace('/^tel:/i', '', $url) : $value;

            return preg_match('/^\+?[0-9](?:[0-9 .()-]*[0-9])?\z/', $phone)
                ? 'tel:'.preg_replace('/[ .()-]/', '', $phone)
                : null;
        }

        if ($type === 'link' || array_key_exists($type, self::SOCIAL_PLATFORMS)) {
            return self::safeContactHttpsUrl($url ?? $value);
        }

        return null;
    }
}
