interface ExportTablePdfOptions {
  title: string;
  fileName: string;
  columns: string[];
  rows: string[][];
}

export async function exportTablePdf({
  title,
  fileName,
  columns,
  rows,
}: ExportTablePdfOptions): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const brandColor: [number, number, number] = [152, 107, 149];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(...brandColor);
  doc.roundedRect(14, 12, 11, 11, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("e", 19.5, 20, { align: "center" });

  doc.setTextColor(17, 17, 17);
  doc.setFontSize(14);
  doc.text("EduLMS", 29, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(107, 102, 112);
  doc.text("Platform Pembelajaran Digital Terpadu", 29, 22);
  doc.setDrawColor(220, 217, 222);
  doc.setLineWidth(0.25);
  doc.line(14, 29, pageWidth - 14, 29);

  doc.setTextColor(17, 17, 17);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 39);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 71, 78);
  doc.text("EduLMS | Tahun Ajaran 2026/2027", 14, 46);
  const printedAt = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
  doc.setTextColor(107, 102, 112);
  doc.text(`Dicetak: ${printedAt}`, 14, 52);

  autoTable(doc, {
    startY: 59,
    head: [columns],
    body: rows,
    margin: { top: 15, right: 14, bottom: 18, left: 14 },
    headStyles: { fillColor: brandColor, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 247, 249] },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 3.2, textColor: [38, 36, 40] },
    didDrawPage: (data) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(107, 102, 112);
      doc.text("© 2026 EduLMS — Dokumen ini digenerate secara otomatis", 14, pageHeight - 9);
      doc.text(`Halaman ${data.pageNumber}`, pageWidth - 14, pageHeight - 9, { align: "right" });
    },
  });

  const finalY = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 59;
  if (finalY > pageHeight - 24) {
    doc.addPage();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 102, 112);
    doc.text("© 2026 EduLMS — Dokumen ini digenerate secara otomatis", 14, pageHeight - 9);
    doc.text(`Halaman ${doc.getNumberOfPages()}`, pageWidth - 14, pageHeight - 9, { align: "right" });
  }
  const summaryY = finalY > pageHeight - 24 ? 18 : finalY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(38, 36, 40);
  doc.text(`Total data: ${rows.length} baris`, 14, summaryY);

  doc.save(fileName);
}