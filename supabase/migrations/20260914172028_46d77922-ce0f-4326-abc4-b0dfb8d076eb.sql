
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _org uuid;
BEGIN
  BEGIN
    _org := NULLIF(NEW.raw_user_meta_data ->> 'organization_id', '')::uuid;
  EXCEPTION WHEN others THEN
    _org := NULL;
  END;

  IF _org IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = _org) THEN
    _org := NULL;
  END IF;

  INSERT INTO public.profiles (user_id, email, first_name, last_name, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    _org
  );

  IF _org IS NOT NULL THEN
    INSERT INTO public.user_organizations (user_id, organization_id)
    VALUES (NEW.id, _org)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
