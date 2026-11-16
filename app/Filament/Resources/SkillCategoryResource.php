<?php

namespace App\Filament\Resources;

use App\Filament\Forms\BilingualTextInput;
use App\Filament\Resources\SkillCategoryResource\Pages;
use App\Models\SkillCategory;
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

class SkillCategoryResource extends Resource
{
    protected static ?string $model = SkillCategory::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedSquares2x2;

    protected static ?string $navigationLabel = 'Skill Categories';

    protected static string|UnitEnum|null $navigationGroup = 'Skills';

    protected static ?int $navigationSort = 10;

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make('Language')
                    ->tabs([
                        Tab::make('English')
                            ->schema([
                                BilingualTextInput::make('en_name', 'id_id_name')
                                    ->label('Category Name (EN)')
                                    ->placeholder('e.g. Web development')
                                    ->required(),
                            ]),
                        Tab::make('Indonesia')
                            ->schema([
                                BilingualTextInput::make('id_id_name', 'en_name')
                                    ->label('Nama Kategori (ID)')
                                    ->placeholder('mis. Pengembangan web')
                                    ->required(),
                            ]),
                    ])
                    ->columnSpanFull(),
                Section::make('Settings')
                    ->schema([
                        TextInput::make('order')
                            ->numeric()
                            ->default(fn (): int => ((int) SkillCategory::query()->max('order')) + 1)
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
                TextColumn::make('name')
                    ->label('Name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('en_name')
                    ->label('EN')
                    ->searchable(),
                TextColumn::make('id_id_name')
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
            'index' => Pages\ListSkillCategories::route('/'),
            'create' => Pages\CreateSkillCategory::route('/create'),
            'edit' => Pages\EditSkillCategory::route('/{record}/edit'),
        ];
    }
}
