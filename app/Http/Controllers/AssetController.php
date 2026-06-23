<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\Staff;
use App\Models\Vendor;
use App\Services\AssetAuditLogger;
use App\Support\InventoryCategories;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AssetController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $relations = [
            'vendor',
            'assignedStaff',
        ];

        $assets = $schoolId
            ? Asset::forSchool($schoolId)
                ->active()
                ->with($relations)
                ->orderByDesc('id')
                ->get()
            : collect();

        $archivedAssets = $schoolId
            ? Asset::forSchool($schoolId)
                ->archived()
                ->with($relations)
                ->orderByDesc('archived_at')
                ->get()
            : collect();

        $stats = [
            'totalAssets' => $assets->count(),
            'totalItems' => $assets->sum('quantity'),
            'totalValue' => $assets->sum(fn ($a) => $a->current_value ?? $a->purchase_cost ?? 0),
            'byGroup' => (object) $assets
                ->groupBy(fn ($a) => $a->inventory_group ?? 'uncategorized')
                ->map(fn ($group) => $group->sum('quantity'))
                ->all(),
            'byStatus' => (object) $assets->groupBy('status')->map(fn ($group) => $group->sum('quantity'))->all(),
            'archivedCount' => $archivedAssets->count(),
        ];

        return Inertia::render('dashboard/assets/page', [
            'assets' => $assets,
            'archivedAssets' => $archivedAssets,
            'stats' => $stats,
            'archiveRetentionDays' => Asset::ARCHIVE_RETENTION_DAYS,
            'vendors' => $schoolId
                ? Vendor::forSchool($schoolId)->where('is_active', true)->orderBy('name')->get()
                : collect(),
            'staff' => $schoolId
                ? Staff::forSchool($schoolId)->where('status', 'active')->orderBy('last_name')->get()
                : collect(),
            ...InventoryCategories::uiPayload(),
        ]);
    }

    public function show(Asset $asset): JsonResponse
    {
        abort_unless($asset->school_id === $this->schoolId(), 403);

        $asset->load([
            'vendor',
            'assignedStaff',
            'creator:id,name,email',
            'updater:id,name,email',
            'archiver:id,name,email',
        ]);

        $asset->setRelation(
            'auditLogs',
            $asset->auditLogs()
                ->with('user:id,name,email')
                ->limit(50)
                ->get(),
        );

        return response()->json($asset);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $this->validateAsset($request, $schoolId);
        $userId = auth()->id();

        $asset = Asset::create([
            ...$this->snakeKeys($validated),
            'category' => InventoryCategories::subcategoryLabel(
                $validated['inventoryGroup'],
                $validated['subcategory'],
            ),
            'school_id' => $schoolId,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        AssetAuditLogger::log($asset, 'created', 'Inventory item created', $userId);

        return back()->with('success', 'Inventory item added');
    }

    public function update(Request $request, Asset $asset): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId && $asset->school_id === $schoolId, 403);
        abort_if($asset->isArchived(), 403, 'Archived items cannot be edited.');

        $validated = $this->validateAsset($request, $schoolId);
        $userId = auth()->id();

        $asset->update([
            ...$this->snakeKeys($validated),
            'category' => InventoryCategories::subcategoryLabel(
                $validated['inventoryGroup'],
                $validated['subcategory'],
            ),
            'updated_by' => $userId,
        ]);

        AssetAuditLogger::log($asset, 'updated', 'Inventory details updated', $userId);

        return back()->with('success', 'Inventory item updated');
    }

    public function destroy(Asset $asset): RedirectResponse
    {
        abort_unless($asset->school_id === $this->schoolId(), 403);
        abort_if($asset->isArchived(), 403, 'Item is already archived.');

        $userId = auth()->id();

        $asset->update([
            'archived_at' => now(),
            'archived_by' => $userId,
            'updated_by' => $userId,
        ]);

        AssetAuditLogger::log(
            $asset,
            'archived',
            'Moved to archive (permanent deletion after '.Asset::ARCHIVE_RETENTION_DAYS.' days)',
            $userId,
        );

        return back()->with('success', 'Item moved to archive. It will be permanently removed after '.Asset::ARCHIVE_RETENTION_DAYS.' days.');
    }

    public function restore(Asset $asset): RedirectResponse
    {
        abort_unless($asset->school_id === $this->schoolId(), 403);
        abort_unless($asset->isArchived(), 403, 'Only archived items can be restored.');

        $userId = auth()->id();

        $asset->update([
            'archived_at' => null,
            'archived_by' => null,
            'updated_by' => $userId,
        ]);

        AssetAuditLogger::log($asset, 'restored', 'Restored from archive', $userId);

        return back()->with('success', 'Inventory item restored from archive');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateAsset(Request $request, int $schoolId): array
    {
        $groups = InventoryCategories::groups();

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'inventoryGroup' => ['required', 'string', Rule::in($groups)],
            'subcategory' => [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail) use ($request): void {
                    $group = $request->input('inventoryGroup');
                    if (! is_string($group) || ! InventoryCategories::isValidSubcategory($group, (string) $value)) {
                        $fail('The selected subcategory is invalid for this inventory group.');
                    }
                },
            ],
            'assetTag' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string'],
            'purchaseDate' => ['nullable', 'string'],
            'purchaseCost' => ['nullable', 'numeric'],
            'currentValue' => ['nullable', 'numeric'],
            'vendorId' => [
                'nullable',
                'integer',
                Rule::exists('vendors', 'id')->where(fn ($query) => $query->where('school_id', $schoolId)),
            ],
            'assignedStaffId' => [
                'nullable',
                'integer',
                Rule::exists('staff', 'id')->where(fn ($query) => $query->where('school_id', $schoolId)),
            ],
            'warrantyExpiry' => ['nullable', 'string'],
            'condition' => ['required', 'in:new,good,fair,poor,disposed'],
            'quantity' => ['required', 'integer', 'min:1'],
            'status' => ['required', 'in:in_use,in_storage,under_repair,disposed'],
        ]);
    }
}
