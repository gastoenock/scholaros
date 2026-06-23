<?php

namespace Database\Seeders\Concerns;

use App\Models\Asset;
use App\Models\Staff;
use App\Models\Vendor;
use App\Support\InventoryCategories;

trait SeedsInventory
{
    /**
     * @return array<string, int>
     */
    protected function seedInventoryVendors(int $schoolId): array
    {
        $vendorIds = [];

        foreach ([
            ['BuildCo Tanzania', 'Construction & Facilities', '+255 22 555 0100', 'physical_facility'],
            ['EduSupply Ltd', 'Educational Materials', '+255 22 555 0200', 'educational_instructional'],
            ['TechPro Solutions', 'IT & Software', '+255 22 555 0300', 'technological_digital'],
            ['OfficeMart Supplies', 'Office & Admin', '+255 22 555 0400', 'administrative_operational'],
        ] as [$vendorName, $vendorCategory, $vendorPhone, $vendorGroupKey]) {
            $vendorIds[$vendorGroupKey] = Vendor::create([
                'school_id' => $schoolId,
                'name' => $vendorName,
                'category' => $vendorCategory,
                'phone' => $vendorPhone,
                'is_active' => true,
            ])->id;
        }

        return $vendorIds;
    }

    /**
     * @param  array<string, int>  $vendorIds
     */
    protected function seedInventoryAssets(int $schoolId, array $vendorIds): void
    {
        $staffIds = Staff::forSchool($schoolId)->pluck('id', 'staff_id');

        $inventoryStaffByGroup = [
            'physical_facility' => $staffIds['STF-A013'] ?? null,
            'educational_instructional' => $staffIds['STF-A004'] ?? null,
            'technological_digital' => $staffIds['STF-A005'] ?? null,
            'administrative_operational' => $staffIds['STF-A006'] ?? null,
        ];

        $inventoryItems = [
            ['Main Classroom Block', 'physical_facility', 'buildings_grounds', 'INV-PF-001', 'Block A — 12 classrooms', 850000, 1, 'good'],
            ['School Auditorium', 'physical_facility', 'buildings_grounds', 'INV-PF-002', '500-seat auditorium', 420000, 1, 'good'],
            ['Gymnasium & Sports Field', 'physical_facility', 'buildings_grounds', 'INV-PF-003', 'PE facilities', 310000, 1, 'good'],
            ['Student Desk Set', 'physical_facility', 'furniture', 'INV-PF-004', 'All Classrooms', 150, 300, 'good'],
            ['Ergonomic Teacher Workstation', 'physical_facility', 'furniture', 'INV-PF-005', 'Staff Offices', 450, 45, 'good'],
            ['Library Shelving Units', 'physical_facility', 'furniture', 'INV-PF-006', 'Central Library', 1200, 24, 'good'],
            ['Fire Alarm System', 'physical_facility', 'safety_equipment', 'INV-PF-007', 'Campus-wide', 18000, 1, 'good'],
            ['CCTV Security Cameras', 'physical_facility', 'safety_equipment', 'INV-PF-008', 'All blocks', 8500, 32, 'good'],
            ['Emergency Exit Lighting', 'physical_facility', 'safety_equipment', 'INV-PF-009', 'All corridors', 120, 85, 'good'],
            ['First Aid Supply Kits', 'physical_facility', 'safety_equipment', 'INV-PF-010', 'Nurse office + labs', 45, 20, 'good'],
            ['Janitorial Supply Stock', 'physical_facility', 'maintenance_tools', 'INV-PF-011', 'Maintenance store', 2500, 1, 'good'],
            ['Landscaping Equipment', 'physical_facility', 'maintenance_tools', 'INV-PF-012', 'Grounds store', 4200, 1, 'fair'],
            ['Mathematics Textbook Set', 'educational_instructional', 'learning_materials', 'INV-EI-001', 'Grade 7–9', 35, 450, 'good'],
            ['Science Lab Equipment Kit', 'educational_instructional', 'learning_materials', 'INV-EI-002', 'Science Lab', 12000, 1, 'good'],
            ['Robotics Learning Kit', 'educational_instructional', 'learning_materials', 'INV-EI-003', 'STEM Lab', 850, 15, 'new'],
            ['Art Supplies Inventory', 'educational_instructional', 'learning_materials', 'INV-EI-004', 'Art Room', 2200, 1, 'good'],
            ['Physical Book Collection', 'educational_instructional', 'library_resources', 'INV-EI-005', 'Central Library', 25, 8500, 'good'],
            ['Encyclopedia & Reference Set', 'educational_instructional', 'library_resources', 'INV-EI-006', 'Reference section', 180, 120, 'good'],
            ['Academic Journal Subscriptions', 'educational_instructional', 'library_resources', 'INV-EI-007', 'Digital + print', 1200, 1, 'good'],
            ['Sensory Equipment Set', 'educational_instructional', 'special_education_tools', 'INV-EI-008', 'SEN Unit', 3200, 1, 'good'],
            ['Mobility Aids', 'educational_instructional', 'special_education_tools', 'INV-EI-009', 'SEN Unit', 450, 6, 'good'],
            ['Student Laptop — HP ProBook', 'technological_digital', 'hardware', 'INV-TD-001', 'ICT Lab + loan pool', 650, 120, 'good'],
            ['Teacher Laptop Fleet', 'technological_digital', 'hardware', 'INV-TD-002', 'Staff', 720, 55, 'good'],
            ['Interactive Smartboard', 'technological_digital', 'hardware', 'INV-TD-003', 'Classrooms', 1800, 18, 'good'],
            ['Tablet Devices — iPad', 'technological_digital', 'hardware', 'INV-TD-004', 'Primary wing', 380, 60, 'good'],
            ['Network Printers', 'technological_digital', 'hardware', 'INV-TD-005', 'Admin + labs', 420, 8, 'good'],
            ['Google Workspace for Education', 'technological_digital', 'software_subscriptions', 'INV-TD-006', 'Campus-wide license', 12000, 1, 'good'],
            ['Canvas LMS Subscription', 'technological_digital', 'software_subscriptions', 'INV-TD-007', 'Secondary section', 8500, 1, 'good'],
            ['Digital Library Platform', 'technological_digital', 'software_subscriptions', 'INV-TD-008', 'Library', 2400, 1, 'good'],
            ['Campus Wi-Fi Infrastructure', 'technological_digital', 'infrastructure', 'INV-TD-009', 'All buildings', 45000, 1, 'good'],
            ['Broadband & Network Server', 'technological_digital', 'infrastructure', 'INV-TD-010', 'Server room', 28000, 1, 'good'],
            ['Office Paper & Supplies', 'administrative_operational', 'office_supplies', 'INV-AO-001', 'Admin store', 3500, 1, 'good'],
            ['Filing Cabinets & Storage', 'administrative_operational', 'office_supplies', 'INV-AO-002', 'Admin offices', 280, 30, 'good'],
            ['Document Scanner Fleet', 'administrative_operational', 'office_supplies', 'INV-AO-003', 'Records office', 350, 4, 'good'],
            ['Student Information System', 'administrative_operational', 'data_records', 'INV-AO-004', 'ScholarOS SIS', 15000, 1, 'good'],
            ['Attendance Tracking Software', 'administrative_operational', 'data_records', 'INV-AO-005', 'Campus-wide', 4200, 1, 'good'],
            ['Finance & HR Database', 'administrative_operational', 'data_records', 'INV-AO-006', 'Bursar office', 6800, 1, 'good'],
        ];

        foreach ($inventoryItems as [$name, $group, $subcategory, $tag, $location, $cost, $qty, $condition]) {
            Asset::create([
                'school_id' => $schoolId,
                'name' => $name,
                'inventory_group' => $group,
                'subcategory' => $subcategory,
                'category' => InventoryCategories::subcategoryLabel($group, $subcategory),
                'asset_tag' => $tag,
                'location' => $location,
                'vendor_id' => $vendorIds[$group] ?? null,
                'assigned_staff_id' => $inventoryStaffByGroup[$group] ?? null,
                'purchase_date' => '2024-01-15',
                'purchase_cost' => $cost,
                'current_value' => (int) floor($cost * 0.85),
                'quantity' => $qty,
                'condition' => $condition,
                'status' => 'in_use',
            ]);
        }
    }
}
