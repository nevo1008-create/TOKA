import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.107.0";

type PlayerReportRow = {
  id: string;
  reporter_player_id: string;
  reported_player_id: string | null;
  related_lobby_id: string | null;
  report_type: string;
  report_context: string;
  message: string;
  diagnostics_opt_in: boolean;
  contact_opt_in: boolean;
  email_notification_status: string;
  support_email_snapshot: string;
  client_context: Record<string, unknown>;
  created_at: string;
};

type PlayerRow = {
  id: string;
  auth_user_id?: string | null;
  display_name: string;
  area: string;
  level: string;
};

type LobbyRow = {
  id: string;
  title: string;
  starts_at: string;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase function environment is missing." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const token = getBearerToken(request.headers.get("Authorization"));

  if (!token) {
    return jsonResponse({ error: "Missing user session." }, 401);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return jsonResponse({ error: "Invalid user session." }, 401);
  }

  const body = await request.json().catch(() => null) as { reportId?: unknown } | null;
  const reportId = typeof body?.reportId === "string" ? body.reportId : null;

  if (!reportId) {
    return jsonResponse({ error: "Missing reportId." }, 400);
  }

  const { data: reportData, error: reportError } = await supabase
    .from("player_reports")
    .select("*")
    .eq("id", reportId)
    .single();
  const report = reportData as PlayerReportRow | null;

  if (reportError || !report) {
    return jsonResponse({ error: "Report not found." }, 404);
  }

  const reporter = await getPlayer(supabase, report.reporter_player_id, true);

  if (!reporter || reporter.auth_user_id !== userData.user.id) {
    return jsonResponse({ error: "Report does not belong to this user." }, 403);
  }

  if (report.email_notification_status === "sent") {
    return jsonResponse({ ok: true, skipped: "already_sent" });
  }

  await markReportEmailNotification(supabase, report.id, {
    email_notification_attempted_at: new Date().toISOString(),
    email_notification_error: null,
    email_notification_status: "pending",
  });

  if (!resendApiKey) {
    const message = "Missing RESEND_API_KEY secret.";
    await markReportEmailNotification(supabase, report.id, {
      email_notification_error: message,
      email_notification_status: "failed",
    });

    return jsonResponse({ error: message }, 500);
  }

  const [reportedPlayer, lobby] = await Promise.all([
    report.reported_player_id ? getPlayer(supabase, report.reported_player_id, false) : Promise.resolve(null),
    report.related_lobby_id ? getLobby(supabase, report.related_lobby_id) : Promise.resolve(null),
  ]);

  const supportTo = Deno.env.get("REPORT_SUPPORT_TO") ?? report.support_email_snapshot ?? "support@toca-ftv.com";
  const supportFrom = Deno.env.get("REPORT_SUPPORT_FROM") ?? "TOCA Reports <support@toca-ftv.com>";
  const email = buildReportEmail({ lobby, report, reportedPlayer, reporter, supportTo });
  const resendResponse = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: supportFrom,
      html: email.html,
      subject: email.subject,
      text: email.text,
      to: [supportTo],
    }),
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!resendResponse.ok) {
    const message = await getResponseError(resendResponse);
    await markReportEmailNotification(supabase, report.id, {
      email_notification_error: message,
      email_notification_status: "failed",
    });

    return jsonResponse({ error: message }, 502);
  }

  await markReportEmailNotification(supabase, report.id, {
    email_notification_error: null,
    email_notification_sent_at: new Date().toISOString(),
    email_notification_status: "sent",
  });

  return jsonResponse({ ok: true });
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}

function getBearerToken(value: string | null) {
  const prefix = "Bearer ";

  return value?.startsWith(prefix) ? value.slice(prefix.length).trim() : null;
}

async function getPlayer(
  supabase: SupabaseClient,
  playerId: string,
  includeAuthUserId: boolean,
): Promise<PlayerRow | null> {
  const columns = includeAuthUserId
    ? "id, auth_user_id, display_name, area, level"
    : "id, display_name, area, level";
  const { data, error } = await supabase
    .from("players")
    .select(columns)
    .eq("id", playerId)
    .single();

  if (error) {
    return null;
  }

  return data as PlayerRow;
}

async function getLobby(
  supabase: SupabaseClient,
  lobbyId: string,
): Promise<LobbyRow | null> {
  const { data, error } = await supabase
    .from("lobbies")
    .select("id, title, starts_at")
    .eq("id", lobbyId)
    .single();

  if (error) {
    return null;
  }

  return data as LobbyRow;
}

async function markReportEmailNotification(
  supabase: SupabaseClient,
  reportId: string,
  patch: Record<string, string | null>,
) {
  await supabase
    .from("player_reports")
    .update(patch)
    .eq("id", reportId);
}

function buildReportEmail({
  lobby,
  report,
  reportedPlayer,
  reporter,
  supportTo,
}: {
  lobby: LobbyRow | null;
  report: PlayerReportRow;
  reportedPlayer: PlayerRow | null;
  reporter: PlayerRow;
  supportTo: string;
}) {
  const subject = `New TOCA report: ${formatLabel(report.report_type)} (${report.id.slice(0, 8)})`;
  const rows = [
    ["Report ID", report.id],
    ["Created", report.created_at],
    ["Type", formatLabel(report.report_type)],
    ["Context", formatLabel(report.report_context)],
    ["Reporter", formatPlayer(reporter)],
    ["Reported player", reportedPlayer ? formatPlayer(reportedPlayer) : "None"],
    ["Related lobby", lobby ? `${lobby.title} (${lobby.id})` : "None"],
    ["Can contact reporter", report.contact_opt_in ? "Yes" : "No"],
    ["Diagnostics included", report.diagnostics_opt_in ? "Yes" : "No"],
    ["Support inbox", supportTo],
  ];
  const details = report.message.trim() || "No details provided.";
  const context = formatClientContext(report.client_context ?? {});
  const text = [
    subject,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Details:",
    details,
    "",
    "Client context:",
    context,
  ].join("\n");
  const htmlRows = rows
    .map(([label, value]) => `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("");
  const html = `
    <h1>${escapeHtml(subject)}</h1>
    <table cellpadding="6" cellspacing="0">${htmlRows}</table>
    <h2>Details</h2>
    <p>${escapeHtml(details).replaceAll("\n", "<br>")}</p>
    <h2>Client context</h2>
    <p>${escapeHtml(context).replaceAll("\n", "<br>")}</p>
  `;

  return { html, subject, text };
}

function formatPlayer(player: PlayerRow) {
  return `${player.display_name} (${player.id}) - ${player.level}, ${player.area}`;
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replaceAll(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatClientContext(context: Record<string, unknown>) {
  const entries = Object.entries(context);

  if (entries.length === 0) {
    return "No client context provided.";
  }

  return entries
    .map(([key, value]) => `${formatLabel(key)}: ${formatContextValue(value)}`)
    .join("\n");
}

function formatContextValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "None";
  }

  if (typeof value === "string") {
    return formatLabel(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0
      ? value.map((item) => formatContextValue(item)).join(", ")
      : "None";
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);

    return entries.length > 0
      ? entries.map(([key, item]) => `${formatLabel(key)}: ${formatContextValue(item)}`).join("; ")
      : "None";
  }

  return String(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function getResponseError(response: Response) {
  const text = await response.text().catch(() => "");

  if (!text) {
    return `Email provider returned HTTP ${response.status}.`;
  }

  return `Email provider returned HTTP ${response.status}: ${text.slice(0, 500)}`;
}
