
-- Add image_url column to work_locations
ALTER TABLE public.work_locations ADD COLUMN image_url text NULL;

-- Create storage bucket for location images
INSERT INTO storage.buckets (id, name, public) VALUES ('location-images', 'location-images', true);

-- Allow authenticated users to upload location images
CREATE POLICY "Admins can upload location images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'location-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow public read access
CREATE POLICY "Anyone can view location images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'location-images');

-- Allow admins to delete location images
CREATE POLICY "Admins can delete location images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'location-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
