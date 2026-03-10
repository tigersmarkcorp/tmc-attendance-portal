import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyTimeDisplay } from '@/components/admin/DailyTimeDisplay';
import {
  Clock, User, MapPin, Briefcase, Shield, Heart, GraduationCap, Users, Loader2, Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth';
import { getPhilippineTodayStart, getPhilippineTodayEnd, formatPHTime } from '@/lib/philippineTime';

interface EmployeeInfo {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  hourly_rate: number;
  hire_date: string;
  date_of_birth: string | null;
  sex: string | null;
  civil_status: string | null;
  citizenship: string | null;
  religion: string | null;
  height: string | null;
  weight: string | null;
  city_address: string | null;
  provincial_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_address: string | null;
  spouse_name: string | null;
  spouse_occupation: string | null;
  father_name: string | null;
  mother_name: string | null;
  elementary_school: string | null;
  elementary_year: string | null;
  highschool_school: string | null;
  highschool_year: string | null;
  college_school: string | null;
  college_year: string | null;
  degree_received: string | null;
  special_skills: string | null;
  languages: string | null;
  employee_id: string;
}

interface TimeEntry {
  id: string;
  entry_type: string;
  timestamp: string;
}

interface PersonalInfoTabsProps {
  entityType?: 'employee' | 'sao';
}

const entryTypeLabels: Record<string, string> = {
  clock_in: '🟢 Clock In',
  break_start: '🟡 Break Start',
  break_end: '🔵 Break End',
  clock_out: '🔴 Clock Out',
};

const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-border/30 last:border-0 group/row hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors">
    <span className="text-[11px] text-muted-foreground/80 font-medium">{label}</span>
    <span className="text-[11px] font-semibold text-foreground text-right max-w-[60%] truncate">{value || '—'}</span>
  </div>
);

