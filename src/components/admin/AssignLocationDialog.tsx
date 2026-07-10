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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WorkLocation {
  id: string;
  name: string;
  address: string | null;
  radius_meters: number;
}

interface AssignLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityId: string;
  entityName: string;
  entityType: 'employee' | 'worker';
  currentLocationId: string | null;
  onSuccess: () => void;
}

export function AssignLocationDialog({
  open,
  onOpenChange,
  entityId,
  entityName,
  entityType,
  currentLocationId,
  onSuccess,
}: AssignLocationDialogProps) {
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(currentLocationId || 'none');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLocations();
      setSelectedLocationId(currentLocationId || 'none');
    }
  }, [open, currentLocationId]);

  const fetchLocations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('work_locations')
      .select('id, name, address, radius_meters')
      .eq('is_active', true)
      .order('name');

    if (data) {
      setLocations(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const tableName = entityType === 'employee' ? 'employees' : 'workers';
    const locationValue = selectedLocationId === 'none' ? null : selectedLocationId;

    const { error } = await supabase
      .from(tableName)
      .update({ assigned_location_id: locationValue })
      .eq('id', entityId);

    if (error) {
      toast.error('Failed to assign location');
    } else {
      toast.success(locationValue ? 'Location assigned successfully!' : 'Location unassigned');
      onSuccess();
      onOpenChange(false);
    }
    setSaving(false);
  };

  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Assign Work Location
          </DialogTitle>
          <DialogDescription>
            Assign a geofenced work location to <strong>{entityName}</strong>. They will only be able to clock in/out when within the location's radius.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="location">Work Location</Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No location assigned</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {location.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedLocation && (
            <div className="p-3 rounded-lg bg-muted space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="w-4 h-4 text-success" />
                {selectedLocation.name}
              </div>
              {selectedLocation.address && (
                <p className="text-xs text-muted-foreground pl-6">{selectedLocation.address}</p>
              )}
              <p className="text-xs text-muted-foreground pl-6">
                Radius: {selectedLocation.radius_meters} meters
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
                Assign Location
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
