import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar,
  Loader2,
  Save,
  Camera,
  Key,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: user?.email || '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user.email || '',
        });
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    }
    setLoading(false);
  };

  const getInitials = () => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'AD';
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header Card */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="h-32 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
          <CardContent className="relative pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-background shadow-2xl">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-2 right-2 p-2 rounded-full bg-primary text-primary-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center sm:text-left flex-1 space-y-2">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <h2 className="text-2xl font-bold text-foreground">
                    {profile.first_name && profile.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : 'Administrator'}
                  </h2>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
                  <Calendar className="w-4 h-4" />
                  Member since {user?.created_at ? format(new Date(user.created_at), 'MMMM yyyy') : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                    placeholder="Enter first name"
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                    placeholder="Enter last name"
                    className="bg-muted/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed from here
                </p>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="w-full gradient-primary shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Key className="w-5 h-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-success/10">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-success">Account Secured</p>
                    <p className="text-sm text-muted-foreground">Your account is protected</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">Last changed: Never</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Two-Factor Auth</p>
                    <p className="text-sm text-muted-foreground">Not enabled</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Info */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Account ID</p>
                <p className="font-mono text-sm truncate">{user?.id}</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Role</p>
                <Badge className="gradient-primary text-primary-foreground">Administrator</Badge>
              </div>
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
