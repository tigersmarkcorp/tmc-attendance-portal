-- Add new fields to workers table for comprehensive employee data
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS employee_type text,
ADD COLUMN IF NOT EXISTS date_hired date,
ADD COLUMN IF NOT EXISTS sss_number text,
ADD COLUMN IF NOT EXISTS tin_id text,
ADD COLUMN IF NOT EXISTS pagibig_id text,
ADD COLUMN IF NOT EXISTS nbi_id text,
ADD COLUMN IF NOT EXISTS philhealth_id text;