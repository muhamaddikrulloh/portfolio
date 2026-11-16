<?php

namespace App\Filament\Pages;

use App\Models\AboutSetting;
use BackedEnum;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Illuminate\Database\Eloquent\Model;
use UnitEnum;

class ManageAbout extends BaseSingletonPage
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedUserCircle;

    protected static ?string $navigationLabel = 'About';

    protected static ?string $title = 'About';

    protected static string|UnitEnum|null $navigationGroup = 'Portfolio';

    protected static ?int $navigationSort = 40;

    protected static ?string $slug = 'about';

    protected function getRecord(): Model
    {
        return AboutSetting::singleton();
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Tabs::make('Language')
                    ->tabs([
                        Tab::make('English')
                            ->schema([
                                TextInput::make('en_header')
                                    ->label('Section Label (EN)')
                                    ->requiredWith('id_id_header')
                                    ->placeholder('e.g. About'),
                                TextInput::make('en_heading')
                                    ->label('Display Heading (EN)')
                                    ->requiredWith('id_id_heading')
                                    ->placeholder('e.g. Beyond the screen.'),
                                Textarea::make('en_lead')
                                    ->label('Lead Paragraph (EN)')
                                    ->requiredWith('id_id_lead')
                                    ->rows(3),
                                Textarea::make('en_body_primary')
                                    ->label('Primary Body Paragraph (EN)')
                                    ->requiredWith('id_id_body_primary')
                                    ->rows(4),
                                Textarea::make('en_body_secondary')
                                    ->label('Secondary Body Paragraph (EN)')
                                    ->requiredWith('id_id_body_secondary')
                                    ->rows(4),
                                TextInput::make('en_profile_heading')
                                    ->label('Profile Card Heading (EN)')
                                    ->requiredWith('id_id_profile_heading')
                                    ->placeholder('e.g. Profile'),
                                Repeater::make('en_info_rows')
                                    ->label('Profile Information Rows (EN)')
                                    ->requiredWith('id_id_info_rows')
                                    ->schema([
                                        TextInput::make('label')
                                            ->label('Field Label (EN)')
                                            ->required(),
                                        TextInput::make('value')
                                            ->label('Field Value (EN)')
                                            ->required(),
                                    ])
                                    ->columns(2)
                                    ->reorderableWithDragAndDrop()
                                    ->defaultItems(0),
                            ]),
                        Tab::make('Indonesia')
                            ->schema([
                                TextInput::make('id_id_header')
                                    ->label('Label Bagian (ID)')
                                    ->requiredWith('en_header')
                                    ->placeholder('mis. Tentang'),
                                TextInput::make('id_id_heading')
                                    ->label('Judul Tampilan (ID)')
                                    ->requiredWith('en_heading')
                                    ->placeholder('mis. Di balik tampilan.'),
                                Textarea::make('id_id_lead')
                                    ->label('Paragraf Pembuka (ID)')
                                    ->requiredWith('en_lead')
                                    ->rows(3),
                                Textarea::make('id_id_body_primary')
                                    ->label('Paragraf Utama (ID)')
                                    ->requiredWith('en_body_primary')
                                    ->rows(4),
                                Textarea::make('id_id_body_secondary')
                                    ->label('Paragraf Tambahan (ID)')
                                    ->requiredWith('en_body_secondary')
                                    ->rows(4),
                                TextInput::make('id_id_profile_heading')
                                    ->label('Judul Kartu Profil (ID)')
                                    ->requiredWith('en_profile_heading')
                                    ->placeholder('mis. Profil'),
                                Repeater::make('id_id_info_rows')
                                    ->label('Baris Informasi Profil (ID)')
                                    ->requiredWith('en_info_rows')
                                    ->schema([
                                        TextInput::make('label')
                                            ->label('Label Kolom (ID)')
                                            ->required(),
                                        TextInput::make('value')
                                            ->label('Nilai Kolom (ID)')
                                            ->required(),
                                    ])
                                    ->columns(2)
                                    ->reorderableWithDragAndDrop()
                                    ->defaultItems(0),
                            ]),
                    ])
                    ->columnSpanFull(),
            ]);
    }
}
