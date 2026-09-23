import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Keyboard, Lock, Mail } from 'lucide-react';
import loginImage from '@/assets/modellogin1.png';
import tmcLogo from '/TMClog0s.png';

export default function EncoderLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    } else {
      toast({ title: 'Welcome Back!', description: 'Redirecting to Encoder Portal...' });
      setTimeout(() => navigate('/encoder'), 500);
    }
  };

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
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">TimeTrack Pro</p>
              <p className="text-xs text-white/60">Encoder Portal</p>
            </div>
          </div>

          {/* Bottom messaging */}
          <div className="max-w-md space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium">
              <Keyboard className="w-3.5 h-3.5" />
              Records Management
            </div>
            <h2 className="text-3xl font-bold leading-tight">
              Manage worker & employee records
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Sign in to enter and update attendance, payroll, and personnel
              records. Your credentials were provided by your administrator —
              contact them if you have any login issues.
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
              Encoder Portal
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Sign in to manage worker & employee records.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="encoder@company.com"
                  className="h-11 pl-10 bg-background"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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
                'Sign In'
              )}
            </Button>
          </form>

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