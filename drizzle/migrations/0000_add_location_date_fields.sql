ALTER TABLE public.work_locations ADD COLUMN date_started date;
ALTER TABLE public.work_locations ADD COLUMN expected_done date;

COMMENT ON COLUMN public.work_locations.date_started IS 'Optional project start date for this location';
COMMENT ON COLUMN public.work_locations.expected_done IS 'Optional expected completion date for this location';
