import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';

interface LocationWithImage {
  id: string;
  name: string;
  address: string | null;
  image_url: string | null;
  is_active: boolean;
  radius_meters: number;
  notes: string | null;
}

export function LocationCarousel() {
  const [locations, setLocations] = useState<LocationWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('work_locations')
        .select('id, name, address, image_url, is_active, radius_meters, notes')
        .eq('is_active', true)
        .order('name');
      if (data) setLocations(data as LocationWithImage[]);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('location-carousel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_locations' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (loading) return null;
  if (locations.filter(l => l.image_url).length === 0) return null;

  const locationsWithImages = locations.filter(l => l.image_url);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Work Locations
            </CardTitle>
            <CardDescription>{locationsWithImages.length} location{locationsWithImages.length !== 1 ? 's' : ''} with photos</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => scroll('left')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => scroll('right')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto px-6 pb-2 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {locationsWithImages.map((loc) => (
            <div
              key={loc.id}
              className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[340px] snap-start rounded-xl overflow-hidden border bg-card shadow-sm"
            >
              <div className="relative h-[180px] sm:h-[200px] w-full">
                <img
                  src={loc.image_url!}
                  alt={loc.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <Badge
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-foreground border-border"
                >
                  {loc.is_active ? '🟢 Active' : '🔴 Inactive'}
                </Badge>
              </div>
              <div className="p-3 space-y-1">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  {loc.name}
                </h3>
                {loc.address && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{loc.address}</p>
                )}
                {loc.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{loc.notes}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    📍 {loc.radius_meters}m radius
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
