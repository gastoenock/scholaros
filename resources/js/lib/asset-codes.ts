import QRCode from "qrcode";
import JsBarcodeImport from "jsbarcode";

const JsBarcode = (
  typeof JsBarcodeImport === "function"
    ? JsBarcodeImport
    : (JsBarcodeImport as { default: typeof JsBarcodeImport }).default
);

export type AssetCodeTarget = {
  id: number;
  name: string;
  assetTag: string;
  publicUuid?: string;
  location?: string | null;
};

export function assetPublicPreviewUrl(publicUuid: string): string {
  return `${window.location.origin}/asset/${publicUuid}`;
}

export function assetQrPayload(asset: AssetCodeTarget): string {
  if (asset.publicUuid) {
    return assetPublicPreviewUrl(asset.publicUuid);
  }

  return asset.assetTag;
}

export function assetBarcodeValue(asset: AssetCodeTarget): string {
  const tag = asset.assetTag.trim();

  if (tag && /^[\x20-\x7E]+$/.test(tag)) {
    return tag;
  }

  return asset.publicUuid ?? tag.replace(/[^\x20-\x7E]/g, "");
}

export async function createQrDataUrl(payload: string, size = 240): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

export function renderBarcode(
  target: SVGSVGElement | HTMLCanvasElement,
  value: string,
): void {
  const sanitized = value.trim();

  if (!sanitized) {
    throw new Error("Barcode value is empty");
  }

  JsBarcode(target, sanitized, {
    format: "CODE128",
    displayValue: true,
    fontSize: 14,
    height: 70,
    width: 2,
    margin: 10,
    textMargin: 4,
    background: "#ffffff",
    lineColor: "#000000",
  });
}

export function createBarcodeDataUrl(value: string): string {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  renderBarcode(svg, value);
  const serialized = new XMLSerializer().serializeToString(svg);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function downloadSvg(svg: SVGSVGElement, filename: string): void {
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function printAssetLabels(assets: AssetCodeTarget[]): boolean {
  if (assets.length === 0) {
    return false;
  }

  const popup = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
  if (!popup) {
    return false;
  }

  const labelsHtml = assets
    .map((asset) => {
      const payload = assetQrPayload(asset);
      const barcodeValue = assetBarcodeValue(asset);

      return `
        <section class="label">
          <div class="label-header">
            <strong>${escapeHtml(asset.name)}</strong>
            <span>${escapeHtml(asset.assetTag)}</span>
          </div>
          <div class="codes">
            <div class="code-block">
              <img alt="QR code for ${escapeHtml(asset.assetTag)}" data-qr="${escapeHtml(payload)}" width="140" height="140" />
              <p>Scan to preview</p>
            </div>
            <div class="code-block barcode-block">
              <svg class="barcode" data-value="${escapeHtml(barcodeValue)}"></svg>
              <p>Barcode</p>
            </div>
          </div>
          ${asset.location ? `<p class="location">${escapeHtml(asset.location)}</p>` : ""}
        </section>
      `;
    })
    .join("");

  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Asset Labels</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
          .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
          .label { border: 1px solid #ddd; border-radius: 8px; padding: 16px; page-break-inside: avoid; }
          .label-header { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
          .label-header span { color: #555; font-size: 12px; }
          .codes { display: flex; gap: 16px; align-items: center; justify-content: space-between; }
          .code-block { text-align: center; }
          .code-block p { margin: 8px 0 0; font-size: 11px; color: #666; }
          .location { margin: 10px 0 0; font-size: 11px; color: #666; }
          @media print {
            body { margin: 0; }
            .label { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="grid">${labelsHtml}</div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.4/build/qrcode.min.js"><\/script>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
        <script>
          document.querySelectorAll('[data-qr]').forEach(async (img) => {
            img.src = await QRCode.toDataURL(img.dataset.qr, { width: 140, margin: 1 });
          });
          document.querySelectorAll('.barcode').forEach((svg) => {
            JsBarcode(svg, svg.dataset.value, {
              format: 'CODE128',
              displayValue: true,
              fontSize: 12,
              height: 50,
              width: 2,
              margin: 8,
              background: '#ffffff',
              lineColor: '#000000',
            });
          });
          window.onload = () => setTimeout(() => window.print(), 400);
        <\/script>
      </body>
    </html>
  `);
  popup.document.close();
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
