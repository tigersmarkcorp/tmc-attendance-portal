import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmployeeTimesheets } from '@/components/employee/EmployeeTimesheets';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function MyTimesheets() {
  const { employeeId, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout title="My Timesheets">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employeeId) {
    return (
      <DashboardLayout title="My Timesheets">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Your employee profile is not set up yet. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Timesheets">
      <EmployeeTimesheets employeeId={employeeId} />
    </DashboardLayout>
  );
}
