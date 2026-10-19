-- Create work_locations table for geofenced clock-in/out areas
CREATE TABLE public.work_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_locations ENABLE ROW LEVEL SECURITY;

-- Admin can manage all locations
CREATE POLICY "Admins can manage work locations"
ON public.work_locations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view active locations
CREATE POLICY "Authenticated users can view active work locations"
ON public.work_locations
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_work_locations_updated_at
BEFORE UPDATE ON public.work_locations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();