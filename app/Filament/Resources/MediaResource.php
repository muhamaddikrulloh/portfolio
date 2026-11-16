<?php

namespace App\Filament\Resources;

use App\Filament\Resources\MediaResource\Pages;
use App\Models\Media;
use App\Support\ImageVariants;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Html;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\HtmlString;
use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;
use UnitEnum;

class MediaResource extends Resource
{
    protected static ?string $model = Media::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedPhoto;

    protected static ?string $navigationLabel = 'Media Library';

    protected static ?string $modelLabel = 'Media Asset';

    protected static ?string $pluralModelLabel = 'Media Library';

    protected static string|UnitEnum|null $navigationGroup = 'System';

    protected static ?int $navigationSort = 100;

    protected static ?string $recordTitleAttribute = 'filename';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                FileUpload::make('filename')
                    ->label(fn (string $operation): string => $operation === 'create' ? 'Files' : 'File')
                    ->disk('media')
                    ->multiple(fn (string $operation): bool => $operation === 'create')
                    ->getUploadedFileNameForStorageUsing(static fn (TemporaryUploadedFile $file): string => ImageVariants::storageName($file))
                    ->acceptedFileTypes([
                        'image/jpeg',
                        'image/png',
                        'image/webp',
                        'image/avif',
                        'application/pdf',
                    ])
                    ->maxSize(20480)
                    ->rules(['mimes:jpg,jpeg,png,webp,avif,pdf'])
                    ->required()
                    ->columnSpanFull(),
                Html::make(static function (?Media $record): HtmlString|string {
                    $url = $record?->publicUrl();
                    if (! $url || ($record->mime_type !== 'application/pdf' && ! str_ends_with(strtolower($record->filename), '.pdf'))) {
                        return '';
                    }

                    $url = e($url);

                    return new HtmlString('<iframe src="'.$url.'" title="PDF preview" sandbox class="w-full" style="height: 32rem"></iframe><a href="'.$url.'" target="_blank" rel="noopener noreferrer">Open PDF</a>');
                })->columnSpanFull(),
                TextInput::make('alt')
                    ->label('Alt Text')
                    ->helperText('Descriptive alt text for accessibility. For bulk uploads, applies to all selected files; edit individual assets afterward.')
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('id', 'desc')
            ->columns([
                TextColumn::make('filename')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('mime_type')
                    ->label('MIME Type')
                    ->sortable(),
                TextColumn::make('filesize')
                    ->label('File Size (B)')
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListMedia::route('/'),
            'create' => Pages\CreateMedia::route('/create'),
            'edit' => Pages\EditMedia::route('/{record}/edit'),
        ];
    }
}
