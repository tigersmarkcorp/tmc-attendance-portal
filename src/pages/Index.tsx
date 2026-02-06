import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Loader2, 
  ArrowRight,
  Shield,
  Users,
  UserCheck,
  Building2,
  Lock,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Database,
  FileText,
  MapPin,
  CalendarCheck,
  UserCog
} from 'lucide-react';
import adminPortalIcon from '@/assets/Frontadmin.png';
import saoPortalIcon from '@/assets/FrontSite.png';
import employeePortalIcon from '@/assets/FrontEmployeet.png';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping"></div>
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse delay-700"></div>
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 relative" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Establishing secure enterprise session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Enterprise Header */}
     

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-14 flex flex-col justify-center">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">NEW ENTERPRISE INTERFACE • v3.2</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-900 dark:text-white tracking-tight">
              Unified Workspace Access Portal
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Securely access your role-specific environment with enterprise-grade governance and compliance controls
            </p>
          </div>

          {/* Portal Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
            {/* Admin Portal - With Hover Effects */}
            <div className="group flex flex-col bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
              {/* Security Header */}
              <div className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-blue-800 dark:text-blue-200">SYSTEM ADMINISTRATOR</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-xs font-medium px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="w-3 h-3" />
                    L4 ACCESS
                  </div>
                </div>
              </div>
              
              {/* HERO IMAGE WITH HOVER EFFECTS */}
              <div className="relative w-full min-h-[208px] overflow-hidden border-b border-slate-200 dark:border-slate-700 rounded-t-none">
                <img 
                  src={adminPortalIcon} 
                  alt="System Administrator Workspace" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/85 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-70"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 backdrop-blur-sm border border-blue-300/50 transform transition-all duration-300 group-hover:translate-y-[-2px] group-hover:bg-blue-500/30">
                    <Shield className="w-4 h-4 text-blue-300 group-hover:text-white transition-colors duration-300" />
                    <span className="text-white text-lg font-bold transition-colors duration-300 group-hover:text-blue-100">Global System Control</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex flex-col flex-1">
                <div className="text-center mb-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Enterprise-wide governance, security policy enforcement, and organizational oversight
                  </p>
                </div>

                {/* Feature Grid with Hover */}
                <div className="grid grid-cols-1 gap-3 mb-7 flex-1">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors duration-200">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg transform transition-transform duration-300 group-hover:scale-110">
                      <UserCog className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">User & Permission Management</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Global directory administration</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors duration-200">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg transform transition-transform duration-300 group-hover:scale-110">
                      <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">System Analytics Dashboard</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time operational intelligence</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900 hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors duration-200">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg transform transition-transform duration-300 group-hover:scale-110">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Compliance Reporting</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Audit-ready documentation</p>
                    </div>
                  </div>
                </div>

                {/* Action Button with Enhanced Hover */}
                <Button asChild className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-blue-500/25 transition-all duration-300 text-sm font-semibold mt-auto relative overflow-hidden">
                  <Link to="/admin/login" className="flex items-center justify-center gap-2.5">
                    <span>Access Administrator Portal</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </Button>
              </div>
            </div>

            {/* SAO Portal - With Hover Effects */}
            <div className="group flex flex-col bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
              <div className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">SITE ADMIN OFFICER</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="w-3 h-3" />
                    L3 ACCESS
                  </div>
                </div>
              </div>
              
              {/* HERO IMAGE WITH HOVER EFFECTS */}
              <div className="relative w-full min-h-[208px] overflow-hidden border-b border-slate-200 dark:border-slate-700 rounded-t-none">
                <img 
                  src={saoPortalIcon} 
                  alt="Site Operations Workspace" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/85 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-70"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-300/50 transform transition-all duration-300 group-hover:translate-y-[-2px] group-hover:bg-emerald-500/30">
                    <MapPin className="w-4 h-4 text-emerald-300 group-hover:text-white transition-colors duration-300" />
                    <span className="text-white text-lg font-bold transition-colors duration-300 group-hover:text-emerald-100">Site Operations Hub</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="text-center mb-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Multi-site management, workforce coordination, and field compliance oversight
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-7 flex-1">
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 transition-colors duration-200">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg transform transition-transform duration-300 group-hover:scale-110">
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Multi-Site Dashboard</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time location monitoring</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 transition-colors duration-200">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg transform transition-transform duration-300 group-hover:scale-110">
                      <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Workforce Allocation</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Resource optimization tools</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 transition-colors duration-200">
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg transform transition-transform duration-300 group-hover:scale-110">
                      <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Compliance Auditing</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Field operation verification</p>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-500/25 transition-all duration-300 text-sm font-semibold mt-auto relative overflow-hidden">
                  <Link to="/sao/login" className="flex items-center justify-center gap-2.5">
                    <span>Access Site Operations Portal</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Employee Portal - With Hover Effects */}
            <div className="group flex flex-col bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1">
              <div className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <UserCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="text-xs font-medium text-violet-800 dark:text-violet-200">EMPLOYEE SELF-SERVICE</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-medium px-2 py-0.5 rounded border border-violet-200 dark:border-violet-800">
                    <CheckCircle className="w-3 h-3" />
                    L2 ACCESS
                  </div>
                </div>
              </div>
              
              {/* HERO IMAGE WITH HOVER EFFECTS */}
              <div className="relative w-full min-h-[208px] overflow-hidden border-b border-slate-200 dark:border-slate-700 rounded-t-none">
                <img 
                  src={employeePortalIcon} 
                  alt="Employee Workspace" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-violet-900/85 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-70"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 backdrop-blur-sm border border-violet-300/50 transform transition-all duration-300 group-hover:translate-y-[-2px] group-hover:bg-violet-500/30">
                    <UserCheck className="w-4 h-4 text-violet-300 group-hover:text-white transition-colors duration-300" />
                    <span className="text-white text-lg font-bold transition-colors duration-300 group-hover:text-violet-100">Personal Workspace</span>
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="text-center mb-6">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Attendance management, leave requests, and personal records access
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-7 flex-1">
                  <div className="flex items-start gap-3 p-3 bg-violet-50 dark:bg-violet-900/10 rounded-lg border border-violet-100 dark:border-violet-900 hover:bg-violet-100/50 dark:hover:bg-violet-900/20 transition-colors duration-200">
                    <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg transform transition-transform duration-300 group-hover:scale-110">
                      <CalendarCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Attendance Tracking</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Biometric & mobile check-in</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-violet-50 dark:bg-violet-900/10 rounded-lg border border-violet-100 dark:border-violet-900 hover:bg-violet-100/50 dark:hover:bg-violet-900/20 transition-colors duration-200">
                    <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg transform transition-transform duration-300 group-hover:scale-110">
                      <FileText className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Leave Management</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Digital request workflow</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-violet-50 dark:bg-violet-900/10 rounded-lg border border-violet-100 dark:border-violet-900 hover:bg-violet-100/50 dark:hover:bg-violet-900/20 transition-colors duration-200">
                    <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg transform transition-transform duration-300 group-hover:scale-110">
                      <Database className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Personal Document Vault</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Secure record storage</p>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white shadow-md hover:shadow-violet-500/25 transition-all duration-300 text-sm font-semibold mt-auto relative overflow-hidden">
                  <Link to="/employee/login" className="flex items-center justify-center gap-2.5">
                    <span>Access Employee Portal</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

       
        </section>

       
      </div>
    </div>
  );
}
