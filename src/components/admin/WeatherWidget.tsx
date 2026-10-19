import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  MapPin,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface WeatherData {
  temperature: number;
  feelsLike: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  visibility: number;
  location: string;
  updatedAt: Date;
}

function getWeatherInfo(code: number): {
  label: string;
  Icon: React.ElementType;
  gradient: string;
  iconColor: string;
} {
  if (code === 0)
    return {
      label: 'Clear Sky',
      Icon: Sun,
      gradient: 'from-yellow-400/20 to-orange-300/10',
      iconColor: 'text-yellow-500',
    };
  if (code <= 3)
    return {
      label: 'Partly Cloudy',
      Icon: Cloud,
      gradient: 'from-sky-400/20 to-blue-300/10',
      iconColor: 'text-sky-400',
    };
  if (code <= 48)
    return {
      label: 'Foggy',
      Icon: Cloud,
      gradient: 'from-muted/40 to-muted/20',
      iconColor: 'text-muted-foreground',
    };
  if (code <= 67)
    return {
      label: 'Rainy',
      Icon: CloudRain,
      gradient: 'from-blue-500/20 to-indigo-400/10',
      iconColor: 'text-blue-500',
    };
  if (code <= 77)
    return {
      label: 'Snowy',
      Icon: CloudSnow,
      gradient: 'from-sky-200/30 to-blue-100/20',
      iconColor: 'text-sky-300',
    };
  if (code <= 82)
    return {
      label: 'Showers',
      Icon: CloudRain,
      gradient: 'from-blue-400/20 to-cyan-300/10',
      iconColor: 'text-blue-400',
    };
  if (code <= 99)
    return {
      label: 'Thunderstorm',
      Icon: CloudLightning,
      gradient: 'from-purple-500/20 to-violet-400/10',
      iconColor: 'text-purple-500',
    };
  return {
    label: 'Unknown',
    Icon: Cloud,
    gradient: 'from-muted/30 to-muted/10',
    iconColor: 'text-muted-foreground',
  };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = useCallback(async (lat: number, lon: number, locationName: string) => {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,visibility&timezone=auto`
    );
    const data = await res.json();
    const c = data.current;
    setWeather({
      temperature: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      weatherCode: c.weather_code,
      windSpeed: Math.round(c.wind_speed_10m),
      humidity: c.relative_humidity_2m,
      visibility: Math.round((c.visibility ?? 10000) / 1000),
      location: locationName,
      updatedAt: new Date(),
    });
  }, []);

  const init = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const getLocation = (): Promise<{ lat: number; lon: number }> =>
          new Promise((resolve) => {
            if (!navigator.geolocation) {
              resolve({ lat: 14.5995, lon: 120.9842 });
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
              () => resolve({ lat: 14.5995, lon: 120.9842 }),
              { timeout: 5000 }
            );
          });

        const { lat, lon } = await getLocation();

        let locationName = 'Manila, Philippines';
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const geoData = await geoRes.json();
          locationName =
            geoData.address?.city ||
            geoData.address?.town ||
            geoData.address?.municipality ||
            geoData.address?.county ||
            'Your Location';
        } catch {
          // keep default
        }

        await fetchWeather(lat, lon, locationName);
      } catch {
        // silently fail — widget hides on error
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchWeather]
  );

  useEffect(() => {
    init();
    const interval = setInterval(() => init(true), 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(interval);
  }, [init]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="w-14 h-14 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  const { label, Icon, gradient, iconColor } = getWeatherInfo(weather.weatherCode);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className={`bg-gradient-to-br ${gradient} p-5`}>
          <div className="flex items-center justify-between gap-4">
            {/* Left — icon + temp */}
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-background/60 backdrop-blur-sm ${iconColor}`}>
                <Icon className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="font-medium">{weather.location}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black tracking-tight">{weather.temperature}°C</span>
                  <span className="text-sm font-semibold text-muted-foreground">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Feels like {weather.feelsLike}°C
                </p>
              </div>
            </div>

            {/* Right — stats */}
            <div className="flex flex-col gap-2.5 text-xs min-w-[90px]">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>{weather.humidity}% humidity</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span>{weather.windSpeed} km/h wind</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{weather.visibility} km vis.</span>
              </div>
            </div>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => init(true)}
              disabled={refreshing}
              className="self-start"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground mt-3">
            Last updated: {weather.updatedAt.toLocaleTimeString()} · Auto-refreshes every 10 min
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
