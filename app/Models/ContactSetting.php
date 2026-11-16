<?php

namespace App\Models;

use App\Models\Concerns\InvalidatesPortfolioCache;
use Illuminate\Database\Eloquent\Model;

class ContactSetting extends Model
{
    use InvalidatesPortfolioCache;

    protected $table = 'contact_settings';

    protected $fillable = [
        'email',
        'en_heading',
        'id_id_heading',
        'en_base_location',
        'id_id_base_location',
        'en_contact_rows',
        'id_id_contact_rows',
        'social_links',
    ];

    protected function casts(): array
    {
        return [
            'en_contact_rows' => 'array',
            'id_id_contact_rows' => 'array',
            'social_links' => 'array',
        ];
    }

    public static function singleton(): self
    {
        return static::query()->first() ?? new static([
            'en_contact_rows' => [],
            'id_id_contact_rows' => [],
            'social_links' => [],
        ]);
    }
}
