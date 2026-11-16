<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    private function googleConfig(): array
    {
        $origin = rtrim((string) config('app.url'), '/');
        $parts = parse_url($origin);
        $local = app()->environment(['local', 'testing'])
            && in_array($parts['host'] ?? '', ['localhost', '127.0.0.1', '[::1]'], true);
        abort_unless(
            filter_var($origin, FILTER_VALIDATE_URL)
            && is_array($parts)
            && (($parts['scheme'] ?? '') === 'https' || ($local && ($parts['scheme'] ?? '') === 'http'))
            && ! isset($parts['user']) && ! isset($parts['pass'])
            && ! isset($parts['query']) && ! isset($parts['fragment'])
            && empty($parts['path']),
            503,
            'Google authentication is not configured.'
        );

        $google = config('services.google', []);
        $redirectUri = ($google['redirect_uri'] ?? '') ?: $origin.'/api/auth/google/callback';
        abort_unless(
            is_string($google['client_id'] ?? null) && trim($google['client_id']) !== ''
            && is_string($google['client_secret'] ?? null) && trim($google['client_secret']) !== ''
            && $redirectUri === $origin.'/api/auth/google/callback',
            503,
            'Google authentication is not configured.'
        );

        return [...$google, 'origin' => $origin, 'redirect_uri' => $redirectUri, 'secure' => $parts['scheme'] === 'https'];
    }

    public function redirect(Request $request): RedirectResponse
    {
        $google = $this->googleConfig();
        $state = bin2hex(random_bytes(32));
        $cookie = Cookie::make('payload_oauth_state', $state, 10, '/', null, $google['secure'], true, false, 'lax');
        $request->session()->put('oauth_state', $state);

        $googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => $google['client_id'],
            'redirect_uri' => $google['redirect_uri'],
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'prompt' => 'select_account',
        ]);

        return redirect()->away($googleAuthUrl, 307)->withCookie($cookie);
    }

    public function callback(Request $request): RedirectResponse
    {
        $google = $this->googleConfig();
        $code = $request->query('code', '');
        $state = $request->query('state', '');
        $expectedState = $request->session()->pull('oauth_state', '');
        $forgetCookie = Cookie::forget('payload_oauth_state', '/');

        if (! is_string($state) || $state === '' || ! is_string($expectedState) || $expectedState === '' || ! hash_equals($expectedState, $state)) {
            return redirect($google['origin'].'/admin/login?error=invalid_state')->withCookie($forgetCookie);
        }

        if (! is_string($code) || $code === '') {
            return redirect($google['origin'].'/admin/login?error=no_code')->withCookie($forgetCookie);
        }

        try {
            $tokenRes = Http::asForm()->timeout(10)->post('https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => $google['client_id'],
                'client_secret' => $google['client_secret'],
                'redirect_uri' => $google['redirect_uri'],
                'grant_type' => 'authorization_code',
            ]);

            if (! $tokenRes->successful()) {
                Log::error('[google-auth] Token exchange failed', ['status' => $tokenRes->status()]);

                return redirect($google['origin'].'/admin/login?error=token_failed')->withCookie($forgetCookie);
            }

            $accessToken = $tokenRes->json('access_token');
            if (! is_string($accessToken) || trim($accessToken) === '') {
                return redirect($google['origin'].'/admin/login?error=token_failed')->withCookie($forgetCookie);
            }

            $userRes = Http::withToken($accessToken)->timeout(10)->get('https://www.googleapis.com/oauth2/v3/userinfo');

            if (! $userRes->successful()) {
                Log::error('[google-auth] UserInfo request failed', ['status' => $userRes->status()]);

                return redirect($google['origin'].'/admin/login?error=userinfo_failed')->withCookie($forgetCookie);
            }

            $userProfile = $userRes->json();
        } catch (\Throwable) {
            Log::error('[google-auth] Network or exchange error');

            return redirect($google['origin'].'/admin/login?error=network_error')->withCookie($forgetCookie);
        }

        if (! is_array($userProfile) || ($userProfile['email_verified'] ?? null) !== true
            || ! is_string($userProfile['email'] ?? null) || ! filter_var($userProfile['email'], FILTER_VALIDATE_EMAIL)) {
            return redirect($google['origin'].'/admin/login?error=unverified')->withCookie($forgetCookie);
        }

        $normalizedEmail = strtolower(trim($userProfile['email']));
        if (! User::isAllowedAdminEmail($normalizedEmail)) {
            Log::warning('[google-auth] Unauthorized login attempt');

            return redirect($google['origin'].'/admin/login?error=unauthorized')->withCookie($forgetCookie);
        }

        $user = User::query()->where('email', $normalizedEmail)->first();
        if (! $user) {
            $user = User::query()->create([
                'email' => $normalizedEmail,
                'name' => is_string($userProfile['name'] ?? null) ? $userProfile['name'] : explode('@', $normalizedEmail)[0],
                'password' => Hash::make(Str::random(40).'!Aa1'),
                'email_verified_at' => now(),
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect($google['origin'].'/admin')->withCookie($forgetCookie);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/admin/login?state=logged_out');
    }
}
