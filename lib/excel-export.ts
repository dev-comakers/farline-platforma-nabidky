import ExcelJS from "exceljs";
import type { Offer, Product } from "./types";
import {
  itemDiscountAmount,
  itemTotalAfterDiscount,
  itemTotalBeforeDiscount,
  offerSummary,
} from "./calculations";

async function fetchImageDataUrl(url: string): Promise<string | null> {
  try {
    if (url.startsWith("data:")) return url;
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function extToExtension(dataUrl: string): "jpeg" | "png" {
  return dataUrl.startsWith("data:image/png") ? "png" : "jpeg";
}

export async function exportOfferToExcel(offer: Offer, products: Product[]) {
  const productsById = new Map(products.map((p) => [p.id, p]));
  const summary = offerSummary(offer, products);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Farline Living";
  wb.created = new Date();

  const ws = wb.addWorksheet("Nabídka", {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 22 },
  });

  const numberFormat =
    offer.currency === "USD" ? '"$"#,##0.00' : '#,##0.00" Kč"';
  const percentFormat = "0.00%";

  // Title rows
  ws.mergeCells("A1:L1");
  ws.getCell("A1").value = "FARLINE LIVING — Cenová nabídka";
  ws.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF18181B" } };
  ws.getCell("A1").alignment = { vertical: "middle" };

  ws.mergeCells("A2:F2");
  ws.getCell("A2").value = offer.name;
  ws.getCell("A2").font = { name: "Calibri", size: 11, bold: true };

  ws.mergeCells("G2:L2");
  ws.getCell("G2").value = offer.architect ? `Architekt: ${offer.architect}` : "";
  ws.getCell("G2").font = { name: "Calibri", size: 10 };
  ws.getCell("G2").alignment = { horizontal: "right" };

  ws.mergeCells("A3:L3");
  ws.getCell("A3").value = `Měna: ${offer.currency}    Datum: ${new Date(offer.updatedAt).toLocaleDateString("cs-CZ")}`;
  ws.getCell("A3").font = { name: "Calibri", size: 9, color: { argb: "FF71717A" } };

  // Header row (row 5)
  const headerRow = 5;
  const headers = [
    "#",
    "Foto",
    "Kód",
    "Název",
    "Dekor",
    "Značka",
    "Ks",
    "Jedn. cena",
    "Cena celkem",
    "Sleva %",
    "Sleva (částka)",
    "Cena po slevě",
  ];
  headers.forEach((h, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF71717A" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFAFAF8" },
    };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF8B7355" } },
    };
  });
  ws.getRow(headerRow).height = 22;

  // Column widths (excel units ~ characters)
  const widths = [5, 14, 14, 38, 18, 18, 6, 14, 14, 9, 14, 14];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });

  // Pre-load images
  const imageDataUrls = new Map<string, string>();
  await Promise.all(
    offer.items.map(async (item) => {
      const p = productsById.get(item.productId);
      if (!p?.imageUrl) return;
      const dataUrl = await fetchImageDataUrl(p.imageUrl);
      if (dataUrl) imageDataUrls.set(p.imageUrl, dataUrl);
    })
  );

  // Body rows
  const ROW_HEIGHT = 60; // generous for photo
  offer.items.forEach((item, idx) => {
    const p = productsById.get(item.productId);
    if (!p) return;
    const row = headerRow + 1 + idx;
    ws.getCell(row, 1).value = idx + 1;
    ws.getCell(row, 1).alignment = { vertical: "middle", horizontal: "center" };
    // col 2 = photo, left blank, image added below
    ws.getCell(row, 3).value = p.code;
    ws.getCell(row, 3).font = { name: "Consolas", size: 10 };
    ws.getCell(row, 4).value = p.name;
    ws.getCell(row, 4).alignment = { vertical: "middle", wrapText: true };
    ws.getCell(row, 5).value = p.decor;
    ws.getCell(row, 5).alignment = { vertical: "middle", wrapText: true };
    ws.getCell(row, 6).value = p.brand;
    ws.getCell(row, 6).alignment = { vertical: "middle" };
    ws.getCell(row, 7).value = item.quantity;
    ws.getCell(row, 7).alignment = { vertical: "middle", horizontal: "center" };
    ws.getCell(row, 8).value = p.unitPrice;
    ws.getCell(row, 8).numFmt = numberFormat;
    ws.getCell(row, 8).alignment = { vertical: "middle", horizontal: "right" };
    ws.getCell(row, 9).value = itemTotalBeforeDiscount(item, p);
    ws.getCell(row, 9).numFmt = numberFormat;
    ws.getCell(row, 9).alignment = { vertical: "middle", horizontal: "right" };
    ws.getCell(row, 10).value = item.discountPercent / 100;
    ws.getCell(row, 10).numFmt = percentFormat;
    ws.getCell(row, 10).alignment = { vertical: "middle", horizontal: "center" };
    ws.getCell(row, 11).value = itemDiscountAmount(item, p);
    ws.getCell(row, 11).numFmt = numberFormat;
    ws.getCell(row, 11).alignment = { vertical: "middle", horizontal: "right" };
    ws.getCell(row, 12).value = itemTotalAfterDiscount(item, p);
    ws.getCell(row, 12).numFmt = numberFormat;
    ws.getCell(row, 12).font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF8B7355" } };
    ws.getCell(row, 12).alignment = { vertical: "middle", horizontal: "right" };

    // bottom border on every row
    for (let c = 1; c <= 12; c++) {
      const cell = ws.getCell(row, c);
      cell.border = { bottom: { style: "hair", color: { argb: "FFE4E4E7" } } };
    }
    ws.getRow(row).height = ROW_HEIGHT;

    // Embed photo
    if (p.imageUrl) {
      const dataUrl = imageDataUrls.get(p.imageUrl);
      if (dataUrl) {
        const base64 = dataUrl.split(",")[1];
        const ext = extToExtension(dataUrl);
        const imageId = wb.addImage({ base64, extension: ext });
        // Place image inside col B (index 1, zero-based)
        ws.addImage(imageId, {
          tl: { col: 1.08, row: row - 1 + 0.08 },
          ext: { width: 78, height: 58 },
          editAs: "oneCell",
        });
      }
    }
  });

  // Totals row
  const totalsRow = headerRow + 1 + offer.items.length + 1;
  const labelStyle = (cell: ExcelJS.Cell) => {
    cell.font = { name: "Calibri", size: 9, color: { argb: "FF71717A" } };
    cell.alignment = { vertical: "middle", horizontal: "right" };
  };
  const valueStyle = (cell: ExcelJS.Cell, color = "FF18181B", bold = true) => {
    cell.font = { name: "Calibri", size: 12, bold, color: { argb: color } };
    cell.alignment = { vertical: "middle", horizontal: "right" };
    cell.numFmt = numberFormat;
  };

  ws.getCell(totalsRow, 7).value = "Před slevou:";
  labelStyle(ws.getCell(totalsRow, 7));
  ws.getCell(totalsRow, 8).value = summary.totalBeforeDiscount;
  valueStyle(ws.getCell(totalsRow, 8));

  ws.getCell(totalsRow, 9).value = "Sleva:";
  labelStyle(ws.getCell(totalsRow, 9));
  ws.getCell(totalsRow, 10).value = -summary.totalDiscount;
  valueStyle(ws.getCell(totalsRow, 10), "FF71717A");

  ws.getCell(totalsRow, 11).value = "Po slevě (bez DPH):";
  labelStyle(ws.getCell(totalsRow, 11));
  ws.getCell(totalsRow, 12).value = summary.totalAfterDiscount;
  valueStyle(ws.getCell(totalsRow, 12), "FF8B7355");

  // Top border on totals row
  for (let c = 7; c <= 12; c++) {
    ws.getCell(totalsRow, c).border = {
      top: { style: "medium", color: { argb: "FF8B7355" } },
    };
  }
  ws.getRow(totalsRow).height = 28;

  // Footer note
  const noteRow = totalsRow + 2;
  ws.mergeCells(noteRow, 1, noteRow, 12);
  ws.getCell(noteRow, 1).value =
    "Ceny jsou uvedeny bez DPH. Platnost nabídky 30 dní od data vystavení. Farline Living.";
  ws.getCell(noteRow, 1).font = {
    name: "Calibri",
    size: 9,
    italic: true,
    color: { argb: "FF71717A" },
  };

  // Generate buffer & save
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const safeName =
    offer.name.replace(/[^\p{L}\p{N}\s\-_]/gu, "").trim() || "nabidka";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Farline_${safeName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
