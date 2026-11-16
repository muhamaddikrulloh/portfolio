<?php

namespace App\Filament\Resources\FocusAreaResource\Pages;

use App\Filament\Resources\FocusAreaResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditFocusArea extends EditRecord
{
    protected static string $resource = FocusAreaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
