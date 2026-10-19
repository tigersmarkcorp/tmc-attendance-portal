import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No authorization header" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(url, serviceKey);

    // Only super admins may create companies
    const { data: membership } = await admin
      .from("user_organizations")
      .select("is_super_admin")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership?.is_super_admin) {
      return json({ error: "Super admin access required" }, 403);
    }

    const body = await req.json();
    const action = body.action ?? "create_company";

    if (action === "create_company") {
      const { company_name, email, password, first_name, last_name } = body;
      if (!company_name || !email || !password || password.length < 6) {
        return json({ error: "Company name, email and a password of at least 6 characters are required" }, 400);
      }

      const { data: org, error: orgErr } = await admin
        .from("organizations")
        .insert({ name: company_name })
        .select()
        .single();
      if (orgErr) throw orgErr;

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: first_name ?? "",
          last_name: last_name ?? "",
          organization_id: org.id,
        },
      });
      if (createErr || !created.user) {
        await admin.from("organizations").delete().eq("id", org.id);
        throw createErr || new Error("Failed to create the admin account");
      }

      const newUserId = created.user.id;

      const cleanup = async () => {
        await admin.auth.admin.deleteUser(newUserId);
        await admin.from("organizations").delete().eq("id", org.id);
      };

      const { error: roleErr } = await admin
        .from("user_roles")
        .insert({ user_id: newUserId, role: "admin", organization_id: org.id });
      if (roleErr) {
        await cleanup();
        throw roleErr;
      }

      const { error: memberErr } = await admin
        .from("user_organizations")
        .upsert({ user_id: newUserId, organization_id: org.id, is_super_admin: false });
      if (memberErr) {
        await cleanup();
        throw memberErr;
      }

      await admin.from("profiles").update({ organization_id: org.id }).eq("user_id", newUserId);

      // Give the new company its own default overtime settings
      await admin.from("overtime_settings").insert({
        organization_id: org.id,
        regular_hours_per_day: 8,
        overtime_multiplier: 1.0,
        double_overtime_multiplier: 2.0,
        double_overtime_threshold_hours: 12,
      });

      return json({ success: true, organization_id: org.id, user_id: newUserId });
    }

    if (action === "add_admin") {
      const { organization_id, email, password, first_name, last_name } = body;
      if (!organization_id || !email || !password || password.length < 6) {
        return json({ error: "Company, email and a password of at least 6 characters are required" }, 400);
      }

      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: first_name ?? "",
          last_name: last_name ?? "",
          organization_id,
        },
      });
      if (createErr || !created.user) throw createErr || new Error("Failed to create the admin account");

      const newUserId = created.user.id;

      const { error: roleErr } = await admin
        .from("user_roles")
        .insert({ user_id: newUserId, role: "admin", organization_id });
      if (roleErr) {
        await admin.auth.admin.deleteUser(newUserId);
        throw roleErr;
      }

      await admin
        .from("user_organizations")
        .upsert({ user_id: newUserId, organization_id, is_super_admin: false });
      await admin.from("profiles").update({ organization_id }).eq("user_id", newUserId);

      return json({ success: true, user_id: newUserId });
    }

    if (action === "set_active") {
      const { organization_id, is_active } = body;
      if (!organization_id || typeof is_active !== "boolean") {
        return json({ error: "organization_id and is_active are required" }, 400);
      }
      const { error } = await admin
        .from("organizations")
        .update({ is_active })
        .eq("id", organization_id);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "list_admins") {
      const { organization_id } = body;
      if (!organization_id) return json({ error: "organization_id is required" }, 400);

      const { data: roles, error: rolesErr } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("organization_id", organization_id)
        .eq("role", "admin");
      if (rolesErr) throw rolesErr;

      const ids = [...new Set((roles ?? []).map((r: any) => r.user_id))];
      if (ids.length === 0) return json({ success: true, admins: [] });

      const { data: profiles } = await admin
        .from("profiles")
        .select("user_id, email, first_name, last_name, created_at")
        .in("user_id", ids);

      const admins = ids.map((id) => {
        const p = (profiles ?? []).find((x: any) => x.user_id === id);
        return {
          user_id: id,
          email: p?.email ?? "",
          first_name: p?.first_name ?? "",
          last_name: p?.last_name ?? "",
          created_at: p?.created_at ?? null,
        };
      });

      return json({ success: true, admins });
    }

    if (action === "org_stats") {
      const [{ data: orgs }, { data: employees }, { data: workers }, { data: roles }] = await Promise.all([
        admin.from("organizations").select("id"),
        admin.from("employees").select("organization_id"),
        admin.from("workers").select("organization_id"),
        admin.from("user_roles").select("user_id, role, organization_id"),
      ]);

      const stats = (orgs ?? []).map((o: any) => {
        const emp = (employees ?? []).filter((e: any) => e.organization_id === o.id).length;
        const wrk = (workers ?? []).filter((w: any) => w.organization_id === o.id).length;
        const orgRoles = (roles ?? []).filter((r: any) => r.organization_id === o.id);
        const admins = new Set(
          orgRoles.filter((r: any) => r.role === "admin").map((r: any) => r.user_id),
        ).size;
        const encoders = new Set(
          orgRoles.filter((r: any) => r.role === "encoder").map((r: any) => r.user_id),
        ).size;
        return {
          organization_id: o.id,
          employees: emp,
          workers: wrk,
          admins,
          encoders,
          total: emp + wrk + admins + encoders,
        };
      });

      return json({ success: true, stats });
    }

    if (action === "reset_admin_password") {
      const { user_id, new_password } = body;
      if (!user_id || !new_password || new_password.length < 6) {
        return json({ error: "A password of at least 6 characters is required" }, 400);
      }
      const { error } = await admin.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("create-company-admin error:", e);
    return json({ error: e.message || "Internal error" }, 500);
  }
});
