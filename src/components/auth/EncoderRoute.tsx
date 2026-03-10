import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface EncoderRouteProps {
  children: ReactNode;
}

export function EncoderRoute({ children }: EncoderRouteProps) {
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

  if (!user) {
    return <Navigate to="/encoder/login" replace />;
  }

  if (role !== 'encoder') {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'employee') return <Navigate to="/employee" replace />;
    if (role === 'site_admin_officer') return <Navigate to="/sao" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
