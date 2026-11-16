<?php

namespace App\Models;

use App\Models\Concerns\InvalidatesPortfolioCache;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectGallery extends Model
{
    use InvalidatesPortfolioCache;

    protected $table = 'project_gallery';

    public $timestamps = false;

    protected $fillable = [
        'project_id',
        'media_id',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'project_id' => 'integer',
            'media_id' => 'integer',
            'order' => 'integer',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'media_id');
    }
}
