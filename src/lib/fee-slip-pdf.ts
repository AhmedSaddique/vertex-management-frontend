import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { INSTALLMENT_LABEL, date, money, remainingLabel } from "./format";
import type { StudentDetail } from "./types";

const BRAND: [number, number, number] = [79, 70, 229];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];

/**
 * Two identical copies of the fee position on one page: one for the student and one for
 * the academy, separated by a cut line, the way a fee challan is handed over.
 */
export function buildFeeSlip(s: StudentDetail): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const half = doc.internal.pageSize.getHeight() / 2;

  const rows = s.installments.map((i, idx) => [
    String(idx + 1),
    date(i.dueDate),
    money(i.amount),
    money(i.paidAmount),
    money(i.remaining),
    INSTALLMENT_LABEL[i.status] ?? i.status,
  ]);
  if (rows.length === 0) rows.push(["-", "No due date set", money(s.finalPrice), money(0), money(s.remaining), "Not scheduled"]);

  const renderCopy = (top: number, copyLabel: string) => {
    // Title bar
    doc.setFillColor(...BRAND);
    doc.rect(margin, top, pageWidth - margin * 2, 11, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Vertex Trading Academy", margin + 4, top + 7.3);
    doc.setFontSize(9);
    doc.text(copyLabel, pageWidth - margin - 4, top + 7.3, { align: "right" });

    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Fee Due Slip", margin, top + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Issued ${date(new Date())}`, pageWidth - margin, top + 18, { align: "right" });

    // Who the slip is for
    autoTable(doc, {
      startY: top + 21,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: { fontSize: 8.5, cellPadding: 1.2, textColor: INK },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 26, textColor: MUTED },
        1: { cellWidth: 55 },
        2: { fontStyle: "bold", cellWidth: 24, textColor: MUTED },
        3: { cellWidth: "auto" },
      },
      body: [
        ["Admission no", `#${s.admissionNo}`, "Course", s.subject.name],
        ["Student", s.name, "Teacher", s.teacher.user.name],
        ["Father name", s.fatherName || "-", "Phone", s.phone],
      ],
    });

    // The fee position
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2,
      margin: { left: margin, right: margin },
      head: [["#", "Due date", "Amount", "Paid", "Remaining", "Status"]],
      body: rows,
      styles: { fontSize: 8.5, cellPadding: 1.6 },
      headStyles: { fillColor: [241, 245, 249], textColor: INK, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 8 },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
      foot: [["", "Total", money(s.finalPrice), money(s.paid), remainingLabel(s.remaining), ""]],
      footStyles: { fillColor: [248, 250, 252], textColor: INK, fontStyle: "bold", halign: "right" },
    });

    const afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

    // Headline numbers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text(`Total fee: ${money(s.finalPrice)}`, margin, afterTable + 7);
    doc.text(`Received: ${money(s.paid)}`, margin + 60, afterTable + 7);
    doc.text(`Remaining: ${remainingLabel(s.remaining)}`, margin + 115, afterTable + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text("Received by ______________________", margin, afterTable + 15);
    doc.text("Student / Guardian ______________________", pageWidth - margin, afterTable + 15, { align: "right" });
  };

  renderCopy(margin, "STUDENT COPY");

  // Cut line between the copies
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(margin, half, pageWidth - margin, half);
  doc.setLineDashPattern([], 0);

  renderCopy(half + 6, "ACADEMY COPY");
  return doc;
}

export function downloadFeeSlip(s: StudentDetail) {
  const slug = s.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  buildFeeSlip(s).save(`fee-slip-${s.admissionNo}-${slug || "student"}.pdf`);
}
