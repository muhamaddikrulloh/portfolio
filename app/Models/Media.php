<?php

namespace App\Models;

use App\Models\Concerns\InvalidatesPortfolioCache;
use App\Support\ImageVariants;
use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    use InvalidatesPortfolioCache;

    protected $table = 'media';

    protected $fillable = [
        'filename',
        'alt',
        'mime_type',
        'filesize',
        'width',
        'height',
        'url',
    ];

    protected function casts(): array
    {
        return [
            'filesize' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Media $media): void {
            if ($media->filename) {
                $cleanName = basename($media->filename);
                $media->filename = $cleanName;
                if ($media->exists && $media->isDirty('filename')) {
                    $media->filesize = null;
                    $media->mime_type = null;
                    $media->width = null;
                    $media->height = null;
                    if ($media->url === $media->getRawOriginal('url')) {
                        $media->url = null;
                    }
                }
                if (! $media->url) {
                    $media->url = '/media/'.rawurlencode($cleanName);
                }

                $diskPath = public_path('media/'.$cleanName);
                if (is_file($diskPath)) {
                    if (! $media->filesize) {
                        $size = @filesize($diskPath);
                        if ($size !== false) {
                            $media->filesize = $size;
                        }
                    }
                    if (! $media->mime_type) {
                        $mime = @mime_content_type($diskPath);
                        if (is_string($mime)) {
                            $media->mime_type = $mime;
                        }
                    }
                    if ((! $media->width || ! $media->height) && str_starts_with((string) $media->mime_type, 'image/')) {
                        $dims = @getimagesize($diskPath);
                        if (is_array($dims)) {
                            $media->width = (int) $dims[0];
                            $media->height = (int) $dims[1];
                        }
                    }
                }
            }
        });

        $processUpload = function (Media $media): void {
            $previous = $media->wasChanged('filename') ? $media->getRawOriginal('filename') : null;
            $current = clone $media;
            $media->getConnection()->afterCommit(function () use ($current, $previous): void {
                $stored = static::on($current->getConnectionName())->find($current->getKey());
                if ($stored && $stored->filename === $current->filename) {
                    ImageVariants::convertUpload($stored);
                }
                if (is_string($previous) && $previous !== $current->filename) {
                    ImageVariants::cleanup((new Media(['filename' => $previous]))->setConnection($current->getConnectionName()));
                }
            });
        };
        static::created($processUpload);
        static::updated(function (Media $media) use ($processUpload): void {
            if ($media->wasChanged('filename')) {
                $processUpload($media);
            }
        });

        static::deleted(function (Media $media): void {
            $deleted = clone $media;
            $media->getConnection()->afterCommit(fn () => ImageVariants::cleanup($deleted));
        });
    }

    public function fileExistsOnDisk(): bool
    {
        if (! $this->filename) {
            return false;
        }

        return is_file(public_path('media/'.basename($this->filename)));
    }

    public function publicUrl(): ?string
    {
        if (! $this->fileExistsOnDisk()) {
            return null;
        }

        $baseUrl = $this->url ?: ('/media/'.rawurlencode(basename((string) $this->filename)));
        $mtime = @filemtime(public_path('media/'.basename((string) $this->filename)));

        return $mtime ? $baseUrl.(str_contains($baseUrl, '?') ? '&' : '?').'v='.$mtime : $baseUrl;
    }
}
