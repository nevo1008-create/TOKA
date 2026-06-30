import { supabase } from '../../lib/supabase';
import type { DbPlayerReport, Json } from '../../lib/database.types';
import type { PlayerReport, ReportContext, ReportType } from '../../types';

export type SubmitPlayerReportInput = {
  contactOptIn: boolean;
  clientContext?: Record<string, unknown>;
  diagnosticsOptIn: boolean;
  message: string;
  relatedLobbyId?: string | null;
  reportedPlayerId?: string | null;
  reportContext: ReportContext;
  reportType: ReportType;
};

export async function submitPlayerReport(input: SubmitPlayerReportInput): Promise<PlayerReport> {
  const reportedPlayerId = normalizeOptionalUuid(input.reportedPlayerId);
  const relatedLobbyId = normalizeOptionalUuid(input.relatedLobbyId);

  const { data, error } = await supabase.rpc('submit_player_report', {
    can_contact: input.contactOptIn,
    include_diagnostics: input.diagnosticsOptIn,
    submitted_client_context: (input.clientContext ?? {}) as Json,
    submitted_message: input.message,
    submitted_report_context: input.reportContext,
    submitted_report_type: input.reportType,
    target_related_lobby_id: relatedLobbyId,
    target_reported_player_id: reportedPlayerId,
  });

  if (error) {
    throw new Error(error.message);
  }

  const report = mapDbPlayerReportToPlayerReport(data as DbPlayerReport);

  await notifySupportOfReport(report.id);

  return report;
}

function mapDbPlayerReportToPlayerReport(report: DbPlayerReport): PlayerReport {
  return {
    clientContext: toClientContext(report.client_context),
    contactOptIn: report.contact_opt_in,
    createdAt: report.created_at,
    diagnosticsOptIn: report.diagnostics_opt_in,
    emailNotificationAttemptedAt: report.email_notification_attempted_at,
    emailNotificationError: report.email_notification_error,
    emailNotificationSentAt: report.email_notification_sent_at,
    emailNotificationStatus: report.email_notification_status,
    id: report.id,
    message: report.message,
    relatedLobbyId: report.related_lobby_id,
    reportedPlayerId: report.reported_player_id,
    reporterPlayerId: report.reporter_player_id,
    reportContext: report.report_context,
    reportType: report.report_type,
    status: report.status,
    supportEmailSnapshot: report.support_email_snapshot,
    updatedAt: report.updated_at,
  };
}

function toClientContext(value: Json): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return {};
  }

  return Object.fromEntries(Object.entries(value));
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeOptionalUuid(value?: string | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  return isUuid(trimmedValue) ? trimmedValue : null;
}

async function notifySupportOfReport(reportId: string) {
  try {
    const { error } = await supabase.functions.invoke('notify-report-support', {
      body: { reportId },
    });

    if (error) {
      console.warn('Report was saved, but the support email notification was not sent.', error.message);
    }
  } catch (error) {
    console.warn('Report was saved, but the support email notification request failed.', error);
  }
}
