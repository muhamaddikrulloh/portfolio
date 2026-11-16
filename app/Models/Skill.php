<?php

namespace App\Models;

use App\Models\Concerns\InvalidatesPortfolioCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Skill extends Model
{
    use InvalidatesPortfolioCache;

    protected $table = 'skills';

    protected $fillable = [
        'name',
        'category_id',
        'order',
        'published',
    ];

    protected function casts(): array
    {
        return [
            'category_id' => 'integer',
            'order' => 'integer',
            'published' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(SkillCategory::class, 'category_id');
    }
}
