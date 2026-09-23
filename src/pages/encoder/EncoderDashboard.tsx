import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Users, HardHat, Keyboard } from 'lucide-react';

export default function EncoderDashboard() {
  const [workerCount, setWorkerCount] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const [{ count: wc }, { count: ec }] = await Promise.all([
        supabase.from('workers').select('*', { count: 'exact', head: true }),
        supabase.from('employees').select('*', { count: 'exact', head: true }),
      ]);
      setWorkerCount(wc || 0);
      setEmployeeCount(ec || 0);
    };
    fetchCounts();

    const channel = supabase
      .channel('encoder-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => fetchCounts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => fetchCounts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <DashboardLayout title="Encoder Dashboard" portalType="encoder">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-soft bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Workers</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{workerCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <HardHat className="w-6 h-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-gradient-to-br from-success/5 to-success/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Employees</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{employeeCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <Users className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-soft bg-gradient-to-br from-violet-500/5 to-violet-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Role</p>
                  <p className="text-xl font-bold text-foreground mt-1">Data Encoder</p>
                </div>
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <Keyboard className="w-6 h-6 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border">
          <CardContent className="p-8 text-center">
            <Keyboard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Welcome to the Encoder Portal</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Use the sidebar to navigate to Workers or Employees pages to add and edit records.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
