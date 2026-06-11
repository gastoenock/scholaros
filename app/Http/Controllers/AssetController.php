<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssetController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $assets = $schoolId
            ? Asset::forSchool($schoolId)->orderByDesc('id')->get()
            : collect();

        $stats = [
            'totalAssets' => $assets->count(),
            'totalItems' => $assets->sum('quantity'),
            'totalValue' => $assets->sum(fn ($a) => $a->current_value ?? $a->purchase_cost ?? 0),
            'byCategory' => (object) $assets->groupBy('category')->map(fn ($group) => $group->sum('quantity'))->all(),
            'byStatus' => (object) $assets->groupBy('status')->map(fn ($group) => $group->sum('quantity'))->all(),
        ];

        return Inertia::render('dashboard/assets/page', [
            'assets' => $assets,
            'stats' => $stats,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'assetTag' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string'],
            'purchaseDate' => ['nullable', 'string'],
            'purchaseCost' => ['nullable', 'numeric'],
            'currentValue' => ['nullable', 'numeric'],
            'vendor' => ['nullable', 'string'],
            'warrantyExpiry' => ['nullable', 'string'],
            'assignedTo' => ['nullable', 'string'],
            'condition' => ['required', 'in:new,good,fair,poor,disposed'],
            'quantity' => ['required', 'integer', 'min:1'],
            'status' => ['required', 'in:in_use,in_storage,under_repair,disposed'],
        ]);

        Asset::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
        ]);

        return back()->with('success', 'Asset added successfully');
    }

    public function destroy(Asset $asset): RedirectResponse
    {
        abort_unless($asset->school_id === $this->schoolId(), 403);

        $asset->delete();

        return back()->with('success', 'Asset deleted');
    }
}
