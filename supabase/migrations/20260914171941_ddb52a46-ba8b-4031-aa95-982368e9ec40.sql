
REVOKE ALL ON FUNCTION public.set_organization_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_user_organization() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.current_org_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
