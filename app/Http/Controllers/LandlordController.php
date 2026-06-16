<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Support\TenancyUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LandlordController extends Controller
{
    public function enter(School $school): RedirectResponse
    {
        abort_unless(auth()->user()?->isPlatformAdmin(), 403);

        session(['manage_tenant_id' => $school->id]);

        return redirect()
            ->away(TenancyUrl::tenantUrlForSchool($school, '/dashboard'))
            ->with('success', "You are now managing {$school->name}.");
    }

    public function leave(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->isPlatformAdmin(), 403);

        $request->session()->forget('manage_tenant_id');

        return redirect()
            ->away(TenancyUrl::centralUrl('/dashboard'))
            ->with('success', 'Returned to platform administration.');
    }
}
