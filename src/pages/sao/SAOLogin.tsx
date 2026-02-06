import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Clock, Loader2, Lock, Mail, MapPin, Calendar, FileText, Building2, ShieldCheck } from 'lucide-react';
import { z } from 'zod';

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
      {/* Left Panel - SAO Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-violet-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/50 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Site Admin Officer</h1>
                <p className="text-sm text-white/60">TimeTrack Pro</p>
              </div>
            </div>
            <p className="text-xl text-white/80 max-w-md">
              Manage site operations, track your attendance, and oversee daily activities from one central hub.
            </p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Clock className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold">Clock In/Out</h3>
                <p className="text-sm text-white/60 mt-1">Time tracking with selfie verification for secure attendance</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <FileText className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold">View Timesheets</h3>
                <p className="text-sm text-white/60 mt-1">Access your work hours, overtime, and earnings history</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Leave Requests</h3>
                <p className="text-sm text-white/60 mt-1">Submit and track your leave applications easily</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="p-2 rounded-lg bg-fuchsia-500/20">
                <MapPin className="w-6 h-6 text-fuchsia-400" />
              </div>
              <div>
                <h3 className="font-semibold">Site Management</h3>
                <p className="text-sm text-white/60 mt-1">Oversee site operations and attendance compliance</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-violet-400" />
              <span className="font-semibold text-violet-300">Site Administration</span>
            </div>
            <p className="text-sm text-white/60">
              Your credentials were provided by your administrator. Contact HR if you have any login issues.
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Site Admin Officer</h1>
                <p className="text-sm text-muted-foreground">TimeTrack Pro</p>
              </div>
            </div>
          </div>
          
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">SAO Login</CardTitle>
              <CardDescription>
                Sign in with your site officer credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-base font-medium" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Sign In to Portal
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground text-center">
                  Don't have an account? Your administrator will create one for you.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link to="/admin/login" className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center hover:bg-red-500/20 transition-colors">
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">Admin Login</span>
                </Link>
                <Link to="/employee/login" className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center hover:bg-emerald-500/20 transition-colors">
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Employee Login</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2">
              <Building2 className="w-4 h-4" />
              Back to Portal Selection
            </Link>
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            © 2025 TimeTrack Pro. Enterprise Attendance System.
          </p>
        </div>
      </div>
    </div>
  );
}
