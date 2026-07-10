import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyTimeDisplay } from '@/components/admin/DailyTimeDisplay';
import {
  User, Mail, Phone, MapPin, Briefcase, Shield, Heart, GraduationCap,
  Clock, Users, Loader2
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

export function SAODailyInfo() {
  const { employeeId } = useAuth();
  const [info, setInfo] = useState<EmployeeInfo | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;
    fetchData();

    const channel = supabase
      .channel(`sao-daily-${employeeId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries' }, () => {
        fetchTodayEntries();
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
      <Card>
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!info || !employeeId) return null;

  const entryTypeLabels: Record<string, string> = {
    clock_in: '🟢 Clock In',
    break_start: '🟡 Break Start',
    break_end: '🔵 Break End',
    clock_out: '🔴 Clock Out',
  };

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="flex justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value || '—'}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Real-Time Daily Time */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Today's Work Time (Live)
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center justify-center py-3">
            <DailyTimeDisplay entityType="employee" entityId={employeeId} showLabel />
          </div>
          {todayEntries.length > 0 && (
            <div className="mt-3 space-y-1 border-t border-border pt-3">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Today's Timeline</p>
              {todayEntries.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center text-xs">
                  <span>{entryTypeLabels[entry.entry_type] || entry.entry_type}</span>
                  <span className="font-mono text-muted-foreground">
                    {formatPHTime(new Date(entry.timestamp))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <InfoRow label="Employee ID" value={info.employee_id} />
          <InfoRow label="Full Name" value={`${info.first_name} ${info.last_name}`} />
          <InfoRow label="Email" value={info.email} />
          <InfoRow label="Phone" value={info.phone} />
          <InfoRow label="Date of Birth" value={info.date_of_birth ? format(new Date(info.date_of_birth), 'MMM d, yyyy') : null} />
          <InfoRow label="Sex" value={info.sex} />
          <InfoRow label="Civil Status" value={info.civil_status} />
          <InfoRow label="Citizenship" value={info.citizenship} />
          <InfoRow label="Religion" value={info.religion} />
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <InfoRow label="City Address" value={info.city_address} />
          <InfoRow label="Provincial Address" value={info.provincial_address} />
        </CardContent>
      </Card>

      {/* Employment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            Employment
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <InfoRow label="Department" value={info.department} />
          <InfoRow label="Position" value={info.position} />
          <InfoRow label="Hourly Rate" value={`₱${info.hourly_rate.toFixed(2)}`} />
          <InfoRow label="Hire Date" value={format(new Date(info.hire_date), 'MMM d, yyyy')} />
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-destructive" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <InfoRow label="Name" value={info.emergency_contact_name} />
          <InfoRow label="Phone" value={info.emergency_contact_phone} />
          <InfoRow label="Address" value={info.emergency_contact_address} />
        </CardContent>
      </Card>

      {/* Family */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" />
            Family
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <InfoRow label="Spouse" value={info.spouse_name} />
          <InfoRow label="Spouse Occupation" value={info.spouse_occupation} />
          <InfoRow label="Father" value={info.father_name} />
          <InfoRow label="Mother" value={info.mother_name} />
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Education
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <InfoRow label="Elementary" value={info.elementary_school} />
          <InfoRow label="High School" value={info.highschool_school} />
          <InfoRow label="College" value={info.college_school} />
          <InfoRow label="Degree" value={info.degree_received} />
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Skills & Languages
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <InfoRow label="Special Skills" value={info.special_skills} />
          <InfoRow label="Languages" value={info.languages} />
        </CardContent>
      </Card>
    </div>
  );
}