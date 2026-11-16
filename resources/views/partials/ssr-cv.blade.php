@php
    $resume = $ssrContent['resume'] ?? ['pdfUrl' => null, 'documentTitle' => 'Curriculum Vitae'];
    $activePdfUrl = $resume['pdfUrl'] ?? null;
    $previewPages = $resume['previewPages'] ?? [];
    ob_start();
@endphp
<main id="main-content" tabindex="-1" class="cv-page">
    <div class="cv-container">
        <div class="cv-toolbar">
            <a href="/#about" class="btn-ghost"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left" aria-hidden="true"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>Back</a>
            <div class="cv-toolbar-actions">
                <button class="btn-solid" type="button"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-printer" aria-hidden="true"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"></path><rect x="6" y="14" width="12" height="8" rx="1"></rect></svg>Print</button>
                @if($activePdfUrl)
                    <a class="btn-solid" href="{{ $activePdfUrl }}" download=""><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download" aria-hidden="true"><path d="M12 15V3"></path><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5"></path></svg>Download CV</a>
                @endif
            </div>
        </div>
        <article class="cv-resume crosshair" aria-label="CV of Muhamad Dikrulloh" data-paper="A4">
            <div class="cv-sheet-container">
                <header class="cv-sheet-meta mono"><span>[ CV / RESUME ]</span><span>ISO 216 · A4 (210 × 297 MM) · PDF</span></header>
                <div class="cv-sheet-body{{ count($previewPages) > 0 ? ' cv-sheet-body-pdf' : '' }}" role="region" aria-label="Resume document">
                    @if(count($previewPages) > 0)
                        <div class="cv-preview-pages">
                            @foreach($previewPages as $index => $page)
                                <img src="{{ $page['url'] }}" @isset($page['srcSet']) srcset="{{ $page['srcSet'] }}" @endisset sizes="(max-width: 767px) calc(100vw - 80px), 712px" @isset($page['width']) width="{{ $page['width'] }}" @endisset @isset($page['height']) height="{{ $page['height'] }}" @endisset alt="Page {{ $index + 1 }} / {{ count($previewPages) }} — Muhamad Dikrulloh" loading="{{ $index === 0 ? 'eager' : 'lazy' }}" decoding="async" class="cv-pdf-canvas">
                            @endforeach
                        </div>
                    @else
                        <div class="cv-sheet-center">
                            <div class="cv-sheet-badge"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v6h6"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg><span class="label">A4 PDF Document</span></div>
                            <h1 id="cv-name">Muhamad Dikrulloh</h1>
                            <p class="cv-role">Web &amp; Mobile App Developer</p>
                            <p class="cv-empty-copy">CV preview image unavailable. The PDF loads only when you choose Print or Download CV.</p>
                        </div>
                    @endif
                </div>
                <footer class="cv-contact mono">
                    <div class="cv-contact-row">
                        <a href="mailto:muhamaddikrulloh@gmail.com"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail" aria-hidden="true"><path d="m22 7-8.991 5.727a1.94 1.94 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg><span>muhamaddikrulloh@gmail.com</span></a>
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg><span>Sukabumi, Indonesia</span></span>
                    </div>
                    <div class="cv-contact-row">
                        @foreach(['GitHub' => 'https://github.com/muhamaddikrulloh', 'LinkedIn' => 'https://www.linkedin.com/in/muhamaddikrulloh'] as $label => $url)
                            <a href="{{ $url }}" target="_blank" rel="noreferrer" aria-label="{{ $label }} profile (opens in a new tab)">{{ $label }}<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right" aria-hidden="true"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg></a>
                        @endforeach
                    </div>
                </footer>
            </div>
        </article>
    </div>
</main>
@php
    $cvHtml = ob_get_clean();
    echo preg_replace('/>\s+</u', '><', trim((string) $cvHtml));
@endphp
