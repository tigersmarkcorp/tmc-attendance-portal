import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Mail, Calendar, Loader2, Key, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

export default function SAOProfile() {
  const { user, employeeId } = useAuth();
  const { toast } = useToast();
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profile, setProfile] = useState({ first_name: '', last_name: '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!employeeId) return;
      const { data } = await supabase.from('employees').select('first_name, last_name, email').eq('id', employeeId).maybeSingle();
      if (data) {
        setProfile({ first_name: data.first_name || '', last_name: data.last_name || '', email: data.email || user?.email || '' });
      }
    };
    fetchProfile();
  }, [employeeId, user]);

  const handleChangePassword = async () => {
    if (passwords.newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Password changed successfully' });
      setPasswords({ newPassword: '', confirmPassword: '' });
    }
    setPasswordLoading(false);
  };

  const getInitials = () => {
    if (profile.first_name && profile.last_name) return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    return user?.email?.substring(0, 2).toUpperCase() || 'SO';
  };

  return (
    <DashboardLayout title="My Profile" portalType="sao">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="h-32 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
          <CardContent className="relative pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16">
              <Avatar className="w-32 h-32 border-4 border-background shadow-2xl">
                <AvatarImage src="" />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left flex-1 space-y-2">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <h2 className="text-2xl font-bold text-foreground">
                    {profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : 'Site Officer'}
                  </h2>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <ShieldCheck className="w-3 h-3 mr-1" />SAO
                  </Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
                  <Mail className="w-4 h-4" />{user?.email}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
                  <Calendar className="w-4 h-4" />
                  Member since {user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg"><Key className="w-5 h-5 text-primary" />Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input id="newPassword" type={showPassword ? 'text' : 'password'} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} placeholder="Enter new password" className="bg-muted/50 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} placeholder="Confirm new password" className="bg-muted/50 pr-10" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleChangePassword} disabled={passwordLoading || !passwords.newPassword} className="w-full gradient-primary shadow-lg">
              {passwordLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
