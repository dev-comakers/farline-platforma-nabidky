import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Offer, Product } from "./types";
import {
  formatCurrency,
  itemTotalAfterDiscount,
  itemTotalBeforeDiscount,
  itemDiscountAmount,
  offerSummary,
  formatDate,
} from "./calculations";

const BRASS: [number, number, number] = [139, 115, 85];
const ZINC_900: [number, number, number] = [24, 24, 27];
const ZINC_500: [number, number, number] = [113, 113, 122];
const ZINC_300: [number, number, number] = [212, 212, 216];

let fontsLoaded = false;
let robotoRegular: string | null = null;
let robotoBold: string | null = null;
const imageCache = new Map<string, { dataUrl: string; w: number; h: number }>();

async function loadFonts() {
  if (fontsLoaded) return;
  const [reg, bold] = await Promise.all([
    fetch("/fonts/Roboto-Regular.ttf").then((r) => r.arrayBuffer()),
    fetch("/fonts/Roboto-Bold.ttf").then((r) => r.arrayBuffer()),
  ]);
  robotoRegular = arrayBufferToBase64(reg);
  robotoBold = arrayBufferToBase64(bold);
  fontsLoaded = true;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[]
    );
  }
  return btoa(binary);
}

async function loadImage(
  url: string
): Promise<{ dataUrl: string; w: number; h: number } | null> {
  if (imageCache.has(url)) return imageCache.get(url)!;
  try {
    let dataUrl: string;
    let img: HTMLImageElement;
    if (url.startsWith("data:")) {
      dataUrl = url;
      img = await loadHtmlImage(url);
    } else {
      const res = await fetch(url);
      const blob = await res.blob();
      dataUrl = await blobToDataUrl(blob);
      img = await loadHtmlImage(dataUrl);
    }
    // Re-encode through canvas to ensure JPEG format (smaller, jsPDF-friendly)
    const max = 320;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const out = { dataUrl: canvas.toDataURL("image/jpeg", 0.78), w, h };
    imageCache.set(url, out);
    return out;
  } catch {
    return null;
  }
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function exportOfferToPdf(offer: Offer, products: Product[]) {
  await loadFonts();
  const productsById = new Map(products.map((p) => [p.id, p]));

  // Pre-load all images
  const imagePromises = offer.items
    .map((item) => productsById.get(item.productId)?.imageUrl)
    .filter((u): u is string => !!u)
    .map((u) => loadImage(u));
  await Promise.all(imagePromises);

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  doc.addFileToVFS("Roboto-Regular.ttf", robotoRegular!);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", robotoBold!);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");

  const summary = offerSummary(offer, products);
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

  // ------- HEADER -------
  doc.setFont("Roboto", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...ZINC_900);
  doc.text("FARLINE LIVING", margin, 18);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...ZINC_500);
  doc.text("Cenová nabídka", margin, 24);

  const rightX = pageWidth - margin;
  const labelY = 14;
  const lineH = 5;
  const meta: Array<[string, string]> = [
    ["AKCE", offer.name || "—"],
    ["ARCHITEKT", offer.architect || "—"],
    ["DATUM", formatDate(offer.updatedAt)],
    ["MĚNA", offer.currency],
  ];
  meta.forEach(([label, value], i) => {
    const y = labelY + i * lineH;
    doc.setFont("Roboto", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...ZINC_500);
    doc.text(label, rightX, y, { align: "right" });
    doc.setFont("Roboto", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...ZINC_900);
    doc.text(value, rightX - 22, y, { align: "right" });
  });

  doc.setDrawColor(...BRASS);
  doc.setLineWidth(0.5);
  doc.line(margin, 38, pageWidth - margin, 38);

  // ------- TABLE with images in col 1 (Foto) -------
  const rows = offer.items.map((item, idx) => {
    const p = productsById.get(item.productId);
    if (!p) return [];
    return [
      String(idx + 1),
      "", // photo column, drawn via hook
      p.code,
      p.name,
      p.decor,
      p.brand,
      String(item.quantity),
      formatCurrency(p.unitPrice, p.currency),
      formatCurrency(itemTotalBeforeDiscount(item, p), p.currency),
      `${item.discountPercent.toFixed(2)} %`,
      formatCurrency(itemDiscountAmount(item, p), p.currency),
      formatCurrency(itemTotalAfterDiscount(item, p), p.currency),
    ];
  });

  const ROW_MIN_HEIGHT = 18; // mm — leaves room for thumbnail
  const PHOTO_COL_INDEX = 1;

  autoTable(doc, {
    startY: 44,
    head: [[
      "#",
      "Foto",
      "Kód",
      "Název",
      "Dekor",
      "Značka",
      "Ks",
      "Jedn. cena",
      "Celkem",
      "Sleva",
      "Sleva Kč",
      "Po slevě",
    ]],
    body: rows,
    theme: "plain",
    styles: {
      font: "Roboto",
      fontStyle: "normal",
      fontSize: 8,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      textColor: ZINC_900,
      lineColor: ZINC_300,
      lineWidth: 0.1,
      overflow: "linebreak",
      valign: "middle",
      minCellHeight: ROW_MIN_HEIGHT,
    },
    headStyles: {
      font: "Roboto",
      fontStyle: "bold",
      fillColor: [250, 250, 248],
      textColor: ZINC_500,
      fontSize: 7,
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
      lineWidth: { bottom: 0.4, top: 0, left: 0, right: 0 },
      minCellHeight: 7,
    },
    columnStyles: {
      0: { cellWidth: 7, halign: "center" },
      1: { cellWidth: 22, halign: "center" }, // Foto
      2: { cellWidth: 20 },                    // Kód
      3: { cellWidth: 48 },                    // Název
      4: { cellWidth: 20 },                    // Dekor
      5: { cellWidth: 19 },                    // Značka
      6: { cellWidth: 8, halign: "center" },
      7: { cellWidth: 20, halign: "right" },
      8: { cellWidth: 20, halign: "right" },
      9: { cellWidth: 14, halign: "center" },
      10: { cellWidth: 20, halign: "right" },
      11: {
        cellWidth: 23,
        halign: "right",
        fontStyle: "bold",
        textColor: BRASS,
      },
    },
    didDrawCell: (data) => {
      if (data.section !== "body") return;
      if (data.column.index !== PHOTO_COL_INDEX) return;
      const rowIdx = data.row.index;
      const item = offer.items[rowIdx];
      if (!item) return;
      const product = productsById.get(item.productId);
      if (!product?.imageUrl) return;
      const cached = imageCache.get(product.imageUrl);
      if (!cached) return;
      const padding = 1.2;
      const maxW = data.cell.width - padding * 2;
      const maxH = data.cell.height - padding * 2;
      const ratio = Math.min(maxW / cached.w, maxH / cached.h);
      const drawW = cached.w * ratio;
      const drawH = cached.h * ratio;
      const x = data.cell.x + (data.cell.width - drawW) / 2;
      const y = data.cell.y + (data.cell.height - drawH) / 2;
      try {
        doc.addImage(cached.dataUrl, "JPEG", x, y, drawW, drawH, undefined, "FAST");
      } catch {
        // skip on failure
      }
    },
    margin: { left: margin, right: margin },
  });

  // ------- TOTALS -------
  const finalY = ((doc as any).lastAutoTable?.finalY ?? 50) + 8;
  doc.setDrawColor(...BRASS);
  doc.setLineWidth(0.4);
  doc.line(margin, finalY, pageWidth - margin, finalY);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...ZINC_500);
  doc.text("Celková cena před slevou", margin, finalY + 7);
  doc.text("Celková sleva", pageWidth / 2 - 30, finalY + 7);
  doc.text("Cena po slevě (bez DPH)", pageWidth - margin, finalY + 7, {
    align: "right",
  });

  doc.setFontSize(13);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(...ZINC_900);
  doc.text(
    formatCurrency(summary.totalBeforeDiscount, offer.currency),
    margin,
    finalY + 14
  );
  doc.setTextColor(...ZINC_500);
  doc.text(
    `− ${formatCurrency(summary.totalDiscount, offer.currency)}`,
    pageWidth / 2 - 30,
    finalY + 14
  );
  doc.setTextColor(...BRASS);
  doc.text(
    formatCurrency(summary.totalAfterDiscount, offer.currency),
    pageWidth - margin,
    finalY + 14,
    { align: "right" }
  );

  // Footer
  doc.setFont("Roboto", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...ZINC_500);
  doc.text(
    "Ceny jsou uvedeny bez DPH. Platnost nabídky 30 dní od data vystavení.",
    margin,
    pageHeight - 8
  );
  doc.text("Farline Living", pageWidth - margin, pageHeight - 8, {
    align: "right",
  });

  const safeName =
    offer.name.replace(/[^\p{L}\p{N}\s\-_]/gu, "").trim() || "nabidka";
  doc.save(`Farline_${safeName}.pdf`);
}
