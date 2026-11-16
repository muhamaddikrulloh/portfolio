<?php

namespace App\Filament\Pages\Auth;

use Filament\Auth\Pages\Login as BaseLogin;
use Filament\Schemas\Components\RenderHook;
use Filament\Schemas\Schema;
use Filament\Support\Enums\Width;
use Filament\View\PanelsRenderHook;
use Illuminate\Contracts\Support\Htmlable;
use Illuminate\Support\HtmlString;

class Login extends BaseLogin
{
    public function content(Schema $schema): Schema
    {
        return $schema->components([
            RenderHook::make(PanelsRenderHook::AUTH_LOGIN_FORM_BEFORE),
            RenderHook::make(PanelsRenderHook::AUTH_LOGIN_FORM_AFTER),
        ]);
    }

    public function getTitle(): string | Htmlable
    {
        return 'Login';
    }

    public function hasLogo(): bool
    {
        return false;
    }

    public function getHeading(): string | Htmlable
    {
        return new HtmlString('<span class="control-room-heading">The Control Room.</span>');
    }

    public function getSubheading(): string | Htmlable | null
    {
        return new HtmlString('<span class="control-room-subheading">Your space to manage what\'s behind the scenes.</span>');
    }

    public function getMaxWidth(): Width | string | null
    {
        return Width::Medium;
    }
}
