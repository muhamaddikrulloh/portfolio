<?php

namespace App\Filament\Resources\ProjectResource\Pages;

use App\Filament\Resources\ProjectResource;
use App\Models\Project;
use Filament\Resources\Pages\CreateRecord;

class CreateProject extends CreateRecord
{
    protected static string $resource = ProjectResource::class;

    protected function afterCreate(): void
    {
        /** @var Project $record */
        $record = $this->getRecord();
        $skillIds = $this->data['skill_ids'] ?? [];
        if (is_array($skillIds)) {
            $record->syncOrderedSkills($skillIds);
        }
    }
}
