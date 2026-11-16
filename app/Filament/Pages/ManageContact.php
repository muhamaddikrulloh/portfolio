<?php

namespace App\Filament\Pages;

use App\Models\ContactSetting;
use App\Support\UrlValidator;
use BackedEnum;
use Closure;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Illuminate\Database\Eloquent\Model;
use UnitEnum;

class ManageContact extends BaseSingletonPage
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedEnvelope;

    protected static ?string $navigationLabel = 'Contact';

    protected static ?string $title = 'Contact';

    protected static string|UnitEnum|null $navigationGroup = 'Portfolio';

    protected static ?int $navigationSort = 50;

    protected static ?string $slug = 'contact';

    protected function getRecord(): Model
    {
        return ContactSetting::singleton();
    }

    public function form(Schema $schema): Schema
    {
        $rowTypeOptions = array_merge([
            'email' => 'Email (Mail icon + click to write)',
            'phone' => 'Phone (Phone icon + click to call)',
            'location' => 'Location (Map pin icon)',
            'link' => 'Link (External arrow icon + clickable)',
            'text' => 'Plain Text (No link)',
        ], UrlValidator::SOCIAL_PLATFORMS);

        $rowUrlRule = static function (Get $get): Closure {
            return static function (string $attribute, mixed $value, Closure $fail) use ($get): void {
                $type = (string) ($get('type') ?: 'text');
                if ($type === 'location' || $type === 'text') {
                    return;
                }
                $displayValue = (string) ($get('value') ?: '');
                $href = UrlValidator::contactRowHref([
                    'label' => (string) ($get('label') ?: ''),
                    'value' => $displayValue,
                    'type' => $type,
                    'url' => is_string($value) ? $value : null,
                ]);
                if ($href === null) {
                    $fail(match ($type) {
                        'email' => 'Enter a valid email address or mailto: link.',
                        'phone' => 'Enter a valid phone number or tel: link.',
                        default => 'Enter a valid HTTPS URL without credentials.',
                    });
                }
            };
        };

        return $schema
            ->components([
                Tabs::make('Language')
                    ->tabs([
                        Tab::make('English')
                            ->schema([
                                TextInput::make('en_heading')
                                    ->label('Display Heading (EN)')
                                    ->requiredWith('id_id_heading')
                                    ->maxLength(255)
                                    ->placeholder("LET'S WORK TOGETHER"),
                                Repeater::make('en_contact_rows')
                                    ->label('Contact details (EN)')
                                    ->requiredWith('id_id_contact_rows')
                                    ->schema([
                                        TextInput::make('label')
                                            ->label('Label')
                                            ->required(),
                                        TextInput::make('value')
                                            ->label('Display text')
                                            ->required(),
                                        Select::make('type')
                                            ->label('Icon & Behavior')
                                            ->options($rowTypeOptions)
                                            ->default('text')
                                            ->live(),
                                        TextInput::make('url')
                                            ->label('Link destination')
                                            ->rules([$rowUrlRule]),
                                    ])
                                    ->columns(2)
                                    ->reorderableWithDragAndDrop()
                                    ->defaultItems(0),
                            ]),
                        Tab::make('Indonesia')
                            ->schema([
                                TextInput::make('id_id_heading')
                                    ->label('Judul Tampilan (ID)')
                                    ->requiredWith('en_heading')
                                    ->maxLength(255)
                                    ->placeholder('MARI BEKERJA BERSAMA'),
                                Repeater::make('id_id_contact_rows')
                                    ->label('Informasi kontak (ID)')
                                    ->requiredWith('en_contact_rows')
                                    ->schema([
                                        TextInput::make('label')
                                            ->label('Label')
                                            ->required(),
                                        TextInput::make('value')
                                            ->label('Nilai / Teks')
                                            ->required(),
                                        Select::make('type')
                                            ->label('Ikon & Tipe Tautan')
                                            ->options($rowTypeOptions)
                                            ->default('text')
                                            ->live(),
                                        TextInput::make('url')
                                            ->label('Tujuan tautan')
                                            ->rules([$rowUrlRule]),
                                    ])
                                    ->columns(2)
                                    ->reorderableWithDragAndDrop()
                                    ->defaultItems(0),
                            ]),
                    ])
                    ->columnSpanFull(),
                Section::make('Social profiles · shared EN / ID')
                    ->schema([
                        Repeater::make('social_links')
                            ->label('Social Profiles')
                            ->schema([
                                Select::make('platform')
                                    ->label('Platform')
                                    ->options(UrlValidator::SOCIAL_PLATFORMS)
                                    ->required(),
                                TextInput::make('url')
                                    ->label('Profile URL')
                                    ->required()
                                    ->rules([
                                        static fn (): Closure => static function (string $attribute, mixed $value, Closure $fail): void {
                                            if (UrlValidator::safeContactHttpsUrl($value) === null) {
                                                $fail('Must be a valid HTTPS URL without credentials.');
                                            }
                                        },
                                    ]),
                                Toggle::make('visible')
                                    ->label('Visible on Site')
                                    ->default(true),
                            ])
                            ->columns(3)
                            ->reorderableWithDragAndDrop()
                            ->defaultItems(0),
                    ])
                    ->columnSpanFull(),
            ]);
    }
}
