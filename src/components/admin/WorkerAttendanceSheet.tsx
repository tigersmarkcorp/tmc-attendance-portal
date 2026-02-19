import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  LogIn,
  LogOut,
  Loader2,
  Image,
  Calendar,
} from 'lucide-react';

interface Worker {
  id: string;
  first_name: string;
  last_name: string;
  worker_id: string;
  photo_url: string | null;
}

interface WorkerTimeEntry {
  id: string;
  entry_type: string;
  timestamp: string;
  selfie_url: string | null;
  recorded_by: string;
}

interface WorkerAttendanceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: Worker;
}

const entryTypeConfig: Record<string, { label: string; icon: typeof LogIn; className: string }> = {
  clock_in: { label: 'Clock In', icon: LogIn, className: 'bg-success/10 text-success border-success/20' },
  clock_out: { label: 'Clock Out', icon: LogOut, className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export function WorkerAttendanceSheet({ open, onOpenChange, worker }: WorkerAttendanceSheetProps) {
  const [timeEntries, setTimeEntries] = useState<WorkerTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSelfie, setSelectedSelfie] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('today');

  useEffect(() => {
    if (open && worker.id) {
      fetchTimeEntries();
    }
  }, [open, worker.id, selectedDate]);

  const fetchTimeEntries = async () => {
    setLoading(true);

    let startDate: Date;
    let endDate: Date = new Date();

    if (selectedDate === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (selectedDate === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    const { data } = await supabase
      .from('worker_time_entries')
      .select('id, entry_type, timestamp, selfie_url, recorded_by')
      .eq('worker_id', worker.id)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: false });

    if (data) {
      setTimeEntries(data);
    }
    setLoading(false);
  };

  // Group entries by date
  const groupedEntries = timeEntries.reduce((acc, entry) => {
    const date = format(new Date(entry.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, WorkerTimeEntry[]>);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarImage src={worker.photo_url || ''} />
                <AvatarFallback className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg">
                  {worker.first_name[0]}{worker.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-left">
                  {worker.first_name} {worker.last_name}
                </SheetTitle>
                <SheetDescription className="text-left">
                  Worker Attendance with Selfies
                </SheetDescription>
                <code className="text-xs bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                  {worker.worker_id}
                </code>
              </div>
            </div>
          </SheetHeader>

          <Tabs defaultValue="today" className="w-full" onValueChange={setSelectedDate}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedDate} className="mt-4">
              <ScrollArea className="h-[calc(100vh-280px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : Object.keys(groupedEntries).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No attendance records found</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedEntries).map(([date, entries]) => (
                      <div key={date}>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                        </h4>
                        <div className="space-y-2">
                          {entries.map((entry) => {
                            const config = entryTypeConfig[entry.entry_type] || {
                              label: entry.entry_type,
                              icon: Clock,
                              className: 'bg-muted text-muted-foreground',
                            };
                            const Icon = config.icon;
                            return (
                              <Card key={entry.id} className="overflow-hidden">
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={config.className}>
                                      <Icon className="w-3 h-3 mr-1" />
                                      {config.label}
                                    </Badge>
                                    <span className="text-sm font-mono">
                                      {format(new Date(entry.timestamp), 'HH:mm:ss')}
                                    </span>
                                    <div className="ml-auto">
                                      {entry.selfie_url ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setSelectedSelfie(entry.selfie_url)}
                                          className="gap-1 text-blue-500 hover:text-blue-600"
                                        >
                                          <Image className="w-4 h-4" />
                                          View Selfie
                                        </Button>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">No selfie</span>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Selfie Dialog */}
      <Dialog open={!!selectedSelfie} onOpenChange={() => setSelectedSelfie(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verification Selfie</DialogTitle>
          </DialogHeader>
          {selectedSelfie && (
            <img
              src={selectedSelfie}
              alt="Verification selfie"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
