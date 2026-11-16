<?php

namespace App\Models;

use App\Models\Concerns\InvalidatesPortfolioCache;
use Illuminate\Database\Eloquent\Model;

class FocusArea extends Model
{
    use InvalidatesPortfolioCache;

    protected $table = 'focus_areas';

    protected $fillable = [
        'title',
        'en_title',
        'id_id_title',
        'order',
        'published',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
            'published' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (FocusArea $focusArea): void {
            $focusArea->title = $focusArea->en_title ?: ($focusArea->id_id_title ?: ($focusArea->title ?: 'Untitled Focus Area'));
        });
    }
}
