export type InventorySubcategory = {
  key: string;
  label: string;
};

export type InventoryGroup = {
  key: string;
  label: string;
  subcategories: InventorySubcategory[];
};

export const INVENTORY_GROUPS: InventoryGroup[] = [
  {
    key: "physical_facility",
    label: "Physical & Facility",
    subcategories: [
      { key: "buildings_grounds", label: "Buildings & Grounds" },
      { key: "furniture", label: "Furniture" },
      { key: "safety_equipment", label: "Safety Equipment" },
      { key: "maintenance_tools", label: "Maintenance Tools" },
    ],
  },
  {
    key: "educational_instructional",
    label: "Educational & Instructional",
    subcategories: [
      { key: "learning_materials", label: "Learning Materials" },
      { key: "library_resources", label: "Library Resources" },
      { key: "special_education_tools", label: "Special Education Tools" },
    ],
  },
  {
    key: "technological_digital",
    label: "Technological & Digital",
    subcategories: [
      { key: "hardware", label: "Hardware" },
      { key: "software_subscriptions", label: "Software & Subscriptions" },
      { key: "infrastructure", label: "Infrastructure" },
    ],
  },
  {
    key: "administrative_operational",
    label: "Administrative & Operational",
    subcategories: [
      { key: "office_supplies", label: "Office Supplies" },
      { key: "data_records", label: "Data & Records" },
    ],
  },
];

export const INVENTORY_GROUP_LABELS = Object.fromEntries(
  INVENTORY_GROUPS.map((g) => [g.key, g.label]),
) as Record<string, string>;

export function subcategoryLabel(groupKey: string, subcategoryKey: string): string {
  const group = INVENTORY_GROUPS.find((g) => g.key === groupKey);
  return group?.subcategories.find((s) => s.key === subcategoryKey)?.label ?? subcategoryKey;
}

export function groupForSubcategory(subcategoryKey: string): string | undefined {
  return INVENTORY_GROUPS.find((g) => g.subcategories.some((s) => s.key === subcategoryKey))?.key;
}