export function PersonalInfoTabs({ entityType = 'employee' }: PersonalInfoTabsProps) {
  const { employeeId } = useAuth();
  const [info, setInfo] = useState<EmployeeInfo | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;
    fetchData();

    const channel = supabase
      .channel(`info-tabs-${employeeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, () => {
        fetchTodayEntries();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'employees', filter: `id=eq.${employeeId}` }, () => {
        fetchInfo();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [employeeId]);

  const fetchData = async () => {
    await Promise.all([fetchInfo(), fetchTodayEntries()]);
    setLoading(false);
  };

  const fetchInfo = async () => {
    if (!employeeId) return;
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .maybeSingle();
    if (data) setInfo(data as EmployeeInfo);
  };

  const fetchTodayEntries = async () => {
    if (!employeeId) return;
    const { data } = await supabase
      .from('time_entries')
      .select('id, entry_type, timestamp')
      .eq('employee_id', employeeId)
      .gte('timestamp', getPhilippineTodayStart())
      .lte('timestamp', getPhilippineTodayEnd())
      .order('timestamp', { ascending: true });
    if (data) setTodayEntries(data);
  };

  if (loading) {
    return (
      <Card className="border-primary/10">
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!info || !employeeId) return null;

  return (
    <div className="space-y-4">
      {/* Today's Time Card - Enhanced */}
      <Card className="border-primary/15 overflow-hidden relative shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.03] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
        
        <CardHeader className="pb-2 relative">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 ring-1 ring-primary/10">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold tracking-tight">Today's Work Time</span>
            <span className="ml-auto text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">Live</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5 relative">
          <div className="flex items-center justify-center py-4">
            <DailyTimeDisplay entityType="employee" entityId={employeeId} showLabel />
          </div>
          {todayEntries.length > 0 && (
            <div className="mt-3 space-y-1.5 border-t border-border/40 pt-4">
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.15em] mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Today's Timeline
              </p>
              {todayEntries.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center text-xs py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors -mx-2">
                  <span className="font-medium">{entryTypeLabels[entry.entry_type] || entry.entry_type}</span>
                  <span className="font-mono text-muted-foreground text-[11px] bg-muted/50 px-2 py-0.5 rounded-md">
                    {formatPHTime(new Date(entry.timestamp))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabbed Info Card - Enhanced */}
      <Card className="border-primary/10 shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <CardContent className="p-5">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="w-full grid grid-cols-4 h-auto gap-1.5 bg-muted/40 p-1.5 rounded-xl">
              <TabsTrigger value="personal" className="text-[10px] px-1.5 py-2 rounded-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
                <User className="w-3.5 h-3.5 mr-1" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="work" className="text-[10px] px-1.5 py-2 rounded-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
                <Briefcase className="w-3.5 h-3.5 mr-1" />
                Work
              </TabsTrigger>
              <TabsTrigger value="family" className="text-[10px] px-1.5 py-2 rounded-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
                <Heart className="w-3.5 h-3.5 mr-1" />
                Family
              </TabsTrigger>
              <TabsTrigger value="education" className="text-[10px] px-1.5 py-2 rounded-lg font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
                <GraduationCap className="w-3.5 h-3.5 mr-1" />
                Education
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-4 space-y-0">
              <InfoRow label="Employee ID" value={info.employee_id} />
              <InfoRow label="Full Name" value={`${info.first_name} ${info.last_name}`} />
              <InfoRow label="Email" value={info.email} />
              <InfoRow label="Phone" value={info.phone} />
              <InfoRow label="Date of Birth" value={info.date_of_birth ? format(new Date(info.date_of_birth), 'MMM d, yyyy') : null} />
              <InfoRow label="Sex" value={info.sex} />
              <InfoRow label="Civil Status" value={info.civil_status} />
              <InfoRow label="Citizenship" value={info.citizenship} />
              <InfoRow label="Religion" value={info.religion} />
              <InfoRow label="Height" value={info.height} />
              <InfoRow label="Weight" value={info.weight} />
              <div className="pt-3 mt-3 border-t border-border/40">
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-primary/60" />
                  Address
                </p>
                <InfoRow label="City Address" value={info.city_address} />
                <InfoRow label="Provincial Address" value={info.provincial_address} />
              </div>
            </TabsContent>

            <TabsContent value="work" className="mt-4 space-y-0">
              <InfoRow label="Department" value={info.department} />
              <InfoRow label="Position" value={info.position} />
              <InfoRow label="Hourly Rate" value={`₱${info.hourly_rate.toFixed(2)}`} />
              <InfoRow label="Hire Date" value={info.hire_date && !isNaN(new Date(info.hire_date).getTime()) ? format(new Date(info.hire_date), 'MMM d, yyyy') : '—'} />
              <div className="pt-3 mt-3 border-t border-border/40">
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-destructive/60" />
                  Emergency Contact
                </p>
                <InfoRow label="Name" value={info.emergency_contact_name} />
                <InfoRow label="Phone" value={info.emergency_contact_phone} />
                <InfoRow label="Address" value={info.emergency_contact_address} />
              </div>
            </TabsContent>

            <TabsContent value="family" className="mt-4 space-y-0">
              <InfoRow label="Spouse" value={info.spouse_name} />
              <InfoRow label="Spouse Occupation" value={info.spouse_occupation} />
              <InfoRow label="Father" value={info.father_name} />
              <InfoRow label="Mother" value={info.mother_name} />
            </TabsContent>

            <TabsContent value="education" className="mt-4 space-y-0">
              <InfoRow label="Elementary" value={info.elementary_school} />
              <InfoRow label="Year" value={info.elementary_year} />
              <InfoRow label="High School" value={info.highschool_school} />
              <InfoRow label="Year" value={info.highschool_year} />
              <InfoRow label="College" value={info.college_school} />
              <InfoRow label="Year" value={info.college_year} />
              <InfoRow label="Degree" value={info.degree_received} />
              <div className="pt-3 mt-3 border-t border-border/40">
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-primary/60" />
                  Skills & Languages
                </p>
                <InfoRow label="Special Skills" value={info.special_skills} />
                <InfoRow label="Languages" value={info.languages} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
