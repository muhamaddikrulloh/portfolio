<?php

namespace App\Filament\Resources;

use App\Filament\Forms\BilingualTextInput;
use App\Filament\Resources\FocusAreaResource\Pages;
use App\Models\FocusArea;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\ToggleColumn;
use Filament\Tables\Table;
use UnitEnum;

class FocusAreaResource extends Resource
{
    protected static ?string $model = FocusArea::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedSparkles;

    protected static ?string $navigationLabel = 'Focus Areas';

    protected static string|UnitEnum|null $navigationGroup = 'Skills';

    protected static ?int $navigationSort = 30;

    protected static ?string $recordTitleAttribute = 'title';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make('Language')
                    ->tabs([
                        Tab::make('English')
                            ->schema([
                                BilingualTextInput::make('en_title', 'id_id_title')
                                    ->label('Focus Area (EN)')
                                    ->placeholder('e.g. Web application development')
                                    ->required(),
                            ]),
                        Tab::make('Indonesia')
                            ->schema([
                                BilingualTextInput::make('id_id_title', 'en_title')
                                    ->label('Bidang Fokus (ID)')
                                    ->placeholder('mis. Pengembangan aplikasi web')
                                    ->required(),
                            ]),
                    ])
                    ->columnSpanFull(),
                Section::make('Settings')
                    ->schema([
                        TextInput::make('order')
                            ->numeric()
                            ->default(fn (): int => ((int) FocusArea::query()->max('order')) + 1)
                            ->unique(ignoreRecord: true)
                            ->required(),
                        Toggle::make('published')
                            ->default(true),
                    ])
                    ->columns(2)
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('order')
            ->reorderable('order')
            ->columns([
                TextColumn::make('title')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('en_title')
                    ->label('EN')
                    ->searchable(),
                TextColumn::make('id_id_title')
                    ->label('ID')
                    ->searchable(),
                TextColumn::make('order')
                    ->sortable(),
                ToggleColumn::make('published'),
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
            'index' => Pages\ListFocusAreas::route('/'),
            'create' => Pages\CreateFocusArea::route('/create'),
            'edit' => Pages\EditFocusArea::route('/{record}/edit'),
        ];
    }
}
