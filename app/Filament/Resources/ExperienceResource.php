<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ExperienceResource\Pages;
use App\Models\Experience;
use App\Models\Skill;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
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

class ExperienceResource extends Resource
{
    protected static ?string $model = Experience::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBriefcase;

    protected static ?string $navigationLabel = 'Experience';

    protected static ?string $modelLabel = 'Experience Entry';

    protected static ?string $pluralModelLabel = 'Experience';

    protected static string|UnitEnum|null $navigationGroup = 'Portfolio';

    protected static ?int $navigationSort = 10;

    protected static ?string $recordTitleAttribute = 'title';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make('Language')
                    ->tabs([
                        Tab::make('English')
                            ->schema([
                                TextInput::make('en_position')
                                    ->label('Position / Role (EN)')
                                    ->placeholder('e.g. Web & Mobile App Developer')
                                    ->required(),
                                TextInput::make('en_organization')
                                    ->label('Organization / Institution (EN)')
                                    ->placeholder('e.g. Independent / Open Source')
                                    ->required(),
                                TextInput::make('en_period')
                                    ->label('Active Period (EN)')
                                    ->placeholder('e.g. 2024–Present')
                                    ->required(),
                                Textarea::make('en_description')
                                    ->label('Role Description (EN)')
                                    ->rows(4)
                                    ->required(),
                            ]),
                        Tab::make('Indonesia')
                            ->schema([
                                TextInput::make('id_id_position')
                                    ->label('Peran / Posisi (ID)')
                                    ->placeholder('mis. Pengembang Web & Mobile')
                                    ->required(),
                                TextInput::make('id_id_organization')
                                    ->label('Organisasi / Institusi (ID)')
                                    ->placeholder('mis. Independen / Open Source')
                                    ->required(),
                                TextInput::make('id_id_period')
                                    ->label('Periode Aktif (ID)')
                                    ->placeholder('mis. 2024–Sekarang')
                                    ->required(),
                                Textarea::make('id_id_description')
                                    ->label('Deskripsi Peran (ID)')
                                    ->rows(4)
                                    ->required(),
                            ]),
                    ])
                    ->columnSpanFull(),
                Section::make('Skills & Visibility')
                    ->schema([
                        Select::make('skill_ids')
                            ->label('Relevant Skills & Competencies')
                            ->multiple()
                            ->options(fn (): array => Skill::query()->orderBy('order')->pluck('name', 'id')->all())
                            ->searchable()
                            ->preload()
                            ->afterStateHydrated(function (Select $component, ?Experience $record): void {
                                if ($record) {
                                    $component->state($record->skills()->pluck('skills.id')->all());
                                }
                            })
                            ->dehydrated(false)
                            ->columnSpanFull(),
                        TextInput::make('order')
                            ->numeric()
                            ->default(fn (): int => ((int) Experience::query()->max('order')) + 1)
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
                TextColumn::make('en_period')
                    ->label('Period'),
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
            'index' => Pages\ListExperiences::route('/'),
            'create' => Pages\CreateExperience::route('/create'),
            'edit' => Pages\EditExperience::route('/{record}/edit'),
        ];
    }
}
