import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EmployeeTimesheets } from '@/components/employee/EmployeeTimesheets';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';

export default function SAOTimesheets() {
  const { employeeId, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout title="My Timesheets" portalType="sao">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employeeId) {
    return (
      <DashboardLayout title="My Timesheets" portalType="sao">
        <Card className="border-warning">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Account Setup Pending</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your profile is not set up yet. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Timesheets" portalType="sao">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">My Timesheets</h2>
          <p className="text-muted-foreground">View your work hours and earnings history</p>
        </div>
        <EmployeeTimesheets employeeId={employeeId} />
      </div>
    </DashboardLayout>
  );
}
