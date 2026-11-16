<?php

namespace App\Models;

use App\Models\Concerns\InvalidatesPortfolioCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SkillCategory extends Model
{
    use InvalidatesPortfolioCache;

    protected $table = 'skill_categories';

    protected $fillable = [
        'name',
        'en_name',
        'id_id_name',
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
        static::saving(function (SkillCategory $category): void {
            $category->name = $category->en_name ?: ($category->id_id_name ?: ($category->name ?: 'Untitled Category'));
        });
    }

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class, 'category_id')->orderBy('order');
    }
}
