import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorkLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

interface GeolocationResult {
  isWithinLocation: boolean;
  currentLocation: { lat: number; lng: number } | null;
  nearestLocation: WorkLocation | null;
  distance: number | null;
  error: string | null;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function useGeolocation() {
  const [checking, setChecking] = useState(false);

  const checkLocation = useCallback(async (): Promise<GeolocationResult> => {
    setChecking(true);

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        return {
          isWithinLocation: false,
          currentLocation: null,
          nearestLocation: null,
          distance: null,
          error: 'Geolocation is not supported by your browser',
        };
      }

      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const currentLat = position.coords.latitude;
      const currentLng = position.coords.longitude;

      // Fetch active work locations
      const { data: locations, error } = await supabase
        .from('work_locations')
        .select('*')
        .eq('is_active', true);

      if (error) {
        throw new Error('Failed to fetch work locations');
      }

      if (!locations || locations.length === 0) {
        return {
          isWithinLocation: false,
          currentLocation: { lat: currentLat, lng: currentLng },
          nearestLocation: null,
          distance: null,
          error: 'No work locations configured. Please contact your administrator.',
        };
      }

      // Find the nearest location and check if within any geofence
      let nearestLocation: WorkLocation | null = null;
      let nearestDistance = Infinity;
      let isWithinAny = false;

      for (const loc of locations) {
        const distance = calculateDistance(
          currentLat,
          currentLng,
          loc.latitude,
          loc.longitude
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestLocation = loc;
        }

        if (distance <= loc.radius_meters) {
          isWithinAny = true;
          nearestLocation = loc;
          nearestDistance = distance;
          break;
        }
      }

      return {
        isWithinLocation: isWithinAny,
        currentLocation: { lat: currentLat, lng: currentLng },
        nearestLocation,
        distance: Math.round(nearestDistance),
        error: isWithinAny
          ? null
          : `You are ${Math.round(nearestDistance)}m away from the nearest work location (${nearestLocation?.name}). You must be within ${nearestLocation?.radius_meters}m to clock in/out.`,
      };
    } catch (error: any) {
      let errorMessage = 'Failed to get your location';

      if (error.code === 1) {
        errorMessage = 'Location access denied. Please enable location permissions to clock in/out.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please ensure GPS is enabled.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      }

      return {
        isWithinLocation: false,
        currentLocation: null,
        nearestLocation: null,
        distance: null,
        error: errorMessage,
      };
    } finally {
      setChecking(false);
    }
  }, []);

  return { checkLocation, checking };
}
