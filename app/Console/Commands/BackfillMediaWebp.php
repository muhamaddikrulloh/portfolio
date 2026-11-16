<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class BackfillMediaWebp extends Command
{
    protected $signature = 'media:backfill-webp';

    protected $description = 'Removed: only new image uploads are converted to WebP';

    public function handle(): int
    {
        $this->error('WebP backfill was removed. Existing media must remain unchanged.');

        return self::FAILURE;
    }
}
