-- Allow encoders to upload photos to employee-photos bucket
CREATE POLICY "Encoders can upload employee photos"
ON storage.objects FOR INSERT
WITH CHECK (
  (bucket_id = 'employee-photos'::text) AND has_role(auth.uid(), 'encoder'::app_role)
);

-- Allow encoders to update photos in employee-photos bucket
CREATE POLICY "Encoders can update employee photos"
ON storage.objects FOR UPDATE
USING (
  (bucket_id = 'employee-photos'::text) AND has_role(auth.uid(), 'encoder'::app_role)
);