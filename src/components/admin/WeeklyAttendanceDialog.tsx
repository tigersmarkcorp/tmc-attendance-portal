import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { addDays, format, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight, Download, Loader2, CalendarRange } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface WeeklyPerson {
  id: string;
  name: string;
  code: string;
}

interface WeeklyAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'worker' | 'sao';
  people: WeeklyPerson[];
}

interface DayCell {
  present: boolean;
  inTime: string | null;
  outTime: string | null;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeeklyAttendanceDialog({ open, onOpenChange, mode, people }: WeeklyAttendanceDialogProps) {
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState(false);
  const [grid, setGrid] = useState<Record<string, DayCell[]>>({});

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const title = mode === 'worker' ? 'Weekly Worker Attendance' : 'Weekly Site Officer Attendance';

  const peopleKey = useMemo(() => people.map((p) => p.id).join(','), [people]);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);
      const start = new Date(weekStart);
      start.setHours(0, 0, 0, 0);
      const end = addDays(start, 7);

      const table = mode === 'worker' ? 'worker_time_entries' : 'time_entries';
      const idCol = mode === 'worker' ? 'worker_id' : 'employee_id';

      const { data, error } = await supabase
        .from(table as any)
        .select(`${idCol}, entry_type, timestamp`)
        .gte('timestamp', start.toISOString())
        .lt('timestamp', end.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        toast({ title: 'Failed to load attendance', description: error.message, variant: 'destructive' });
        setLoading(false);
        return;
      }

      const next: Record<string, DayCell[]> = {};
      for (const p of people) {
        next[p.id] = DAY_LABELS.map(() => ({ present: false, inTime: null, outTime: null }));
      }

      for (const row of (data as any[]) || []) {
        const pid = row[idCol] as string;
        if (!next[pid]) continue;
        const ts = new Date(row.timestamp);
        const dayIdx = Math.floor((ts.getTime() - start.getTime()) / 86400000);
        if (dayIdx < 0 || dayIdx > 6) continue;
        const cell = next[pid][dayIdx];
        cell.present = true;
        const timeStr = format(ts, 'HH:mm');
        if (row.entry_type === 'clock_in') {
          if (!cell.inTime) cell.inTime = timeStr;
        } else if (row.entry_type === 'clock_out') {
          cell.outTime = timeStr;
        }
      }

      setGrid(next);
      setLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, weekStart, mode, peopleKey]);

  const cellText = (cell?: DayCell) => {
    if (!cell || !cell.present) return '—';
    if (cell.inTime && cell.outTime) return `${cell.inTime}-${cell.outTime}`;
    if (cell.inTime) return `${cell.inTime}-…`;
    return 'Present';
  };

  const presentRows = people.filter((p) => (grid[p.id] || []).some((c) => c.present));

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const rangeLabel = `${format(weekStart, 'MMM d, yyyy')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`;

    doc.setFontSize(16);
    doc.text(title, 40, 40);
    doc.setFontSize(10);
    doc.text(`Week of ${rangeLabel}`, 40, 58);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 40, 72);

    autoTable(doc, {
      startY: 90,
      head: [[
        'Name',
        'ID',
        ...weekDays.map((d, i) => `${DAY_LABELS[i]} ${format(d, 'M/d')}`),
        'Days',
      ]],
      body: presentRows.map((p) => {
        const cells = grid[p.id] || [];
        return [
          p.name,
          p.code,
          ...cells.map((c) => cellText(c)),
          String(cells.filter((c) => c.present).length),
        ];
      }),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: mode === 'worker' ? [245, 158, 11] : [99, 102, 241], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    if (presentRows.length === 0) {
      doc.setFontSize(11);
      doc.text('No attendance records for this week.', 40, 110);
    }

    doc.save(
      `${mode === 'worker' ? 'worker' : 'site-officer'}-weekly-attendance-${format(weekStart, 'yyyy-MM-dd')}.pdf`
    );
    toast({ title: 'PDF generated', description: `Weekly attendance for ${rangeLabel}` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Everyone who clocked in during the selected week, with their daily attendance.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Input
            type="date"
            className="w-[170px]"
            value={format(weekStart, 'yyyy-MM-dd')}
            onChange={(e) => {
              if (!e.target.value) return;
              const d = new Date(`${e.target.value}T00:00:00`);
              setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
            }}
          />
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Badge variant="outline" className="text-xs">
            {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-2"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            This Week
          </Button>
          <Button size="sm" className="gap-2" onClick={handleDownloadPdf} disabled={loading}>
            <Download className="w-4 h-4" />
            Generate PDF
          </Button>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : presentRows.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No attendance records for this week.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Name</TableHead>
                  <TableHead>ID</TableHead>
                  {weekDays.map((d, i) => (
                    <TableHead key={i} className="text-center whitespace-nowrap">
                      {DAY_LABELS[i]}
                      <span className="block text-[10px] font-normal text-muted-foreground">
                        {format(d, 'M/d')}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presentRows.map((p) => {
                  const cells = grid[p.id] || [];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs">{p.code}</TableCell>
                      {cells.map((c, i) => (
                        <TableCell key={i} className="text-center text-xs whitespace-nowrap">
                          {c.present ? (
                            <span className="text-success font-medium">{cellText(c)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold">
                        {cells.filter((c) => c.present).length}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
