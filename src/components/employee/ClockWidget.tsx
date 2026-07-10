import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Clock, Coffee, LogIn, LogOut, Loader2 } from 'lucide-react';
import { AutoCaptureCamera } from '@/components/camera/AutoCaptureCamera';
import { getPhilippineNow, getPhilippineToday, getPhilippineTimeString, getPhilippineDateString, formatPH24 } from '@/lib/philippineTime';
import { checkLocationForEmployee } from '@/lib/locationValidation';
type EntryType = 'clock_in' | 'break_start' | 'break_end' | 'clock_out';

interface ClockWidgetProps {
  employeeId: string;
}

export function ClockWidget({ employeeId }: ClockWidgetProps) {
  const [currentStatus, setCurrentStatus] = useState<EntryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingAction, setPendingAction] = useState<EntryType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(getPhilippineTimeString());
  const [currentDate, setCurrentDate] = useState(getPhilippineDateString());
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [locationChecking, setLocationChecking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationVerified, setLocationVerified] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getPhilippineTimeString());
      setCurrentDate(getPhilippineDateString());
      if (clockInTime && currentStatus !== 'clock_out') {
        const now = getPhilippineNow();
        const diff = now.getTime() - clockInTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setElapsedTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [clockInTime, currentStatus]);

  useEffect(() => {
    const fetchCurrentStatus = async () => {
      // Fetch the most recent entry EVER (not just today) to persist clock-in across days
      const { data } = await supabase
        .from('time_entries')
        .select('entry_type, timestamp')
        .eq('employee_id', employeeId)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setCurrentStatus(data[0].entry_type as EntryType);
        if (data[0].entry_type !== 'clock_out') {
          // Find the most recent clock_in to track elapsed time
          const { data: clockInData } = await supabase
            .from('time_entries')
            .select('timestamp')
            .eq('employee_id', employeeId)
            .eq('entry_type', 'clock_in')
            .order('timestamp', { ascending: false })
            .limit(1);
          if (clockInData && clockInData.length > 0) {
            setClockInTime(new Date(clockInData[0].timestamp));
          }
        }
      }
      setLoading(false);
    };
    fetchCurrentStatus();

    // Real-time subscription for time entries
    const channel = supabase
      .channel(`clock-widget-${employeeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'time_entries',
        filter: `employee_id=eq.${employeeId}`,
      }, () => {
        fetchCurrentStatus();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [employeeId]);

  const checkLocation = async (): Promise<{ success: boolean; error?: string }> => {
    return checkLocationForEmployee(employeeId);
  };

  const handleAction = async (action: EntryType) => {
    setPendingAction(action);
    setLocationError(null);
    setLocationVerified(false);
    setLocationChecking(true);
    setShowCamera(true);

    const locationResult = await checkLocation();
    setLocationChecking(false);

    if (!locationResult.success) {
      setLocationError(locationResult.error || 'Location verification failed');
      return;
    }
    setLocationVerified(true);
  };

  const retryLocation = async () => {
    setLocationChecking(true);
    setLocationError(null);
    const locationResult = await checkLocation();
    setLocationChecking(false);
    if (!locationResult.success) {
      setLocationError(locationResult.error || 'Location verification failed');
      return;
    }
    setLocationVerified(true);
  };

  const handleCapture = async (blob: Blob) => {
    if (!pendingAction) return;
    setSubmitting(true);
    try {
      const fileName = `${employeeId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('selfies').upload(fileName, blob);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(fileName);

      const phNow = getPhilippineNow();

      const { error: entryError } = await supabase.from('time_entries').insert({
        employee_id: employeeId,
        entry_type: pendingAction,
        selfie_url: publicUrl,
        timestamp: phNow.toISOString(),
      });
      if (entryError) throw entryError;

      setCurrentStatus(pendingAction);
      if (pendingAction === 'clock_in') {
        setClockInTime(phNow);
      } else if (pendingAction === 'clock_out') {
        setClockInTime(null);
        setElapsedTime('00:00:00');
      }

      const actionLabels: Record<EntryType, string> = {
        clock_in: 'Clocked In',
        break_start: 'Break Started',
        break_end: 'Back from Break',
        clock_out: 'Clocked Out',
      };

      toast({ title: 'Success', description: `You have ${actionLabels[pendingAction].toLowerCase()} at ${formatPH24(phNow)}` });
      handleCloseCamera();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to record entry. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    setPendingAction(null);
    setLocationError(null);
    setLocationVerified(false);
  };

  const getAvailableActions = () => {
    switch (currentStatus) {
      case null:
        return [{ type: 'clock_in' as EntryType, label: 'Clock In', icon: LogIn }];
      case 'clock_in':
      case 'break_end':
        return [
          { type: 'break_start' as EntryType, label: 'Start Break', icon: Coffee },
          { type: 'clock_out' as EntryType, label: 'Clock Out', icon: LogOut },
        ];
      case 'break_start':
        return [{ type: 'break_end' as EntryType, label: 'End Break', icon: Clock }];
      case 'clock_out':
        return [{ type: 'clock_in' as EntryType, label: 'Clock In Again', icon: LogIn }];
      default:
        return [];
    }
  };

  const getStatusDisplay = () => {
    switch (currentStatus) {
      case 'clock_in':
      case 'break_end':
        return { label: 'Working', className: 'status-clocked-in' };
      case 'break_start':
        return { label: 'On Break', className: 'status-on-break' };
      case 'clock_out':
        return { label: 'Clocked Out', className: 'status-clocked-out' };
      default:
        return { label: 'Not Clocked In', className: 'status-clocked-out' };
    }
  };

  const getActionLabel = (): string => {
    if (!pendingAction) return '';
    const labels: Record<EntryType, string> = { clock_in: 'Clock In', clock_out: 'Clock Out', break_start: 'Start Break', break_end: 'End Break' };
    return labels[pendingAction];
  };

  const getActionVariant = (): 'success' | 'destructive' | 'warning' => {
    if (pendingAction === 'clock_out') return 'destructive';
    if (pendingAction === 'break_start' || pendingAction === 'break_end') return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const status = getStatusDisplay();
  const actions = getAvailableActions();

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="gradient-primary text-primary-foreground pb-8">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Time Clock
          </CardTitle>
        </CardHeader>
        <CardContent className="-mt-4 relative">
          <div className="bg-card rounded-xl shadow-lg p-6 space-y-6">
            <div className="text-center">
              <p className="text-4xl font-bold font-mono">{currentTime}</p>
              <p className="text-muted-foreground">{currentDate}</p>
              <p className="text-xs text-muted-foreground mt-1">Philippine Standard Time (PST)</p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className={`px-4 py-2 rounded-full border ${status.className}`}>
                <span className="font-medium">{status.label}</span>
              </div>
            </div>

            {clockInTime && currentStatus !== 'clock_out' && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Time Worked Today</p>
                <p className="text-2xl font-bold font-mono text-primary">{elapsedTime}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.type}
                    onClick={() => handleAction(action.type)}
                    disabled={locationChecking}
                    size="lg"
                    className={
                      action.type === 'clock_in'
                        ? 'gradient-success h-14 text-lg'
                        : action.type === 'clock_out'
                        ? 'bg-destructive hover:bg-destructive/90 h-14 text-lg'
                        : 'gradient-warning h-14 text-lg'
                    }
                  >
                    {locationChecking && pendingAction === action.type ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Checking Location...
                      </>
                    ) : (
                      <>
                        <Icon className="w-5 h-5 mr-2" />
                        {action.label}
                      </>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCamera} onOpenChange={handleCloseCamera}>
        <DialogContent className="w-full max-w-full h-[100dvh] sm:max-w-2xl sm:h-auto sm:max-h-[95vh] p-4 sm:p-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {getActionLabel()}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Auto-capture when face is detected
            </DialogDescription>
          </DialogHeader>

          <AutoCaptureCamera
            onCapture={handleCapture}
            onCancel={handleCloseCamera}
            actionLabel={getActionLabel()}
            actionVariant={getActionVariant()}
            isLocationVerified={locationVerified}
            locationError={locationError}
            onRetryLocation={retryLocation}
            locationChecking={locationChecking}
            submitting={submitting}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
