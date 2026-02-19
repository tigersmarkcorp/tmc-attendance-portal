import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WorkLocation {
  id: string;
  name: string;
}

interface MultiLocationBadgesProps {
  entityType: 'employee' | 'worker';
  entityId: string;
}

export function MultiLocationBadges({ entityType, entityId }: MultiLocationBadgesProps) {
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocations();
  }, [entityId, entityType]);

  const fetchLocations = async () => {
    if (entityType === 'employee') {
      const { data: assignments } = await supabase
        .from('employee_location_assignments')
        .select('location_id')
        .eq('employee_id', entityId);

      if (assignments && assignments.length > 0) {
        const locationIds = assignments.map(a => a.location_id);
        const { data: locs } = await supabase
          .from('work_locations')
          .select('id, name')
          .in('id', locationIds);
        if (locs) {
          setLocations(locs);
        }
      }
    } else {
      const { data: assignments } = await supabase
        .from('worker_location_assignments')
        .select('location_id')
        .eq('worker_id', entityId);

      if (assignments && assignments.length > 0) {
        const locationIds = assignments.map(a => a.location_id);
        const { data: locs } = await supabase
          .from('work_locations')
          .select('id, name')
          .in('id', locationIds);
        if (locs) {
          setLocations(locs);
        }
      }
    }
    setLoading(false);
  };

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  }

  if (locations.length === 0) {
    return <span className="text-sm text-muted-foreground">Not assigned</span>;
  }

  if (locations.length === 1) {
    return (
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
        <MapPin className="w-3 h-3 mr-1" />
        {locations[0].name}
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 cursor-pointer">
            <MapPin className="w-3 h-3 mr-1" />
            {locations.length} locations
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            {locations.map(loc => (
              <div key={loc.id} className="flex items-center gap-1 text-xs">
                <MapPin className="w-3 h-3" />
                {loc.name}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
