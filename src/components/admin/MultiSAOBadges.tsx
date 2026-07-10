import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { UserCog, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SAO {
  id: string;
  first_name: string;
  last_name: string;
}

interface Props {
  workerId: string;
  legacySaoId?: string | null;
}

export function MultiSAOBadges({ workerId, legacySaoId }: Props) {
  const [saos, setSaos] = useState<SAO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSAOs();
    const channel = supabase
      .channel(`sao-badges-${workerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worker_sao_assignments' },
        () => fetchSAOs()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerId, legacySaoId]);

  const fetchSAOs = async () => {
    const { data: assignments } = await supabase
      .from('worker_sao_assignments')
      .select('sao_employee_id')
      .eq('worker_id', workerId);

    const ids = new Set<string>();
    assignments?.forEach(a => ids.add(a.sao_employee_id));
    if (legacySaoId) ids.add(legacySaoId);

    if (ids.size === 0) {
      setSaos([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .in('id', Array.from(ids));
    if (data) setSaos(data);
    setLoading(false);
  };

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  }

  if (saos.length === 0) {
    return <span className="text-sm text-muted-foreground">Unassigned</span>;
  }

  if (saos.length === 1) {
    return (
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
        <UserCog className="w-3 h-3 mr-1" />
        {saos[0].first_name} {saos[0].last_name}
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 cursor-pointer">
            <UserCog className="w-3 h-3 mr-1" />
            {saos.length} SAOs
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            {saos.map(s => (
              <div key={s.id} className="flex items-center gap-1 text-xs">
                <UserCog className="w-3 h-3" />
                {s.first_name} {s.last_name}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
