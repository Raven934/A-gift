<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    // This is where extra app helpers would be plugged in.
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    // This runs when Laravel wakes up; nothing special is needed yet.
    public function boot(): void
    {
        //
    }
}
