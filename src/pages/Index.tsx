import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  Loader2, 
  ArrowRight,
  Shield,
  MapPin,
  UserCheck,
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

  const portals = [
    {
      title: 'Administrator',
      description: 'Full system access & HR management',
      icon: <Shield className="w-6 h-6" />,
      image: adminPortalIcon,
      link: '/admin/login',
      gradient: 'from-primary to-orange-600',
      glowColor: 'group-hover:shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.4)]',
    },
    {
      title: 'Site Admin Officer',
      description: 'Site operations & worker oversight',
      icon: <MapPin className="w-6 h-6" />,
      image: saoPortalIcon,
      link: '/sao/login',
      gradient: 'from-orange-500 to-amber-500',
      glowColor: 'group-hover:shadow-[0_8px_40px_-8px_hsl(var(--primary)/0.35)]',
    },
    {
      title: 'Employee',
      description: 'Self-service attendance & leave',
      icon: <UserCheck className="w-6 h-6" />,
      image: employeePortalIcon,
      link: '/employee/login',
      gradient: 'from-amber-500 to-yellow-500',
      glowColor: 'group-hover:shadow-[0_8px_40px_-8px_hsl(38_92%_50%/0.35)]',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col portal-zoom">
      {/* Decorative blurs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-warning/15 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-primary/10 rounded-full blur-[80px]" />
      </div>

      {/* Hero Section */}
      <section className="relative flex-1 container mx-auto px-4 py-16 flex flex-col justify-center">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="p-3 rounded-2xl gradient-primary shadow-glow">
              <Clock className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">TimeTrack Pro</h1>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Enterprise Workforce Management</p>
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground tracking-tight">
            Welcome Back
          </h2>
          <p className="text-muted-foreground text-lg">
            Select your portal to continue
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
          {portals.map((portal) => (
            <div
              key={portal.title}
              className={`group relative glass-card rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 ${portal.glowColor}`}
            >
              {/* Top accent bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${portal.gradient}`} />
              
              <div className="relative p-8 flex flex-col items-center text-center">
                {/* Icon background */}
                <div className="mb-6 relative">
                  <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl scale-110" />
                  <div className="relative p-4 rounded-2xl bg-card/80 backdrop-blur-md border border-border/50 shadow-soft">
                    <img 
                      src={portal.image} 
                      alt={portal.title} 
                      className="w-24 h-24 md:w-28 md:h-28 object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>

                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3`}>
                  {portal.icon}
                  <span className="uppercase tracking-wider">{portal.title}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-8">{portal.description}</p>

                <Button 
                  asChild 
                  className={`w-full h-12 bg-gradient-to-r ${portal.gradient} text-primary-foreground shadow-lg hover:shadow-xl hover:opacity-95 transition-all duration-300 rounded-xl font-semibold`}
                >
                  <Link to={portal.link} className="flex items-center justify-center gap-2">
                    Access Portal
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/50 bg-card/30 backdrop-blur-xl py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 TimeTrack Pro — Enterprise Workforce Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
