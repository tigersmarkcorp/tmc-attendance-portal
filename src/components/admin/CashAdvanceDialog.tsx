import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Wallet, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';

export interface CashAdvance {
  id: string;
  description: string;
  amount: number;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectType: 'employee' | 'worker';
  subjectId: string;
  subjectName: string;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  advances: CashAdvance[];
  onChanged?: () => void;
}

export function CashAdvanceDialog({
  open, onOpenChange, subjectType, subjectId, subjectName,
  periodStart, periodEnd, periodLabel, advances, onChanged,
}: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const total = advances.reduce((s, a) => s + Number(a.amount || 0), 0);

  const handleAdd = async () => {
    const amt = parseFloat(amount);
    const desc = description.trim();
    if (!desc) {
      toast({ title: 'Missing description', description: 'Please describe what the cash advance is for.', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      toast({ title: 'Invalid amount', description: 'Amount must be a positive number.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload: any = {
      description: desc,
      amount: amt,
      period_start: format(periodStart, 'yyyy-MM-dd'),
      period_end: format(periodEnd, 'yyyy-MM-dd'),
    };
    if (subjectType === 'employee') payload.employee_id = subjectId;
    else payload.worker_id = subjectId;

    const { error } = await (supabase as any).from('cash_advances').insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to save', description: error.message, variant: 'destructive' });
      return;
    }
    setDescription('');
    setAmount('');
    toast({ title: 'Cash advance added', description: `${desc} — ${formatCurrency(amt)} deducted from ${subjectName}'s total pay.` });
    onChanged?.();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await (supabase as any).from('cash_advances').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      toast({ title: 'Failed to remove', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Cash advance removed' });
    onChanged?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-orange-500" />
            Cash Advance — {subjectName}
          </DialogTitle>
          <DialogDescription>
            {periodLabel} • Deducted from total pay in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-3 rounded-lg border p-3 bg-muted/30">
            <div className="grid gap-1.5">
              <Label htmlFor="ca-desc" className="text-xs">Description / What it's for</Label>
              <Input
                id="ca-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Rice, Emergency loan, Meal allowance"
                maxLength={200}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ca-amt" className="text-xs">Amount (₱)</Label>
              <Input
                id="ca-amt"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <Button onClick={handleAdd} disabled={saving} className="gap-2 bg-orange-500 hover:bg-orange-600">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Cash Advance
            </Button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                This Period ({advances.length})
              </p>
              <Badge variant="secondary" className="text-xs">
                Total: {formatCurrency(total)}
              </Badge>
            </div>
            {advances.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No cash advances for this period.</p>
            ) : (
              <div className="space-y-2">
                {advances.map((a) => (
                  <Card key={a.id} className="border">
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{a.description}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(a.created_at), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-orange-600 whitespace-nowrap">
                        −{formatCurrency(Number(a.amount))}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(a.id)}
                        disabled={deletingId === a.id}
                      >
                        {deletingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
