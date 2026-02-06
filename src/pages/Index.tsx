import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Loader2, 
  ArrowRight,
} from 'lucide-react';
import adminPortalIcon from '@/assets/admin-portal-icon.png';
import saoPortalIcon from '@/assets/sao-portal-icon.png';
import employeePortalIcon from '@/assets/employee-portal-icon.png';

export default function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'employee') {
        navigate('/employee');
      } else if (role === 'site_admin_officer') {
        navigate('/sao');
      }
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 container mx-auto px-4 py-16 flex flex-col justify-center">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-primary shadow-lg">
              <Clock className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">TimeTrack Pro</h1>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Enterprise Workforce Management</p>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground tracking-tight">
            Welcome Back
          </h2>
          <p className="text-muted-foreground text-lg">
            Select your portal to continue
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          {/* Admin Portal */}
          <div className="group relative bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.03] to-orange-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-8 flex flex-col items-center text-center">
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-inner">
                <img 
                  src={adminPortalIcon} 
                  alt="Administrator" 
                  className="w-24 h-24 md:w-28 md:h-28 object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1">Administrator</h3>
              <p className="text-sm text-muted-foreground mb-6">Full system access & HR management</p>
              <Button asChild className="w-full h-11 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white shadow-md">
                <Link to="/admin/login" className="flex items-center justify-center gap-2">
                  Access Portal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* SAO Portal */}
          <div className="group relative bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.03] to-indigo-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-8 flex flex-col items-center text-center">
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-inner">
                <img 
                  src={saoPortalIcon} 
                  alt="Site Admin Officer" 
                  className="w-24 h-24 md:w-28 md:h-28 object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1">Site Admin Officer</h3>
              <p className="text-sm text-muted-foreground mb-6">Site operations & worker oversight</p>
              <Button asChild className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600 text-white shadow-md">
                <Link to="/sao/login" className="flex items-center justify-center gap-2">
                  Access Portal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Employee Portal */}
          <div className="group relative bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-cyan-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative p-8 flex flex-col items-center text-center">
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-inner">
                <img 
                  src={employeePortalIcon} 
                  alt="Employee" 
                  className="w-24 h-24 md:w-28 md:h-28 object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1">Employee</h3>
              <p className="text-sm text-muted-foreground mb-6">Self-service attendance & leave</p>
              <Button asChild className="w-full h-11 bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-700 hover:to-cyan-600 text-white shadow-md">
                <Link to="/employee/login" className="flex items-center justify-center gap-2">
                  Access Portal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 TimeTrack Pro — Enterprise Workforce Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
