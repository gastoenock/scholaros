<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contactPerson' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'category' => ['nullable', 'string', 'max:255'],
        ]);

        Vendor::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'is_active' => true,
        ]);

        return back()->with('success', 'Vendor registered');
    }

    public function destroy(Vendor $vendor): RedirectResponse
    {
        abort_unless($vendor->school_id === $this->schoolId(), 403);

        $vendor->delete();

        return back()->with('success', 'Vendor removed');
    }
}
