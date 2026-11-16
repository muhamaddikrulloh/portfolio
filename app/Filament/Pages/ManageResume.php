<?php

namespace App\Filament\Pages;

use App\Filament\Forms\BilingualTextInput;
use App\Filament\Forms\MediaPicker;
use App\Models\Media;
use App\Models\ResumeSetting;
use App\Support\PdfA4Validator;
use BackedEnum;
use Closure;
use Filament\Forms\Components\Select;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Illuminate\Database\Eloquent\Model;
use UnitEnum;

class ManageResume extends BaseSingletonPage
{
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedDocumentText;

    protected static ?string $navigationLabel = 'Resume';

    protected static ?string $title = 'Resume';

    protected static string|UnitEnum|null $navigationGroup = 'Portfolio';

    protected static ?int $navigationSort = 60;

    protected static ?string $slug = 'resume';

    protected function getRecord(): Model
    {
        return ResumeSetting::singleton();
    }

    public function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                MediaPicker::configure(Select::make('image_id')
                    ->label('Resume Preview Image (WebP / PNG / JPG)')
                    ->options(fn (): array => Media::query()
                        ->whereIn('mime_type', ['image/webp', 'image/png', 'image/jpeg', 'image/avif'])
                        ->orderByDesc('id')
                        ->pluck('filename', 'id')
                        ->all())
                    ->searchable()
                    ->nullable()
                    ->helperText('Gambar preview yang akan ditampilkan di halaman /cv. Gambar otomatis dioptimasi ke WebP.')
                    ->rules([
                        static fn (): Closure => static function (string $attribute, mixed $value, Closure $fail): void {
                            if (! $value) {
                                return;
                            }
                            $media = Media::query()->find((int) $value);
                            if (! $media) {
                                $fail('Selected media file could not be found.');

                                return;
                            }
                            if (! in_array($media->mime_type, ['image/webp', 'image/png', 'image/jpeg', 'image/avif'], true)) {
                                $fail('Preview must be an image (WebP, PNG, JPG).');
                            }
                        },
                    ]), 'image'),
                MediaPicker::preview('image_id'),
                MediaPicker::configure(Select::make('file_id')
                    ->label('Active Resume / CV (PDF A4 Portrait - For Download & Print)')
                    ->options(fn (): array => Media::query()
                        ->where('mime_type', 'application/pdf')
                        ->orWhere('filename', 'like', '%.pdf')
                        ->orderByDesc('id')
                        ->pluck('filename', 'id')
                        ->all())
                    ->searchable()
                    ->nullable()
                    ->helperText('Single active CV / Resume document (Must be ISO 216 A4 portrait PDF, 210 × 297 mm). Used for Download & Print.')
                    ->rules([
                        static fn (): Closure => static function (string $attribute, mixed $value, Closure $fail): void {
                            if (! $value) {
                                return;
                            }
                            $media = Media::query()->find((int) $value);
                            if (! $media) {
                                $fail('Selected media file could not be found.');

                                return;
                            }
                            $isPdf = $media->mime_type === 'application/pdf' || str_ends_with(strtolower((string) $media->filename), '.pdf');
                            if (! $isPdf) {
                                $fail('Resume must be a PDF document. Images or other formats are not allowed.');

                                return;
                            }
                            if ($media->filename) {
                                $check = PdfA4Validator::validateFile(public_path('media/'.basename($media->filename)));
                                if (! $check['valid']) {
                                    $fail($check['message'] ?? 'Resume must be an ISO 216 A4 portrait PDF (210 × 297 mm).');
                                }
                            }
                        },
                    ]), 'pdf'),
                MediaPicker::preview('file_id'),
                Tabs::make('Language')
                    ->tabs([
                        Tab::make('English')
                            ->schema([
                                BilingualTextInput::make('en_document_title', 'id_id_document_title')
                                    ->label('Document Title (EN)')
                                    ->default('Curriculum Vitae')
                                    ->required(),
                            ]),
                        Tab::make('Indonesia')
                            ->schema([
                                BilingualTextInput::make('id_id_document_title', 'en_document_title')
                                    ->label('Judul Dokumen (ID)')
                                    ->default('Curriculum Vitae')
                                    ->required(),
                            ]),
                    ])
                    ->columnSpanFull(),
            ]);
    }
}
