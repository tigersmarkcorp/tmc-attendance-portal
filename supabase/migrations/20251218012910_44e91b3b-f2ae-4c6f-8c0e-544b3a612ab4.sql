-- Create storage bucket for employee photos if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-photos', 'employee-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies for employee-photos
DROP POLICY IF EXISTS "Admins can upload employee photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update employee photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete employee photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view employee photos" ON storage.objects;

-- Create storage policies for employee-photos bucket
CREATE POLICY "Admins can upload employee photos" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'employee-photos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update employee photos" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'employee-photos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete employee photos" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'employee-photos' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can view employee photos" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'employee-photos');