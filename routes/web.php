<?php

use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\PublicPortfolioController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PublicPortfolioController::class, 'home'])->name('portfolio.home');
Route::get('/projects', [PublicPortfolioController::class, 'projects'])->name('portfolio.projects');
Route::get('/cv', [PublicPortfolioController::class, 'cv'])->name('portfolio.cv');

Route::get('/robots.txt', [PublicPortfolioController::class, 'robots'])->name('portfolio.robots');
Route::get('/sitemap.xml', [PublicPortfolioController::class, 'sitemap'])->name('portfolio.sitemap');

Route::get('/api/auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
Route::get('/api/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
Route::match(['get', 'post'], '/api/auth/logout', [GoogleAuthController::class, 'logout'])->name('auth.google.logout');
