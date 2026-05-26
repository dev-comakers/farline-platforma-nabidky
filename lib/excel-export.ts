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
  const hideCode = offer.hideCode;
  const lastCol = String.fromCharCode(64 + (hideCode ? 11 : 12));

  ws.mergeCells(`A1:${lastCol}1`);
  ws.getCell("A1").value = "FARLINE LIVING — Cenová nabídka";
  ws.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF18181B" } };
  ws.getCell("A1").alignment = { vertical: "middle" };

  ws.mergeCells(`A2:F2`);
  ws.getCell("A2").value = offer.name;
  ws.getCell("A2").font = { name: "Calibri", size: 11, bold: true };

  ws.mergeCells(`G2:${lastCol}2`);
  ws.getCell("G2").value = offer.architect ? `Architekt: ${offer.architect}` : "";
  ws.getCell("G2").font = { name: "Calibri", size: 10 };
  ws.getCell("G2").alignment = { horizontal: "right" };

  ws.mergeCells(`A3:${lastCol}3`);
  ws.getCell("A3").value = `Měna: ${offer.currency}    Datum: ${new Date(offer.updatedAt).toLocaleDateString("cs-CZ")}`;
  ws.getCell("A3").font = { name: "Calibri", size: 9, color: { argb: "FF71717A" } };

  // Header row (row 5)
  const headerRow = 5;
  const headers = [
    "#",
    "Foto",
    ...(!hideCode ? ["Kód"] : []),
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
  const totalCols = headers.length;
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
  const widths = hideCode
    ? [5, 14, 48, 18, 18, 6, 14, 14, 9, 14, 14]
    : [5, 14, 14, 38, 18, 18, 6, 14, 14, 9, 14, 14];
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

  // Body rows — col offset: hideCode removes col 3 (Kód), everything after shifts by -1
  const co = hideCode ? 0 : 1; // column offset for cols after Foto
  const ROW_HEIGHT = 60;
  offer.items.forEach((item, idx) => {
    const p = productsById.get(item.productId);
    if (!p) return;
    const row = headerRow + 1 + idx;
    ws.getCell(row, 1).value = idx + 1;
    ws.getCell(row, 1).alignment = { vertical: "middle", horizontal: "center" };
    // col 2 = photo, left blank, image added below
    if (!hideCode) {
      ws.getCell(row, 3).value = p.code;
      ws.getCell(row, 3).font = { name: "Consolas", size: 10 };
    }
    ws.getCell(row, 3 + co).value = p.name;
    ws.getCell(row, 3 + co).alignment = { vertical: "middle", wrapText: true };
    ws.getCell(row, 4 + co).value = p.decor;
    ws.getCell(row, 4 + co).alignment = { vertical: "middle", wrapText: true };
    ws.getCell(row, 5 + co).value = p.brand;
    ws.getCell(row, 5 + co).alignment = { vertical: "middle" };
    ws.getCell(row, 6 + co).value = item.quantity;
    ws.getCell(row, 6 + co).alignment = { vertical: "middle", horizontal: "center" };
    ws.getCell(row, 7 + co).value = p.unitPrice;
    ws.getCell(row, 7 + co).numFmt = numberFormat;
    ws.getCell(row, 7 + co).alignment = { vertical: "middle", horizontal: "right" };
    ws.getCell(row, 8 + co).value = itemTotalBeforeDiscount(item, p);
    ws.getCell(row, 8 + co).numFmt = numberFormat;
    ws.getCell(row, 8 + co).alignment = { vertical: "middle", horizontal: "right" };
    ws.getCell(row, 9 + co).value = item.discountPercent / 100;
    ws.getCell(row, 9 + co).numFmt = percentFormat;
    ws.getCell(row, 9 + co).alignment = { vertical: "middle", horizontal: "center" };
    ws.getCell(row, 10 + co).value = itemDiscountAmount(item, p);
    ws.getCell(row, 10 + co).numFmt = numberFormat;
    ws.getCell(row, 10 + co).alignment = { vertical: "middle", horizontal: "right" };
    ws.getCell(row, 11 + co).value = itemTotalAfterDiscount(item, p);
    ws.getCell(row, 11 + co).numFmt = numberFormat;
    ws.getCell(row, 11 + co).font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF8B7355" } };
    ws.getCell(row, 11 + co).alignment = { vertical: "middle", horizontal: "right" };

    // bottom border on every row
    for (let c = 1; c <= totalCols; c++) {
      ws.getCell(row, c).border = { bottom: { style: "hair", color: { argb: "FFE4E4E7" } } };
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

  // Totals rows
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

  // col indices for totals (last 6 of the header)
  const tc = totalCols; // last col
  ws.getCell(totalsRow, tc - 5).value = "Před slevou:";
  labelStyle(ws.getCell(totalsRow, tc - 5));
  ws.getCell(totalsRow, tc - 4).value = summary.totalBeforeDiscount;
  valueStyle(ws.getCell(totalsRow, tc - 4));

  ws.getCell(totalsRow, tc - 3).value = "Sleva:";
  labelStyle(ws.getCell(totalsRow, tc - 3));
  ws.getCell(totalsRow, tc - 2).value = -summary.totalDiscount;
  valueStyle(ws.getCell(totalsRow, tc - 2), "FF71717A");

  const afterDiscountLabel = offer.showVat ? "Základ DPH (bez DPH):" : "Po slevě (bez DPH):";
  ws.getCell(totalsRow, tc - 1).value = afterDiscountLabel;
  labelStyle(ws.getCell(totalsRow, tc - 1));
  ws.getCell(totalsRow, tc).value = summary.totalAfterDiscount;
  valueStyle(ws.getCell(totalsRow, tc), "FF8B7355");

  // Top border on totals row
  for (let c = tc - 5; c <= tc; c++) {
    ws.getCell(totalsRow, c).border = { top: { style: "medium", color: { argb: "FF8B7355" } } };
  }
  ws.getRow(totalsRow).height = 28;

  // VAT row (only when showVat)
  let noteRow = totalsRow + 2;
  if (offer.showVat) {
    const vatRow = totalsRow + 1;
    ws.getCell(vatRow, tc - 1).value = `DPH ${Math.round(offer.vatRate * 100)} %:`;
    labelStyle(ws.getCell(vatRow, tc - 1));
    ws.getCell(vatRow, tc).value = summary.vatAmount;
    valueStyle(ws.getCell(vatRow, tc), "FF71717A");

    const totalWithVatRow = totalsRow + 2;
    ws.getCell(totalWithVatRow, tc - 1).value = "Celkem s DPH:";
    ws.getCell(totalWithVatRow, tc - 1).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF18181B" } };
    ws.getCell(totalWithVatRow, tc - 1).alignment = { vertical: "middle", horizontal: "right" };
    ws.getCell(totalWithVatRow, tc).value = summary.totalWithVat;
    valueStyle(ws.getCell(totalWithVatRow, tc), "FF8B7355");
    ws.getRow(totalWithVatRow).height = 24;

    noteRow = totalWithVatRow + 2;
  }

  // Footer note
  const footerNote = offer.showVat
    ? "Platnost nabídky 30 dní od data vystavení. Farline Living."
    : "Ceny jsou uvedeny bez DPH. Platnost nabídky 30 dní od data vystavení. Farline Living.";
  ws.mergeCells(noteRow, 1, noteRow, totalCols);
  ws.getCell(noteRow, 1).value = footerNote;
  ws.getCell(noteRow, 1).font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF71717A" } };

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
