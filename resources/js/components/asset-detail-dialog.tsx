import { format, formatDistanceToNow } from "date-fns";
import {
  Archive,
  Calendar,
  Hash,
  MapPin,
  Package,
  QrCode,
  RotateCcw,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
  INVENTORY_GROUP_LABELS,
  subcategoryLabel,
} from "@/lib/inventory-categories.ts";
import type { AssetCodeTarget } from "@/lib/asset-codes.ts";

export type UserLite = {
  id: number;
  name: string;
  email?: string | null;
};

export type AssetAuditLogEntry = {
  id: number;
  action: string;
  summary: string;
  createdAt: string;
  user?: UserLite | null;
};

export type AssetDetail = AssetCodeTarget & {
  id: number;
  category: string;
  inventoryGroup?: string | null;
  subcategory?: string | null;
  description?: string | null;
  vendor?: { id: number; name: string } | null;
  assignedStaff?: {
    id: number;
    firstName: string;
    lastName: string;
    staffId: string;
  } | null;
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

type AssetDetailDialogProps = {
  asset: AssetDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archiveRetentionDays: number;
  onEdit?: (asset: AssetDetail) => void;
  onArchive?: (id: number) => void;
  onRestore?: (id: number) => void;
  onOpenCodes?: (asset: AssetCodeTarget) => void;
};

const actionLabels: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  archived: "Archived",
  restored: "Restored",
  permanently_deleted: "Permanently deleted",
};

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  return format(new Date(value), "MMM d, yyyy 'at' h:mm a");
}

function formatRelative(value?: string | null) {
  if (!value) {
    return null;
  }

  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

function staffName(staff?: AssetDetail["assignedStaff"]) {
  if (!staff) {
    return "—";
  }

  return `${staff.firstName} ${staff.lastName}`;
}

function daysUntilPurge(archivedAt: string, retentionDays: number): number {
  const purgeAt = new Date(archivedAt);
  purgeAt.setDate(purgeAt.getDate() + retentionDays);
  const diffMs = purgeAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function AssetDetailDialog({
  asset,
  open,
  onOpenChange,
  archiveRetentionDays,
  onEdit,
  onArchive,
  onRestore,
  onOpenCodes,
}: AssetDetailDialogProps) {
  if (!asset) {
    return null;
  }

  const isArchived = !!asset.archivedAt;
  const purgeDays = asset.archivedAt
    ? daysUntilPurge(asset.archivedAt, archiveRetentionDays)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2 pr-6">
            <Package className="h-5 w-5 mt-0.5 shrink-0 text-primary" />
            <span>{asset.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{asset.assetTag}</Badge>
            {asset.inventoryGroup && (
              <Badge variant="secondary">
                {INVENTORY_GROUP_LABELS[asset.inventoryGroup] ?? asset.category}
              </Badge>
            )}
            {asset.subcategory && asset.inventoryGroup && (
              <Badge variant="outline">
                {subcategoryLabel(asset.inventoryGroup, asset.subcategory)}
              </Badge>
            )}
            <Badge className="capitalize">{asset.condition}</Badge>
            <Badge variant="outline" className="capitalize">
              {asset.status.replace("_", " ")}
            </Badge>
            {isArchived && <Badge variant="destructive">Archived</Badge>}
          </div>

          {isArchived && purgeDays !== null && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 p-3 text-sm">
              <p className="font-medium text-amber-900 dark:text-amber-200">
                This item is in the archive
              </p>
              <p className="text-amber-800/80 dark:text-amber-300/80 mt-1">
                {purgeDays === 0
                  ? "Scheduled for permanent removal."
                  : `${purgeDays} day${purgeDays === 1 ? "" : "s"} until permanent removal (soft delete after ${archiveRetentionDays} days).`}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <DetailItem icon={Hash} label="Quantity" value={String(asset.quantity)} />
            <DetailItem icon={MapPin} label="Location" value={asset.location ?? "—"} />
            <DetailItem icon={User} label="Vendor" value={asset.vendor?.name ?? "—"} />
            <DetailItem icon={User} label="Assigned To" value={staffName(asset.assignedStaff)} />
            <DetailItem
              icon={Calendar}
              label="Purchase Date"
              value={asset.purchaseDate ?? "—"}
            />
            <DetailItem
              icon={Calendar}
              label="Warranty Expiry"
              value={asset.warrantyExpiry ?? "—"}
            />
            <DetailItem
              label="Purchase Cost"
              value={asset.purchaseCost != null ? `$${asset.purchaseCost.toLocaleString()}` : "—"}
            />
            <DetailItem
              label="Current Value"
              value={asset.currentValue != null ? `$${asset.currentValue.toLocaleString()}` : "—"}
            />
          </div>

          {asset.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm whitespace-pre-wrap">{asset.description}</p>
            </div>
          )}

          <Separator />

          <div>
            <p className="text-sm font-semibold mb-3">Record History</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <HistoryItem label="Created by" user={asset.creator} date={asset.createdAt} />
              <HistoryItem label="Last updated by" user={asset.updater} date={asset.updatedAt} />
              {isArchived && (
                <HistoryItem label="Archived by" user={asset.archiver} date={asset.archivedAt} />
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">Audit Trail</p>
            {(asset.auditLogs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit entries yet.</p>
            ) : (
              <div className="space-y-3">
                {(asset.auditLogs ?? []).map((entry) => (
                  <div key={entry.id} className="flex gap-3 text-sm">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {actionLabels[entry.action] ?? entry.action}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelative(entry.createdAt)}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">{entry.summary}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.user?.name ?? "System"} · {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {onOpenCodes && (
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                onClick={() => onOpenCodes(asset)}
              >
                <QrCode className="h-4 w-4 mr-1.5" />
                QR & Barcode
              </Button>
            )}
            {!isArchived && onEdit && (
              <Button type="button" variant="outline" className="cursor-pointer" onClick={() => onEdit(asset)}>
                Edit Item
              </Button>
            )}
            {!isArchived && onArchive && (
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer text-destructive hover:text-destructive"
                onClick={() => onArchive(asset.id)}
              >
                <Archive className="h-4 w-4 mr-1.5" />
                Move to Archive
              </Button>
            )}
            {isArchived && onRestore && (
              <Button type="button" className="cursor-pointer" onClick={() => onRestore(asset.id)}>
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Restore from Archive
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function HistoryItem({
  label,
  user,
  date,
}: {
  label: string;
  user?: UserLite | null;
  date?: string | null;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium mt-1">{user?.name ?? "Unknown"}</p>
      <p className="text-xs text-muted-foreground mt-1">{formatDate(date)}</p>
    </div>
  );
}
