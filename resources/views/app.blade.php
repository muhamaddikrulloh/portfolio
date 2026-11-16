@php
    $siteUrl = $seo['siteUrl'] ?? 'https://mdikrulloh.informatika24b.my.id';
    $title = $seo['title'] ?? 'Muhamad Dikrulloh — Web & Mobile Developer';
    $description = $seo['description'] ?? 'Muhamad Dikrulloh. I develop web and mobile applications with a focus on functionality, thoughtful design, and user experience. Web and Mobile App Developer specializing in functional architecture, thoughtful interfaces, and reliable applications.';
    $ogDescription = $seo['ogDescription'] ?? 'Muhamad Dikrulloh. I develop web and mobile applications with a focus on functionality, thoughtful design, and user experience.';
    $twitterDescription = $seo['twitterDescription'] ?? $ogDescription;
    $canonical = $seo['canonical'] ?? ($siteUrl . '/');
    $ogType = $seo['ogType'] ?? 'website';
    $dateModified = $seo['dateModified'] ?? '2026-11-10';
    $routeType = $ssrContent['route'] ?? 'home';
    $component = $page['component'] ?? 'Home';
    $viteAssets = \App\Support\ViteManifest::assetsForComponent($component, inlineCss: true);

    $jsonLd = [
        '@context' => 'https://schema.org',
        '@graph' => [
            [
                '@type' => 'Person',
                '@id' => $siteUrl . '/#person',
                'name' => 'Muhamad Dikrulloh',
                'givenName' => 'Muhamad',
                'familyName' => 'Dikrulloh',
                'url' => $siteUrl,
                'image' => $siteUrl . '/portrait-hero.webp',
                'jobTitle' => 'Web & Mobile Application Developer',
                'email' => 'mailto:muhamaddikrulloh@gmail.com',
                'sameAs' => [
                    'https://github.com/muhamaddikrulloh',
                    'https://www.linkedin.com/in/muhamaddikrulloh',
                    'https://instagram.com/muhamaddikrulloh',
                ],
                'alumniOf' => [
                    '@type' => 'CollegeOrUniversity',
                    'name' => 'Universitas Muhammadiyah Sukabumi',
                    'url' => 'https://ummi.ac.id',
                ],
                'address' => [
                    '@type' => 'PostalAddress',
                    'addressLocality' => 'Sukabumi',
                    'addressRegion' => 'Jawa Barat',
                    'addressCountry' => 'ID',
                ],
                'knowsAbout' => [
                    'Web Development',
                    'Android Development',
                    'React',
                    'Next.js',
                    'TypeScript',
                    'JavaScript',
                    'PHP',
                    'PostgreSQL',
                    'MySQL',
                    'Kotlin',
                    'UI/UX Design',
                ],
            ],
            [
                '@type' => 'WebSite',
                '@id' => $siteUrl . '/#website',
                'url' => $siteUrl,
                'name' => 'Muhamad Dikrulloh Portfolio',
                'description' => 'I develop web and mobile applications with a focus on functionality, thoughtful design, and user experience.',
                'publisher' => [
                    '@id' => $siteUrl . '/#person',
                ],
                'inLanguage' => ['en-US', 'id-ID'],
            ],
            [
                '@type' => $routeType === 'projects' ? 'CollectionPage' : 'ProfilePage',
                '@id' => $canonical . ($routeType === 'projects' ? '#collectionpage' : '#profilepage'),
                'url' => $canonical,
                'name' => $title,
                'isPartOf' => [
                    '@id' => $siteUrl . '/#website',
                ],
                'mainEntity' => [
                    '@id' => $siteUrl . '/#person',
                ],
                'dateModified' => $dateModified,
            ],
        ],
    ];
