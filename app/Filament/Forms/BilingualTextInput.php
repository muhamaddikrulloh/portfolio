<?php

namespace App\Filament\Forms;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;

class BilingualTextInput
{
    public static function make(string $name, string $partner): TextInput
    {
        return TextInput::make($name)
            ->live(onBlur: true)
            ->afterStateUpdated(function (?string $state, Get $get, Set $set) use ($partner): void {
                if (filled($state) && blank($get($partner))) {
                    $set($partner, $state);
                }
            });
    }
}
