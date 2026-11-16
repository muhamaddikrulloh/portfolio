<?php

namespace App\Support;

class ViteManifest
{
    /** @var array<string, mixed>|null */
    private static ?array $manifest = null;

    /**
     * @return array<string, mixed>
     */
    private static function load(): array
    {
        if (self::$manifest !== null) {
            return self::$manifest;
        }

        $path = public_path('build/manifest.json');
        if (! is_file($path)) {
            return self::$manifest = [];
        }

        $decoded = json_decode((string) file_get_contents($path), true);

        return self::$manifest = is_array($decoded) ? $decoded : [];
    }

    /**
     * Return critical CSS contents and asset URLs for a given Inertia page component.
     *
     * @return array{inlineCss: string, stylesheets: list<string>, modulePreloads: list<string>, scripts: list<string>, isHot: bool}
     */
    public static function assetsForComponent(string $component, bool $inlineCss = true): array
    {
        $hotFile = public_path('hot');
        if (is_file($hotFile)) {
            return [
                'inlineCss' => '',
                'stylesheets' => [],
                'modulePreloads' => [],
                'scripts' => [],
                'isHot' => true,
            ];
        }

        $manifest = self::load();
        $entries = [
            'resources/css/app.css',
            'resources/js/app.tsx',
            "resources/js/Pages/{$component}.tsx",
        ];

        $visited = [];
        $cssFiles = [];
        $jsFiles = [];

        $walk = static function (string $key) use (&$walk, &$visited, &$cssFiles, &$jsFiles, $manifest): void {
            if (isset($visited[$key]) || ! isset($manifest[$key]) || ! is_array($manifest[$key])) {
                return;
            }
            $visited[$key] = true;
            $chunk = $manifest[$key];

            if (! empty($chunk['file']) && is_string($chunk['file'])) {
                if (str_ends_with($chunk['file'], '.css')) {
                    $cssFiles[$chunk['file']] = true;
                } elseif (str_ends_with($chunk['file'], '.js')) {
                    $jsFiles[$chunk['file']] = true;
                }
            }

            foreach ($chunk['css'] ?? [] as $css) {
                if (is_string($css)) {
                    $cssFiles[$css] = true;
                }
            }

            foreach ($chunk['imports'] ?? [] as $imp) {
                if (is_string($imp)) {
                    $walk($imp);
                }
            }
        };

        foreach ($entries as $entry) {
            $walk($entry);
        }

        $orderedCss = array_keys($cssFiles);
        $combinedCss = '';
        $stylesheets = [];

        if ($inlineCss) {
            foreach ($orderedCss as $relPath) {
                $fullPath = public_path('build/'.$relPath);
                if (is_file($fullPath)) {
                    $combinedCss .= file_get_contents($fullPath)."\n";
                } else {
                    $stylesheets[] = '/build/'.$relPath;
                }
            }
        } else {
            foreach ($orderedCss as $relPath) {
                $stylesheets[] = '/build/'.$relPath;
            }
        }

        $entryJs = isset($manifest['resources/js/app.tsx']['file'])
            ? (string) $manifest['resources/js/app.tsx']['file']
            : '';

        $preloads = [];
        $scripts = [];
        foreach (array_keys($jsFiles) as $relPath) {
            $url = '/build/'.$relPath;
            $preloads[] = $url;
            if ($relPath === $entryJs) {
                $scripts[] = $url;
            }
        }

        return [
            'inlineCss' => $combinedCss,
            'stylesheets' => $stylesheets,
            'modulePreloads' => $preloads,
            'scripts' => $scripts,
            'isHot' => false,
        ];
    }
}
