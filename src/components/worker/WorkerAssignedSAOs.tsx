import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, UserCog, Mail, Phone } from 'lucide-react';

interface SAO {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
}

export function WorkerAssignedSAOs({ workerId }: { workerId: string }) {
  const [saos, setSaos] = useState<SAO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSAOs = async () => {
      const ids = new Set<string>();

      const { data: assignments } = await supabase
        .from('worker_sao_assignments')
        .select('sao_employee_id')
        .eq('worker_id', workerId);
      assignments?.forEach((a) => ids.add(a.sao_employee_id));

      const { data: worker } = await supabase
        .from('workers')
        .select('assigned_sao_id')
        .eq('id', workerId)
        .maybeSingle();
      if (worker?.assigned_sao_id) ids.add(worker.assigned_sao_id);

      if (ids.size === 0) {
        setSaos([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position, email, phone, photo_url')
        .in('id', Array.from(ids))
        .order('first_name');
      setSaos((data as SAO[]) || []);
      setLoading(false);
    };

    fetchSAOs();

    const channel = supabase
      .channel(`worker-saos-${workerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worker_sao_assignments' },
        () => fetchSAOs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="w-5 h-5 text-primary" />
          My Site Officers
        </CardTitle>
        <CardDescription>Site Admin Officers assigned to you</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : saos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No site officer assigned yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {saos.map((sao) => (
              <div
                key={sao.id}
                className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30"
              >
                <Avatar className="w-11 h-11 border">
                  <AvatarImage src={sao.photo_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {`${sao.first_name[0] || ''}${sao.last_name[0] || ''}`.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {sao.first_name} {sao.last_name}
                  </p>
                  {sao.position && (
                    <p className="text-xs text-muted-foreground truncate">{sao.position}</p>
                  )}
                  {sao.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 shrink-0" /> {sao.email}
                    </p>
                  )}
                  {sao.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Phone className="w-3 h-3 shrink-0" /> {sao.phone}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
