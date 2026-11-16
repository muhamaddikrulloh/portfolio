<?php

namespace App\Filament\Forms;

use App\Models\Media;
use App\Support\ImageVariants;
use App\Support\PdfA4Validator;
use Closure;
use Filament\Actions\Action;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Html;
use Filament\Schemas\Components\Utilities\Get;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\HtmlString;
use Livewire\Features\SupportFileUploads\TemporaryUploadedFile;

class MediaPicker
{
    public static function configure(Select $select, string $type): Select
    {
        $types = $type === 'image'
            ? ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
            : ($type === 'pdf' ? ['application/pdf'] : ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf']);

        return $select
            ->live()
            ->createOptionModalHeading('Upload media')
            ->createOptionForm([
                FileUpload::make('filename')
                    ->label('File')
                    ->disk('media')
                    ->getUploadedFileNameForStorageUsing(static fn (TemporaryUploadedFile $file): string => ImageVariants::storageName($file))
                    ->acceptedFileTypes($types)
                    ->maxSize(20480)
                    ->rules([
                        $type === 'image' ? 'mimes:jpg,jpeg,png,webp,avif' : ($type === 'pdf' ? 'mimes:pdf' : 'mimes:jpg,jpeg,png,webp,avif,pdf'),
                        static fn (): Closure => static function (string $attribute, mixed $value, Closure $fail) use ($type): void {
                            if ($type !== 'pdf' || ! $value instanceof TemporaryUploadedFile) {
                                return;
                            }
                            $check = PdfA4Validator::validateFile($value->getRealPath());
                            if (! $check['valid']) {
                                $fail($check['message'] ?? 'Resume must be an A4 portrait PDF.');
                            }
                        },
                    ])
                    ->required(),
                TextInput::make('alt')->label('Alt Text'),
            ])
            ->createOptionUsing(static function (array $data): int {
                $media = Media::create($data);
                $media->getConnection()->afterCommit(fn () => $media->refresh());

                return $media->getKey();
            });
    }

    public static function galleryUpload(): Action
    {
        return Action::make('uploadGalleryImages')
            ->label('Upload images')
            ->icon('heroicon-o-arrow-up-tray')
            ->schema([
                FileUpload::make('filenames')
                    ->label('Images')
                    ->disk('media')
                    ->multiple()
                    ->reorderable()
                    ->getUploadedFileNameForStorageUsing(static fn (TemporaryUploadedFile $file): string => ImageVariants::storageName($file))
                    ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
                    ->rules(['mimes:jpg,jpeg,png,webp,avif'])
                    ->maxSize(20480)
                    ->required(),
            ])
            ->action(static function (array $data, Repeater $component): void {
                $records = DB::transaction(function () use ($data): array {
                    $records = [];
                    foreach ($data['filenames'] as $filename) {
                        $records[] = Media::create(['filename' => $filename]);
                    }

                    return $records;
                });
                $state = $component->getRawState() ?? [];
                foreach ($records as $media) {
                    $media->getConnection()->afterCommit(fn () => $media->refresh());
                    $key = $component->generateUuid();
                    if ($key) {
                        $state[$key] = ['media_id' => $media->getKey()];
                    } else {
                        $state[] = ['media_id' => $media->getKey()];
                    }
                }
                $component->rawState($state);
                $component->callAfterStateUpdated();
            });
    }

    public static function preview(string $field): Html
    {
        return Html::make(static function (Get $get) use ($field): HtmlString|string {
            $media = Media::query()->find($get($field));
            $url = $media?->publicUrl();
            if (! $url) {
                return 'No preview available.';
            }
            $url = e($url);
            if ($media->mime_type === 'application/pdf' || str_ends_with(strtolower($media->filename), '.pdf')) {
                return new HtmlString('<iframe src="'.$url.'" title="PDF preview" sandbox class="w-full" style="height: 32rem"></iframe><a href="'.$url.'" target="_blank" rel="noopener noreferrer">Open PDF</a>');
            }
            if (str_starts_with((string) $media->mime_type, 'image/')) {
                return new HtmlString('<img src="'.$url.'" alt="'.e($media->alt ?? '').'" style="max-height: 20rem; max-width: 100%">');
            }

            return 'No preview available.';
        });
    }
}
