import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export function WorkerRoute({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/worker/login" replace />;
  if (role !== 'worker') {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'employee') return <Navigate to="/employee" replace />;
    if (role === 'site_admin_officer') return <Navigate to="/sao" replace />;
    if (role === 'encoder') return <Navigate to="/encoder" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
