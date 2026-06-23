import { useEffect, useState } from "react";
import { Download, ExternalLink, Printer, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
  type AssetCodeTarget,
  assetBarcodeValue,
  assetPublicPreviewUrl,
  assetQrPayload,
  createBarcodeDataUrl,
  createQrDataUrl,
  downloadDataUrl,
  printAssetLabels,
} from "@/lib/asset-codes.ts";

type AssetCodesDialogProps = {
  asset: AssetCodeTarget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AssetCodesDialog({ asset, open, onOpenChange }: AssetCodesDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [barcodeDataUrl, setBarcodeDataUrl] = useState("");
  const previewUrl = asset?.publicUuid ? assetPublicPreviewUrl(asset.publicUuid) : null;

  useEffect(() => {
    if (!open || !asset) {
      setQrDataUrl("");
      setBarcodeDataUrl("");
      return;
    }

    let cancelled = false;

    createQrDataUrl(assetQrPayload(asset))
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl("");
        }
      });

    try {
      const barcodeUrl = createBarcodeDataUrl(assetBarcodeValue(asset));
      if (!cancelled) {
        setBarcodeDataUrl(barcodeUrl);
      }
    } catch {
      if (!cancelled) {
        setBarcodeDataUrl("");
      }
    }

    return () => {
      cancelled = true;
    };
  }, [asset, open]);

  if (!asset) {
    return null;
  }

  const safeTag = asset.assetTag.replace(/[^\w.-]+/g, "_");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Asset Codes</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="font-medium">{asset.name}</p>
            <p className="text-sm text-muted-foreground">{asset.assetTag}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 flex flex-col items-center gap-3">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR code for ${asset.assetTag}`} className="h-40 w-40" />
              ) : (
                <div className="h-40 w-40 rounded bg-muted animate-pulse" />
              )}
              <p className="text-xs text-muted-foreground text-center">Scan to open public preview</p>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1 hover:underline break-all text-center"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  {previewUrl.replace(/^https?:\/\//, "")}
                </a>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer w-full"
                disabled={!qrDataUrl}
                onClick={() => downloadDataUrl(qrDataUrl, `${safeTag}-qr.png`)}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download QR
              </Button>
            </div>

            <div className="rounded-lg border p-4 flex flex-col items-center gap-3">
              {barcodeDataUrl ? (
                <img
                  src={barcodeDataUrl}
                  alt={`Barcode for ${asset.assetTag}`}
                  className="w-full max-w-[220px] h-auto bg-white rounded"
                />
              ) : (
                <div className="h-[100px] w-full max-w-[220px] rounded bg-muted animate-pulse" />
              )}
              <p className="text-xs text-muted-foreground">Barcode (CODE128)</p>
              <p className="text-xs font-mono text-muted-foreground">{assetBarcodeValue(asset)}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="cursor-pointer w-full"
                disabled={!barcodeDataUrl}
                onClick={() => downloadDataUrl(barcodeDataUrl, `${safeTag}-barcode.svg`)}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download Barcode
              </Button>
            </div>
          </div>

          <Button
            type="button"
            className="w-full cursor-pointer"
            onClick={() => {
              if (!printAssetLabels([asset])) {
                toast.error("Unable to open print window. Allow pop-ups and try again.");
              }
            }}
          >
            <Printer className="h-4 w-4 mr-1.5" />
            Print Label
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type AssetCodesButtonProps = {
  asset: AssetCodeTarget;
  onOpen: (asset: AssetCodeTarget) => void;
};

export function AssetCodesButton({ asset, onOpen }: AssetCodesButtonProps) {
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => onOpen(asset)}
      className="cursor-pointer h-8 w-8 p-0"
      title="View QR & barcode"
    >
      <QrCode className="h-3.5 w-3.5" />
    </Button>
  );
}
