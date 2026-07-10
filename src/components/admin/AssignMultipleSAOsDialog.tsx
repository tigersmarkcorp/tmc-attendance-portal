import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { UserCog, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SAOEmployee {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
}

interface AssignMultipleSAOsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workerId: string;
  workerName: string;
  onSuccess: () => void;
}

export function AssignMultipleSAOsDialog({
  open,
  onOpenChange,
  workerId,
  workerName,
  onSuccess,
}: AssignMultipleSAOsDialogProps) {
  const [saos, setSaos] = useState<SAOEmployee[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSAOs();
      fetchCurrentAssignments();
    }
  }, [open, workerId]);

  const fetchSAOs = async () => {
    setLoading(true);
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'site_admin_officer');

    if (roles && roles.length > 0) {
      const userIds = roles.map(r => r.user_id);
      const { data } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position')
        .in('user_id', userIds)
        .order('first_name');
      if (data) setSaos(data);
    } else {
      setSaos([]);
    }
    setLoading(false);
  };

  const fetchCurrentAssignments = async () => {
    const ids: string[] = [];
    const { data: junction } = await supabase
      .from('worker_sao_assignments')
      .select('sao_employee_id')
      .eq('worker_id', workerId);
    if (junction) junction.forEach(j => ids.push(j.sao_employee_id));

    // include legacy single assignment
    const { data: worker } = await supabase
      .from('workers')
      .select('assigned_sao_id')
      .eq('id', workerId)
      .single();
    if (worker?.assigned_sao_id && !ids.includes(worker.assigned_sao_id)) {
      ids.push(worker.assigned_sao_id);
    }
    setSelectedIds(ids);
  };

  const toggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Reset junction
      await supabase
        .from('worker_sao_assignments')
        .delete()
        .eq('worker_id', workerId);

      if (selectedIds.length > 0) {
        const rows = selectedIds.map(sao_employee_id => ({
          worker_id: workerId,
          sao_employee_id,
        }));
        const { error } = await supabase
          .from('worker_sao_assignments')
          .insert(rows);
        if (error) throw error;
      }

      // Mirror first selected as legacy primary (for backward compatibility)
      await supabase
        .from('workers')
        .update({ assigned_sao_id: selectedIds[0] ?? null })
        .eq('id', workerId);

      toast.success(
        selectedIds.length > 0
          ? `${selectedIds.length} SAO(s) assigned successfully!`
          : 'All SAOs unassigned'
      );
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed to assign SAOs');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            Assign Site Admin Officers
          </DialogTitle>
          <DialogDescription>
            Assign one or more SAOs to <strong>{workerName}</strong>. Any
            assigned SAO will see this worker in their portal.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : saos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCog className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No SAOs available.</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {saos.map((sao) => {
                  const isSelected = selectedIds.includes(sao.id);
                  return (
                    <div
                      key={sao.id}
                      onClick={() => toggle(sao.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggle(sao.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <Label className="font-medium cursor-pointer flex items-center gap-2">
                          <UserCog className="w-4 h-4 text-primary shrink-0" />
                          {sao.first_name} {sao.last_name}
                        </Label>
                        {sao.position && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {sao.position}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {selectedIds.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium">
                {selectedIds.length} SAO(s) selected
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <UserCog className="w-4 h-4 mr-2" />
                Save SAOs
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
