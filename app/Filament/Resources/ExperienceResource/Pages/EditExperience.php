<?php

namespace App\Filament\Resources\ExperienceResource\Pages;

use App\Filament\Resources\ExperienceResource;
use App\Models\Experience;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditExperience extends EditRecord
{
    protected static string $resource = ExperienceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }

    protected function afterSave(): void
    {
        /** @var Experience $record */
        $record = $this->getRecord();
        $skillIds = $this->data['skill_ids'] ?? [];
        if (is_array($skillIds)) {
            $record->syncOrderedSkills($skillIds);
        }
    }
}
