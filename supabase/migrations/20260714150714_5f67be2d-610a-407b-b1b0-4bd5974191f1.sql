DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_sao_assignments;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
