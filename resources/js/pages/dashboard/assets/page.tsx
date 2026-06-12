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
import { Textarea } from "@/components/ui/textarea.tsx";
import {
  Package,
  Plus,
  Search,
  DollarSign,
  Boxes,
  Wrench,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { routerDeleteWithConfirm } from "@/lib/confirm.ts";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";

type Asset = {
  id: number;
  schoolId: number;
  name: string;
  category: string;
  assetTag: string;
  description?: string | null;
  location?: string | null;
  vendor?: string | null;
  purchaseDate?: string | null;
  warrantyExpiry?: string | null;
  purchaseCost?: number | null;
  currentValue?: number | null;
  assignedTo?: string | null;
  condition: string;
  quantity: number;
  status: string;
  createdAt: string;
};

type AssetStats = {
  totalAssets: number;
  totalItems: number;
  totalValue: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
};

type PageProps = {
  assets: Asset[];
  stats: AssetStats;
};

function AssetsInner({ assets: allAssets, stats }: PageProps) {
  const { schoolId } = useCurrentSchool();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const assets = useMemo(() => {
    let filtered = allAssets;
    if (categoryFilter !== "all") {
      filtered = filtered.filter((a) => a.category === categoryFilter);
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
          a.category.toLowerCase().includes(term),
      );
    }
    return filtered;
  }, [allAssets, search, categoryFilter, statusFilter]);

  const handleDelete = async (id: number) => {
    await routerDeleteWithConfirm(`/dashboard/assets/${id}`, {
      title: "Delete this asset?",
      onSuccess: () => toast.success("Asset deleted"),
      onError: () => toast.error("Failed to delete asset"),
    });
  };

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">No school linked to your account.</p>
      </div>
    );
  }

  const conditionColors: Record<string, string> = {
    new: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    good: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    fair: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    poor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    disposed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  };

  const categories = Object.keys(stats.byCategory);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold">Assets & Inventory</h1>
          <p className="text-muted-foreground mt-1">Track school assets and equipment</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" /> Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Asset</DialogTitle>
            </DialogHeader>
            <CreateAssetForm onSuccess={() => setShowCreateDialog(false)} />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: "Total Assets", value: stats.totalAssets, icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px] cursor-pointer">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="cursor-pointer">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="cursor-pointer">{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] cursor-pointer">
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

      {/* Assets List */}
      {assets.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Package /></EmptyMedia>
            <EmptyTitle>No assets found</EmptyTitle>
            <EmptyDescription>Add your first asset to start tracking inventory</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setShowCreateDialog(true)} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-1.5" /> Add Asset
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <Card key={asset.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{asset.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{asset.assetTag}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(asset.id)} className="cursor-pointer text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Badge variant="secondary" className="text-xs">{asset.category}</Badge>
                    <Badge className={`text-xs capitalize ${conditionColors[asset.condition] ?? ""}`}>
                      {asset.condition}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Qty: {asset.quantity}</span>
                    <span>Location: {asset.location ?? "—"}</span>
                    {asset.currentValue && <span>Value: ${asset.currentValue.toLocaleString()}</span>}
                    {asset.assignedTo && <span>Assigned: {asset.assignedTo}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function CreateAssetForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [condition, setCondition] = useState<"new" | "good" | "fair" | "poor">("new");
  const [status, setStatus] = useState<"in_use" | "in_storage" | "under_repair">("in_use");
  const [vendor, setVendor] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !assetTag) {
      toast.error("Please fill in all required fields");
      return;
    }

    router.post("/dashboard/assets", {
      name,
      category,
      assetTag,
      description: description || undefined,
      location: location || undefined,
      purchaseCost: purchaseCost ? parseFloat(purchaseCost) : undefined,
      currentValue: purchaseCost ? parseFloat(purchaseCost) : undefined,
      vendor: vendor || undefined,
      assignedTo: assignedTo || undefined,
      condition,
      quantity: parseInt(quantity),
      status,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Asset added successfully");
        onSuccess();
      },
      onError: () => toast.error("Failed to add asset"),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Laptop Dell XPS" required />
        </div>
        <div>
          <Label>Asset Tag *</Label>
          <Input value={assetTag} onChange={(e) => setAssetTag(e.target.value)} placeholder="AST-001" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category *</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Electronics" required />
        </div>
        <div>
          <Label>Quantity</Label>
          <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Condition</Label>
          <Select value={condition} onValueChange={(v) => setCondition(v as typeof condition)}>
            <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new" className="cursor-pointer">New</SelectItem>
              <SelectItem value="good" className="cursor-pointer">Good</SelectItem>
              <SelectItem value="fair" className="cursor-pointer">Fair</SelectItem>
              <SelectItem value="poor" className="cursor-pointer">Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="in_use" className="cursor-pointer">In Use</SelectItem>
              <SelectItem value="in_storage" className="cursor-pointer">In Storage</SelectItem>
              <SelectItem value="under_repair" className="cursor-pointer">Under Repair</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Purchase Cost ($)</Label>
          <Input type="number" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} placeholder="500.00" step="0.01" />
        </div>
        <div>
          <Label>Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Room 101" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Vendor</Label>
          <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Dell Inc." />
        </div>
        <div>
          <Label>Assigned To</Label>
          <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="IT Department" />
        </div>
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the asset" rows={2} />
      </div>
      <Button type="submit" className="w-full cursor-pointer">Add Asset</Button>
    </form>
  );
}

export default function AssetsPage(props: PageProps) {
  return (
    <DashboardLayout>
      <AssetsInner {...props} />
    </DashboardLayout>
  );
}
