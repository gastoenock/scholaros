<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Vendor;
use Database\Seeders\Concerns\SeedsInventory;
use Illuminate\Database\Seeder;

class TenantDatabaseSeeder extends Seeder
{
    use SeedsInventory;

    public function run(): void
    {
        $schoolId = (int) tenant('id');

        $vendorIds = [];

        if (Vendor::forSchool($schoolId)->count() === 0) {
            $vendorIds = $this->seedInventoryVendors($schoolId);
        }

        if (Asset::forSchool($schoolId)->count() === 0) {
            if ($vendorIds === []) {
                $vendorIds = Vendor::forSchool($schoolId)
                    ->get()
                    ->mapWithKeys(fn (Vendor $vendor) => [
                        $this->vendorGroupKey($vendor->name) => $vendor->id,
                    ])
                    ->filter()
                    ->all();
            }

            $this->seedInventoryAssets($schoolId, $vendorIds);
        }

        $this->call(ExaminationResultsSeeder::class);
    }

    private function vendorGroupKey(string $name): ?string
    {
        return match ($name) {
            'BuildCo Tanzania' => 'physical_facility',
            'EduSupply Ltd' => 'educational_instructional',
            'TechPro Solutions' => 'technological_digital',
            'OfficeMart Supplies' => 'administrative_operational',
            default => null,
        };
    }
}