@endphp
<!DOCTYPE html>
<html lang="en" class="h-full antialiased">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
    <meta name="theme-color" content="#0B0B0B" />
    <meta name="color-scheme" content="dark" />
    <title>{{ $title }}</title>
    <meta name="description" content="{{ $description }}" />
    <meta name="application-name" content="Muhamad Dikrulloh Portfolio" />
    <link rel="author" href="{{ $siteUrl }}" />
    <meta name="author" content="Muhamad Dikrulloh" />
    <meta name="keywords" content="Muhamad Dikrulloh,Web Developer,Mobile Developer,Software Engineer,Next.js,React,TypeScript,Android Developer,Kotlin,Frontend Engineer,Portfolio,Indonesia,Sukabumi,UMMI" />
    <meta name="referrer" content="origin-when-cross-origin" />
    <meta name="creator" content="Muhamad Dikrulloh" />
    <meta name="publisher" content="Muhamad Dikrulloh" />
    <meta name="format-detection" content="telephone=no, address=no, email=no" />
    <meta name="robots" content="index, follow" />
    <meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
    <link rel="canonical" href="{{ $canonical }}" />

    <meta property="og:title" content="{{ $title }}" />
    <meta property="og:description" content="{{ $ogDescription }}" />
    <meta property="og:url" content="{{ $canonical }}" />
    <meta property="og:site_name" content="Muhamad Dikrulloh Portfolio" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:locale:alternate" content="id_ID" />
    <meta property="og:image" content="{{ $siteUrl }}/portrait-hero.webp" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Muhamad Dikrulloh — Web & Mobile Developer" />
    <meta property="og:type" content="{{ $ogType }}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:creator" content="@muhamaddikrulloh" />
    <meta name="twitter:title" content="{{ $title }}" />
    <meta name="twitter:description" content="{{ $twitterDescription }}" />
    <meta name="twitter:image" content="{{ $siteUrl }}/portrait-hero.webp" />

    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="shortcut icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/icon.svg" />

    <link rel="preload" href="/fonts/portfolio/605ce01b664af129-s.p.0wgildi0cnwt9.woff2" as="font" type="font/woff2" crossorigin="" />
    <link rel="preload" href="/fonts/portfolio/07a39a8a4660cc7c-s.p.0r6juujl39pe6.woff2" as="font" type="font/woff2" crossorigin="" />
    <link rel="preload" href="/fonts/portfolio/big_shoulders_display_latin-s.p.25pflephogvim.woff2" as="font" type="font/woff2" crossorigin="" />
    <link rel="prefetch" href="/badge.glb" as="fetch" crossorigin="anonymous" />

    @if(!empty($seo['preloadHeroImage']))
    <link rel="preload" as="image" type="image/avif" imagesrcset="/portrait-hero-640.avif 640w, /portrait-hero.avif 1280w" imagesizes="(max-width: 382px) 92vw, (max-width: 899px) 352px, 57vw" fetchpriority="high" />
    @endif

    <script type="application/ld+json">{!! json_encode($jsonLd, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
    <script>if("scrollRestoration"in history)history.scrollRestoration="manual";(function(){var n=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0];if(n&&n.type==="reload"){window.__portfolioTargetHash="";if(location.hash||history.state){history.replaceState(null,"",location.pathname+location.search);}window.scrollTo(0,0);}})();</script>

    @if($viteAssets['isHot'])
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @else
        @if($viteAssets['inlineCss'] !== '')
            <style>{!! $viteAssets['inlineCss'] !!}</style>
        @endif
        @foreach($viteAssets['stylesheets'] as $cssHref)
            <link rel="stylesheet" href="{{ $cssHref }}" data-navigate-track="reload" />
        @endforeach
        @foreach($viteAssets['modulePreloads'] as $moduleHref)
            <link rel="modulepreload" href="{{ $moduleHref }}" />
        @endforeach
        @foreach($viteAssets['scripts'] as $scriptSrc)
            <script type="module" src="{{ $scriptSrc }}" data-navigate-track="reload"></script>
        @endforeach
    @endif
</head>
<body class="min-h-full flex flex-col">
    <script data-page="app" type="application/json">{!! json_encode($page, JSON_HEX_TAG) !!}</script>
    <div data-server-rendered="true" id="app">@include('partials.ssr-header')@if($routeType === 'home')@include('partials.ssr-home')@elseif($routeType === 'projects')@include('partials.ssr-projects')@elseif($routeType === 'cv')@include('partials.ssr-cv')@endif{{-- --}}{{ '' }}@include('partials.ssr-footer')</div>
</body>
</html>
