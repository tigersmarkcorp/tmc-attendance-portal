import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, Loader2, Lock, Mail, MapPin, Calendar, FileText, ShieldCheck } from 'lucide-react';
import { z } from 'zod';
import loginImage from '@/assets/modellogin1.png';
import tmcLogo from '/TMClog0s.png';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function SAOLogin() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === 'site_admin_officer') {
        navigate('/sao');
      } else if (role === 'admin') {
        toast({
          title: 'Admin Account Detected',
          description: 'Redirecting to admin dashboard.',
        });
        navigate('/admin');
      } else if (role === 'employee') {
        toast({
          title: 'Employee Account Detected',
          description: 'Redirecting to employee dashboard.',
        });
        navigate('/employee');
      }
    }
  }, [user, role, authLoading, navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      loginSchema.parse({ email: email.trim(), password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation Error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message === 'Invalid login credentials'
          ? 'Invalid email or password. Please contact your administrator if you need help.'
          : error.message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Full Bleed Image */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${loginImage})` }}
      >
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/60" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
          {/* Top brand mark */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">TimeTrack Pro</p>
              <p className="text-xs text-white/60">Site Admin Officer</p>
            </div>
          </div>

          {/* Bottom messaging */}
          <div className="max-w-md space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Site Administration
            </div>
            <h2 className="text-3xl font-bold leading-tight">
              Manage site operations from one hub
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Clock in and out, view timesheets, submit leave requests, and
              oversee site attendance compliance. Your credentials were
              provided by your administrator — contact HR if you have any
              login issues.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8 bg-background">
        <div className="w-full max-w-sm text-center">
          {/* Header */}
          <div className="mb-6 flex flex-col items-center">
            <img
              src={tmcLogo}
              alt="TMC Logo"
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain mb-3"
            />
            <h1 className="text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground">
              SAO Login
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Sign in with your site officer credentials.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 pl-10 bg-background"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pl-10 bg-background"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-sm font-medium mt-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In to Portal'
              )}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-5">
            Don't have an account? Your administrator will create one for you.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex items-center justify-center gap-4 text-sm">
            <Link to="/admin/login" className="text-foreground font-medium hover:underline">
              Admin Login
            </Link>
            <span className="text-border">|</span>
            <Link to="/employee/login" className="text-foreground font-medium hover:underline">
              Employee Login
            </Link>
          </div>

          <div className="mt-5 pt-4 border-t flex items-center justify-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              Back to Portal Selection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}