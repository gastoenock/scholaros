<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\School;
use App\Support\InventoryCategories;
use Inertia\Inertia;
use Inertia\Response;

class AssetPublicController extends Controller
{
    public function show(string $publicUuid): Response
    {
        abort_unless(tenancy()->initialized && tenant() instanceof School, 404);

        $asset = Asset::query()
            ->where('public_uuid', $publicUuid)
            ->where('school_id', tenant('id'))
            ->whereNull('archived_at')
            ->with([
                'vendor:id,name,category',
                'assignedStaff:id,first_name,last_name,designation,department',
            ])
            ->firstOrFail();

        /** @var School $school */
        $school = tenant();

        return Inertia::render('public/asset-preview', [
            'school' => [
                'name' => $school->name,
                'slug' => $school->slug,
            ],
            'asset' => [
                'name' => $asset->name,
                'assetTag' => $asset->asset_tag,
                'category' => $asset->category,
                'inventoryGroup' => $asset->inventory_group,
                'inventoryGroupLabel' => $asset->inventory_group
                    ? InventoryCategories::groupLabel($asset->inventory_group)
                    : null,
                'subcategory' => $asset->subcategory,
                'subcategoryLabel' => $asset->inventory_group && $asset->subcategory
                    ? InventoryCategories::subcategoryLabel($asset->inventory_group, $asset->subcategory)
                    : null,
                'description' => $asset->description,
                'location' => $asset->location,
                'condition' => $asset->condition,
                'status' => $asset->status,
                'quantity' => $asset->quantity,
                'purchaseDate' => $asset->purchase_date,
                'warrantyExpiry' => $asset->warranty_expiry,
                'vendor' => $asset->vendor ? [
                    'name' => $asset->vendor->name,
                    'category' => $asset->vendor->category,
                ] : null,
                'assignedStaff' => $asset->assignedStaff ? [
                    'name' => trim($asset->assignedStaff->first_name.' '.$asset->assignedStaff->last_name),
                    'designation' => $asset->assignedStaff->designation,
                    'department' => $asset->assignedStaff->department,
                ] : null,
            ],
        ])->rootView('public');
    }
}
