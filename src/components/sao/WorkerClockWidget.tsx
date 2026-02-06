 import { useState, useCallback, useEffect } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { 
   Dialog, 
   DialogContent, 
   DialogDescription, 
   DialogHeader, 
   DialogTitle 
 } from '@/components/ui/dialog';
 import { 
   Clock, 
   LogIn, 
   LogOut, 
   RefreshCw,
   Coffee,
 } from 'lucide-react';
 import { toast } from 'sonner';
 import { format } from 'date-fns';
 import { AutoCaptureCamera } from '@/components/camera/AutoCaptureCamera';
 
 interface Worker {
   id: string;
   worker_id: string;
   first_name: string;
   last_name: string;
   photo_url: string | null;
   status: string;
   assigned_location_id?: string | null;
 }
 
 interface ClockStatus {
   isClockedIn: boolean;
   isOnBreak: boolean;
   lastEntry: {
     entry_type: string;
     timestamp: string;
     selfie_url: string | null;
   } | null;
 }
 
 interface WorkerClockWidgetProps {
   worker: Worker;
   saoId: string;
   onClockAction: () => void;
 }
 
 interface WorkLocation {
   id: string;
   name: string;
   latitude: number;
   longitude: number;
   radius_meters: number;
 }
 
 type ActionType = 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
 
 function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
   const R = 6371e3;
   const φ1 = (lat1 * Math.PI) / 180;
   const φ2 = (lat2 * Math.PI) / 180;
   const Δφ = ((lat2 - lat1) * Math.PI) / 180;
   const Δλ = ((lon2 - lon1) * Math.PI) / 180;
   const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   return R * c;
 }
 
 export function WorkerClockWidget({ worker, saoId, onClockAction }: WorkerClockWidgetProps) {
   const [clockStatus, setClockStatus] = useState<ClockStatus | null>(null);
   const [showCamera, setShowCamera] = useState(false);
   const [actionType, setActionType] = useState<ActionType>('clock_in');
   const [locationChecking, setLocationChecking] = useState(false);
   const [locationError, setLocationError] = useState<string | null>(null);
   const [locationVerified, setLocationVerified] = useState(false);
   const [submitting, setSubmitting] = useState(false);
 
   const fetchClockStatus = useCallback(async () => {
     const today = format(new Date(), 'yyyy-MM-dd');
     const { data } = await supabase
       .from('worker_time_entries')
       .select('entry_type, timestamp, selfie_url')
       .eq('worker_id', worker.id)
       .gte('timestamp', `${today}T00:00:00`)
       .lte('timestamp', `${today}T23:59:59`)
       .order('timestamp', { ascending: false })
       .limit(1);
 
     if (data && data.length > 0) {
       const entryType = data[0].entry_type;
       setClockStatus({
         isClockedIn: entryType === 'clock_in' || entryType === 'break_start' || entryType === 'break_end',
         isOnBreak: entryType === 'break_start',
         lastEntry: data[0]
       });
     } else {
       setClockStatus({ isClockedIn: false, isOnBreak: false, lastEntry: null });
     }
   }, [worker.id]);
 
   useEffect(() => {
     fetchClockStatus();
   }, [fetchClockStatus]);
 
   const checkLocation = async (): Promise<{ success: boolean; error?: string }> => {
     if (!navigator.geolocation) {
       return { success: false, error: 'Geolocation is not supported by your browser' };
     }
 
     try {
       const position = await new Promise<GeolocationPosition>((resolve, reject) => {
         navigator.geolocation.getCurrentPosition(resolve, reject, {
           enableHighAccuracy: true,
           timeout: 15000,
           maximumAge: 0,
         });
       });
 
       const currentLat = position.coords.latitude;
       const currentLng = position.coords.longitude;
 
       if (worker.assigned_location_id) {
         const { data: assignedLocation, error } = await supabase
           .from('work_locations')
           .select('*')
           .eq('id', worker.assigned_location_id)
           .eq('is_active', true)
           .single();
 
         if (error || !assignedLocation) {
           return { success: false, error: 'Assigned work location not found or inactive.' };
         }
 
         const distance = calculateDistance(currentLat, currentLng, assignedLocation.latitude, assignedLocation.longitude);
         if (distance > assignedLocation.radius_meters) {
           return { success: false, error: `You are ${Math.round(distance)}m away from ${assignedLocation.name}. Must be within ${assignedLocation.radius_meters}m.` };
         }
         return { success: true };
       }
 
       const { data: locations, error } = await supabase.from('work_locations').select('*').eq('is_active', true);
       if (error || !locations?.length) {
         return { success: false, error: 'No work locations configured.' };
       }
 
       let nearestLocation: WorkLocation | null = null;
       let nearestDistance = Infinity;
 
       for (const loc of locations) {
         const distance = calculateDistance(currentLat, currentLng, loc.latitude, loc.longitude);
         if (distance < nearestDistance) {
           nearestDistance = distance;
           nearestLocation = loc;
         }
         if (distance <= loc.radius_meters) {
           return { success: true };
         }
       }
 
       return { success: false, error: `You are ${Math.round(nearestDistance)}m away from ${nearestLocation?.name}. Must be within ${nearestLocation?.radius_meters}m.` };
     } catch (error: any) {
       if (error.code === 1) return { success: false, error: 'Location access denied.' };
       if (error.code === 2) return { success: false, error: 'Location unavailable. Enable GPS.' };
       if (error.code === 3) return { success: false, error: 'Location request timed out.' };
       return { success: false, error: 'Failed to get location' };
     }
   };
 
   const startCamera = async (type: ActionType) => {
     setActionType(type);
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
 
   const stopCamera = () => {
     setShowCamera(false);
     setLocationError(null);
     setLocationVerified(false);
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
     setSubmitting(true);
     try {
       const fileName = `worker-${worker.id}/${actionType}-${Date.now()}.jpg`;
       const { error: uploadError } = await supabase.storage.from('selfies').upload(fileName, blob, { contentType: 'image/jpeg' });
       if (uploadError) throw uploadError;
 
       const { data: urlData } = supabase.storage.from('selfies').getPublicUrl(fileName);
       const selfieUrl = urlData.publicUrl;
 
       const { error: entryError } = await supabase.from('worker_time_entries').insert({
         worker_id: worker.id,
         recorded_by: saoId,
         entry_type: actionType,
         selfie_url: selfieUrl,
         timestamp: new Date().toISOString()
       });
       if (entryError) throw entryError;
 
       const today = format(new Date(), 'yyyy-MM-dd');
       if (actionType === 'clock_in') {
         await supabase.from('worker_timesheets').upsert({
           worker_id: worker.id,
           date: today,
           clock_in_time: new Date().toISOString(),
           status: 'pending'
         }, { onConflict: 'worker_id,date' });
       } else if (actionType === 'clock_out') {
         const { data: timesheet } = await supabase.from('worker_timesheets').select('*').eq('worker_id', worker.id).eq('date', today).single();
         if (timesheet?.clock_in_time) {
           const clockInTime = new Date(timesheet.clock_in_time);
           const clockOutTime = new Date();
           const totalMinutes = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / 60000);
           const totalHours = totalMinutes / 60;
           await supabase.from('worker_timesheets').update({
             clock_out_time: clockOutTime.toISOString(),
             total_work_minutes: totalMinutes,
             regular_hours: Math.min(totalHours, 8),
             overtime_hours: Math.max(0, totalHours - 8)
           }).eq('id', timesheet.id);
         }
       }
 
       const labels: Record<ActionType, string> = { clock_in: 'clocked in', clock_out: 'clocked out', break_start: 'started break', break_end: 'ended break' };
       toast.success(`Worker ${labels[actionType]} successfully!`);
       stopCamera();
       fetchClockStatus();
       onClockAction();
     } catch (error) {
       console.error('Clock action error:', error);
       toast.error('Failed to complete action. Please try again.');
     } finally {
       setSubmitting(false);
     }
   };
 
   const getActionLabel = (): string => {
     const labels: Record<ActionType, string> = { clock_in: 'Clock In', clock_out: 'Clock Out', break_start: 'Start Break', break_end: 'End Break' };
     return labels[actionType];
   };
 
   const getActionVariant = (): 'success' | 'destructive' | 'warning' => {
     if (actionType === 'clock_out') return 'destructive';
     if (actionType === 'break_start') return 'warning';
     return 'success';
   };
 
   return (
     <>
       <div className="flex items-center gap-1">
         {clockStatus === null ? (
           <Button variant="ghost" size="sm" onClick={fetchClockStatus}><RefreshCw className="w-4 h-4" /></Button>
         ) : clockStatus.isClockedIn ? (
           clockStatus.isOnBreak ? (
             <Button size="sm" onClick={() => startCamera('break_end')} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
               <Coffee className="w-3 h-3" />End Break
             </Button>
           ) : (
             <>
               <Button size="sm" variant="outline" onClick={() => startCamera('break_start')} className="gap-1 px-2">
                 <Coffee className="w-3 h-3" />
               </Button>
               <Button size="sm" variant="destructive" onClick={() => startCamera('clock_out')} className="gap-1 px-2">
                 <LogOut className="w-3 h-3" />
               </Button>
             </>
           )
         ) : (
           <Button size="sm" onClick={() => startCamera('clock_in')} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
             <LogIn className="w-3 h-3" />In
           </Button>
         )}
       </div>
 
       <Dialog open={showCamera} onOpenChange={(open) => !open && stopCamera()}>
         <DialogContent className="w-full max-w-full h-[100dvh] sm:max-w-2xl sm:h-auto sm:max-h-[95vh] p-4 sm:p-6 overflow-y-auto">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Clock className="w-5 h-5" />
               Worker {getActionLabel()}
             </DialogTitle>
             <DialogDescription className="text-xs sm:text-sm">
               Auto-capture when face is detected
             </DialogDescription>
           </DialogHeader>
 
           <div className="flex items-center gap-3 p-3 rounded-lg bg-muted mb-2">
             <Avatar>
               <AvatarImage src={worker.photo_url || ''} />
               <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                 {worker.first_name[0]}{worker.last_name[0]}
               </AvatarFallback>
             </Avatar>
             <div className="flex-1 min-w-0">
               <p className="font-medium truncate">{worker.first_name} {worker.last_name}</p>
               <p className="text-xs text-muted-foreground">{worker.worker_id}</p>
             </div>
             <Badge variant="outline" className="shrink-0">
               <Clock className="w-3 h-3 mr-1" />{format(new Date(), 'h:mm a')}
             </Badge>
           </div>
 
           <AutoCaptureCamera
             onCapture={handleCapture}
             onCancel={stopCamera}
             actionLabel={getActionLabel()}
             actionVariant={getActionVariant()}
             isLocationVerified={locationVerified}
             locationError={locationError}
             onRetryLocation={retryLocation}
             locationChecking={locationChecking}
             personName={`${worker.first_name} ${worker.last_name}`}
             submitting={submitting}
           />
         </DialogContent>
       </Dialog>
     </>
   );
 }
