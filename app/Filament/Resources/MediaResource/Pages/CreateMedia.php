<?php

namespace App\Filament\Resources\MediaResource\Pages;

use App\Filament\Resources\MediaResource;
use App\Models\Media;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class CreateMedia extends CreateRecord
{
    protected static string $resource = MediaResource::class;

    protected function handleRecordCreation(array $data): Model
    {
        $records = DB::transaction(function () use ($data): array {
            $records = [];
            foreach ($data['filename'] as $filename) {
                $records[] = Media::create([...$data, 'filename' => $filename]);
            }

            return $records;
        });
        foreach ($records as $record) {
            $record->getConnection()->afterCommit(fn () => $record->refresh());
        }

        return $records[0];
    }

    protected function getRedirectUrl(): string
    {
        return MediaResource::getUrl('index');
    }
}
