<?php

namespace App\Filament\Resources;

use App\Filament\Forms\BilingualTextInput;
use App\Filament\Forms\MediaPicker;
use App\Filament\Resources\ProjectResource\Pages;
use App\Models\Media;
use App\Models\Project;
use App\Models\Skill;
use BackedEnum;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Repeater;
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
use Illuminate\Validation\Rule;
use UnitEnum;

class ProjectResource extends Resource
{
    protected static ?string $model = Project::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $navigationLabel = 'Projects';

    protected static string|UnitEnum|null $navigationGroup = 'Portfolio';

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
                                    ->label('Project Title (EN)')
                                    ->placeholder('e.g. Food Court Web App')
                                    ->required(),
                                TextInput::make('en_kind')
                                    ->label('Category / Kind (EN)')
                                    ->placeholder('e.g. Web application, Mobile exercises')
                                    ->required(),
                                Textarea::make('en_summary')
                                    ->label('Card Summary (EN)')
                                    ->rows(3)
                                    ->required(),
                                Textarea::make('en_description')
                                    ->label('Detailed Description (EN)')
                                    ->requiredWith('id_id_description')
                                    ->rows(4),
                            ]),
                        Tab::make('Indonesia')
                            ->schema([
                                BilingualTextInput::make('id_id_title', 'en_title')
                                    ->label('Judul Proyek (ID)')
                                    ->placeholder('mis. Aplikasi Web Food Court')
                                    ->required(),
                                TextInput::make('id_id_kind')
                                    ->label('Kategori / Jenis (ID)')
                                    ->placeholder('mis. Aplikasi web, Latihan mobile')
                                    ->required(),
                                Textarea::make('id_id_summary')
                                    ->label('Ringkasan Kartu (ID)')
                                    ->rows(3)
                                    ->required(),
                                Textarea::make('id_id_description')
                                    ->label('Deskripsi Lengkap (ID)')
                                    ->requiredWith('en_description')
                                    ->rows(4),
                            ]),
                    ])
                    ->columnSpanFull(),
                Section::make('Project Metadata, Media & Visibility')
                    ->schema([
                        TextInput::make('slug')
                            ->label('Slug')
                            ->required()
                            ->unique(ignoreRecord: true),
                        TextInput::make('year')
                            ->label('Year'),
                        Select::make('visual')
                            ->label('Fallback illustration')
                            ->options(Project::VISUAL_OPTIONS)
                            ->formatStateUsing(fn (?string $state): string => Project::normalizeVisual($state))
                            ->dehydrateStateUsing(fn (string $state, ?Project $record): ?string => $record && Project::normalizeVisual($record->visual) === $state ? $record->visual : $state)
                            ->rules([Rule::in(array_keys(Project::VISUAL_OPTIONS))])
                            ->default('none')
                            ->required(),
                        TextInput::make('order')
                            ->numeric()
                            ->default(fn (): int => ((int) Project::query()->max('order')) + 1)
                            ->unique(ignoreRecord: true)
                            ->required(),
                        TextInput::make('live_url')
                            ->label('Live Application URL')
                            ->placeholder('https://...'),
                        TextInput::make('github_url')
                            ->label('GitHub Repository URL')
                            ->placeholder('https://github.com/...'),
                        Select::make('skill_ids')
                            ->label('Technologies & Skills')
                            ->multiple()
                            ->options(fn (): array => Skill::query()->orderBy('order')->pluck('name', 'id')->all())
                            ->searchable()
                            ->preload()
                            ->afterStateHydrated(function (Select $component, ?Project $record): void {
                                if ($record) {
                                    $component->state($record->skills()->pluck('skills.id')->all());
                                }
                            })
                            ->dehydrated(false)
                            ->columnSpanFull(),
                        Repeater::make('galleryItems')
                            ->label('Project images · shared EN / ID')
                            ->relationship('galleryItems')
                            ->orderColumn('order')
                            ->helperText('Upload several images at once, or add an existing library image. Drag items to set display order.')
                            ->hintAction(MediaPicker::galleryUpload())
                            ->addActionLabel('Choose existing image')
                            ->addActionAlignment('start')
                            ->compact()
                            ->grid(['default' => 1, 'lg' => 2])
                            ->schema([
                                MediaPicker::configure(Select::make('media_id')
                                    ->label('Image')
                                    ->options(fn (): array => Media::query()
                                        ->whereIn('mime_type', ['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
                                        ->orderByDesc('id')
                                        ->pluck('filename', 'id')
                                        ->all())
                                    ->searchable()
                                    ->rules([Rule::exists('media', 'id')->whereIn('mime_type', ['image/jpeg', 'image/png', 'image/webp', 'image/avif'])])
                                    ->required(), 'image'),
                                MediaPicker::preview('media_id'),
                            ])
                            ->reorderableWithDragAndDrop()
                            ->defaultItems(0)
                            ->columnSpanFull(),
                        Toggle::make('selected')
                            ->label('Feature on Homepage (Selected Projects)')
                            ->default(false),
                        Toggle::make('published')
                            ->label('Published')
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
                TextColumn::make('slug')
                    ->searchable(),
                TextColumn::make('year')
                    ->sortable(),
                ToggleColumn::make('selected'),
                ToggleColumn::make('published'),
                TextColumn::make('order')
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
            'index' => Pages\ListProjects::route('/'),
            'create' => Pages\CreateProject::route('/create'),
            'edit' => Pages\EditProject::route('/{record}/edit'),
        ];
    }
}
