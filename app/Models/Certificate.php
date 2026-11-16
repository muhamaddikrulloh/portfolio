<?php

namespace App\Models;

use App\Models\Concerns\InvalidatesPortfolioCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificate extends Model
{
    use InvalidatesPortfolioCache;

    protected $table = 'certificates';

    protected $fillable = [
        'title',
        'en_title',
        'en_issuer',
        'en_description',
        'id_id_title',
        'id_id_issuer',
        'id_id_description',
        'year',
        'credential_id',
        'credential_url',
        'file_id',
        'order',
        'published',
    ];

    protected function casts(): array
    {
        return [
            'file_id' => 'integer',
            'order' => 'integer',
            'published' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Certificate $certificate): void {
            $certificate->title = $certificate->en_title ?: ($certificate->id_id_title ?: ($certificate->title ?: 'Untitled Certificate'));
        });
    }

    public function file(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'file_id');
    }
}
