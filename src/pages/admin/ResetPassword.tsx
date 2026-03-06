import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KeyRound, Loader2, Search, ShieldCheck, Clock, Mail, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

interface ResetLog {
  id: string;
  user_email: string;
  created_at: string;
  notes: string | null;
}

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resetLogs, setResetLogs] = useState<ResetLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('password_reset_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setResetLogs(data as ResetLog[]);
    setLogsLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('password-reset-logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'password_reset_requests' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleReset = async () => {
    if (!email || !newPassword) {
      toast({ title: 'Error', description: 'Please fill in both email and new password.', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('admin-reset-password', {
        body: { email, new_password: newPassword },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: 'Password Reset', description: `Password for ${email} has been reset successfully.` });
      setEmail('');
      setNewPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to reset password.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = resetLogs.filter(log =>
    log.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Reset Password">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Reset Form */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="gradient-primary text-primary-foreground">
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              Reset User Password
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Reset any user's password. The user will use the new password to log in.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                User Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button
              onClick={handleReset}
              disabled={submitting}
              className="w-full gradient-primary h-12 text-lg"
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Resetting...</>
              ) : (
                <><KeyRound className="w-5 h-5 mr-2" /> Reset Password</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Reset History */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Reset History
                </CardTitle>
                <CardDescription>Recent password reset activity</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {logsLoading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No password resets yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>User Email</TableHead>
                    <TableHead>Reset Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.user_email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
