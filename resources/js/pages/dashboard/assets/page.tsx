import { useMemo, useState } from "react";
import { router } from "@inertiajs/react";
import { DashboardLayout } from "../_components/layout.tsx";
import { useCurrentSchool } from "../_components/use-current-school.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  INVENTORY_GROUPS,
  INVENTORY_GROUP_LABELS,
  subcategoryLabel,
  type InventoryGroup,
} from "@/lib/inventory-categories.ts";
import { SearchableSelect } from "@/components/searchable-select.tsx";
import {
  Package,
  Plus,
  Search,
  DollarSign,
  Boxes,
  Wrench,
  Pencil,
  Building2,
  BookOpen,
  Monitor,
  Briefcase,
  Truck,
  Printer,
  Eye,
  Archive,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import { AssetCodesButton, AssetCodesDialog } from "@/components/asset-codes-dialog.tsx";
import { AssetDetailDialog, type AssetAuditLogEntry, type UserLite } from "@/components/asset-detail-dialog.tsx";
import { printAssetLabels, type AssetCodeTarget } from "@/lib/asset-codes.ts";

type Vendor = {
  id: number;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  category?: string | null;
};

type StaffLite = {
  id: number;
  firstName: string;
  lastName: string;
  staffId: string;
  department?: string | null;
  designation?: string | null;
};

type Asset = AssetCodeTarget & {
  id: number;
  schoolId: number;
  publicUuid?: string;
  name: string;
  category: string;
  inventoryGroup?: string | null;
  subcategory?: string | null;
  description?: string | null;
  vendorId?: number | null;
  assignedStaffId?: number | null;
  vendor?: Vendor | null;
  assignedStaff?: StaffLite | null;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  purchaseCost?: number | null;
  currentValue?: number | null;
  condition: string;
  quantity: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
  archivedAt?: string | null;
  creator?: UserLite | null;
  updater?: UserLite | null;
  archiver?: UserLite | null;
  auditLogs?: AssetAuditLogEntry[];
};

type AssetStats = {
  totalAssets: number;
  totalItems: number;
  totalValue: number;
  byGroup: Record<string, number>;
  byStatus: Record<string, number>;
  archivedCount?: number;
};

type PageProps = {
  assets: Asset[];
  archivedAssets: Asset[];
  stats: AssetStats;
  archiveRetentionDays: number;
  vendors: Vendor[];
  staff: StaffLite[];
  groups: InventoryGroup[];
  groupLabels: Record<string, string>;
};

const GROUP_ICONS: Record<string, React.ElementType> = {
  physical_facility: Building2,
  educational_instructional: BookOpen,
  technological_digital: Monitor,
  administrative_operational: Briefcase,
};

const conditionColors: Record<string, string> = {
  new: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  fair: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  poor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  disposed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

type AssetFormData = {
  name: string;
  inventoryGroup: string;
  subcategory: string;
  assetTag: string;
  description: string;
  location: string;
  purchaseCost: string;
  quantity: string;
  condition: "new" | "good" | "fair" | "poor" | "disposed";
  status: "in_use" | "in_storage" | "under_repair" | "disposed";
  vendorId: string;
  assignedStaffId: string;
};

const emptyForm = (): AssetFormData => ({
  name: "",
  inventoryGroup: INVENTORY_GROUPS[0]?.key ?? "physical_facility",
  subcategory: INVENTORY_GROUPS[0]?.subcategories[0]?.key ?? "buildings_grounds",
  assetTag: "",
  description: "",
  location: "",
  purchaseCost: "",
  quantity: "1",
  condition: "new",
  status: "in_use",
  vendorId: "none",
  assignedStaffId: "none",
});

function staffLabel(member: StaffLite) {
  return `${member.firstName} ${member.lastName}`;
}

function assetToForm(asset: Asset): AssetFormData {
  const group = asset.inventoryGroup ?? INVENTORY_GROUPS[0]?.key ?? "physical_facility";
  const groupDef = INVENTORY_GROUPS.find((g) => g.key === group);
  return {
    name: asset.name,
    inventoryGroup: group,
    subcategory: asset.subcategory ?? groupDef?.subcategories[0]?.key ?? "",
    assetTag: asset.assetTag,
    description: asset.description ?? "",
    location: asset.location ?? "",
    purchaseCost: asset.purchaseCost ? String(asset.purchaseCost) : "",
    quantity: String(asset.quantity),
    condition: asset.condition as AssetFormData["condition"],
    status: asset.status as AssetFormData["status"],
    vendorId: asset.vendorId ? String(asset.vendorId) : "none",
    assignedStaffId: asset.assignedStaffId ? String(asset.assignedStaffId) : "none",
  };
}

function RegisterVendorForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vendor name is required");
      return;
    }
    setSubmitting(true);
    router.post("/dashboard/assets/vendors", {
      name: name.trim(),
      contactPerson: contactPerson.trim() || undefined,
      phone: phone.trim() || undefined,
      category: category.trim() || undefined,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Vendor registered");
        onSuccess();
      },
      onError: () => toast.error("Failed to register vendor"),
      onFinish: () => setSubmitting(false),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label>Vendor Name *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dell Technologies Tanzania" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Contact Person</Label>
          <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Category</Label>
        <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="IT, Furniture, Supplies..." />
      </div>
      <Button type="submit" className="w-full cursor-pointer" disabled={submitting}>
        {submitting ? "Saving..." : "Register Vendor"}
      </Button>
    </form>
  );
}

function InventoryForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
  vendors,
  staff,
  onRegisterVendor,
}: {
  form: AssetFormData;
  setForm: (next: AssetFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  vendors: Vendor[];
  staff: StaffLite[];
  onRegisterVendor: () => void;
}) {
  const selectedGroup = INVENTORY_GROUPS.find((g) => g.key === form.inventoryGroup);

  const handleGroupChange = (groupKey: string) => {
    const group = INVENTORY_GROUPS.find((g) => g.key === groupKey);
    setForm({
      ...form,
      inventoryGroup: groupKey,
      subcategory: group?.subcategories[0]?.key ?? "",
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Inventory Group *</Label>
          <Select value={form.inventoryGroup} onValueChange={handleGroupChange}>
            <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              {INVENTORY_GROUPS.map((g) => (
                <SelectItem key={g.key} value={g.key} className="cursor-pointer">{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Subcategory *</Label>
          <Select value={form.subcategory} onValueChange={(v) => setForm({ ...form, subcategory: v })}>
            <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(selectedGroup?.subcategories ?? []).map((s) => (
                <SelectItem key={s.key} value={s.key} className="cursor-pointer">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Interactive Smartboard" required />
        </div>
        <div>
          <Label>Asset Tag *</Label>
          <Input value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} placeholder="INV-HW-001" required />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Quantity</Label>
          <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
        </div>
        <div>
          <Label>Location</Label>
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Room 101 / Library" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Condition</Label>
          <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v as AssetFormData["condition"] })}>
            <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["new", "good", "fair", "poor", "disposed"].map((c) => (
                <SelectItem key={c} value={c} className="cursor-pointer capitalize">{c.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AssetFormData["status"] })}>
            <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="in_use" className="cursor-pointer">In Use</SelectItem>
              <SelectItem value="in_storage" className="cursor-pointer">In Storage</SelectItem>
              <SelectItem value="under_repair" className="cursor-pointer">Under Repair</SelectItem>
              <SelectItem value="disposed" className="cursor-pointer">Disposed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Purchase Cost</Label>
          <Input type="number" value={form.purchaseCost} onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} step="0.01" />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <Label>Vendor</Label>
            <Button type="button" variant="link" className="h-auto p-0 text-xs cursor-pointer" onClick={onRegisterVendor}>
              + Register vendor
            </Button>
          </div>
          <SearchableSelect
            value={form.vendorId}
            onValueChange={(v) => setForm({ ...form, vendorId: v })}
            options={vendors.map((vendor) => ({
              value: String(vendor.id),
              label: vendor.name,
              description: [vendor.category, vendor.phone].filter(Boolean).join(" · ") || undefined,
            }))}
            placeholder="Select vendor"
            searchPlaceholder="Search vendors..."
            emptyText="No vendors found. Register one first."
          />
        </div>
      </div>
      <div>
        <Label>Assigned To</Label>
        <SearchableSelect
          value={form.assignedStaffId}
          onValueChange={(v) => setForm({ ...form, assignedStaffId: v })}
          options={staff.map((member) => ({
            value: String(member.id),
            label: staffLabel(member),
            description: [member.designation, member.department, member.staffId].filter(Boolean).join(" · ") || undefined,
          }))}
          placeholder="Select staff member"
          searchPlaceholder="Search staff..."
          emptyText="No staff found."
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
      </div>
      <Button type="submit" className="w-full cursor-pointer">{submitLabel}</Button>
    </form>
  );
}

function AssetCard({
  asset,
  onView,
  onEdit,
  onDelete,
  onOpenCodes,
  archived = false,
}: {
  asset: Asset;
  onView: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  onDelete?: (id: number) => void;
  onOpenCodes: (asset: AssetCodeTarget) => void;
  archived?: boolean;
}) {
  const groupKey = asset.inventoryGroup ?? "uncategorized";
  const GroupIcon = GROUP_ICONS[groupKey] ?? Package;

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <GroupIcon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{asset.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{asset.assetTag}</p>
            </div>
          </div>
          <div className="flex shrink-0">
            <Button size="sm" variant="ghost" onClick={() => onView(asset)} className="cursor-pointer h-8 w-8 p-0" title="View details">
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <AssetCodesButton asset={asset} onOpen={onOpenCodes} />
            {!archived && onEdit && (
              <Button size="sm" variant="ghost" onClick={() => onEdit(asset)} className="cursor-pointer h-8 w-8 p-0">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {!archived && onDelete && (
              <Button size="sm" variant="ghost" onClick={() => onDelete(asset.id)} className="cursor-pointer h-8 w-8 p-0 text-destructive hover:text-destructive" title="Move to archive">
                <Archive className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {archived && <Badge variant="destructive" className="text-xs">Archived</Badge>}
          <Badge variant="outline" className="text-xs">
            {asset.inventoryGroup ? INVENTORY_GROUP_LABELS[asset.inventoryGroup] : asset.category}
          </Badge>
          {asset.subcategory && asset.inventoryGroup && (
            <Badge variant="secondary" className="text-xs">
              {subcategoryLabel(asset.inventoryGroup, asset.subcategory)}
            </Badge>
          )}
          <Badge className={`text-xs capitalize ${conditionColors[asset.condition] ?? ""}`}>
            {asset.condition}
          </Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>Qty: {asset.quantity}</span>
          <span className="capitalize">Status: {asset.status.replace("_", " ")}</span>
          <span className="truncate">Location: {asset.location ?? "—"}</span>
          {asset.vendor && <span className="truncate col-span-2">Vendor: {asset.vendor.name}</span>}
          {asset.assignedStaff && <span className="truncate col-span-2">Assigned: {staffLabel(asset.assignedStaff)}</span>}
          {asset.currentValue != null && <span>Value: ${asset.currentValue.toLocaleString()}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function InventoryInner({
  assets: allAssets,
  archivedAssets: allArchivedAssets,
  stats,
  archiveRetentionDays,
  vendors,
  staff,
}: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [codesAsset, setCodesAsset] = useState<AssetCodeTarget | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [inventoryView, setInventoryView] = useState<"active" | "archive">("active");

  const activeGroup = tab === "all" ? null : INVENTORY_GROUPS.find((g) => g.key === tab);

  const sourceAssets = inventoryView === "archive" ? allArchivedAssets : allAssets;

  const assets = useMemo(() => {
    let filtered = sourceAssets;
    if (tab !== "all") {
      filtered = filtered.filter((a) => a.inventoryGroup === tab);
    }
    if (subcategoryFilter !== "all") {
      filtered = filtered.filter((a) => a.subcategory === subcategoryFilter);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(term) ||
          a.assetTag.toLowerCase().includes(term) ||
          a.category.toLowerCase().includes(term) ||
          (a.location ?? "").toLowerCase().includes(term),
      );
    }
    return filtered;
  }, [sourceAssets, tab, subcategoryFilter, statusFilter, search]);

  const handleArchive = async (id: number) => {
    await routerDeleteWithConfirm(`/dashboard/assets/${id}`, {
      title: "Move this item to archive?",
      text: `It will be kept in archive for ${archiveRetentionDays} days, then permanently removed.`,
      confirmText: "Move to archive",
      onSuccess: () => {
        toast.success("Item moved to archive");
        setDetailAsset(null);
      },
      onError: () => toast.error("Failed to archive item"),
    });
  };

  const handleRestore = (id: number) => {
    router.post(`/dashboard/assets/${id}/restore`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Item restored from archive");
        setDetailAsset(null);
      },
      onError: () => toast.error("Failed to restore item"),
    });
  };

  const handleViewAsset = async (asset: Asset) => {
    setDetailAsset(asset);

    try {
      const response = await fetch(`/dashboard/assets/${asset.id}`, {
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Failed to load asset");
      }

      const data = (await response.json()) as Asset;
      setDetailAsset(data);
    } catch {
      toast.error("Failed to load asset details");
    }
  };

  const buildPayload = (form: AssetFormData) => ({
    name: form.name,
    inventoryGroup: form.inventoryGroup,
    subcategory: form.subcategory,
    assetTag: form.assetTag,
    description: form.description || undefined,
    location: form.location || undefined,
    purchaseCost: form.purchaseCost ? parseFloat(form.purchaseCost) : undefined,
    currentValue: form.purchaseCost ? parseFloat(form.purchaseCost) : undefined,
    vendorId: form.vendorId !== "none" ? Number(form.vendorId) : null,
    assignedStaffId: form.assignedStaffId !== "none" ? Number(form.assignedStaffId) : null,
    condition: form.condition,
    quantity: parseInt(form.quantity, 10) || 1,
    status: form.status,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.assetTag || !createForm.subcategory) {
      toast.error("Please fill in all required fields");
      return;
    }
    router.post("/dashboard/assets", buildPayload(createForm), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Inventory item added");
        setShowCreateDialog(false);
        setCreateForm(emptyForm());
      },
      onError: () => toast.error("Failed to add item"),
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAsset) return;
    router.put(`/dashboard/assets/${editAsset.id}`, buildPayload(editForm), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Inventory item updated");
        setEditAsset(null);
      },
      onError: () => toast.error("Failed to update item"),
    });
  };

  const handlePrintLabels = () => {
    if (assets.length === 0) {
      toast.error("No items to print labels for");
      return;
    }

    if (!printAssetLabels(assets)) {
      toast.error("Unable to open print window. Allow pop-ups and try again.");
    }
  };

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">No school linked to your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Track physical, educational, technological, and administrative assets
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={handlePrintLabels}
            disabled={assets.length === 0}
          >
            <Printer className="h-4 w-4 mr-1.5" /> Print Labels
          </Button>
          <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                <Truck className="h-4 w-4 mr-1.5" /> Register Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Register Vendor</DialogTitle></DialogHeader>
              <RegisterVendorForm onSuccess={() => setShowVendorDialog(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="cursor-pointer">
                <Plus className="h-4 w-4 mr-1.5" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
              <InventoryForm
                form={createForm}
                setForm={setCreateForm}
                onSubmit={handleCreate}
                submitLabel="Add Item"
                vendors={vendors}
                staff={staff}
                onRegisterVendor={() => setShowVendorDialog(true)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Records", value: stats.totalAssets, icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Total Items", value: stats.totalItems, icon: Boxes, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Total Value", value: `$${stats.totalValue.toLocaleString()}`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Under Repair", value: stats.byStatus?.under_repair ?? 0, icon: Wrench, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setSubcategoryFilter("all"); }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="cursor-pointer">All</TabsTrigger>
            {INVENTORY_GROUPS.map((g) => {
              const Icon = GROUP_ICONS[g.key] ?? Package;
              const count = stats.byGroup?.[g.key] ?? 0;
              return (
                <TabsTrigger key={g.key} value={g.key} className="cursor-pointer gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{g.label}</span>
                  <span className="sm:hidden">{g.label.split(" ")[0]}</span>
                  {inventoryView === "active" && count > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">{count}</Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="flex rounded-lg border p-1 bg-muted/30 w-fit">
            <Button
              type="button"
              size="sm"
              variant={inventoryView === "active" ? "default" : "ghost"}
              className="cursor-pointer"
              onClick={() => setInventoryView("active")}
            >
              Active
            </Button>
            <Button
              type="button"
              size="sm"
              variant={inventoryView === "archive" ? "default" : "ghost"}
              className="cursor-pointer gap-1.5"
              onClick={() => setInventoryView("archive")}
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
              {(stats.archivedCount ?? 0) > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{stats.archivedCount}</Badge>
              )}
            </Button>
          </div>
        </div>

        <TabsContent value={tab} className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            {activeGroup && (
              <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                <SelectTrigger className="w-full sm:w-[220px] cursor-pointer">
                  <SelectValue placeholder="Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">All Subcategories</SelectItem>
                  {activeGroup.subcategories.map((s) => (
                    <SelectItem key={s.key} value={s.key} className="cursor-pointer">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] cursor-pointer">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="cursor-pointer">All Status</SelectItem>
                <SelectItem value="in_use" className="cursor-pointer">In Use</SelectItem>
                <SelectItem value="in_storage" className="cursor-pointer">In Storage</SelectItem>
                <SelectItem value="under_repair" className="cursor-pointer">Under Repair</SelectItem>
                <SelectItem value="disposed" className="cursor-pointer">Disposed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tab !== "all" && activeGroup && (
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">{activeGroup.label}</p>
                <p>
                  Includes: {activeGroup.subcategories.map((s) => s.label).join(" · ")}
                </p>
              </CardContent>
            </Card>
          )}

          {assets.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">{inventoryView === "archive" ? <Archive /> : <Package />}</EmptyMedia>
                <EmptyTitle>
                  {inventoryView === "archive" ? "No archived items" : "No inventory items found"}
                </EmptyTitle>
                <EmptyDescription>
                  {inventoryView === "archive"
                    ? "Items moved to archive appear here for 30 days before permanent removal"
                    : "Add items to track assets in this category"}
                </EmptyDescription>
              </EmptyHeader>
              {inventoryView === "active" && (
                <EmptyContent>
                  <Button size="sm" onClick={() => setShowCreateDialog(true)} className="cursor-pointer">
                    <Plus className="h-4 w-4 mr-1.5" /> Add Item
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  archived={inventoryView === "archive"}
                  onView={handleViewAsset}
                  onEdit={inventoryView === "active" ? (a) => { setEditAsset(a); setEditForm(assetToForm(a)); } : undefined}
                  onDelete={inventoryView === "active" ? handleArchive : undefined}
                  onOpenCodes={setCodesAsset}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AssetDetailDialog
        asset={detailAsset}
        open={!!detailAsset}
        onOpenChange={(open) => {
          if (!open) {
            setDetailAsset(null);
          }
        }}
        archiveRetentionDays={archiveRetentionDays}
        onEdit={(asset) => {
          setDetailAsset(null);
          setEditAsset(asset);
          setEditForm(assetToForm(asset));
        }}
        onArchive={handleArchive}
        onRestore={handleRestore}
        onOpenCodes={(target) => {
          setDetailAsset(null);
          setCodesAsset(target);
        }}
      />

      <AssetCodesDialog
        asset={codesAsset}
        open={!!codesAsset}
        onOpenChange={(open) => {
          if (!open) {
            setCodesAsset(null);
          }
        }}
      />

      <Dialog open={!!editAsset} onOpenChange={(open) => { if (!open) setEditAsset(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Inventory Item</DialogTitle></DialogHeader>
          <InventoryForm
            form={editForm}
            setForm={setEditForm}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
            vendors={vendors}
            staff={staff}
            onRegisterVendor={() => setShowVendorDialog(true)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AssetsPage(props: PageProps) {
  return (
    <DashboardLayout>
      <InventoryInner {...props} />
    </DashboardLayout>
  );
}
