import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarClock, MoonStar } from 'lucide-react';
import { DAY_LABELS, DAY_ORDER, type SAOScheduleRow } from '@/lib/saoSchedule';

interface AssignScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saoEmployeeId: string;
  saoName: string;
}

interface DayForm {
  day_of_week: number;
  clock_in: string;   // 'HH:MM'
  clock_out: string;  // 'HH:MM'
  is_rest_day: boolean;
}

function emptyWeek(): DayForm[] {
  return DAY_ORDER.map(dow => ({
    day_of_week: dow,
    clock_in: '08:00',
    clock_out: '17:00',
    is_rest_day: dow === 0, // default Sunday rest
  }));
}

function isOvernight(inT: string, outT: string) {
  if (!inT || !outT) return false;
  return outT <= inT;
}

export function AssignScheduleDialog({
  open,
  onOpenChange,
  saoEmployeeId,
  saoName,
}: AssignScheduleDialogProps) {
  const { toast } = useToast();
  const [days, setDays] = useState<DayForm[]>(emptyWeek());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !saoEmployeeId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('sao_schedules' as any)
        .select('day_of_week, clock_in_time, clock_out_time, is_rest_day')
        .eq('sao_employee_id', saoEmployeeId);

      const base = emptyWeek();
      if (data && Array.isArray(data)) {
        (data as unknown as SAOScheduleRow[]).forEach(row => {
          const idx = base.findIndex(d => d.day_of_week === row.day_of_week);
          if (idx >= 0) {
            base[idx] = {
              day_of_week: row.day_of_week,
              clock_in: row.clock_in_time ? row.clock_in_time.slice(0, 5) : '08:00',
              clock_out: row.clock_out_time ? row.clock_out_time.slice(0, 5) : '17:00',
              is_rest_day: !!row.is_rest_day,
            };
          }
        });
      }
      setDays(base);
      setLoading(false);
    })();
  }, [open, saoEmployeeId]);

  const updateDay = (dow: number, patch: Partial<DayForm>) => {
    setDays(prev => prev.map(d => (d.day_of_week === dow ? { ...d, ...patch } : d)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing, then upsert new (simpler than per-row upsert conflicts)
      const { error: delErr } = await supabase
        .from('sao_schedules' as any)
        .delete()
        .eq('sao_employee_id', saoEmployeeId);
      if (delErr) throw delErr;

      const rows = days.map(d => ({
        sao_employee_id: saoEmployeeId,
        day_of_week: d.day_of_week,
        clock_in_time: d.is_rest_day ? null : `${d.clock_in}:00`,
        clock_out_time: d.is_rest_day ? null : `${d.clock_out}:00`,
        is_rest_day: d.is_rest_day,
      }));

      const { error: insErr } = await supabase.from('sao_schedules' as any).insert(rows);
      if (insErr) throw insErr;

      toast({ title: 'Schedule saved', description: `Weekly schedule assigned to ${saoName}.` });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Failed to save schedule',
        description: err.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-orange-500" />
            Assign Weekly Schedule
          </DialogTitle>
          <DialogDescription>
            Set the weekly clock-in and clock-out times for <span className="font-semibold">{saoName}</span>.
            Overnight shifts are supported — if the clock-out time is earlier than the clock-in time,
            it will roll over to the next day.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <div className="space-y-3 py-2">
              {days.map(d => {
                const overnight = !d.is_rest_day && isOvernight(d.clock_in, d.clock_out);
                return (
                  <div
                    key={d.day_of_week}
                    className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg border bg-card/60 backdrop-blur"
                  >
                    <div className="col-span-12 sm:col-span-3">
                      <Label className="font-semibold text-sm">
                        {DAY_LABELS[d.day_of_week]}
                      </Label>
                      {overnight && (
                        <div className="flex items-center gap-1 text-[10px] text-indigo-500 mt-0.5">
                          <MoonStar className="w-3 h-3" />
                          Overnight → next day
                        </div>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <Label className="text-xs text-muted-foreground">Clock In</Label>
                      <Input
                        type="time"
                        value={d.clock_in}
                        disabled={d.is_rest_day}
                        onChange={e => updateDay(d.day_of_week, { clock_in: e.target.value })}
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <Label className="text-xs text-muted-foreground">Clock Out</Label>
                      <Input
                        type="time"
                        value={d.clock_out}
                        disabled={d.is_rest_day}
                        onChange={e => updateDay(d.day_of_week, { clock_out: e.target.value })}
                      />
                    </div>

                    <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2">
                      <Label className="text-xs text-muted-foreground">Rest day</Label>
                      <Switch
                        checked={d.is_rest_day}
                        onCheckedChange={v => updateDay(d.day_of_week, { is_rest_day: v })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
