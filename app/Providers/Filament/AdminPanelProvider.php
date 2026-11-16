<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\View\PanelsRenderHook;
use Filament\Widgets\AccountWidget;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Support\HtmlString;
use Illuminate\View\Middleware\ShareErrorsFromSession;

class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login(\App\Filament\Pages\Auth\Login::class)
            ->brandName(fn (): string => request()->routeIs('filament.admin.auth.login') ? 'Welcome to Control Room' : 'The Control Room')
            ->favicon('/icon.svg')
            ->darkMode(true, isForced: true)
            ->colors([
                'primary' => Color::hex('#FF4D00'),
            ])
            ->navigationGroups([
                'Portfolio',
                'Skills',
                'System',
            ])
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources')
            ->discoverPages(in: app_path('Filament/Pages'), for: 'App\\Filament\\Pages')
            ->pages([
                Dashboard::class,
            ])
            ->widgets([
                AccountWidget::class,
            ])
            ->renderHook(
                PanelsRenderHook::HEAD_END,
                fn (): HtmlString => $this->renderControlRoomStyles()
            )
            ->renderHook(
                PanelsRenderHook::AUTH_LOGIN_FORM_BEFORE,
                fn (): HtmlString => $this->renderGoogleLoginBanner()
            )
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                PreventRequestForgery::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }

    private function renderGoogleLoginBanner(): HtmlString
    {
        $error = (string) request()->query('error', '');
        $email = (string) request()->query('email', '');
        $state = (string) request()->query('state', '');

        $alertHtml = '';
        if ($error !== '') {
            $msg = match ($error) {
                'unauthorized' => $email !== '' ? 'Access denied for '.e($email) : 'Access denied',
                'invalid_state' => 'Session expired or security token mismatch.',
                default => 'Failed to verify Google account. Please try again.',
            };
            $alertHtml = '<div class="toast-error" role="alert" style="margin-bottom:16px;padding:12px 14px;border-radius:8px;background:#7f1d1d;color:#fecaca;border:1px solid #ef4444;font-size:13px;font-weight:500;">'.$msg.'</div>';
        } elseif ($state === 'logged_out') {
            $alertHtml = '<div class="toast-info" role="status" style="margin-bottom:16px;padding:12px 14px;border-radius:8px;background:#1e293b;color:#e2e8f0;border:1px solid #475569;font-size:13px;">You have been logged out successfully.</div>';
        }

        return new HtmlString($alertHtml.'
            <div class="control-room-auth-actions">
                <a href="/api/auth/google" class="control-room-google-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>Continue with Google</span>
                </a>
            </div>
        ');
    }

    private function renderControlRoomStyles(): HtmlString
    {
        return new HtmlString('
            <style>
                @font-face {
                    font-family: "Big Shoulders Display";
                    font-style: normal;
                    font-weight: 100 900;
                    font-display: swap;
                    src: url("/fonts/portfolio/big_shoulders_display_latin-s.p.25pflephogvim.woff2") format("woff2");
                }
                @font-face {
                    font-family: "Geist";
                    font-style: normal;
                    font-weight: 100 900;
                    font-display: swap;
                    src: url("/fonts/portfolio/4f6667dd39116621-s.3p2_lha1f2xer.woff2") format("woff2");
                }
                @font-face {
                    font-family: "Geist Mono";
                    font-style: normal;
                    font-weight: 100 900;
                    font-display: swap;
                    src: url("/fonts/portfolio/07a39a8a4660cc7c-s.p.0r6juujl39pe6.woff2") format("woff2");
                }

                /* Control Room Theme Base for /admin/login */
                body.fi-body {
                    background-color: #070709 !important;
                    background-image: radial-gradient(rgba(243, 242, 237, 0.04) 1px, transparent 1px) !important;
                    background-size: 24px 24px !important;
                    color: #f3f2ed !important;
                    font-family: "Geist", -apple-system, BlinkMacSystemFont, sans-serif !important;
                    -webkit-font-smoothing: antialiased;
                }

                /* Container Card */
                .fi-simple-main {
                    background: #0e0f13 !important;
                    border: 1px solid rgba(243, 242, 237, 0.12) !important;
                    border-radius: 14px !important;
                    box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 77, 0, 0.08) !important;
                    padding: 2.25rem 2rem !important;
                    position: relative;
                }

                /* Subtle corner crosshairs (+) */
                .fi-simple-main::before,
                .fi-simple-main::after {
                    content: "+";
                    position: absolute;
                    font-family: "Geist Mono", monospace;
                    font-size: 11px;
                    color: rgba(243, 242, 237, 0.25);
                    line-height: 1;
                    pointer-events: none;
                }
                .fi-simple-main::before { top: 8px; left: 10px; }
                .fi-simple-main::after { bottom: 8px; right: 10px; }

                /* Header: Title & Subtitle */
                .fi-simple-header {
                    margin-bottom: 0 !important;
                    text-align: center;
                }
                .fi-simple-header-heading {
                    margin: 0 !important;
                    padding: 0 !important;
                    line-height: 1 !important;
                }
                .control-room-heading {
                    display: block;
                    font-family: "Big Shoulders Display", sans-serif;
                    font-weight: 800;
                    font-size: 34px;
                    letter-spacing: -0.5px;
                    text-transform: uppercase;
                    color: #f3f2ed;
                    line-height: 1.1;
                }
                .control-room-subheading {
                    display: block;
                    margin-top: 8px;
                    font-family: "Geist Mono", monospace;
                    font-size: 12px;
                    color: rgba(243, 242, 237, 0.55);
                    letter-spacing: 0.2px;
                    line-height: 1.4;
                }

                /* Google Action Button & Actions Container */
                .control-room-auth-actions {
                    margin: 0 !important;
                    width: 100%;
                }
                .control-room-google-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    width: 100%;
                    padding: 11px 18px;
                    background-color: #f3f2ed !important;
                    color: #0b0b0b !important;
                    border: 1px solid rgba(243, 242, 237, 0.3) !important;
                    border-radius: 8px !important;
                    font-family: "Geist Mono", monospace;
                    font-size: 12.5px;
                    font-weight: 600;
                    letter-spacing: 0.3px;
                    text-decoration: none;
                    box-sizing: border-box;
                    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
                }
                .control-room-google-btn:hover {
                    background-color: #ffffff !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
                }

                /* OR Divider - Balanced tight spacing */
                .control-room-divider {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-top: 14px !important;
                    margin-bottom: 0 !important;
                    width: 100%;
                }
                .control-room-divider-line {
                    flex: 1;
                    height: 1px;
                    background: rgba(243, 242, 237, 0.10);
                }
                .control-room-divider-badge {
                    font-family: "Geist Mono", monospace;
                    font-size: 10px;
                    letter-spacing: 1.2px;
                    color: rgba(243, 242, 237, 0.38);
                    text-transform: uppercase;
                }

                /* Reduce grid gap between auth actions and form */
                .fi-simple-main .fi-sc-has-gap {
                    gap: 1rem !important;
                }

                /* Form Fields */
                .fi-sc-form {
                    gap: 1.15rem !important;
                }
                .fi-fo-field-wrp-label label {
                    font-family: "Geist Mono", monospace !important;
                    font-size: 11px !important;
                    letter-spacing: 0.8px !important;
                    text-transform: uppercase !important;
                    color: rgba(243, 242, 237, 0.70) !important;
                    font-weight: 500 !important;
                }
                .fi-input-wrp {
                    background-color: #08090b !important;
                    border: 1px solid rgba(243, 242, 237, 0.12) !important;
                    border-radius: 8px !important;
                    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4) !important;
                    transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
                }
                .fi-input-wrp:focus-within {
                    border-color: #FF4D00 !important;
                    box-shadow: 0 0 0 1px #FF4D00, 0 0 8px rgba(255, 77, 0, 0.25) !important;
                }
                .fi-input {
                    font-family: "Geist Mono", monospace !important;
                    font-size: 13px !important;
                    color: #f3f2ed !important;
                }
                .fi-input::placeholder {
                    color: rgba(243, 242, 237, 0.25) !important;
                }

                /* Checkbox "Remember me" */
                .fi-checkbox-input {
                    background-color: #08090b !important;
                    border-color: rgba(243, 242, 237, 0.2) !important;
                    border-radius: 4px !important;
                }
                .fi-checkbox-input:checked {
                    background-color: #FF4D00 !important;
                    border-color: #FF4D00 !important;
                }
                .fi-fo-checkbox span {
                    font-family: "Geist Mono", monospace !important;
                    font-size: 11px !important;
                    color: rgba(243, 242, 237, 0.65) !important;
                }

                /* Submit Button "Sign in" */
                .fi-btn-primary {
                    background-color: #FF4D00 !important;
                    color: #f3f2ed !important;
                    font-family: "Geist Mono", monospace !important;
                    font-size: 12.5px !important;
                    font-weight: 700 !important;
                    letter-spacing: 0.8px !important;
                    text-transform: uppercase !important;
                    border-radius: 8px !important;
                    padding-top: 10px !important;
                    padding-bottom: 10px !important;
                    transition: all 0.15s ease !important;
                    border: none !important;
                }
                .fi-btn-primary:hover {
                    background-color: #e04400 !important;
                    box-shadow: 0 0 16px rgba(255, 77, 0, 0.4) !important;
                }

                /* Mobile Responsiveness */
                @media (max-width: 640px) {
                    .fi-simple-main {
                        padding: 1.75rem 1.25rem !important;
                        margin: 1rem !important;
                    }
                    .control-room-heading {
                        font-size: 28px !important;
                    }
                    .control-room-subheading {
                        font-size: 11px !important;
                    }
                }
            </style>
        ');
    }
}
