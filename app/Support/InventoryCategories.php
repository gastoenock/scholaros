<?php

namespace App\Support;

class InventoryCategories
{
    /**
     * @return array<string, array{label: string, subcategories: array<string, string>}>
     */
    public static function all(): array
    {
        return [
            'physical_facility' => [
                'label' => 'Physical & Facility',
                'subcategories' => [
                    'buildings_grounds' => 'Buildings & Grounds',
                    'furniture' => 'Furniture',
                    'safety_equipment' => 'Safety Equipment',
                    'maintenance_tools' => 'Maintenance Tools',
                ],
            ],
            'educational_instructional' => [
                'label' => 'Educational & Instructional',
                'subcategories' => [
                    'learning_materials' => 'Learning Materials',
                    'library_resources' => 'Library Resources',
                    'special_education_tools' => 'Special Education Tools',
                ],
            ],
            'technological_digital' => [
                'label' => 'Technological & Digital',
                'subcategories' => [
                    'hardware' => 'Hardware',
                    'software_subscriptions' => 'Software & Subscriptions',
                    'infrastructure' => 'Infrastructure',
                ],
            ],
            'administrative_operational' => [
                'label' => 'Administrative & Operational',
                'subcategories' => [
                    'office_supplies' => 'Office Supplies',
                    'data_records' => 'Data & Records',
                ],
            ],
        ];
    }

    /**
     * @return list<string>
     */
    public static function groups(): array
    {
        return array_keys(self::all());
    }

    public static function groupLabel(string $group): string
    {
        return self::all()[$group]['label'] ?? $group;
    }

    public static function subcategoryLabel(string $group, string $subcategory): string
    {
        return self::all()[$group]['subcategories'][$subcategory] ?? $subcategory;
    }

    public static function isValidGroup(string $group): bool
    {
        return isset(self::all()[$group]);
    }

    public static function isValidSubcategory(string $group, string $subcategory): bool
    {
        return isset(self::all()[$group]['subcategories'][$subcategory]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function uiPayload(): array
    {
        $groups = collect(self::all())->map(fn (array $data, string $key) => [
            'key' => $key,
            'label' => $data['label'],
            'subcategories' => collect($data['subcategories'])->map(fn (string $label, string $subKey) => [
                'key' => $subKey,
                'label' => $label,
            ])->values()->all(),
        ])->values()->all();

        return [
            'groups' => $groups,
            'groupLabels' => collect(self::all())->mapWithKeys(fn ($data, $key) => [$key => $data['label']])->all(),
        ];
    }
}
