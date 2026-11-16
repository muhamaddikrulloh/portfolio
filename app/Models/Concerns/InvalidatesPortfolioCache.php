<?php

namespace App\Models\Concerns;

use App\Services\PortfolioDataService;
use Illuminate\Support\Facades\DB;

trait InvalidatesPortfolioCache
{
    public static function bootInvalidatesPortfolioCache(): void
    {
        $invalidate = static function (): void {
            DB::afterCommit(static function (): void {
                PortfolioDataService::invalidateAll();
            });
        };

        static::saved($invalidate);
        static::deleted($invalidate);
    }
}
