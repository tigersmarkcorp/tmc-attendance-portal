import { supabase } from '@/integrations/supabase/client';

interface WorkLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

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

export async function checkLocationForWorker(
  workerId: string
): Promise<{ success: boolean; error?: string }> {
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

    // Fetch assigned locations from junction table
    const { data: assignments } = await supabase
      .from('worker_location_assignments')
      .select('location_id')
      .eq('worker_id', workerId);

    if (assignments && assignments.length > 0) {
      const locationIds = assignments.map(a => a.location_id);
      
      const { data: assignedLocations, error } = await supabase
        .from('work_locations')
        .select('*')
        .in('id', locationIds)
        .eq('is_active', true);

      if (error || !assignedLocations || assignedLocations.length === 0) {
        return { success: false, error: 'Assigned work locations not found or inactive.' };
      }

      // Check if user is within ANY of the assigned locations
      let nearestLocation: WorkLocation | null = null;
      let nearestDistance = Infinity;

      for (const loc of assignedLocations) {
        const distance = calculateDistance(currentLat, currentLng, loc.latitude, loc.longitude);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestLocation = loc;
        }
        if (distance <= loc.radius_meters) {
          return { success: true };
        }
      }

      return { 
        success: false, 
        error: `You are ${Math.round(nearestDistance)}m away from ${nearestLocation?.name}. Must be within ${nearestLocation?.radius_meters}m.` 
      };
    }

    // Fallback: Check legacy single assigned_location_id column
    const { data: worker } = await supabase
      .from('workers')
      .select('assigned_location_id')
      .eq('id', workerId)
      .single();

    if (worker?.assigned_location_id) {
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
        return { 
          success: false, 
          error: `You are ${Math.round(distance)}m away from ${assignedLocation.name}. Must be within ${assignedLocation.radius_meters}m.` 
        };
      }
      return { success: true };
    }

    // No assignments - check any active location
    const { data: locations, error } = await supabase
      .from('work_locations')
      .select('*')
      .eq('is_active', true);

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

    return { 
      success: false, 
      error: `You are ${Math.round(nearestDistance)}m away from ${nearestLocation?.name}. Must be within ${nearestLocation?.radius_meters}m.` 
    };
  } catch (error: any) {
    if (error.code === 1) return { success: false, error: 'Location access denied.' };
    if (error.code === 2) return { success: false, error: 'Location unavailable. Enable GPS.' };
    if (error.code === 3) return { success: false, error: 'Location request timed out.' };
    return { success: false, error: 'Failed to get location' };
  }
}

export async function checkLocationForEmployee(
  employeeId: string
): Promise<{ success: boolean; error?: string }> {
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

    // Fetch assigned locations from junction table
    const { data: assignments } = await supabase
      .from('employee_location_assignments')
      .select('location_id')
      .eq('employee_id', employeeId);

    if (assignments && assignments.length > 0) {
      const locationIds = assignments.map(a => a.location_id);
      
      const { data: assignedLocations, error } = await supabase
        .from('work_locations')
        .select('*')
        .in('id', locationIds)
        .eq('is_active', true);

      if (error || !assignedLocations || assignedLocations.length === 0) {
        return { success: false, error: 'Assigned work locations not found or inactive.' };
      }

      let nearestLocation: WorkLocation | null = null;
      let nearestDistance = Infinity;

      for (const loc of assignedLocations) {
        const distance = calculateDistance(currentLat, currentLng, loc.latitude, loc.longitude);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestLocation = loc;
        }
        if (distance <= loc.radius_meters) {
          return { success: true };
        }
      }

      return { 
        success: false, 
        error: `You are ${Math.round(nearestDistance)}m away from ${nearestLocation?.name}. Must be within ${nearestLocation?.radius_meters}m.` 
      };
    }

    // Fallback: Check legacy single assigned_location_id column
    const { data: employee } = await supabase
      .from('employees')
      .select('assigned_location_id')
      .eq('id', employeeId)
      .single();

    if (employee?.assigned_location_id) {
      const { data: assignedLocation, error } = await supabase
        .from('work_locations')
        .select('*')
        .eq('id', employee.assigned_location_id)
        .eq('is_active', true)
        .single();

      if (error || !assignedLocation) {
        return { success: false, error: 'Assigned work location not found or inactive.' };
      }

      const distance = calculateDistance(currentLat, currentLng, assignedLocation.latitude, assignedLocation.longitude);
      if (distance > assignedLocation.radius_meters) {
        return { 
          success: false, 
          error: `You are ${Math.round(distance)}m away from ${assignedLocation.name}. Must be within ${assignedLocation.radius_meters}m.` 
        };
      }
      return { success: true };
    }

    // No assignments - check any active location
    const { data: locations, error } = await supabase
      .from('work_locations')
      .select('*')
      .eq('is_active', true);

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

    return { 
      success: false, 
      error: `You are ${Math.round(nearestDistance)}m away from ${nearestLocation?.name}. Must be within ${nearestLocation?.radius_meters}m.` 
    };
  } catch (error: any) {
    if (error.code === 1) return { success: false, error: 'Location access denied.' };
    if (error.code === 2) return { success: false, error: 'Location unavailable. Enable GPS.' };
    if (error.code === 3) return { success: false, error: 'Location request timed out.' };
    return { success: false, error: 'Failed to get location' };
  }
}
