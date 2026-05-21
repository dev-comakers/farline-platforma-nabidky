// Node test for Excel export — mirrors lib/excel-export.ts but uses local file paths instead of fetch.
import ExcelJS from "exceljs";
import { readFileSync, writeFileSync } from "node:fs";

const products = JSON.parse(readFileSync("./data/products.json", "utf-8"));
const offers = JSON.parse(readFileSync("./data/offers.json", "utf-8"));

const round2 = (n) => Math.round(n * 100) / 100;
const itemBefore = (i, p) => round2(p.unitPrice * i.quantity);
const itemDisc = (i, p) => round2(itemBefore(i, p) * (i.discountPercent / 100));
const itemAfter = (i, p) => round2(itemBefore(i, p) - itemDisc(i, p));

function summary(offer) {
  const byId = new Map(products.map((p) => [p.id, p]));
  let tb = 0, td = 0;
  for (const i of offer.items) {
    const p = byId.get(i.productId);
    if (!p) continue;
    tb += itemBefore(i, p);
    td += itemDisc(i, p);
  }
  return {
    totalBeforeDiscount: round2(tb),
    totalDiscount: round2(td),
    totalAfterDiscount: round2(tb - td),
    currency: offer.currency,
  };
}

function readImageBuffer(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("/")) {
    return readFileSync("./public" + imageUrl);
  }
  if (imageUrl.startsWith("data:")) {
    const b64 = imageUrl.split(",")[1];
    return Buffer.from(b64, "base64");
  }
  return null;
}

async function generate(offer) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const sum = summary(offer);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Nabídka", {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 22 },
  });

  const numberFormat = offer.currency === "USD" ? '"$"#,##0.00' : '#,##0.00" Kč"';
  const percentFormat = "0.00%";

  ws.mergeCells("A1:L1");
  ws.getCell("A1").value = "FARLINE LIVING — Cenová nabídka";
  ws.getCell("A1").font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF18181B" } };
  ws.mergeCells("A2:F2");
  ws.getCell("A2").value = offer.name;
  ws.getCell("A2").font = { name: "Calibri", size: 11, bold: true };
  ws.mergeCells("G2:L2");
  ws.getCell("G2").value = offer.architect ? `Architekt: ${offer.architect}` : "";
  ws.getCell("G2").alignment = { horizontal: "right" };
  ws.mergeCells("A3:L3");
  ws.getCell("A3").value = `Měna: ${offer.currency}    Datum: ${new Date(offer.updatedAt).toLocaleDateString("cs-CZ")}`;
  ws.getCell("A3").font = { name: "Calibri", size: 9, color: { argb: "FF71717A" } };

  const headerRow = 5;
  const headers = ["#","Foto","Kód","Název","Dekor","Značka","Ks","Jedn. cena","Cena celkem","Sleva %","Sleva (částka)","Cena po slevě"];
  headers.forEach((h, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = h;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF71717A" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAF8" } };
    cell.border = { bottom: { style: "medium", color: { argb: "FF8B7355" } } };
  });
  ws.getRow(headerRow).height = 22;

  const widths = [5, 14, 14, 38, 18, 18, 6, 14, 14, 9, 14, 14];
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  const ROW_H = 60;
  offer.items.forEach((item, idx) => {
    const p = byId.get(item.productId);
    if (!p) return;
    const row = headerRow + 1 + idx;
    ws.getCell(row, 1).value = idx + 1;
    ws.getCell(row, 1).alignment = { vertical: "middle", horizontal: "center" };
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
    ws.getCell(row, 9).value = itemBefore(item, p);
    ws.getCell(row, 9).numFmt = numberFormat;
    ws.getCell(row, 9).alignment = { vertical: "middle", horizontal: "right" };
    ws.getCell(row, 10).value = item.discountPercent / 100;
    ws.getCell(row, 10).numFmt = percentFormat;
    ws.getCell(row, 10).alignment = { vertical: "middle", horizontal: "center" };
    ws.getCell(row, 11).value = itemDisc(item, p);
    ws.getCell(row, 11).numFmt = numberFormat;
    ws.getCell(row, 11).alignment = { vertical: "middle", horizontal: "right" };
    ws.getCell(row, 12).value = itemAfter(item, p);
    ws.getCell(row, 12).numFmt = numberFormat;
    ws.getCell(row, 12).font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF8B7355" } };
    ws.getCell(row, 12).alignment = { vertical: "middle", horizontal: "right" };
    for (let c = 1; c <= 12; c++) {
      ws.getCell(row, c).border = { bottom: { style: "hair", color: { argb: "FFE4E4E7" } } };
    }
    ws.getRow(row).height = ROW_H;

    const imgBuf = readImageBuffer(p.imageUrl);
    if (imgBuf) {
      const id = wb.addImage({ buffer: imgBuf, extension: "jpeg" });
      ws.addImage(id, {
        tl: { col: 1.08, row: row - 1 + 0.08 },
        ext: { width: 78, height: 58 },
        editAs: "oneCell",
      });
    }
  });

  const totalsRow = headerRow + 1 + offer.items.length + 1;
  ws.getCell(totalsRow, 7).value = "Před slevou:";
  ws.getCell(totalsRow, 7).font = { name: "Calibri", size: 9, color: { argb: "FF71717A" } };
  ws.getCell(totalsRow, 7).alignment = { vertical: "middle", horizontal: "right" };
  ws.getCell(totalsRow, 8).value = sum.totalBeforeDiscount;
  ws.getCell(totalsRow, 8).numFmt = numberFormat;
  ws.getCell(totalsRow, 8).font = { name: "Calibri", size: 12, bold: true };
  ws.getCell(totalsRow, 8).alignment = { vertical: "middle", horizontal: "right" };
  ws.getCell(totalsRow, 9).value = "Sleva:";
  ws.getCell(totalsRow, 9).font = { name: "Calibri", size: 9, color: { argb: "FF71717A" } };
  ws.getCell(totalsRow, 9).alignment = { vertical: "middle", horizontal: "right" };
  ws.getCell(totalsRow, 10).value = -sum.totalDiscount;
  ws.getCell(totalsRow, 10).numFmt = numberFormat;
  ws.getCell(totalsRow, 10).font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF71717A" } };
  ws.getCell(totalsRow, 10).alignment = { vertical: "middle", horizontal: "right" };
  ws.getCell(totalsRow, 11).value = "Po slevě (bez DPH):";
  ws.getCell(totalsRow, 11).font = { name: "Calibri", size: 9, color: { argb: "FF71717A" } };
  ws.getCell(totalsRow, 11).alignment = { vertical: "middle", horizontal: "right" };
  ws.getCell(totalsRow, 12).value = sum.totalAfterDiscount;
  ws.getCell(totalsRow, 12).numFmt = numberFormat;
  ws.getCell(totalsRow, 12).font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF8B7355" } };
  ws.getCell(totalsRow, 12).alignment = { vertical: "middle", horizontal: "right" };
  for (let c = 7; c <= 12; c++) {
    ws.getCell(totalsRow, c).border = { top: { style: "medium", color: { argb: "FF8B7355" } } };
  }
  ws.getRow(totalsRow).height = 28;

  const file = `/tmp/Farline_${offer.name.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
  await wb.xlsx.writeFile(file);
  console.log("wrote", file);
}

for (const o of offers) await generate(o);
