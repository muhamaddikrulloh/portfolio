<?php

namespace App\Models;

use App\Models\Concerns\InvalidatesPortfolioCache;
use App\Services\PortfolioDataService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class Project extends Model
{
    use InvalidatesPortfolioCache;

    public const VISUAL_OPTIONS = [
        'web-app' => 'Web app',
        'mobile-app' => 'Mobile app',
        'ui-ux' => 'UI/UX design',
        'none' => 'No preview',
    ];

    public static function normalizeVisual(?string $visual): string
    {
        return match ($visual) {
            'orders', 'city', 'web-app' => 'web-app',
            'diary', 'mobile-app' => 'mobile-app',
            'ui-ux' => 'ui-ux',
            default => 'none',
        };
    }

    protected $table = 'projects';

    protected $fillable = [
        'title',
        'slug',
        'en_title',
        'en_kind',
        'en_summary',
        'en_description',
        'id_id_title',
        'id_id_kind',
        'id_id_summary',
        'id_id_description',
        'year',
        'image_id',
        'visual',
        'live_url',
        'github_url',
        'selected',
        'published',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'image_id' => 'integer',
            'selected' => 'boolean',
            'published' => 'boolean',
            'order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Project $project): void {
            if ($project->isDirty('visual') && $project->visual !== null && ! in_array($project->visual, [...array_keys(self::VISUAL_OPTIONS), 'orders', 'diary', 'city'], true)) {
                throw ValidationException::withMessages(['visual' => 'Choose a valid fallback illustration.']);
            }
            $project->title = $project->en_title ?: ($project->id_id_title ?: ($project->title ?: ($project->slug ?: 'Untitled Project')));
        });
    }

    public function image(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'image_id');
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'project_skill', 'project_id', 'skill_id')
            ->withPivot('order')
            ->orderByPivot('order');
    }

    public function galleryItems(): HasMany
    {
        return $this->hasMany(ProjectGallery::class, 'project_id')->orderBy('order');
    }

    /**
     * Sync ordered skill IDs and invalidate portfolio cache after commit.
     *
     * @param  array<int, int|string>  $skillIds
     */
    public function syncOrderedSkills(array $skillIds): void
    {
        $syncData = [];
        $order = 1;
        foreach ($skillIds as $skillId) {
            $id = (int) $skillId;
            if ($id > 0 && ! isset($syncData[$id])) {
                $syncData[$id] = ['order' => $order++];
            }
        }

        $this->skills()->sync($syncData);
        DB::afterCommit(static fn () => PortfolioDataService::invalidateAll());
    }
}
