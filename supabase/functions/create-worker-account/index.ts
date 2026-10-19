import { createClient } from "https://esm.sh/@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles").select("role").eq("user_id", user.id)
      .in("role", ["admin", "encoder"]).maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Admin or Encoder role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { worker_id, email, password } = await req.json();
    if (!worker_id || !email || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: "worker_id, email, password (min 6 chars) required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Company of the admin/encoder making the request
    const { data: callerOrg } = await admin
      .from("user_organizations").select("organization_id").eq("user_id", user.id).maybeSingle();
    const organizationId = callerOrg?.organization_id ?? null;

    // Create auth user (auto-confirmed)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: organizationId ? { organization_id: organizationId } : {},
    });
    if (createErr || !created.user) throw createErr || new Error("Failed to create user");

    const newUserId = created.user.id;

    // Attach to worker row
    const { error: updErr } = await admin
      .from("workers").update({ user_id: newUserId, email }).eq("id", worker_id);
    if (updErr) {
      await admin.auth.admin.deleteUser(newUserId);
      throw updErr;
    }

    // Assign worker role (within the same company)
    const { error: roleErr } = await admin
      .from("user_roles").insert({ user_id: newUserId, role: "worker", organization_id: organizationId });
    if (roleErr) {
      await admin.auth.admin.deleteUser(newUserId);
      throw roleErr;
    }

    if (organizationId) {
      await admin.from("user_organizations")
        .upsert({ user_id: newUserId, organization_id: organizationId });
      await admin.from("profiles")
        .update({ organization_id: organizationId }).eq("user_id", newUserId);
    }

    return new Response(JSON.stringify({ success: true, user_id: newUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("create-worker-account error:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
