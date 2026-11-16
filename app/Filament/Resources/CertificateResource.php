<?php

namespace App\Filament\Resources;

use App\Filament\Forms\BilingualTextInput;
use App\Filament\Forms\MediaPicker;
use App\Filament\Resources\CertificateResource\Pages;
use App\Models\Certificate;
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

class CertificateResource extends Resource
{
    protected static ?string $model = Certificate::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedAcademicCap;

    protected static ?string $navigationLabel = 'Certificates';

    protected static string|UnitEnum|null $navigationGroup = 'Portfolio';

    protected static ?int $navigationSort = 20;

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
                                    ->label('Certificate Title (EN)')
                                    ->placeholder('e.g. Web Development Foundations')
                                    ->required(),
                                TextInput::make('en_issuer')
                                    ->label('Issuer (EN)')
                                    ->placeholder('e.g. Dicoding Indonesia')
                                    ->required(),
                                Textarea::make('en_description')
                                    ->label('Description / Curriculum Summary (EN)')
                                    ->requiredWith('id_id_description')
                                    ->rows(3),
                            ]),
                        Tab::make('Indonesia')
                            ->schema([
                                BilingualTextInput::make('id_id_title', 'en_title')
                                    ->label('Judul Sertifikat (ID)')
                                    ->placeholder('mis. Dasar Pengembangan Web')
                                    ->required(),
                                TextInput::make('id_id_issuer')
                                    ->label('Penerbit (ID)')
                                    ->placeholder('mis. Dicoding Indonesia')
                                    ->required(),
                                Textarea::make('id_id_description')
                                    ->label('Deskripsi / Ringkasan Kurikulum (ID)')
                                    ->requiredWith('en_description')
                                    ->rows(3),
                            ]),
                    ])
                    ->columnSpanFull(),
                Section::make('Credential & Visibility')
                    ->schema([
                        TextInput::make('year')
                            ->label('Issue Year / Date')
                            ->placeholder('e.g. 2024'),
                        TextInput::make('credential_id')
                            ->label('Credential ID'),
                        TextInput::make('credential_url')
                            ->label('Verification / Credential URL')
                            ->placeholder('https://...'),
                        MediaPicker::configure(Select::make('file_id')
                            ->label('Certificate Document / Image')
                            ->relationship('file', 'filename')
                            ->searchable()
                            ->preload()
                            ->nullable(), 'document'),
                        MediaPicker::preview('file_id'),
                        TextInput::make('order')
                            ->numeric()
                            ->default(fn (): int => ((int) Certificate::query()->max('order')) + 1)
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
                TextColumn::make('year')
                    ->sortable(),
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
            'index' => Pages\ListCertificates::route('/'),
            'create' => Pages\CreateCertificate::route('/create'),
            'edit' => Pages\EditCertificate::route('/{record}/edit'),
        ];
    }
}
