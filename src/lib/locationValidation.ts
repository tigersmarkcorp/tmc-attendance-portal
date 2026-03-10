import { supabase } from '@/integrations/supabase/client';

interface WorkLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

const MAX_GPS_BUFFER_METERS = 150;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalizeLocation(location: any): WorkLocation {
  return {
    id: location.id,
    name: location.name,
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
    radius_meters: Number(location.radius_meters),
  };
}

async function getCurrentPositionWithRetry(maxRetries = 2): Promise<GeolocationPosition> {
  const getCurrentPosition = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS);
    });

  let lastPosition: GeolocationPosition | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastPosition = await getCurrentPosition();

    if (lastPosition.coords.accuracy <= 80 || attempt === maxRetries) {
      return lastPosition;
    }

    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  return lastPosition as GeolocationPosition;
}

async function getActiveLocationsByIds(locationIds: string[]): Promise<WorkLocation[]> {
  if (!locationIds.length) return [];

  const { data, error } = await supabase
    .from('work_locations')
    .select('*')
    .in('id', locationIds)
    .eq('is_active', true);

  if (error || !data) return [];

  return data.map(normalizeLocation);
}

function evaluateLocationMatch(
  locations: WorkLocation[],
  currentLat: number,
  currentLng: number,
  accuracy: number
): { success: boolean; error?: string } {
  let nearestLocation: WorkLocation | null = null;
  let nearestDistance = Infinity;

  const gpsBuffer = Math.min(Math.max(Math.round(accuracy), 0), MAX_GPS_BUFFER_METERS);

  for (const loc of locations) {
    const distance = calculateDistance(currentLat, currentLng, loc.latitude, loc.longitude);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestLocation = loc;
    }

    const effectiveRadius = loc.radius_meters + gpsBuffer;
    if (distance <= effectiveRadius) {
      return { success: true };
    }
  }

  return {
    success: false,
    error: `You are ${Math.round(nearestDistance)}m away from ${nearestLocation?.name}. Must be within ${nearestLocation?.radius_meters}m (GPS ±${gpsBuffer}m).`,
  };
}

export async function checkLocationForWorker(workerId: string): Promise<{ success: boolean; error?: string }> {
  if (!navigator.geolocation) {
    return { success: false, error: 'Geolocation is not supported by your browser' };
  }

  try {
    const position = await getCurrentPositionWithRetry();
    const currentLat = position.coords.latitude;
    const currentLng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    const { data: assignments, error: assignmentError } = await supabase
      .from('worker_location_assignments')
      .select('location_id')
      .eq('worker_id', workerId);

    if (assignmentError) {
      return { success: false, error: 'Failed to verify assigned locations.' };
    }

    if (assignments && assignments.length > 0) {
      const assignedLocations = await getActiveLocationsByIds(assignments.map((a) => a.location_id));

      if (!assignedLocations.length) {
        return { success: false, error: 'Assigned work locations not found or inactive.' };
      }

      return evaluateLocationMatch(assignedLocations, currentLat, currentLng, accuracy);
    }

    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('assigned_location_id')
      .eq('id', workerId)
      .single();

    if (workerError) {
      return { success: false, error: 'Failed to verify worker location assignment.' };
    }

    if (worker?.assigned_location_id) {
      const assignedLocations = await getActiveLocationsByIds([worker.assigned_location_id]);

      if (!assignedLocations.length) {
        return { success: false, error: 'Assigned work location not found or inactive.' };
      }

      return evaluateLocationMatch(assignedLocations, currentLat, currentLng, accuracy);
    }

    const { data: locations, error: locationsError } = await supabase
      .from('work_locations')
      .select('*')
      .eq('is_active', true);

    if (locationsError || !locations?.length) {
      return { success: false, error: 'No work locations configured.' };
    }

    return evaluateLocationMatch(locations.map(normalizeLocation), currentLat, currentLng, accuracy);
  } catch (error: any) {
    if (error.code === 1) return { success: false, error: 'Location access denied.' };
    if (error.code === 2) return { success: false, error: 'Location unavailable. Enable GPS.' };
    if (error.code === 3) return { success: false, error: 'Location request timed out.' };
    return { success: false, error: 'Failed to get location' };
  }
}

export async function checkLocationForEmployee(employeeId: string): Promise<{ success: boolean; error?: string }> {
  if (!navigator.geolocation) {
    return { success: false, error: 'Geolocation is not supported by your browser' };
  }

  try {
    const position = await getCurrentPositionWithRetry();
    const currentLat = position.coords.latitude;
    const currentLng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    const { data: assignments, error: assignmentError } = await supabase
      .from('employee_location_assignments')
      .select('location_id')
      .eq('employee_id', employeeId);

    if (assignmentError) {
      return { success: false, error: 'Failed to verify assigned locations.' };
    }

    if (assignments && assignments.length > 0) {
      const assignedLocations = await getActiveLocationsByIds(assignments.map((a) => a.location_id));

      if (!assignedLocations.length) {
        return { success: false, error: 'Assigned work locations not found or inactive.' };
      }

      return evaluateLocationMatch(assignedLocations, currentLat, currentLng, accuracy);
    }

    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('assigned_location_id')
      .eq('id', employeeId)
      .single();

    if (employeeError) {
      return { success: false, error: 'Failed to verify employee location assignment.' };
    }

    if (employee?.assigned_location_id) {
      const assignedLocations = await getActiveLocationsByIds([employee.assigned_location_id]);

      if (!assignedLocations.length) {
        return { success: false, error: 'Assigned work location not found or inactive.' };
      }

      return evaluateLocationMatch(assignedLocations, currentLat, currentLng, accuracy);
    }

    const { data: locations, error: locationsError } = await supabase
      .from('work_locations')
      .select('*')
      .eq('is_active', true);

    if (locationsError || !locations?.length) {
      return { success: false, error: 'No work locations configured.' };
    }

    return evaluateLocationMatch(locations.map(normalizeLocation), currentLat, currentLng, accuracy);
  } catch (error: any) {
    if (error.code === 1) return { success: false, error: 'Location access denied.' };
    if (error.code === 2) return { success: false, error: 'Location unavailable. Enable GPS.' };
    if (error.code === 3) return { success: false, error: 'Location request timed out.' };
    return { success: false, error: 'Failed to get location' };
  }
}

