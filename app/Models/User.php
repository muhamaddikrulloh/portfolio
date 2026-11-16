<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'email_verified_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements FilamentUser
{
    use Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return self::isAllowedAdminEmail($this->email);
    }

    public static function isAllowedAdminEmail(?string $email): bool
    {
        if (! is_string($email) || trim($email) === '') {
            return false;
        }

        $raw = (string) config('services.google.allowed_admin_emails', '');
        $allowed = array_values(array_filter(array_map(
            static fn (string $item) => strtolower(trim($item)),
            explode(',', $raw)
        )));

        return in_array(strtolower(trim($email)), $allowed, true);
    }
}
