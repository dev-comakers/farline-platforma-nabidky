// Local-only test script — generates a PDF using the same renderer to verify Czech rendering.
// Run: node scripts/test-pdf.mjs
import * as jspdfModule from "jspdf";
import autoTable from "jspdf-autotable";
const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const products = JSON.parse(
  readFileSync(resolve("./data/products.json"), "utf-8")
);
const offers = JSON.parse(readFileSync(resolve("./data/offers.json"), "utf-8"));

const robotoReg = readFileSync(resolve("./public/fonts/Roboto-Regular.ttf")).toString("base64");
const robotoBold = readFileSync(resolve("./public/fonts/Roboto-Bold.ttf")).toString("base64");

const BRASS = [139, 115, 85];
const ZINC_900 = [24, 24, 27];
const ZINC_500 = [113, 113, 122];
const ZINC_300 = [212, 212, 216];

const round2 = (n) => Math.round(n * 100) / 100;
const itemBefore = (i, p) => round2(p.unitPrice * i.quantity);
const itemDisc = (i, p) => round2(itemBefore(i, p) * (i.discountPercent / 100));
const itemAfter = (i, p) => round2(itemBefore(i, p) - itemDisc(i, p));

function summary(offer) {
  const byId = new Map(products.map((p) => [p.id, p]));
  let tb = 0,
    td = 0;
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
    itemCount: offer.items.length,
    currency: offer.currency,
  };
}

function fmt(n, currency) {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(iso) {
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

function generate(offer) {
  const productsById = new Map(products.map((p) => [p.id, p]));
  const sum = summary(offer);

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  doc.addFileToVFS("Roboto-Regular.ttf", robotoReg);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", robotoBold);
  doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
  doc.setFont("Roboto", "normal");

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;

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
  const meta = [
    ["AKCE", offer.name || "—"],
    ["ARCHITEKT", offer.architect || "—"],
    ["DATUM", fmtDate(offer.updatedAt)],
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

  const rows = offer.items.map((item, idx) => {
    const p = productsById.get(item.productId);
    if (!p) return [];
    return [
      String(idx + 1),
      "",
      p.code,
      p.name,
      p.decor,
      p.brand,
      String(item.quantity),
      fmt(p.unitPrice, p.currency),
      fmt(itemBefore(item, p), p.currency),
      `${item.discountPercent.toFixed(2)} %`,
      fmt(itemDisc(item, p), p.currency),
      fmt(itemAfter(item, p), p.currency),
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [
      ["#", "Foto", "Kód", "Název", "Dekor", "Značka", "Ks", "Jedn. cena", "Celkem", "Sleva", "Sleva Kč", "Po slevě"],
    ],
    body: rows,
    theme: "plain",
    styles: { font: "Roboto", fontStyle: "normal", fontSize: 8, cellPadding: { top: 2, right: 2, bottom: 2, left: 2 }, textColor: ZINC_900, lineColor: ZINC_300, lineWidth: 0.1, overflow: "linebreak", valign: "middle", minCellHeight: 18 },
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
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 20 },
      3: { cellWidth: 48 },
      4: { cellWidth: 20 },
      5: { cellWidth: 19 },
      6: { cellWidth: 8, halign: "center" },
      7: { cellWidth: 20, halign: "right" },
      8: { cellWidth: 20, halign: "right" },
      9: { cellWidth: 14, halign: "center" },
      10: { cellWidth: 20, halign: "right" },
      11: { cellWidth: 23, halign: "right", fontStyle: "bold", textColor: BRASS },
    },
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== 1) return;
      const item = offer.items[data.row.index];
      if (!item) return;
      const p = productsById.get(item.productId);
      if (!p?.imageUrl?.startsWith("/")) return;
      const buf = readFileSync(resolve("./public" + p.imageUrl));
      const b64 = "data:image/jpeg;base64," + buf.toString("base64");
      const padding = 1.2;
      const maxW = data.cell.width - padding * 2;
      const maxH = data.cell.height - padding * 2;
      const ratio = Math.min(maxW / 600, maxH / 450);
      const drawW = 600 * ratio;
      const drawH = 450 * ratio;
      const x = data.cell.x + (data.cell.width - drawW) / 2;
      const y = data.cell.y + (data.cell.height - drawH) / 2;
      doc.addImage(b64, "JPEG", x, y, drawW, drawH, undefined, "FAST");
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc.lastAutoTable?.finalY ?? 50) + 8;
  doc.setDrawColor(...BRASS);
  doc.setLineWidth(0.4);
  doc.line(margin, finalY, pageWidth - margin, finalY);

  doc.setFont("Roboto", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...ZINC_500);
  doc.text("Celková cena před slevou", margin, finalY + 7);
  doc.text("Celková sleva", pageWidth / 2 - 30, finalY + 7);
  doc.text("Cena po slevě (bez DPH)", pageWidth - margin, finalY + 7, { align: "right" });

  doc.setFontSize(13);
  doc.setFont("Roboto", "bold");
  doc.setTextColor(...ZINC_900);
  doc.text(fmt(sum.totalBeforeDiscount, offer.currency), margin, finalY + 14);
  doc.setTextColor(...ZINC_500);
  doc.text(`− ${fmt(sum.totalDiscount, offer.currency)}`, pageWidth / 2 - 30, finalY + 14);
  doc.setTextColor(...BRASS);
  doc.text(fmt(sum.totalAfterDiscount, offer.currency), pageWidth - margin, finalY + 14, { align: "right" });

  doc.setFont("Roboto", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...ZINC_500);
  doc.text("Ceny jsou uvedeny bez DPH. Platnost nabídky 30 dní od data vystavení.", margin, pageHeight - 8);
  doc.text("Farline Living", pageWidth - margin, pageHeight - 8, { align: "right" });

  return doc;
}

for (const o of offers) {
  const doc = generate(o);
  const buf = Buffer.from(doc.output("arraybuffer"));
  const safe = o.name.replace(/[^\p{L}\p{N}\s\-_]/gu, "").trim() || "nabidka";
  const file = `/tmp/Farline_${safe.replace(/\s+/g, "_")}.pdf`;
  writeFileSync(file, buf);
  console.log("wrote", file, buf.length, "bytes");
}
