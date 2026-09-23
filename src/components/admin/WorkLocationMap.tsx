import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface WorkLocation {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  employee_count?: number;
}

export function WorkLocationMap() {
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const fetchLocations = async () => {
    const [locResult, empAssignments, workerAssignments] = await Promise.all([
      supabase.from('work_locations').select('*'),
      supabase.from('employee_location_assignments').select('location_id'),
      supabase.from('worker_location_assignments').select('location_id'),
    ]);

    if (locResult.data) {
      const countMap = new Map<string, number>();
      empAssignments.data?.forEach(a => countMap.set(a.location_id, (countMap.get(a.location_id) || 0) + 1));
      workerAssignments.data?.forEach(a => countMap.set(a.location_id, (countMap.get(a.location_id) || 0) + 1));

      setLocations(locResult.data.map(loc => ({
        ...loc,
        employee_count: countMap.get(loc.id) || 0,
      })));
    }
    setLoading(false);
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([12.8797, 121.7740], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loading]);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    locations.forEach(loc => {
      const marker = L.marker([loc.latitude, loc.longitude], { icon: orangeIcon });
      marker.bindPopup(`
        <div style="min-width:180px">
          <p style="font-weight:bold;font-size:14px;margin:0">${loc.name}</p>
          ${loc.address ? `<p style="font-size:12px;color:#888;margin:4px 0">${loc.address}</p>` : ''}
          <div style="margin-top:8px;font-size:12px">
            <p style="margin:2px 0">📍 Radius: ${loc.radius_meters}m</p>
            <p style="margin:2px 0">👥 Assigned: ${loc.employee_count} personnel</p>
            <p style="margin:2px 0">Status: ${loc.is_active ? '🟢 Active' : '🔴 Inactive'}</p>
          </div>
        </div>
      `);
      markersRef.current!.addLayer(marker);

      if (loc.is_active) {
        const circle = L.circle([loc.latitude, loc.longitude], {
          radius: loc.radius_meters,
          color: '#f97316',
          fillColor: '#f97316',
          fillOpacity: 0.15,
          weight: 2,
        });
        markersRef.current!.addLayer(circle);
      }
    });

    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [locations]);

  // Fetch data + realtime
  useEffect(() => {
    fetchLocations();
    const channel = supabase
      .channel('map-locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_locations' }, () => fetchLocations())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_location_assignments' }, () => fetchLocations())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'worker_location_assignments' }, () => fetchLocations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Work Locations Map
            </CardTitle>
            <CardDescription>{locations.length} location{locations.length !== 1 ? 's' : ''} pinned</CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">
            {locations.filter(l => l.is_active).length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] w-full relative">
          {loading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">Loading map...</div>
          ) : (
            <div ref={mapContainerRef} className="h-full w-full" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
