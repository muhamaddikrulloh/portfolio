<?php

namespace App\Filament\Pages;

use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Schemas\Components\Actions;
use Filament\Schemas\Components\EmbeddedSchema;
use Filament\Schemas\Components\Form;
use Filament\Schemas\Schema;
use Illuminate\Database\Eloquent\Model;

/**
 * @property-read Schema $form
 */
abstract class BaseSingletonPage extends Page
{
    /**
     * @var array<string, mixed>|null
     */
    public ?array $data = [];

    abstract protected function getRecord(): Model;

    public function mount(): void
    {
        $record = $this->getRecord();
        $this->form->fill($record->attributesToArray());
    }

    public function defaultForm(Schema $schema): Schema
    {
        return $schema
            ->statePath('data');
    }

    abstract public function form(Schema $schema): Schema;

    public function content(Schema $schema): Schema
    {
        return $schema
            ->components([
                Form::make([EmbeddedSchema::make('form')])
                    ->id('form')
                    ->livewireSubmitHandler('save')
                    ->footer([
                        Actions::make([
                            Action::make('save')
                                ->label('Save changes')
                                ->submit('save')
                                ->keyBindings(['mod+s']),
                        ])->key('form-actions'),
                    ]),
            ]);
    }

    public function save(): void
    {
        $state = $this->form->getState();
        $record = $this->getRecord();
        $record->fill($state);
        $record->save();

        Notification::make()
            ->success()
            ->title('Saved successfully')
            ->send();
    }
}
