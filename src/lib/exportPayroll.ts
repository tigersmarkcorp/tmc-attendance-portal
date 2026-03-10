import { format } from 'date-fns';

interface PayrollDayData {
  date: Date;
  dayName: string;
  timeIn: string | null;
  timeOut: string | null;
  totalHoursMs: number;
  regularHours: number;
  overtimeHours: number;
}

interface PayrollExportOptions {
  employeeName: string;
  periodLabel: string;
  dailyRate: number;
  hourlyRate: number;
  grossRegular: number;
  grossOvertime: number;
  totalPay: number;
  totalRegular: number;
  totalOvertime: number;
  overtimeMultiplier: number;
  dayData: PayrollDayData[];
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportPayrollToExcel(options: PayrollExportOptions) {
  const {
    employeeName,
    periodLabel,
    dailyRate,
    hourlyRate,
    grossRegular,
    grossOvertime,
    totalPay,
    totalRegular,
    totalOvertime,
    overtimeMultiplier,
    dayData,
  } = options;

  const rows: string[][] = [];

  // Header info
  rows.push(['PAYROLL REPORT']);
  rows.push(['Employee', employeeName]);
  rows.push(['Pay Period', periodLabel]);
  rows.push(['Daily Rate', dailyRate.toFixed(2)]);
  rows.push(['Hourly Rate', hourlyRate.toFixed(2)]);
  rows.push(['OT Multiplier', `${overtimeMultiplier}x`]);
  rows.push([]);

  // Table header
  rows.push(['Date', 'Day', 'Time In', 'Time Out', 'Total Hours', 'Regular Hours', 'OT Hours', 'Pay']);

  // Day rows
  dayData.forEach((d) => {
    const totalHours = d.totalHoursMs / (1000 * 60 * 60);
    const dayPay = d.regularHours * hourlyRate + d.overtimeHours * hourlyRate * overtimeMultiplier;
    rows.push([
      format(d.date, 'MMM d, yyyy'),
      d.dayName,
      d.timeIn || '—',
      d.timeOut || '—',
      totalHours > 0 ? totalHours.toFixed(2) : '0.00',
      d.regularHours > 0 ? d.regularHours.toFixed(2) : '0.00',
      d.overtimeHours > 0 ? d.overtimeHours.toFixed(2) : '0.00',
      dayPay > 0 ? dayPay.toFixed(2) : '0.00',
    ]);
  });

  // Totals
  rows.push([]);
  rows.push(['TOTALS', '', '', '', (totalRegular + totalOvertime).toFixed(2), totalRegular.toFixed(2), totalOvertime.toFixed(2), totalPay.toFixed(2)]);
  rows.push([]);
  rows.push(['SUMMARY']);
  rows.push(['Gross Regular Pay', grossRegular.toFixed(2)]);
  rows.push(['Gross Overtime Pay', grossOvertime.toFixed(2)]);
  rows.push(['Total Pay', totalPay.toFixed(2)]);

  // Build CSV
  const csvContent = rows.map(row => row.map(escapeCSV).join(',')).join('\n');

  // BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const safeName = employeeName.replace(/[^a-zA-Z0-9]/g, '_');
  const safePeriod = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  link.href = url;
  link.download = `Payroll_${safeName}_${safePeriod}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
