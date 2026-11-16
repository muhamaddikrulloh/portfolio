<?php

namespace App\Http\Controllers;

use App\Services\PortfolioDataService;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class PublicPortfolioController extends Controller
{
    public function __construct(
        private readonly PortfolioDataService $portfolioDataService
    ) {}

    private function canonicalSiteUrl(Request $request): string
    {
        $configured = (string) config('app.url', 'https://mdikrulloh.informatika24b.my.id');
        if ($configured !== '' && ! str_contains($configured, 'localhost') && ! str_contains($configured, '127.0.0.1')) {
            return rtrim($configured, '/');
        }

        return 'https://mdikrulloh.informatika24b.my.id';
    }

    public function home(Request $request): InertiaResponse
    {
        $bundle = $this->portfolioDataService->getBilingualPortfolioBundle();
        $siteUrl = $this->canonicalSiteUrl($request);

        return Inertia::render('Home', [
            'initialBundle' => $bundle,
        ])->withViewData([
            'seo' => [
                'route' => 'home',
                'title' => 'Muhamad Dikrulloh — Web & Mobile Developer',
                'description' => 'Muhamad Dikrulloh. I develop web and mobile applications with a focus on functionality, thoughtful design, and user experience. Web and Mobile App Developer specializing in functional architecture, thoughtful interfaces, and reliable applications.',
                'ogDescription' => 'Muhamad Dikrulloh. I develop web and mobile applications with a focus on functionality, thoughtful design, and user experience.',
                'canonical' => $siteUrl.'/',
                'ogType' => 'website',
                'siteUrl' => $siteUrl,
                'dateModified' => substr($this->portfolioDataService->getHomeLastModified(), 0, 10),
                'preloadHeroImage' => true,
            ],
            'ssrContent' => [
                'route' => 'home',
                'en' => $bundle['en'],
            ],
        ]);
    }

    public function projects(Request $request): InertiaResponse
    {
        $projects = $this->portfolioDataService->getBilingualProjects();
        $siteUrl = $this->canonicalSiteUrl($request);
        $timestamps = $this->portfolioDataService->getSitemapTimestamps();

        return Inertia::render('Projects', [
            'initialProjects' => $projects,
        ])->withViewData([
            'seo' => [
                'route' => 'projects',
                'title' => 'All Projects — Muhamad Dikrulloh',
                'description' => 'Explore the complete archive of web applications, mobile apps, and interactive experiments built by Muhamad Dikrulloh.',
                'ogDescription' => 'Explore the complete archive of web applications, mobile apps, and interactive experiments built by Muhamad Dikrulloh.',
                'canonical' => $siteUrl.'/projects',
                'ogType' => 'website',
                'siteUrl' => $siteUrl,
                'dateModified' => substr($timestamps['projects'], 0, 10),
                'preloadHeroImage' => false,
            ],
            'ssrContent' => [
                'route' => 'projects',
                'projects' => $projects['en'],
            ],
        ]);
    }

    public function cv(Request $request): InertiaResponse
    {
        $resume = $this->portfolioDataService->getBilingualResume();
        $siteUrl = $this->canonicalSiteUrl($request);
        $timestamps = $this->portfolioDataService->getSitemapTimestamps();

        return Inertia::render('Cv', [
            'activePdfUrl' => $resume['en']['pdfUrl'] ?? null,
            'initialResume' => $resume,
        ])->withViewData([
            'seo' => [
                'route' => 'cv',
                'title' => 'Curriculum Vitae — Muhamad Dikrulloh',
                'description' => 'Curriculum Vitae of Muhamad Dikrulloh — Web & Mobile Developer. Education, technical skills, professional experience, and verified certifications.',
                'ogDescription' => 'Curriculum Vitae of Muhamad Dikrulloh — Web & Mobile Developer. Education, technical skills, professional experience, and verified certifications.',
                'twitterDescription' => 'Curriculum Vitae of Muhamad Dikrulloh — Web & Mobile Developer.',
                'canonical' => $siteUrl.'/cv',
                'ogType' => 'profile',
                'siteUrl' => $siteUrl,
                'dateModified' => substr($timestamps['cv'], 0, 10),
                'preloadHeroImage' => false,
            ],
            'ssrContent' => [
                'route' => 'cv',
                'resume' => $resume['en'],
            ],
        ]);
    }

    public function robots(Request $request): HttpResponse
    {
        $siteUrl = $this->canonicalSiteUrl($request);
        $lines = [
            'User-Agent: *',
            'Allow: /',
            'Allow: /cv',
            'Allow: /projects',
            'Allow: /build/',
            'Disallow: /admin/',
            'Disallow: /api/',
            '',
            "Sitemap: {$siteUrl}/sitemap.xml",
            '',
        ];

        return response(implode("\n", $lines), 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }

    public function sitemap(Request $request): HttpResponse
    {
        $siteUrl = $this->canonicalSiteUrl($request);
        $timestamps = $this->portfolioDataService->getSitemapTimestamps();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n"
            .'  <url>'."\n"
            .'    <loc>'.e($siteUrl.'/') .'</loc>'."\n"
            .'    <lastmod>'.e($timestamps['home']).'</lastmod>'."\n"
            .'    <changefreq>weekly</changefreq>'."\n"
            .'    <priority>1.0</priority>'."\n"
            .'  </url>'."\n"
            .'  <url>'."\n"
            .'    <loc>'.e($siteUrl.'/projects').'</loc>'."\n"
            .'    <lastmod>'.e($timestamps['projects']).'</lastmod>'."\n"
            .'    <changefreq>weekly</changefreq>'."\n"
            .'    <priority>0.8</priority>'."\n"
            .'  </url>'."\n"
            .'  <url>'."\n"
            .'    <loc>'.e($siteUrl.'/cv').'</loc>'."\n"
            .'    <lastmod>'.e($timestamps['cv']).'</lastmod>'."\n"
            .'    <changefreq>monthly</changefreq>'."\n"
            .'    <priority>0.7</priority>'."\n"
            .'  </url>'."\n"
            .'</urlset>'."\n";

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
        ]);
    }
}
