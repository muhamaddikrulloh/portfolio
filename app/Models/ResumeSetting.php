<?php

namespace App\Models;

use App\Models\Concerns\InvalidatesPortfolioCache;
use App\Support\PdfA4Validator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Validation\ValidationException;

class ResumeSetting extends Model
{
    use InvalidatesPortfolioCache;

    protected $table = 'resume_settings';

    protected $fillable = [
        'file_id',
        'image_id',
        'en_document_title',
        'id_id_document_title',
    ];

    protected function casts(): array
    {
        return [
            'file_id' => 'integer',
            'image_id' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (ResumeSetting $resume): void {
            if ($resume->file_id) {
                $media = Media::query()->find($resume->file_id);
                if (! $media) {
                    throw ValidationException::withMessages([
                        'file_id' => 'Selected media file could not be found.',
                    ]);
                }

                $isPdf = $media->mime_type === 'application/pdf' || str_ends_with(strtolower((string) $media->filename), '.pdf');
                if (! $isPdf) {
                    throw ValidationException::withMessages([
                        'file_id' => 'Resume must be a PDF document. Images or other formats are not allowed.',
                    ]);
                }

                $diskPath = public_path('media/'.basename((string) $media->filename));
                $check = PdfA4Validator::validateFile($diskPath);
                if (! $check['valid']) {
                    throw ValidationException::withMessages([
                        'file_id' => $check['message'] ?? 'Resume must be an ISO 216 A4 portrait PDF (210 × 297 mm).',
                    ]);
                }
            }

            if ($resume->image_id) {
                $media = Media::query()->find($resume->image_id);
                if (! $media) {
                    throw ValidationException::withMessages([
                        'image_id' => 'Selected preview image could not be found.',
                    ]);
                }

                $path = $media->filename ? public_path('media/'.basename($media->filename)) : null;
                $isImage = in_array($media->mime_type, ['image/webp', 'image/png', 'image/jpeg', 'image/avif'], true)
                    && $path && is_file($path)
                    && in_array((new \finfo(FILEINFO_MIME_TYPE))->file($path), ['image/webp', 'image/png', 'image/jpeg', 'image/avif'], true)
                    && @getimagesize($path) !== false;
                if (! $isImage) {
                    throw ValidationException::withMessages([
                        'image_id' => 'Preview must be an image (WebP, PNG, JPG). PDFs are not allowed as preview images.',
                    ]);
                }
            }
        });
    }

    public function file(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'file_id');
    }

    public function previewImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'image_id');
    }

    public static function singleton(): self
    {
        return static::query()->first() ?? new static([
            'en_document_title' => 'Curriculum Vitae',
            'id_id_document_title' => 'Curriculum Vitae',
        ]);
    }
}
