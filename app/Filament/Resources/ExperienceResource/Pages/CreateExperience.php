<?php

namespace App\Filament\Resources\ExperienceResource\Pages;

use App\Filament\Resources\ExperienceResource;
use App\Models\Experience;
use Filament\Resources\Pages\CreateRecord;

class CreateExperience extends CreateRecord
{
    protected static string $resource = ExperienceResource::class;

    protected function afterCreate(): void
    {
        /** @var Experience $record */
        $record = $this->getRecord();
        $skillIds = $this->data['skill_ids'] ?? [];
        if (is_array($skillIds)) {
            $record->syncOrderedSkills($skillIds);
        }
    }
}
