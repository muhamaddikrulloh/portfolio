<?php

namespace App\Models;

use App\Models\Concerns\InvalidatesPortfolioCache;
use Illuminate\Database\Eloquent\Model;

class AboutSetting extends Model
{
    use InvalidatesPortfolioCache;

    protected $table = 'about_settings';

    protected $fillable = [
        'en_header',
        'en_heading',
        'en_lead',
        'en_body_primary',
        'en_body_secondary',
        'en_profile_heading',
        'en_info_rows',
        'id_id_header',
        'id_id_heading',
        'id_id_lead',
        'id_id_body_primary',
        'id_id_body_secondary',
        'id_id_profile_heading',
        'id_id_info_rows',
    ];

    protected function casts(): array
    {
        return [
            'en_info_rows' => 'array',
            'id_id_info_rows' => 'array',
        ];
    }

    public static function singleton(): self
    {
        return static::query()->first() ?? new static([
            'en_info_rows' => [],
            'id_id_info_rows' => [],
        ]);
    }
}
