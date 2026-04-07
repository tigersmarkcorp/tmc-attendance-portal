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
import { MapPin, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WorkLocation {
  id: string;
  name: string;
  address: string | null;
  radius_meters: number;
}

interface AssignMultipleLocationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityName: string;
  entityType: 'employee' | 'worker';
  onSuccess: () => void;
}

export function AssignMultipleLocationsDialog({
  open,
  onOpenChange,
  entityId,
  entityName,
  entityType,
  onSuccess,
}: AssignMultipleLocationsDialogProps) {
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLocations();
      fetchCurrentAssignments();
    }
  }, [open, entityId, entityType]);

  const fetchLocations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('work_locations')
      .select('id, name, address, radius_meters')
      .eq('is_active', true)
      .order('name');

    if (data) {
      setLocations(data);
    }
    setLoading(false);
  };

  const fetchCurrentAssignments = async () => {
    if (entityType === 'employee') {
      const { data } = await supabase
        .from('employee_location_assignments')
        .select('location_id')
        .eq('employee_id', entityId);
      if (data) {
        setSelectedLocationIds(data.map(d => d.location_id));
      }
    } else {
      const { data } = await supabase
        .from('worker_location_assignments')
        .select('location_id')
        .eq('worker_id', entityId);
      if (data) {
        setSelectedLocationIds(data.map(d => d.location_id));
      }
    }
  };

  const handleToggleLocation = (locationId: string) => {
    setSelectedLocationIds(prev => 
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      if (entityType === 'employee') {
        await supabase
          .from('employee_location_assignments')
          .delete()
          .eq('employee_id', entityId);

        if (selectedLocationIds.length > 0) {
          const insertData = selectedLocationIds.map(locationId => ({
            employee_id: entityId,
            location_id: locationId,
          }));
          const { error } = await supabase
            .from('employee_location_assignments')
            .insert(insertData);
          if (error) throw error;
        }
      } else {
        await supabase
          .from('worker_location_assignments')
          .delete()
          .eq('worker_id', entityId);

        if (selectedLocationIds.length > 0) {
          const insertData = selectedLocationIds.map(locationId => ({
            worker_id: entityId,
            location_id: locationId,
          }));
          const { error } = await supabase
            .from('worker_location_assignments')
            .insert(insertData);
          if (error) throw error;
        }
      }

      toast.success(
        selectedLocationIds.length > 0 
          ? `${selectedLocationIds.length} location(s) assigned successfully!` 
          : 'All locations unassigned'
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to assign locations');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Assign Work Locations
          </DialogTitle>
          <DialogDescription>
            Assign one or more geofenced work locations to <strong>{entityName}</strong>. 
            They can clock in/out from any assigned location.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No active work locations found.</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {locations.map((location) => {
                  const isSelected = selectedLocationIds.includes(location.id);
                  return (
                    <div
                      key={location.id}
                      onClick={() => handleToggleLocation(location.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        id={location.id}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleLocation(location.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={location.id}
                          className="font-medium cursor-pointer flex items-center gap-2"
                        >
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          {location.name}
                        </Label>
                        {location.address && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {location.address}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Radius: {location.radius_meters}m
                        </p>
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

          {selectedLocationIds.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium">
                {selectedLocationIds.length} location(s) selected
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
                <MapPin className="w-4 h-4 mr-2" />
                Save Locations
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
