import { Head } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import {
  Building2,
  Calendar,
  Hash,
  MapPin,
  Package,
  ShieldCheck,
  Tag,
  User,
} from "lucide-react";

type PublicAssetPreviewProps = {
  school: {
    name: string;
    slug: string;
  };
  asset: {
    name: string;
    assetTag: string;
    category: string;
    inventoryGroup?: string | null;
    inventoryGroupLabel?: string | null;
    subcategory?: string | null;
    subcategoryLabel?: string | null;
    description?: string | null;
    location?: string | null;
    condition: string;
    status: string;
    quantity: number;
    purchaseDate?: string | null;
    warrantyExpiry?: string | null;
    vendor?: { name: string; category?: string | null } | null;
    assignedStaff?: {
      name: string;
      designation?: string | null;
      department?: string | null;
    } | null;
  };
};

const conditionColors: Record<string, string> = {
  new: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  fair: "bg-amber-100 text-amber-800",
  poor: "bg-red-100 text-red-800",
  disposed: "bg-gray-100 text-gray-800",
};

export default function AssetPreviewPage({ school, asset }: PublicAssetPreviewProps) {
  return (
    <>
      <Head title={`${asset.name} · ${school.name}`} />

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="border-b bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-3xl px-4 py-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Inventory Preview
            </p>
            <h1 className="text-lg font-semibold mt-1">{school.name}</h1>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-8">
          <Card className="shadow-lg border-0 ring-1 ring-black/5">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-primary/10 p-3 shrink-0">
                  <Package className="h-7 w-7 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl font-bold tracking-tight">{asset.name}</h2>
                  <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Tag className="h-4 w-4" />
                    {asset.assetTag}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {asset.inventoryGroupLabel && (
                  <Badge variant="secondary">{asset.inventoryGroupLabel}</Badge>
                )}
                {asset.subcategoryLabel && <Badge variant="outline">{asset.subcategoryLabel}</Badge>}
                <Badge className={`capitalize ${conditionColors[asset.condition] ?? ""}`}>
                  {asset.condition}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {asset.status.replace("_", " ")}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PreviewField icon={Hash} label="Quantity" value={String(asset.quantity)} />
                <PreviewField icon={MapPin} label="Location" value={asset.location ?? "—"} />
                <PreviewField icon={Building2} label="Category" value={asset.category} />
                <PreviewField
                  icon={User}
                  label="Assigned To"
                  value={
                    asset.assignedStaff
                      ? [asset.assignedStaff.name, asset.assignedStaff.designation]
                          .filter(Boolean)
                          .join(" · ")
                      : "—"
                  }
                />
                <PreviewField icon={ShieldCheck} label="Vendor" value={asset.vendor?.name ?? "—"} />
                <PreviewField icon={Calendar} label="Purchase Date" value={asset.purchaseDate ?? "—"} />
                <PreviewField icon={Calendar} label="Warranty Expiry" value={asset.warrantyExpiry ?? "—"} />
              </div>

              {asset.description && (
                <div className="rounded-xl bg-muted/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Description
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{asset.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Verified inventory record · {school.name}
          </p>
        </main>
      </div>
    </>
  );
}

function PreviewField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}
