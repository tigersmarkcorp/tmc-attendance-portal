import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone, Briefcase, Building2, MapPin, Calendar, User2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  employee_id: string;
  photo_url: string | null;
  status: string;
  hire_date: string;
  city_address: string | null;
  civil_status: string | null;
  sex: string | null;
}

interface ProfileCardProps {
  employeeId: string;
  role?: 'employee' | 'sao';
}

export function ProfileCard({ employeeId, role = 'employee' }: ProfileCardProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('employees')
      .select('first_name, last_name, email, phone, department, position, employee_id, photo_url, status, hire_date, city_address, civil_status, sex')
      .eq('id', employeeId)
      .maybeSingle();
    if (data) setProfile(data as ProfileData);
    setLoading(false);
  };

  useEffect(() => {
    if (!employeeId) return;
    fetchProfile();

    const channel = supabase
      .channel(`profile-card-${employeeId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'employees',
        filter: `id=eq.${employeeId}`,
      }, () => { fetchProfile(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [employeeId]);

  if (loading) {
    return (
      <Card className="border-primary/10">
        <CardContent className="p-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  const initials = `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
  const fullName = `${profile.first_name} ${profile.last_name}`;
  const hireFormatted = profile.hire_date && !isNaN(new Date(profile.hire_date).getTime())
    ? format(new Date(profile.hire_date), 'MMM d, yyyy')
    : null;

  return (
    <Card className="overflow-hidden border-primary/10 shadow-xl hover:shadow-2xl transition-shadow duration-500 relative">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.02] pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.04] rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />

      {/* Top accent bar with glow */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/30 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary/30 blur-sm" />
      </div>

      <CardContent className="p-0 relative">
        <div className="flex flex-col sm:flex-row min-h-[180px]">
          {/* Left: Info section */}
          <div className="flex-1 p-6 order-2 sm:order-1">
            {/* Name & Role */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                {role === 'sao' && (
                  <Badge className="text-[9px] px-2 py-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 shadow-sm">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                    SAO
                  </Badge>
                )}
              </div>
              <h3 className="text-xl font-bold capitalize tracking-tight">{fullName}</h3>
              {profile.position && (
                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                  {profile.position}
                  {profile.department ? <span className="text-muted-foreground/60"> — {profile.department}</span> : ''}
                </p>
              )}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <Badge variant="outline" className="text-[10px] font-mono px-2.5 py-0.5 border-primary/25 bg-primary/[0.04]">
                {profile.employee_id}
              </Badge>
              <div className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                profile.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                  : profile.status === 'on_leave'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20'
                    : 'bg-muted text-muted-foreground ring-1 ring-border'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  profile.status === 'active' ? 'bg-emerald-500 animate-pulse' : profile.status === 'on_leave' ? 'bg-amber-500' : 'bg-muted-foreground'
                }`} />
                {profile.status}
              </div>
            </div>

            {/* Info grid with refined styling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
              <InfoItem icon={Mail} label="Email" value={profile.email} />
              <InfoItem icon={Phone} label="Phone" value={profile.phone} />
              <InfoItem icon={Building2} label="Department" value={profile.department} />
              <InfoItem icon={Calendar} label="Hired" value={hireFormatted} />
              <InfoItem icon={MapPin} label="Address" value={profile.city_address} />
              <InfoItem icon={User2} label="Sex" value={profile.sex} />
            </div>
          </div>

          {/* Subtle divider */}
          <div className="hidden sm:flex items-center order-2">
            <div className="w-px h-3/4 bg-gradient-to-b from-transparent via-border/60 to-transparent" />
          </div>

          {/* Right: Large Avatar */}
          <div className="sm:w-60 shrink-0 p-5 flex items-center justify-center order-1 sm:order-3">
            <div className="w-full aspect-square max-w-[210px] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-primary/10 relative group">
              {/* Glow effect behind avatar */}
              <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={fullName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/15 to-primary/5">
                    <span className="text-7xl font-black text-primary/30 select-none">{initials}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 group/item">
      <div className="mt-0.5 p-1.5 rounded-lg bg-primary/8 group-hover/item:bg-primary/12 transition-all duration-300 ring-1 ring-primary/5">
        <Icon className="w-3.5 h-3.5 text-primary/70" />
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-[10px] text-muted-foreground/70 leading-none mb-0.5 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-xs font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
