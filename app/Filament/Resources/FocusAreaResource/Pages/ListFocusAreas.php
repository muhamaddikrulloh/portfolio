<?php

namespace App\Filament\Resources\FocusAreaResource\Pages;

use App\Filament\Resources\FocusAreaResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListFocusAreas extends ListRecords
{
    protected static string $resource = FocusAreaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
