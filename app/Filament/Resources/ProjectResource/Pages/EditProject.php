<?php

namespace App\Filament\Resources\ProjectResource\Pages;

use App\Filament\Resources\ProjectResource;
use App\Models\Project;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditProject extends EditRecord
{
    protected static string $resource = ProjectResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }

    protected function afterSave(): void
    {
        /** @var Project $record */
        $record = $this->getRecord();
        $skillIds = $this->data['skill_ids'] ?? [];
        if (is_array($skillIds)) {
            $record->syncOrderedSkills($skillIds);
        }
    }
}
