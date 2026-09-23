import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Building2, Plus, Loader2, UserPlus, Power, Users, KeyRound, Mail, Eye, EyeOff, CalendarClock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

interface Organization {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface AdminAccount {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface OrgStats {
  organization_id: string;
  employees: number;
  workers: number;
  admins: number;
  encoders: number;
  total: number;
}

interface BillingRecord {
  id: string;
  organization_id: string;
  period_month: string;
  due_date: string | null;
  is_paid: boolean;
  amount: number | null;
}

const monthKey = (d: Date) => format(d, 'yyyy-MM-01');

const emptyForm = {
  companyName: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function Companies() {
  const { organizationId, isSuperAdmin, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [addAdminFor, setAddAdminFor] = useState<Organization | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewAdminsFor, setViewAdminsFor] = useState<Organization | null>(null);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [resetFor, setResetFor] = useState<AdminAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [stats, setStats] = useState<Record<string, OrgStats>>({});
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [billingFor, setBillingFor] = useState<Organization | null>(null);
  const [billingMonth, setBillingMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [billingDue, setBillingDue] = useState('');
  const [billingPaid, setBillingPaid] = useState(false);
  const [billingAmount, setBillingAmount] = useState('');
  const { toast } = useToast();

  const currentMonth = monthKey(new Date());

  const fetchStats = async () => {
    const { data } = await supabase.functions.invoke('create-company-admin', {
      body: { action: 'org_stats' },
    });
    const list = ((data as any)?.stats || []) as OrgStats[];
    setStats(Object.fromEntries(list.map((s) => [s.organization_id, s])));
  };

  const fetchBilling = async () => {
    const { data } = await supabase
      .from('company_billing')
      .select('id, organization_id, period_month, due_date, is_paid, amount')
      .order('period_month', { ascending: false });
    setBilling((data || []) as BillingRecord[]);
  };

  const billingRecord = (orgId: string, month: string) =>
    billing.find((b) => b.organization_id === orgId && b.period_month === month);

  const openBilling = (org: Organization) => {
    setBillingFor(org);
    const month = format(new Date(), 'yyyy-MM');
    setBillingMonth(month);
    const rec = billingRecord(org.id, `${month}-01`);
    setBillingDue(rec?.due_date || '');
    setBillingPaid(rec?.is_paid || false);
    setBillingAmount(rec?.amount != null ? String(rec.amount) : '');
  };

  const onBillingMonthChange = (month: string) => {
    setBillingMonth(month);
    const rec = billingFor ? billingRecord(billingFor.id, `${month}-01`) : undefined;
    setBillingDue(rec?.due_date || '');
    setBillingPaid(rec?.is_paid || false);
    setBillingAmount(rec?.amount != null ? String(rec.amount) : '');
  };

  const saveBilling = async () => {
    if (!billingFor || !billingMonth) return;
    setSaving(true);
    const { error } = await supabase.from('company_billing').upsert(
      {
        organization_id: billingFor.id,
        period_month: `${billingMonth}-01`,
        due_date: billingDue || null,
        is_paid: billingPaid,
        paid_at: billingPaid ? new Date().toISOString() : null,
        amount: billingAmount ? Number(billingAmount) : null,
      },
      { onConflict: 'organization_id,period_month' },
    );
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to save the billing details', variant: 'destructive' });
      return;
    }
    toast({ title: 'Saved', description: `Billing updated for ${billingFor.name}.` });
    setBillingFor(null);
    fetchBilling();
  };

  const openAdmins = async (org: Organization) => {
    setViewAdminsFor(org);
    setAdmins([]);
    setAdminsLoading(true);
    const { data, error } = await supabase.functions.invoke('create-company-admin', {
      body: { action: 'list_admins', organization_id: org.id },
    });
    setAdminsLoading(false);
    if (error || (data as any)?.error) {
      toast({
        title: 'Error',
        description: (data as any)?.error || error?.message || 'Failed to load admins',
        variant: 'destructive',
      });
      return;
    }
    setAdmins(((data as any)?.admins || []) as AdminAccount[]);
  };

  const resetAdminPassword = async () => {
    if (!resetFor || newPassword.length < 6) {
      toast({
        title: 'Missing details',
        description: 'Enter a new password of at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'The new password and confirm password must be the same.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('create-company-admin', {
      body: { action: 'reset_admin_password', user_id: resetFor.user_id, new_password: newPassword },
    });
    setSaving(false);
    if (error || (data as any)?.error) {
      toast({
        title: 'Error',
        description: (data as any)?.error || error?.message || 'Failed to change the password',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Password changed', description: `New password set for ${resetFor.email}.` });
    setResetFor(null);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, is_active, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load companies', variant: 'destructive' });
    } else {
      setOrganizations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrganizations();
    fetchStats();
    fetchBilling();
  }, []);

  const createCompany = async () => {
    if (!form.companyName || !form.email || form.password.length < 6) {
      toast({
        title: 'Missing details',
        description: 'Company name, email and a password of at least 6 characters are required.',
        variant: 'destructive',
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Password and Confirm Password must be the same.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.functions.invoke('create-company-admin', {
      body: {
        action: 'create_company',
        company_name: form.companyName,
        email: form.email,
        password: form.password,
        first_name: form.firstName,
        last_name: form.lastName,
      },
    });
    setSaving(false);

    if (error || (data as any)?.error) {
      toast({
        title: 'Error',
        description: (data as any)?.error || error?.message || 'Failed to create the company',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Company created', description: `${form.companyName} can now sign in at the admin portal.` });
    setForm(emptyForm);
    setShowCreate(false);
    fetchOrganizations();
    fetchStats();
  };

  const addAdmin = async () => {
    if (!addAdminFor || !form.email || form.password.length < 6) {
      toast({
        title: 'Missing details',
        description: 'Email and a password of at least 6 characters are required.',
        variant: 'destructive',
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Password and Confirm Password must be the same.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.functions.invoke('create-company-admin', {
      body: {
        action: 'add_admin',
        organization_id: addAdminFor.id,
        email: form.email,
        password: form.password,
        first_name: form.firstName,
        last_name: form.lastName,
      },
    });
    setSaving(false);

    if (error || (data as any)?.error) {
      toast({
        title: 'Error',
        description: (data as any)?.error || error?.message || 'Failed to create the admin account',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Admin added', description: `New admin created for ${addAdminFor.name}.` });
    setForm(emptyForm);
    setAddAdminFor(null);
  };

  const toggleActive = async (org: Organization) => {
    const { data, error } = await supabase.functions.invoke('create-company-admin', {
      body: { action: 'set_active', organization_id: org.id, is_active: !org.is_active },
    });

    if (error || (data as any)?.error) {
      toast({
        title: 'Error',
        description: (data as any)?.error || error?.message || 'Failed to update the company',
        variant: 'destructive',
      });
      return;
    }
    fetchOrganizations();
  };

  if (!authLoading && !isSuperAdmin) {
    return (
      <DashboardLayout title="Companies">
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            This section is only available to the system owner.
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Companies">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Create separate companies. Each company has its own admin, staff and records — completely separate from yours.
          </p>
          <Dialog
            open={showCreate}
            onOpenChange={(open) => {
              setShowCreate(open);
              if (!open) setForm(emptyForm);
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                New Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Company</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="e.g. ABC Security Services"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Admin First Name</Label>
                    <Input
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Admin Last Name</Label>
                    <Input
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Admin Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Admin Password</Label>
                  <PasswordInput
                    value={form.password}
                    onChange={(v) => setForm({ ...form, password: v })}
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <PasswordInput
                    value={form.confirmPassword}
                    onChange={(v) => setForm({ ...form, confirmPassword: v })}
                    placeholder="Retype password"
                  />
                </div>
                <Button onClick={createCompany} disabled={saving} className="w-full gradient-primary">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Company
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              All Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Total Users</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>This Month</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">
                        {org.name}
                        {org.id === organizationId && (
                          <Badge className="ml-2 bg-primary/20 text-primary">Your company</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{stats[org.id]?.total ?? '—'}</div>
                        {stats[org.id] && (
                          <p className="text-xs text-muted-foreground">
                            {stats[org.id].employees} staff · {stats[org.id].workers} workers ·{' '}
                            {stats[org.id].admins + stats[org.id].encoders} office
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(org.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge
                          className={org.is_active ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}
                        >
                          {org.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          if (org.id === organizationId) {
                            return <span className="text-muted-foreground text-sm">—</span>;
                          }
                          const rec = billingRecord(org.id, currentMonth);
                          return (
                            <div className="space-y-1">
                              <Badge
                                className={
                                  rec?.is_paid
                                    ? 'bg-success/20 text-success'
                                    : 'bg-destructive/15 text-destructive'
                                }
                              >
                                {rec?.is_paid ? 'Paid' : 'Unpaid'}
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                {rec?.due_date
                                  ? `Due ${format(new Date(`${rec.due_date}T00:00:00`), 'MMM d, yyyy')}`
                                  : 'No due date'}
                              </p>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {org.id !== organizationId && (
                          <Button variant="outline" size="sm" onClick={() => openBilling(org)}>
                            <CalendarClock className="w-4 h-4 mr-1" />
                            Billing
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openAdmins(org)}>
                          <Users className="w-4 h-4 mr-1" />
                          View Admins
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setForm(emptyForm);
                            setAddAdminFor(org);
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add Admin
                        </Button>
                        {org.id !== organizationId && (
                          <Button variant="outline" size="sm" onClick={() => toggleActive(org)}>
                            <Power className="w-4 h-4 mr-1" />
                            {org.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!addAdminFor}
        onOpenChange={(open) => {
          if (!open) {
            setAddAdminFor(null);
            setForm(emptyForm);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Admin — {addAdminFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Password</Label>
              <PasswordInput
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <PasswordInput
                value={form.confirmPassword}
                onChange={(v) => setForm({ ...form, confirmPassword: v })}
                placeholder="Retype password"
              />
            </div>
            <Button onClick={addAdmin} disabled={saving} className="w-full gradient-primary">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Admin Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewAdminsFor}
        onOpenChange={(open) => {
          if (!open) {
            setViewAdminsFor(null);
            setAdmins([]);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admins — {viewAdminsFor?.name}</DialogTitle>
          </DialogHeader>
          {adminsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : admins.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">No admin accounts for this company yet.</p>
          ) : (
            <div className="space-y-3">
              {admins.map((a) => (
                <div
                  key={a.user_id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {[a.first_name, a.last_name].filter(Boolean).join(' ') || 'Admin'}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      {a.email || '—'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setResetFor(a);
                    }}
                  >
                    <KeyRound className="w-4 h-4 mr-1" />
                    New Password
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!resetFor}
        onOpenChange={(open) => {
          if (!open) {
            setResetFor(null);
            setNewPassword('');
            setConfirmNewPassword('');
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Password — {resetFor?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Password</Label>
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <PasswordInput
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
                placeholder="Retype new password"
              />
            </div>
            <Button onClick={resetAdminPassword} disabled={saving} className="w-full gradient-primary">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!billingFor} onOpenChange={(open) => { if (!open) setBillingFor(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Billing — {billingFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Month</Label>
                <Input
                  type="month"
                  value={billingMonth}
                  onChange={(e) => onBillingMonthChange(e.target.value)}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={billingDue} onChange={(e) => setBillingDue(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Amount (optional)</Label>
              <Input
                type="number"
                value={billingAmount}
                onChange={(e) => setBillingAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Marked as paid</p>
                <p className="text-sm text-muted-foreground">Turn on once payment for this month is received.</p>
              </div>
              <Switch checked={billingPaid} onCheckedChange={setBillingPaid} />
            </div>
            <Button onClick={saveBilling} disabled={saving} className="w-full gradient-primary">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Billing
            </Button>

            {billingFor && billing.filter((b) => b.organization_id === billingFor.id).length > 0 && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium">Payment history</p>
                {billing
                  .filter((b) => b.organization_id === billingFor.id)
                  .map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                      <span>{format(new Date(`${b.period_month}T00:00:00`), 'MMMM yyyy')}</span>
                      <span className="text-muted-foreground">
                        {b.due_date ? format(new Date(`${b.due_date}T00:00:00`), 'MMM d') : '—'}
                      </span>
                      <Badge
                        className={b.is_paid ? 'bg-success/20 text-success' : 'bg-destructive/15 text-destructive'}
                      >
                        {b.is_paid ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
