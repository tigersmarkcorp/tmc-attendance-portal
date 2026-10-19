import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export interface PayrollPdfDay {
  date: Date;
  dayName: string;
  timeIn: string | null;
  timeOut: string | null;
  timeOutDate?: string | null;
  locationIn: string | null;
  locationOut: string | null;
  totalHoursMs: number;
}

function fmtDuration(ms: number) {
  if (ms <= 0) return '-';
  const totalMin = Math.round(ms / 60000);
  return `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;
}

export function exportPayrollToPdf(opts: {
  name: string;
  idNumber: string;
  employeeType: 'Employee' | 'Site Officer' | 'Worker';
  hourlyRate: number;
  periodLabel: string;
  days: PayrollPdfDay[];
  totalPay: number;
  fallbackLocationIn?: string | null;
}) {
  const { name, idNumber, employeeType, hourlyRate, periodLabel, days, totalPay, fallbackLocationIn } = opts;
  const doc = new jsPDF({ orientation: 'landscape' });
  const theme = {
    primary: [249, 115, 22] as [number, number, number],
    ink: [34, 39, 46] as [number, number, number],
    muted: [100, 107, 116] as [number, number, number],
    surface: [255, 247, 237] as [number, number, number],
    border: [232, 234, 237] as [number, number, number],
    paper: [255, 255, 255] as [number, number, number],
  };
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const money = (value: number) => `PHP ${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const generated = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  doc.setFillColor(...theme.primary);
  doc.rect(0, 0, width, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...theme.ink);
  doc.setFontSize(19);
  doc.text('ATTENDANCE AND PAYROLL REPORT', width / 2, 17, { align: 'center' });
  doc.setDrawColor(...theme.primary);
  doc.setLineWidth(0.7);
  doc.line(width / 2 - 18, 22, width / 2 + 18, 22);

  const detail = (label: string, value: string, x: number, y: number, maxWidth: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...theme.muted);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...theme.ink);
    const lines = doc.splitTextToSize(value || '-', maxWidth);
    doc.text(lines, x, y + 5);
    return y + 5 + (lines.length - 1) * 4;
  };
  const nameBottom = detail('Name', name, 14, 31, 170);
  const createdBottom = detail('Date Created (Philippine Time)', generated, 199, 31, width - 213);
  const metadataY = Math.max(nameBottom, createdBottom) + 10;
  const detailsBottom = Math.max(
    detail('ID Number', idNumber, 14, metadataY, 65),
    detail('Employee Type', employeeType, 87, metadataY, 50),
    detail('Hourly Rate', `${money(hourlyRate)} / hr`, 147, metadataY, 48),
    detail('Period', periodLabel, 205, metadataY, width - 219),
  );

  const body = days.map((d) => {
    const dayStr = format(d.date, 'yyyy-MM-dd');
    let out = d.timeOut || '-';
    if (d.timeOut && d.timeOutDate && d.timeOutDate !== dayStr) {
      out = `${d.timeOut} (${format(new Date(d.timeOutDate + 'T00:00:00'), 'MMM d')})`;
    }
    return [
      format(d.date, 'MMM d, yyyy'),
      d.dayName,
      d.timeIn || '-',
      out,
      d.locationIn || '-',
      d.locationOut || '-',
      fmtDuration(d.totalHoursMs),
    ];
  });

  autoTable(doc, {
    startY: detailsBottom + 9,
    margin: { top: 14, bottom: 14, left: 14, right: 14 },
    head: [['Date', 'Day', 'Clock In', 'Clock Out', 'Location In', 'Location Out', 'Total Time']],
    body,
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: { top: 1.3, bottom: 1.3, left: 3, right: 3 }, textColor: theme.ink, lineColor: theme.border, lineWidth: { bottom: 0.15 }, overflow: 'linebreak', valign: 'middle' },
    headStyles: { fillColor: theme.primary, textColor: theme.paper, fontStyle: 'bold', cellPadding: 3.5 },
    alternateRowStyles: { fillColor: theme.surface },
    columnStyles: { 0: { cellWidth: 29 }, 1: { cellWidth: 16 }, 2: { cellWidth: 29 }, 3: { cellWidth: 36 }, 6: { cellWidth: 26, halign: 'right' } },
    rowPageBreak: 'avoid',
  });

  const totalDays = days.filter((d) => d.totalHoursMs > 0).length;
  let y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 70) + 7;
  if (y + 20 > height - 14) {
    doc.addPage();
    y = 18;
  }
  doc.setDrawColor(...theme.primary);
  doc.setLineWidth(0.5);
  doc.line(14, y, width - 14, y);
  detail('Total Days', String(totalDays), 14, y + 7, 70);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...theme.muted);
  doc.text('Total Pay', width - 14, y + 7, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...theme.primary);
  doc.text(money(totalPay), width - 14, y + 14, { align: 'right' });

  const safe = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Payroll_${safe(name)}_${safe(periodLabel)}.pdf`);
}
