<?php

namespace App\Services;

use App\Models\AboutSetting;
use App\Models\Certificate;
use App\Models\ContactSetting;
use App\Models\Experience;
use App\Models\FocusArea;
use App\Models\Media;
use App\Models\Project;
use App\Models\ResumeSetting;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Support\ImageVariants;
use App\Support\UrlValidator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class PortfolioDataService
{
    public const SCHEMA_VERSION = 'v3';

    public const CACHE_TTL_SECONDS = 600;

    public const LKG_TTL_SECONDS = 86400 * 7;

    private static function cacheKey(string $scope): string
    {
        return sprintf('portfolio:%s:%s', self::SCHEMA_VERSION, $scope);
    }

    private static function lkgKey(string $scope): string
    {
        return sprintf('portfolio:%s:%s:lkg', self::SCHEMA_VERSION, $scope);
    }

    public static function invalidateAll(): void
    {
        foreach (['bundle', 'bundle:meta', 'projects', 'resume', 'sitemap'] as $scope) {
            Cache::forget(self::cacheKey($scope));
        }
    }

    public function getHomeLastModified(): string
    {
        return (string) Cache::get(self::cacheKey('bundle:meta'), Carbon::parse('2026-11-10T00:00:00Z')->toAtomString());
    }

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    private function rememberWithFallback(string $scope, callable $callback): mixed
    {
        $key = self::cacheKey($scope);
        $cached = Cache::get($key);
        if ($cached !== null) {
            return $cached;
        }

        $lkgKey = self::lkgKey($scope);

        try {
            $lock = Cache::lock($key.':lock', 10);
            try {
                if ($lock->get()) {
                    $fresh = $callback();
                    Cache::put($key, $fresh, self::CACHE_TTL_SECONDS);
                    Cache::put($lkgKey, $fresh, self::LKG_TTL_SECONDS);

                    return $fresh;
                }
            } finally {
                optional($lock)->release();
            }

            $cachedAfterLock = Cache::get($key);
            if ($cachedAfterLock !== null) {
                return $cachedAfterLock;
            }

            $fresh = $callback();
            Cache::put($key, $fresh, self::CACHE_TTL_SECONDS);
            Cache::put($lkgKey, $fresh, self::LKG_TTL_SECONDS);

            return $fresh;
        } catch (Throwable $e) {
            Log::error(sprintf('[PortfolioDataService] Database failure while loading scope "%s": %s', $scope, $e->getMessage()), [
                'exception' => $e,
            ]);

            $lkg = Cache::get($lkgKey);
            if ($lkg !== null) {
                return $lkg;
            }

            throw new RuntimeException('Portfolio data source is temporarily unavailable.', 503, $e);
        }
    }

    /**
     * Return bilingual PortfolioBundle for '/' homepage.
     *
     * @return array{en: array<string, mixed>, id: array<string, mixed>}
     */
    public function getBilingualPortfolioBundle(): array
    {
        return $this->rememberWithFallback('bundle', function (): array {
            $aboutDoc = AboutSetting::query()->first();
            $categories = SkillCategory::query()
                ->where('published', true)
                ->orderBy('order')
                ->orderBy('id')
                ->get();
            $skills = Skill::query()
                ->where('published', true)
                ->orderBy('order')
                ->orderBy('id')
                ->get();
            $focusAreas = FocusArea::query()
                ->where('published', true)
                ->orderBy('order')
                ->orderBy('id')
                ->get();
            $experiences = Experience::query()
                ->where('published', true)
                ->with(['skills'])
                ->orderBy('order')
                ->orderBy('id')
                ->get();
            $certificates = Certificate::query()
                ->where('published', true)
                ->with(['file'])
                ->orderBy('order')
                ->orderBy('id')
                ->get();
            $projects = Project::query()
                ->where('published', true)
                ->with(['skills', 'image', 'galleryItems.media'])
                ->orderBy('order')
                ->orderBy('id')
                ->get();
            $contactDoc = ContactSetting::query()->first();
            $resumeDoc = ResumeSetting::query()->with(['file', 'previewImage'])->first();

            $timestamps = array_filter([
                $aboutDoc?->updated_at,
                $contactDoc?->updated_at,
                $resumeDoc?->updated_at,
                $categories->max('updated_at'),
                $skills->max('updated_at'),
                $focusAreas->max('updated_at'),
                $experiences->max('updated_at'),
                $certificates->max('updated_at'),
                $projects->max('updated_at'),
            ]);
            $lastMod = ! empty($timestamps)
                ? Carbon::parse(max($timestamps))->toAtomString()
                : Carbon::parse('2026-11-10T00:00:00Z')->toAtomString();
            Cache::put(self::cacheKey('bundle:meta'), $lastMod, self::CACHE_TTL_SECONDS);

            $result = [];
            foreach (['en', 'id'] as $locale) {
                $allProjects = $projects
                    ->map(fn (Project $p) => $this->mapProject($p, $locale))
                    ->values()
                    ->all();

                $selectedProjects = array_values(array_filter(
                    $allProjects,
                    static fn (array $item): bool => (bool) ($item['selected'] ?? false)
                ));

                $result[$locale] = [
                    'about' => $this->mapAbout($aboutDoc, $locale),
                    'skills' => $this->mapSkills($categories, $skills, $focusAreas, $locale),
                    'experience' => $experiences
                        ->map(fn (Experience $exp) => $this->mapExperience($exp, $locale))
                        ->values()
                        ->all(),
                    'certificates' => $certificates
                        ->map(fn (Certificate $cert) => $this->mapCertificate($cert, $locale))
                        ->values()
                        ->all(),
                    'selectedProjects' => $selectedProjects,
                    'allProjects' => $allProjects,
                    'contact' => $this->mapContact($contactDoc, $locale),
                    'resume' => $this->mapResume($resumeDoc, $locale),
                ];
            }

            return $result;
        });
    }

    /**
     * Return bilingual projects list for '/projects'.
     *
     * @return array{en: array<int, array<string, mixed>>, id: array<int, array<string, mixed>>}
     */
    public function getBilingualProjects(): array
    {
        return $this->rememberWithFallback('projects', function (): array {
            $projects = Project::query()
                ->where('published', true)
                ->with(['skills', 'image', 'galleryItems.media'])
                ->orderBy('order')
                ->orderBy('id')
                ->get();

            return [
                'en' => $projects->map(fn (Project $p) => $this->mapProject($p, 'en'))->values()->all(),
                'id' => $projects->map(fn (Project $p) => $this->mapProject($p, 'id'))->values()->all(),
            ];
        });
    }

    /**
     * Return bilingual resume data for '/cv'.
     *
     * @return array{en: array{pdfUrl: string|null, documentTitle: string}, id: array{pdfUrl: string|null, documentTitle: string}}
     */
    public function getBilingualResume(): array
    {
        return $this->rememberWithFallback('resume', function (): array {
            $resumeDoc = ResumeSetting::query()->with(['file', 'previewImage'])->first();

            return [
                'en' => $this->mapResume($resumeDoc, 'en'),
                'id' => $this->mapResume($resumeDoc, 'id'),
            ];
        });
    }

    /**
     * Return meaningful content modification timestamps for '/sitemap.xml'.
     *
     * @return array{home: string, projects: string, cv: string}
     */
    public function getSitemapTimestamps(): array
    {
        return $this->rememberWithFallback('sitemap', function (): array {
            $fallback = Carbon::parse('2026-11-10T00:00:00Z');

            $projectMax = Project::query()->where('published', true)->max('updated_at');
            $resumeMax = ResumeSetting::query()->max('updated_at');
            $aboutMax = AboutSetting::query()->max('updated_at');
            $contactMax = ContactSetting::query()->max('updated_at');
            $expMax = Experience::query()->where('published', true)->max('updated_at');
            $certMax = Certificate::query()->where('published', true)->max('updated_at');
            $skillMax = Skill::query()->where('published', true)->max('updated_at');

            $homeTimestamps = array_filter([$projectMax, $aboutMax, $contactMax, $expMax, $certMax, $skillMax]);
            $homeMax = ! empty($homeTimestamps) ? max($homeTimestamps) : null;

            return [
                'home' => ($homeMax ? Carbon::parse($homeMax) : $fallback)->toAtomString(),
                'projects' => ($projectMax ? Carbon::parse($projectMax) : $fallback)->toAtomString(),
                'cv' => ($resumeMax ? Carbon::parse($resumeMax) : $fallback)->toAtomString(),
            ];
        });
    }

    private function mapAbout(?AboutSetting $doc, string $locale): array
    {
        if (! $doc) {
            return [
                'header' => '',
                'heading' => '',
                'lead' => '',
                'bodyPrimary' => '',
                'bodySecondary' => '',
                'profileHeading' => '',
                'infoRows' => [],
            ];
        }

        $isId = $locale === 'id';
        $rows = $isId ? ($doc->id_id_info_rows ?? $doc->en_info_rows ?? []) : ($doc->en_info_rows ?? $doc->id_id_info_rows ?? []);
        $mappedRows = [];
        if (is_array($rows)) {
            foreach ($rows as $row) {
                if (is_array($row) && isset($row['label'], $row['value'])) {
                    $mappedRows[] = [
                        'label' => (string) $row['label'],
                        'value' => (string) $row['value'],
                    ];
                }
            }
        }

        return [
            'header' => (string) (($isId ? $doc->id_id_header : $doc->en_header) ?? ''),
            'heading' => (string) (($isId ? $doc->id_id_heading : $doc->en_heading) ?? ''),
            'lead' => (string) (($isId ? $doc->id_id_lead : $doc->en_lead) ?? ''),
            'bodyPrimary' => (string) (($isId ? $doc->id_id_body_primary : $doc->en_body_primary) ?? ''),
            'bodySecondary' => (string) (($isId ? $doc->id_id_body_secondary : $doc->en_body_secondary) ?? ''),
            'profileHeading' => (string) (($isId ? $doc->id_id_profile_heading : $doc->en_profile_heading) ?? ''),
            'infoRows' => $mappedRows,
        ];
    }

    /**
     * @param  Collection<int, SkillCategory>  $categories
     * @param  Collection<int, Skill>  $skills
     * @param  Collection<int, FocusArea>  $focusAreas
     */
    private function mapSkills($categories, $skills, $focusAreas, string $locale): array
    {
        $isId = $locale === 'id';

        $groups = $categories->map(function (SkillCategory $cat) use ($skills, $isId): array {
            $catName = ($isId ? $cat->id_id_name : $cat->en_name) ?: ($cat->name ?: 'Category');
            $matchingSkills = $skills
                ->filter(static fn (Skill $s): bool => (int) $s->category_id === (int) $cat->id)
                ->map(static fn (Skill $s): string => (string) $s->name)
                ->values()
                ->all();

            return [
                'category' => (string) $catName,
                'order' => (int) $cat->order,
                'skills' => $matchingSkills,
            ];
        })->values()->all();

        $areas = $focusAreas
            ->map(static fn (FocusArea $f): string => (string) (($isId ? $f->id_id_title : $f->en_title) ?: ($f->title ?: '')))
            ->filter(static fn (string $title): bool => $title !== '')
            ->values()
            ->all();

        return [
            'groups' => $groups,
            'areas' => $areas,
        ];
    }

    private function mapExperience(Experience $doc, string $locale): array
    {
        $isId = $locale === 'id';
        $skillNames = $doc->skills
            ->map(static fn (Skill $s): string => (string) $s->name)
            ->filter(static fn (string $name): bool => $name !== '')
            ->values()
            ->all();

        return [
            'id' => $doc->id,
            'order' => (int) $doc->order,
            'period' => (string) (($isId ? $doc->id_id_period : $doc->en_period) ?? ''),
            'position' => (string) (($isId ? $doc->id_id_position : $doc->en_position) ?: ($doc->title ?: '')),
            'organization' => (string) (($isId ? $doc->id_id_organization : $doc->en_organization) ?? ''),
            'description' => (string) (($isId ? $doc->id_id_description : $doc->en_description) ?? ''),
            'skills' => $skillNames,
        ];
    }

    private function mapCertificate(Certificate $doc, string $locale): array
    {
        $isId = $locale === 'id';
        $item = [
            'id' => $doc->id,
            'order' => (int) $doc->order,
            'title' => (string) (($isId ? $doc->id_id_title : $doc->en_title) ?: ($doc->title ?: '')),
            'issuer' => (string) (($isId ? $doc->id_id_issuer : $doc->en_issuer) ?? ''),
        ];

        if ($doc->year) {
            $item['year'] = (string) $doc->year;
        }

        $description = $isId ? $doc->id_id_description : $doc->en_description;
        if ($description) {
            $item['description'] = (string) $description;
        }

        if ($doc->credential_id) {
            $item['credentialId'] = (string) $doc->credential_id;
        }

        if ($doc->credential_url) {
            $item['credentialUrl'] = (string) $doc->credential_url;
        }

        if ($doc->file instanceof Media && $doc->file->fileExistsOnDisk()) {
            $url = $doc->file->publicUrl();
            if ($url) {
                $item['fileUrl'] = $url;
                $item['previewPages'] = ImageVariants::pages($doc->file);
                if (str_starts_with((string) $doc->file->mime_type, 'image/')) {
                    $item['fileImage'] = $this->mapProjectImage($doc->file);
                }
            }
            if ($doc->file->mime_type) {
                $item['fileMimeType'] = (string) $doc->file->mime_type;
            }
        }

        return $item;
    }

    private function mapProjectImage(?Media $media): ?array
    {
        if (! $media instanceof Media) {
            return null;
        }

        $url = $media->publicUrl();
        if (! $url) {
            return null;
        }

        $img = ['url' => $url];
        if (is_string($media->alt) && $media->alt !== '') {
            $img['alt'] = $media->alt;
        }
        if (is_int($media->width) && $media->width > 0) {
            $img['width'] = $media->width;
        }
        if (is_int($media->height) && $media->height > 0) {
            $img['height'] = $media->height;
        }

        return array_replace($img, ImageVariants::responsive($media));
    }

    private function mapProject(Project $doc, string $locale): array
    {
        $isId = $locale === 'id';
        $gallery = [];

        foreach ($doc->galleryItems as $galleryItem) {
            $mappedImg = $this->mapProjectImage($galleryItem->media);
            if ($mappedImg !== null) {
                $gallery[] = $mappedImg;
            }
        }

        if (empty($gallery) && $doc->image instanceof Media) {
            $legacy = $this->mapProjectImage($doc->image);
            if ($legacy !== null) {
                $gallery[] = $legacy;
            }
        }

        $skillNames = $doc->skills
            ->map(static fn (Skill $s): string => (string) $s->name)
            ->filter(static fn (string $name): bool => $name !== '')
            ->values()
            ->all();

        $visual = Project::normalizeVisual($doc->visual);

        $item = [
            'id' => $doc->id,
            'slug' => (string) $doc->slug,
            'title' => (string) (($isId ? $doc->id_id_title : $doc->en_title) ?: ($doc->title ?: '')),
            'kind' => (string) (($isId ? $doc->id_id_kind : $doc->en_kind) ?? ''),
            'summary' => (string) (($isId ? $doc->id_id_summary : $doc->en_summary) ?? ''),
            'technologies' => $skillNames,
            'visual' => $visual,
            'selected' => (bool) $doc->selected,
        ];

        if ($doc->year) {
            $item['year'] = (string) $doc->year;
        }

        $description = $isId ? $doc->id_id_description : $doc->en_description;
        if ($description) {
            $item['description'] = (string) $description;
        }

        if (! empty($gallery)) {
            $item['imageUrl'] = $gallery[0]['url'];
            $item['gallery'] = $gallery;
        }

        if ($doc->live_url) {
            $item['liveUrl'] = (string) $doc->live_url;
        }

        if ($doc->github_url) {
            $item['githubUrl'] = (string) $doc->github_url;
        }

        return $item;
    }

    private function mapContact(?ContactSetting $doc, string $locale): array
    {
        if (! $doc) {
            return [
                'heading' => null,
                'contactRows' => [],
                'socialLinks' => [],
                'email' => '',
                'baseLocation' => '',
            ];
        }

        $isId = $locale === 'id';
        $rawSocial = is_array($doc->social_links) ? $doc->social_links : [];
        $socialLinks = [];
        foreach ($rawSocial as $link) {
            if (! is_array($link)) {
                continue;
            }
            $visible = ! array_key_exists('visible', $link) || (bool) $link['visible'];
            $safeUrl = UrlValidator::safeContactHttpsUrl($link['url'] ?? null);
            $platform = (string) ($link['platform'] ?? '');
            if ($visible && $safeUrl !== null && array_key_exists($platform, UrlValidator::SOCIAL_PLATFORMS)) {
                $socialLinks[] = [
                    'platform' => $platform,
                    'url' => $safeUrl,
                    'visible' => true,
                ];
            }
        }

        $rawRows = $isId ? $doc->id_id_contact_rows : $doc->en_contact_rows;
        $contactRows = [];
        if (is_array($rawRows)) {
            foreach ($rawRows as $r) {
                if (! is_array($r) || ! isset($r['label'], $r['value'])) {
                    continue;
                }
                $label = (string) $r['label'];
                $value = (string) $r['value'];
                $lowerLabel = strtolower($label);
                $type = isset($r['type']) && is_string($r['type']) && $r['type'] !== ''
                    ? $r['type']
                    : (str_contains($lowerLabel, 'email')
                        ? 'email'
                        : (str_contains($lowerLabel, 'base') || str_contains($lowerLabel, 'lokasi') ? 'location' : 'text'));

                $href = UrlValidator::contactRowHref([
                    'label' => $label,
                    'value' => $value,
                    'type' => $type,
                    'url' => isset($r['url']) && is_string($r['url']) ? $r['url'] : null,
                ]);

                $mappedRow = [
                    'label' => $label,
                    'value' => $value,
                    'type' => $type,
                ];
                if ($href !== null) {
                    $mappedRow['url'] = $href;
                }
                $contactRows[] = $mappedRow;
            }
        }

        $emailFromRow = '';
        foreach ($contactRows as $row) {
            if (($row['type'] ?? '') === 'email') {
                $emailFromRow = (string) $row['value'];
                break;
            }
        }

        $heading = trim((string) ($isId ? $doc->id_id_heading : $doc->en_heading));

        return [
            'heading' => $heading !== '' ? $heading : null,
            'contactRows' => $contactRows,
            'socialLinks' => $socialLinks,
            'email' => $emailFromRow ?: (string) ($doc->email ?? ''),
            'baseLocation' => (string) (($isId ? $doc->id_id_base_location : $doc->en_base_location) ?? ''),
        ];
    }

    private function mapResume(?ResumeSetting $doc, string $locale): array
    {
        $isId = $locale === 'id';
        $pdfUrl = null;

        if ($doc && $doc->file instanceof Media && $doc->file->fileExistsOnDisk()) {
            $pdfUrl = $doc->file->publicUrl();
        }

        $title = $doc
            ? (($isId ? $doc->id_id_document_title : $doc->en_document_title) ?: 'Curriculum Vitae')
            : 'Curriculum Vitae';

        return [
            'pdfUrl' => $pdfUrl,
            'previewPages' => $doc?->previewImage instanceof Media
                && str_starts_with((string) $doc->previewImage->mime_type, 'image/')
                && $doc->previewImage->fileExistsOnDisk()
                    ? array_filter([$this->mapProjectImage($doc->previewImage)]) : [],
            'documentTitle' => (string) $title,
        ];
    }
}
