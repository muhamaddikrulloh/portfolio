<?php

namespace App\Models;

use App\Models\Concerns\InvalidatesPortfolioCache;
use App\Services\PortfolioDataService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\DB;

class Experience extends Model
{
    use InvalidatesPortfolioCache;

    protected $table = 'experience';

    protected $fillable = [
        'title',
        'en_position',
        'en_organization',
        'en_period',
        'en_description',
        'id_id_position',
        'id_id_organization',
        'id_id_period',
        'id_id_description',
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
        static::saving(function (Experience $experience): void {
            $role = $experience->en_position ?: ($experience->id_id_position ?: 'Experience');
            $org = $experience->en_organization ?: ($experience->id_id_organization ?: '');
            $experience->title = $org !== '' ? "{$role} — {$org}" : $role;
        });
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'experience_skill', 'experience_id', 'skill_id')
            ->withPivot('order')
            ->orderByPivot('order');
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
