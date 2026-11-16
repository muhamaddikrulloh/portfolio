<?php

namespace App\Support;

use App\Models\Media;
use App\Services\PortfolioDataService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\File\File;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Throwable;

class ImageVariants
{
    private const VERSION = 4;

    private const MAX_BYTES = 20971520;

    private const MAX_PIXELS = 30000000;

    private const MAX_DIMENSION = 12000;

    private const WIDTHS = [480, 960, 1600, 2400, 3200];

    public static function storageName(File $file): string
    {
        $extension = match ($file->getMimeType()) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/avif' => 'avif',
            'application/pdf' => 'pdf',
            default => throw new RuntimeException('unsupported_source'),
        };
        $original = $file instanceof UploadedFile ? $file->getClientOriginalName() : $file->getFilename();
        $stem = Str::slug(pathinfo(basename(str_replace('\\', '/', $original)), PATHINFO_FILENAME));

        return substr($stem ?: 'media', 0, 80).'-'.bin2hex(random_bytes(12)).'.'.$extension;
    }

    public static function convertUpload(Media $media): void
    {
        $snapshot = $media->getConnection()->transactionLevel() > 0 ? clone $media : $media;
        $convert = static function () use ($snapshot): void {
            try {
                self::convertCommittedUpload($snapshot);
            } catch (Throwable $exception) {
                Log::error('Media upload conversion failed; original retained', ['media_id' => $snapshot->getKey(), 'exception' => $exception::class]);
            }
        };
        if ($media->getConnection()->transactionLevel() > 0) {
            $media->getConnection()->afterCommit($convert);

            return;
        }
        $convert();
    }

    private static function convertCommittedUpload(Media $media): void
    {
        $source = self::source($media);
        if ($source === null || self::signature($source) === null || ! in_array((new \finfo(FILEINFO_MIME_TYPE))->file($source), ['image/jpeg', 'image/png', 'image/avif', 'image/webp'], true)) {
            return;
        }
        if ((new \finfo(FILEINFO_MIME_TYPE))->file($source) === 'image/webp') {
            return;
        }
        $original = $media->filename;
        $sourceHash = hash_file('sha256', $source);
        self::generate($media);
        $pages = self::pages($media);
        if ($pages === []) {
            return;
        }
        $page = $pages[0];
        $variant = $page['variants'][array_key_last($page['variants'])];
        $name = self::storageName(new UploadedFile(public_path(ltrim($variant['url'], '/')), pathinfo($original, PATHINFO_FILENAME).'.webp', 'image/webp', null, true));
        self::publish($source, $name, function (string $temporary) use ($variant): void {
            if (! copy(public_path(ltrim($variant['url'], '/')), $temporary)) {
                throw new RuntimeException('write_failed');
            }
        });
        $output = (new Media(['filename' => $name]))->setConnection($media->getConnectionName());
        $outputSource = self::source($output);
        $data = self::readManifest($source);
        $data['signature'] = self::signature($outputSource);
        $data['hash'] = hash_file('sha256', $outputSource);
        foreach ($data['pages'] as &$outputPage) {
            foreach ($outputPage['variants'] as &$outputVariant) {
                $previous = self::variantPath($source, $outputVariant['name']);
                $outputVariant['name'] = 'variant-v'.self::VERSION.'-'.hash('sha256', $name).'-'.$data['hash'].'-p1-'.$outputVariant['width'].'.webp';
                self::publish($outputSource, 'variants/'.$outputVariant['name'], function (string $temporary) use ($previous): void {
                    if (! copy($previous, $temporary)) {
                        throw new RuntimeException('write_failed');
                    }
                });
            }
            unset($outputVariant);
        }
        unset($outputPage);
        self::writeManifest($outputSource, $data);
        if (self::pages($output) === []) {
            return;
        }
        $connection = $media->getConnection();
        $connection->transaction(function () use ($media, $original, $name, $variant, $source, $sourceHash): void {
            $current = Media::on($media->getConnectionName())->lockForUpdate()->find($media->getKey());
            if (! $current || $current->filename !== $original || self::signature($source) === null || hash_file('sha256', $source) !== $sourceHash) {
                return;
            }
            $current->forceFill([
                'filename' => $name,
                'url' => '/media/'.rawurlencode($name),
                'mime_type' => 'image/webp',
                'filesize' => filesize(public_path('media/'.$name)),
                'width' => $variant['width'],
                'height' => $variant['height'],
            ])->saveQuietly();
            $media->setRawAttributes($current->getAttributes(), true);
            $media->getConnection()->afterCommit(function () use ($media, $original): void {
                self::cleanup((new Media(['filename' => $original]))->setConnection($media->getConnectionName()));
                PortfolioDataService::invalidateAll();
            });
        });
    }

    public static function capabilities(): array
    {
        static $result;
        if (isset($result)) {
            return $result;
        }
        $result = ['gd' => false, 'imagick' => false, 'pdf' => false];
        $directory = sys_get_temp_dir().'/portfolio-webp-'.bin2hex(random_bytes(12));
        if (! @mkdir($directory, 0700)) {
            return $result;
        }
        try {
            if (function_exists('imagewebp') && function_exists('imagecreatefromwebp')) {
                $image = imagecreatetruecolor(2, 2);
                try {
                    imagesetpixel($image, 0, 0, 0x193B71);
                    imagesetpixel($image, 1, 1, 0xD2A617);
                    if (defined('IMG_WEBP_LOSSLESS') && @imagewebp($image, $directory.'/gd.webp', IMG_WEBP_LOSSLESS)) {
                        $decoded = @imagecreatefromwebp($directory.'/gd.webp');
                        if ($decoded) {
                            $result['gd'] = imagesx($decoded) === 2 && imagesy($decoded) === 2
                                && imagecolorat($decoded, 0, 0) === imagecolorat($image, 0, 0)
                                && imagecolorat($decoded, 1, 1) === imagecolorat($image, 1, 1);
                            imagedestroy($decoded);
                        }
                    }
                } finally {
                    imagedestroy($image);
                }
            }
            if (class_exists(\Imagick::class)) {
                self::withImagickLimits(function () use ($directory, &$result): void {
                    $image = new \Imagick;
                    try {
                        $image->newImage(2, 2, 'white');
                        self::saveImagick($image, $directory.'/imagick.webp');
                        $result['imagick'] = true;
                    } finally {
                        $image->clear();
                    }
                });
            }
        } catch (Throwable) {
        } finally {
            foreach (['gd.webp', 'imagick.webp', 'probe.pdf', 'pdf.webp'] as $name) {
                if (is_file($directory.'/'.$name)) {
                    @unlink($directory.'/'.$name);
                }
            }
            @rmdir($directory);
        }

        return $result;
    }

    public static function generate(Media $media, bool $allPages = true): void
    {
        $source = self::source($media);
        if ($source === null || ! is_dir(dirname($source))) {
            return;
        }
        if (in_array((new \finfo(FILEINFO_MIME_TYPE))->file($source), ['application/pdf', 'image/webp'], true)) {
            return;
        }
        $lock = self::lock($source);
        if ($lock === false) {
            return;
        }
        $created = [];
        $data = [
            'version' => self::VERSION,
            'signature' => self::signature($source),
            'hash' => null,
            'mode' => $allPages ? 'all' : 'first',
            'encoding' => 'lossless-webp',
            'status' => 'failed',
            'diagnostic' => 'source_unavailable',
            'pages' => [],
        ];
        try {
            $signature = $data['signature'];
            if ($signature === null) {
                self::writeManifest($source, $data);

                return;
            }
            if ($signature['size'] < 1 || $signature['size'] > self::MAX_BYTES) {
                throw new RuntimeException('source_size_limit');
            }
            $hash = @hash_file('sha256', $source);
            if (! is_string($hash)) {
                throw new RuntimeException('source_unavailable');
            }
            $data['hash'] = $hash;
            $previous = self::readManifest($source);
            if (($previous['hash'] ?? null) === $hash && (($previous['mode'] ?? null) === $data['mode'] || ($previous['mode'] ?? null) === 'all' && ! $allPages)
                && ($previous['signature'] ?? null) === $signature && self::validPages($source, $previous) !== []) {
                return;
            }
            $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($source);
            $capabilities = self::capabilities();
            if (! in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], true)) {
                $data['status'] = 'unsupported';
                throw new RuntimeException('unsupported_source');
            }
            $data['kind'] = 'image';
            $prefix = 'variant-v'.self::VERSION.'-'.hash('sha256', basename($source)).'-'.$hash;
            if ($capabilities['gd']) {
                $data['pages'][] = self::generateGd($source, $prefix, $created);
            } elseif ($capabilities['imagick']) {
                self::withImagickLimits(function () use ($source, $prefix, &$data, &$created): void {
                    $info = @getimagesize($source);
                    self::dimensions((int) ($info[0] ?? 0), (int) ($info[1] ?? 0));
                    $image = new \Imagick;
                    try {
                        $image->readImage($source.'[0]');
                        self::dimensions($image->getImageWidth(), $image->getImageHeight());
                        $image->autoOrient();
                        $image->setImageOrientation(\Imagick::ORIENTATION_TOPLEFT);
                        if ($image->getImageColorspace() === \Imagick::COLORSPACE_CMYK) {
                            $image->transformImageColorspace(\Imagick::COLORSPACE_SRGB);
                        }
                        $width = $image->getImageWidth();
                        $height = $image->getImageHeight();
                        $variants = [];
                        foreach (self::widths($width) as $size) {
                            $targetHeight = max(1, (int) round($height * $size / $width));
                            $resized = clone $image;
                            try {
                                if ($size !== $width) {
                                    $resized->resizeImage($size, $targetHeight, \Imagick::FILTER_LANCZOS, 1);
                                }
                                $name = $prefix.'-p1-'.$size.'.webp';
                                self::publish($source, 'variants/'.$name, fn ($temporary) => self::saveImagick($resized, $temporary));
                                $created[] = $name;
                                $variants[] = ['name' => $name, 'width' => $size, 'height' => $targetHeight];
                            } finally {
                                $resized->clear();
                            }
                        }
                        $data['pages'][] = ['width' => $width, 'height' => $height, 'variants' => $variants];
                    } finally {
                        $image->clear();
                    }
                });
            } else {
                $data['status'] = 'unsupported';
                throw new RuntimeException('webp_unavailable');
            }
            if (self::signature($source) !== $signature || @hash_file('sha256', $source) !== $hash) {
                throw new RuntimeException('source_changed');
            }
            if ($data['pages'] === []) {
                throw new RuntimeException('decode_failed');
            }
            $data['status'] = ! empty($data['truncated']) ? 'limited' : 'ready';
            $data['diagnostic'] = ! empty($data['truncated']) ? 'page_limit' : null;
            self::writeManifest($source, $data);
            self::removeOwned($source, $created);
        } catch (Throwable $exception) {
            foreach ($created as $name) {
                self::removeFile(dirname($source).'/variants/'.$name);
            }
            $allowed = ['source_unavailable', 'source_size_limit', 'source_changed', 'pixel_limit', 'memory_limit', 'orientation_unavailable', 'unsupported_source', 'pdf_unavailable', 'webp_unavailable', 'decode_failed', 'write_failed'];
            $data['diagnostic'] = in_array($exception->getMessage(), $allowed, true) ? $exception->getMessage() : 'conversion_failed';
            if ($data['diagnostic'] === 'conversion_failed') {
                $message = strtolower($exception->getMessage());
                $data['diagnostic'] = match (true) {
                    str_contains($message, 'policy'), str_contains($message, 'not authorized') => 'imagick_policy',
                    str_contains($message, 'delegate') => 'imagick_delegate',
                    str_contains($message, 'cache resources'), str_contains($message, 'memory allocation'), str_contains($message, 'time limit') => 'imagick_resource_limit',
                    default => 'conversion_failed',
                };
            }
            Log::error('Media WebP conversion failed', [
                'media_id' => $media->getKey(),
                'diagnostic' => $data['diagnostic'],
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
            $data['pages'] = [];
            try {
                self::writeManifest($source, $data);
            } catch (Throwable) {
            }
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    private static function generateGd(string $source, string $prefix, array &$created): array
    {
        $info = @getimagesize($source);
        $width = (int) ($info[0] ?? 0);
        $height = (int) ($info[1] ?? 0);
        self::dimensions($width, $height);
        $limit = ini_parse_quantity((string) ini_get('memory_limit'));
        if ($limit > 0 && memory_get_usage(true) + $width * $height * 16 + 16777216 > $limit) {
            throw new RuntimeException('memory_limit');
        }
        $loader = match ($info[2]) {
            IMAGETYPE_JPEG => 'imagecreatefromjpeg',
            IMAGETYPE_PNG => 'imagecreatefrompng',
            IMAGETYPE_WEBP => 'imagecreatefromwebp',
            IMAGETYPE_AVIF => 'imagecreatefromavif',
            default => '',
        };
        if (! function_exists($loader)) {
            throw new RuntimeException('unsupported_source');
        }
        $orientation = 1;
        if ($info[2] === IMAGETYPE_JPEG) {
            if (! function_exists('exif_read_data')) {
                throw new RuntimeException('orientation_unavailable');
            }
            $exif = @exif_read_data($source);
            $orientation = (int) ($exif['Orientation'] ?? 1);
            if ($orientation < 1 || $orientation > 8) {
                throw new RuntimeException('orientation_unavailable');
            }
        }
        $image = @$loader($source);
        if (! $image) {
            throw new RuntimeException('decode_failed');
        }
        try {
            if (in_array($orientation, [2, 4, 5, 7], true)) {
                imageflip($image, IMG_FLIP_HORIZONTAL);
            }
            $angle = match ($orientation) {
                3, 4 => 180,
                6, 7 => -90,
                5, 8 => 90,
                default => 0,
            };
            if ($angle !== 0) {
                $rotated = imagerotate($image, $angle, 0);
                if (! $rotated) {
                    throw new RuntimeException('decode_failed');
                }
                imagedestroy($image);
                $image = $rotated;
            }
            $width = imagesx($image);
            $height = imagesy($image);
            $variants = [];
            foreach (self::widths($width) as $size) {
                $targetHeight = max(1, (int) round($height * $size / $width));
                $resized = imagecreatetruecolor($size, $targetHeight);
                try {
                    imagealphablending($resized, false);
                    imagesavealpha($resized, true);
                    if (! imagecopyresampled($resized, $image, 0, 0, 0, 0, $size, $targetHeight, $width, $height)) {
                        throw new RuntimeException('decode_failed');
                    }
                    $name = $prefix.'-p1-'.$size.'.webp';
                    self::publish($source, 'variants/'.$name, function ($temporary) use ($resized): void {
                        if (! @imagewebp($resized, $temporary, IMG_WEBP_LOSSLESS)) {
                            throw new RuntimeException('write_failed');
                        }
                    });
                    $created[] = $name;
                    $variants[] = ['name' => $name, 'width' => $size, 'height' => $targetHeight];
                } finally {
                    imagedestroy($resized);
                }
            }

            return ['width' => $width, 'height' => $height, 'variants' => $variants];
        } finally {
            imagedestroy($image);
        }
    }

    private static function widths(int $width): array
    {
        return array_values(array_unique(array_map(fn ($size) => min($width, $size), [...self::WIDTHS, $width])));
    }

    private static function dimensions(int $width, int $height): void
    {
        if ($width < 1 || $height < 1 || $width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION || $width * $height > self::MAX_PIXELS) {
            throw new RuntimeException('pixel_limit');
        }
    }

    private static function withImagickLimits(callable $callback): void
    {
        $limits = [];
        try {
            $phpLimit = ini_parse_quantity((string) ini_get('memory_limit'));
            $memory = $phpLimit > 0 ? min(134217728, max(0, $phpLimit - memory_get_usage(true) - 16777216)) : 134217728;
            if ($memory < 1048576) {
                throw new RuntimeException('memory_limit');
            }
            foreach (['MEMORY' => $memory, 'MAP' => 268435456, 'DISK' => 134217728, 'THREAD' => 1, 'TIME' => 20, 'WIDTH' => self::MAX_DIMENSION, 'HEIGHT' => self::MAX_DIMENSION, 'AREA' => self::MAX_PIXELS] as $name => $value) {
                $constant = \Imagick::class.'::RESOURCETYPE_'.$name;
                if (defined($constant)) {
                    $type = constant($constant);
                    $limits[$type] = \Imagick::getResourceLimit($type);
                    if (! \Imagick::setResourceLimit($type, $limits[$type] > 0 ? min($limits[$type], $value) : $value)) {
                        throw new RuntimeException('memory_limit');
                    }
                }
            }
            $callback();
        } finally {
            foreach ($limits as $type => $value) {
                \Imagick::setResourceLimit($type, $value);
            }
        }
    }

    private static function saveImagick(\Imagick $image, string $path): void
    {
        $image->stripImage();
        $image->setImageFormat('webp');
        $image->setImageDepth(8);
        $image->setOption('webp:lossless', 'true');
        $image->setOption('webp:exact', 'true');
        $image->setImageCompressionQuality(100);
        $width = $image->getImageWidth();
        $height = $image->getImageHeight();
        $pixels = self::pixelHash($image);
        if (! $image->writeImage($path)) {
            throw new RuntimeException('write_failed');
        }
        $image->clear();
        $decoded = new \Imagick;
        try {
            $decoded->readImage('webp:'.$path);
            if ($decoded->getImageFormat() !== 'WEBP' || $decoded->getImageWidth() !== $width || $decoded->getImageHeight() !== $height
                || self::pixelHash($decoded) !== $pixels) {
                throw new RuntimeException('write_failed');
            }
        } finally {
            $decoded->clear();
        }
    }

    private static function pixelHash(\Imagick $image): string
    {
        $hash = hash_init('sha256');
        for ($row = 0; $row < $image->getImageHeight(); $row++) {
            hash_update($hash, pack('C*', ...$image->exportImagePixels(0, $row, $image->getImageWidth(), 1, 'RGBA', \Imagick::PIXEL_CHAR)));
        }

        return hash_final($hash);
    }

    private static function source(Media $media): ?string
    {
        $name = $media->filename;
        if (! is_string($name) || $name === '' || $name !== basename($name) || str_contains($name, '\\') || str_contains($name, "\0") || in_array($name, ['.', '..'], true)) {
            return null;
        }
        $directory = public_path('media');
        if (is_link($directory)) {
            return null;
        }

        return $directory.'/'.$name;
    }

    private static function manifestPath(string $source): string
    {
        return storage_path('app/private/image-variants').'/.variant-'.hash('sha256', basename($source)).'.json';
    }

    private static function directory(string $path, int $permissions): void
    {
        if (is_link($path)) {
            throw new RuntimeException('write_failed');
        }
        if (is_dir($path)) {
            return;
        }
        self::directory(dirname($path), $permissions);
        if (! @mkdir($path, $permissions) && ! is_dir($path)) {
            throw new RuntimeException('write_failed');
        }
    }

    private static function variantPath(string $source, string $name): string
    {
        $directory = dirname($source).'/variants';
        $path = $directory.'/'.$name;

        return ! is_link($directory) && is_file($path) ? $path : dirname($source).'/'.$name;
    }

    private static function signature(string $source): ?array
    {
        clearstatcache(true, $source);
        if (is_link($source) || ! is_file($source)) {
            return null;
        }
        $stat = @stat($source);

        return $stat ? array_intersect_key($stat, array_flip(['size', 'mtime', 'ctime', 'ino'])) : null;
    }

    private static function lock(string $source)
    {
        $path = self::manifestPath($source).'.lock';
        try {
            self::directory(dirname($path), 0700);
        } catch (RuntimeException) {
            return false;
        }
        if (is_link($path)) {
            return false;
        }
        $lock = @fopen($path, 'c');
        if ($lock === false) {
            return false;
        }
        if (! flock($lock, LOCK_EX | LOCK_NB)) {
            fclose($lock);

            return false;
        }

        return $lock;
    }

    private static function readManifest(string $source): array
    {
        $path = self::manifestPath($source);
        if (! file_exists($path) && ! is_link($path)) {
            $path = dirname($source).'/'.basename($path);
        }
        if (is_link(dirname($path)) || is_link($path) || ! is_file($path) || @filesize($path) > 65536) {
            return [];
        }
        $stream = @fopen($path, 'rb');
        if ($stream === false) {
            return [];
        }
        try {
            $json = stream_get_contents($stream, 65537);
        } finally {
            fclose($stream);
        }
        if (! is_string($json) || strlen($json) > 65536) {
            return [];
        }
        $data = json_decode($json, true);

        return is_array($data) ? $data : [];
    }

    private static function writeManifest(string $source, array $data): void
    {
        self::publish($source, basename(self::manifestPath($source)), function ($temporary) use ($data): void {
            if (file_put_contents($temporary, json_encode($data, JSON_THROW_ON_ERROR)) === false) {
                throw new RuntimeException('write_failed');
            }
        }, false, dirname(self::manifestPath($source)));
    }

    private static function publish(string $source, string $name, callable $write, bool $image = true, ?string $directory = null): void
    {
        $directory ??= dirname($source);
        $target = $directory.'/'.$name;
        self::directory(dirname($target), $image ? 0755 : 0700);
        if (is_link($target)) {
            throw new RuntimeException('write_failed');
        }
        $temporaryDirectory = dirname(self::manifestPath($source));
        self::directory($temporaryDirectory, 0700);
        $temporary = @tempnam($temporaryDirectory, '.variant-tmp-');
        if ($temporary === false) {
            throw new RuntimeException('write_failed');
        }
        try {
            $write($temporary);
            $info = $image ? @getimagesize($temporary) : null;
            if ($image && function_exists('imagecreatefromwebp')) {
                $decoded = @imagecreatefromwebp($temporary);
                if (! $decoded) {
                    throw new RuntimeException('write_failed');
                }
                try {
                    if (imagesx($decoded) !== ($info[0] ?? null) || imagesy($decoded) !== ($info[1] ?? null)) {
                        throw new RuntimeException('write_failed');
                    }
                } finally {
                    imagedestroy($decoded);
                }
            }
            if (($image && (! is_array($info) || $info[2] !== IMAGETYPE_WEBP)) || ! @filesize($temporary) || ! @rename($temporary, $target)) {
                throw new RuntimeException('write_failed');
            }
            @chmod($target, $image ? 0644 : 0600);
        } finally {
            if (is_file($temporary)) {
                @unlink($temporary);
            }
        }
    }

    private static function ownedName(string $source, string $name): bool
    {
        return (bool) preg_match('/^variant-v[0-9]+-'.hash('sha256', basename($source)).'-[a-f0-9]{64}-p(?:[1-9]|1[0-2])-(?:[1-9][0-9]{0,3}|1[01][0-9]{3}|12000)\.webp$/D', $name);
    }

    private static function removeFile(string $path): void
    {
        if (! is_link($path) && is_file($path)) {
            @unlink($path);
        }
    }

    private static function removeOwned(string $source, array $keep = []): void
    {
        foreach ([dirname($source), dirname($source).'/variants'] as $directory) {
            if (is_link($directory)) {
                continue;
            }
            foreach (glob($directory.'/variant-v*-'.hash('sha256', basename($source)).'-*.webp') ?: [] as $path) {
                if ($path !== $source && self::ownedName($source, basename($path)) && ! in_array(basename($path), $keep, true)
                    && ! Media::query()->where('filename', basename($path))->exists()) {
                    self::removeFile($path);
                }
            }
        }
    }

    public static function cleanup(Media $media): void
    {
        if ($media->getConnection()->transactionLevel() > 0) {
            $snapshot = clone $media;
            $media->getConnection()->afterCommit(fn () => self::cleanupCommittedUpload($snapshot));

            return;
        }
        self::cleanupCommittedUpload($media);
    }

    private static function cleanupCommittedUpload(Media $media): void
    {
        $source = self::source($media);
        if ($source === null || ! is_dir(dirname($source))) {
            return;
        }
        $lock = self::lock($source);
        if ($lock === false) {
            return;
        }
        try {
            if (Media::query()->where('filename', $media->filename)->exists()) {
                return;
            }
            self::removeOwned($source);
            self::removeFile(self::manifestPath($source));
            self::removeFile(dirname($source).'/'.basename(self::manifestPath($source)));
            self::removeFile($source);
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    private static function validPages(string $source, array $data): array
    {
        if (($data['version'] ?? null) !== self::VERSION || ! in_array($data['status'] ?? null, ['ready', 'limited'], true)
            || ($data['signature'] ?? null) !== self::signature($source) || ! is_string($data['hash'] ?? null)
            || ! preg_match('/^[a-f0-9]{64}$/D', $data['hash']) || ($data['kind'] ?? null) !== 'image'
            || ! is_array($data['pages'] ?? null) || ! array_is_list($data['pages']) || count($data['pages']) !== 1) {
            return [];
        }
        foreach ($data['pages'] as $index => $page) {
            if (! is_array($page) || ! is_int($page['width'] ?? null) || ! is_int($page['height'] ?? null)
                || $page['width'] < 1 || $page['height'] < 1 || $page['width'] > self::MAX_DIMENSION || $page['height'] > self::MAX_DIMENSION
                || $page['width'] * $page['height'] > self::MAX_PIXELS || ! is_array($page['variants'] ?? null) || ! array_is_list($page['variants']) || count($page['variants']) !== count(self::widths($page['width']))) {
                return [];
            }
            foreach ($page['variants'] as $position => $variant) {
                $width = self::widths($page['width'])[$position];
                $expected = 'variant-v'.self::VERSION.'-'.hash('sha256', basename($source)).'-'.$data['hash'].'-p'.($index + 1).'-'.$width.'.webp';
                if (! is_array($variant) || ($variant['name'] ?? null) !== $expected || ($variant['width'] ?? null) !== $width
                    || ($variant['height'] ?? null) !== max(1, (int) round($page['height'] * $width / $page['width']))
                    || self::signature(self::variantPath($source, $expected)) === null || @filesize(self::variantPath($source, $expected)) < 1) {
                    return [];
                }
                $info = @getimagesize(self::variantPath($source, $expected));
                if (! is_array($info) || $info[2] !== IMAGETYPE_WEBP || $info[0] !== $variant['width'] || $info[1] !== $variant['height']) {
                    return [];
                }
            }
        }

        return $data['pages'];
    }

    public static function pages(Media $media, bool $complete = false): array
    {
        $source = self::source($media);
        if ($source === null) {
            return [];
        }
        $data = self::readManifest($source);
        if ($complete && $data !== [] && (($data['status'] ?? null) !== 'ready' || ! empty($data['truncated']) || ($data['mode'] ?? null) !== 'all')) {
            return [];
        }
        $pages = self::validPages($source, $data);
        $result = [];
        foreach ($pages as $page) {
            $variants = array_map(fn ($variant) => ['url' => '/media/'.(dirname(self::variantPath($source, $variant['name'])) === dirname($source) ? '' : 'variants/').$variant['name'], 'width' => $variant['width'], 'height' => $variant['height']], $page['variants']);
            $srcSet = array_map(fn ($variant) => $variant['url'].' '.$variant['width'].'w', $variants);
            $last = $variants[array_key_last($variants)];
            if ($data['kind'] === 'image' && $page['width'] > $last['width']) {
                $original = $media->publicUrl();
                if ($original && ! preg_match('/[\s,]/', $original)) {
                    $srcSet[] = $original.' '.$page['width'].'w';
                }
            }
            $result[] = ['url' => $last['url'], 'width' => $page['width'], 'height' => $page['height'], 'variants' => $variants, 'srcSet' => implode(', ', $srcSet)];
        }

        return $result;
    }

    public static function responsive(Media $media): array
    {
        $source = self::source($media);
        if ($source === null || (self::readManifest($source)['kind'] ?? null) !== 'image') {
            return [];
        }
        $page = self::pages($media)[0] ?? [];
        unset($page['url']);

        return $page;
    }

    public static function url(Media $media): ?string
    {
        return self::responsive($media)['variants'][0]['url'] ?? self::pages($media)[0]['url'] ?? null;
    }
}
