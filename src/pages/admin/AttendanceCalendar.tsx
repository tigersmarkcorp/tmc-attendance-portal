import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Users, Clock, Loader2 } from 'lucide-react';

interface DayAttendance {
  date: string;
  employees: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
    clock_in: string | null;
    clock_out: string | null;
    total_hours: number;
  }[];
}

export default function AttendanceCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [monthData, setMonthData] = useState<Map<string, number>>(new Map());
  const [dayDetails, setDayDetails] = useState<DayAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchMonthData();
  }, [selectedDate]);

  useEffect(() => {
    fetchDayDetails(selectedDate);
  }, [selectedDate]);

  const fetchMonthData = async () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    const { data } = await supabase
      .from('timesheets')
      .select('date, employee_id')
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'));

    if (data) {
      const countMap = new Map<string, number>();
      data.forEach((entry) => {
        const current = countMap.get(entry.date) || 0;
        countMap.set(entry.date, current + 1);
      });
      setMonthData(countMap);
    }
    setLoading(false);
  };

  const fetchDayDetails = async (date: Date) => {
    setLoadingDetails(true);
    const dateStr = format(date, 'yyyy-MM-dd');

    const { data: timesheets } = await supabase
      .from('timesheets')
      .select(`
        clock_in_time,
        clock_out_time,
        total_work_minutes,
        employees (
          id,
          first_name,
          last_name,
          photo_url
        )
      `)
      .eq('date', dateStr);

    if (timesheets && timesheets.length > 0) {
      setDayDetails({
        date: dateStr,
        employees: timesheets.map((ts: any) => ({
          id: ts.employees.id,
          first_name: ts.employees.first_name,
          last_name: ts.employees.last_name,
          photo_url: ts.employees.photo_url,
          clock_in: ts.clock_in_time,
          clock_out: ts.clock_out_time,
          total_hours: Math.round((ts.total_work_minutes / 60) * 10) / 10,
        })),
      });
    } else {
      setDayDetails({ date: dateStr, employees: [] });
    }
    setLoadingDetails(false);
  };

  const modifiers = {
    hasAttendance: (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return monthData.has(dateStr);
    },
  };

  const modifiersStyles = {
    hasAttendance: {
      backgroundColor: 'hsl(var(--primary) / 0.1)',
      color: 'hsl(var(--primary))',
      fontWeight: '600',
    },
  };

  return (
    <DashboardLayout title="Attendance Calendar">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-md border"
              />
            )}
          </CardContent>
        </Card>

        {/* Day Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDetails ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !dayDetails || dayDetails.employees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No attendance records for this day</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Badge variant="secondary" className="mb-4">
                  {dayDetails.employees.length} employee{dayDetails.employees.length !== 1 ? 's' : ''} worked
                </Badge>
                {dayDetails.employees.map((emp) => (
                  <div
                    key={emp.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Avatar>
                      <AvatarImage src={emp.photo_url || ''} />
                      <AvatarFallback className="gradient-primary text-primary-foreground">
                        {emp.first_name[0]}
                        {emp.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {emp.first_name} {emp.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {emp.clock_in && (
                          <span>{format(new Date(emp.clock_in), 'HH:mm')}</span>
                        )}
                        {emp.clock_in && emp.clock_out && <span>-</span>}
                        {emp.clock_out && (
                          <span>{format(new Date(emp.clock_out), 'HH:mm')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{emp.total_hours}h</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
