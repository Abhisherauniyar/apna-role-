import { getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import * as nodemailer from 'nodemailer';

const FIRESTORE_DATABASE_ID = 'ai-studio-c173a0fa-e371-475b-8120-66098d78a2b1';

const smtpHostSecret = defineSecret('SMTP_HOST');
const smtpPortSecret = defineSecret('SMTP_PORT');
const smtpUserSecret = defineSecret('SMTP_USER');
const smtpPassSecret = defineSecret('SMTP_PASS');
const smtpFromSecret = defineSecret('SMTP_FROM');

const app = getApps().length > 0 ? getApps()[0] : initializeApp();
const db = getFirestore(app, FIRESTORE_DATABASE_ID);

interface ApplicationDoc {
  id: string;
  jobId: string;
  listingType: 'job' | 'internship';
  jobTitle: string;
  companyId: string;
  companyName: string;
  employerId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  status: string;
  interviewDate?: string;
  interviewMode?: string;
  interviewLink?: string;
  recruiterNotes?: string;
}

const NOTIFY_STATUSES = new Set(['Shortlisted', 'Interview Scheduled']);

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readEnvOrSecret(secret: ReturnType<typeof defineSecret>, envKey: string): string {
  try {
    const val = secret.value();
    if (val && val.trim()) return val.trim();
  } catch {
    // Fallback to process.env when running locally or with .env vars
  }
  return (process.env[envKey] || '').trim();
}

function buildEmailContent(
  data: ApplicationDoc,
  dashboardUrl: string
): {
  subject: string;
  text: string;
  html: string;
} {
  const candidate = data.candidateName || 'Candidate';
  const role = data.jobTitle || 'Role';
  const company = data.companyName || 'Hiring Partner';

  if (data.status === 'Interview Scheduled') {
    const dateLine = data.interviewDate || 'To be confirmed by recruiter';
    const modeLine = data.interviewMode || 'Video / Online';
    const linkLine = data.interviewLink || '';

    const subject = `Interview Scheduled: ${role} at ${company} | Apna Role`;
    const text = [
      `Namaste ${candidate},`,
      '',
      `Great news! ${company} has scheduled an interview for your application to "${role}".`,
      '',
      `Interview Date & Time: ${dateLine}`,
      `Interview Mode: ${modeLine}`,
      linkLine ? `Meeting Link / Venue: ${linkLine}` : '',
      data.recruiterNotes ? `Recruiter Notes: ${data.recruiterNotes}` : '',
      '',
      `View your application details: ${dashboardUrl}`,
      '',
      'Best regards,',
      'Team Apna Role',
      'Sahi Naukri, Sahi Mauka – Apna Role Ke Saath!',
    ]
      .filter(Boolean)
      .join('\n');

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #0B1B3B; padding: 24px 28px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Apna Role</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #67e8f9;">Interview Invitation</p>
        </div>
        <div style="padding: 28px; background: #ffffff;">
          <p style="margin: 0 0 14px; font-size: 15px;">Namaste <strong>${escapeHtml(candidate)}</strong>,</p>
          <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #334155;">
            Congratulations! <strong>${escapeHtml(company)}</strong> has scheduled an interview for your application to <strong>${escapeHtml(role)}</strong>.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 18px; font-size: 13px;">
            <p style="margin: 0 0 6px;"><strong>Date &amp; Time:</strong> ${escapeHtml(dateLine)}</p>
            <p style="margin: 0 0 6px;"><strong>Mode:</strong> ${escapeHtml(modeLine)}</p>
            ${linkLine ? `<p style="margin: 0 0 6px;"><strong>Link / Location:</strong> <a href="${escapeHtml(linkLine)}" style="color: #1d4ed8;">${escapeHtml(linkLine)}</a></p>` : ''}
            ${data.recruiterNotes ? `<p style="margin: 0;"><strong>Notes:</strong> ${escapeHtml(data.recruiterNotes)}</p>` : ''}
          </div>
          <a href="${escapeHtml(dashboardUrl)}" style="display: inline-block; padding: 10px 18px; background: #1d4ed8; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">
            Open Job Seeker Dashboard
          </a>
        </div>
        <div style="background: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          Apna Role · Sahi Naukri, Sahi Mauka – Apna Role Ke Saath!
        </div>
      </div>
    `;
    return { subject, text, html };
  }

  // Status: 'Shortlisted'
  const subject = `You've Been Shortlisted: ${role} at ${company} | Apna Role`;
  const text = [
    `Namaste ${candidate},`,
    '',
    `Congratulations! Your application for "${role}" at ${company} has been Shortlisted by the hiring team.`,
    data.recruiterNotes ? `\nRecruiter Notes: ${data.recruiterNotes}` : '',
    '',
    `Track your application timeline: ${dashboardUrl}`,
    '',
    'Best regards,',
    'Team Apna Role',
    'Sahi Naukri, Sahi Mauka – Apna Role Ke Saath!',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0B1B3B; padding: 24px 28px; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Apna Role</h1>
        <p style="margin: 4px 0 0; font-size: 12px; color: #67e8f9;">Application Status Update</p>
      </div>
      <div style="padding: 28px; background: #ffffff;">
        <p style="margin: 0 0 14px; font-size: 15px;">Namaste <strong>${escapeHtml(candidate)}</strong>,</p>
        <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #334155;">
          Great news! <strong>${escapeHtml(company)}</strong> has updated your application status for <strong>${escapeHtml(role)}</strong> to <strong>Shortlisted</strong>.
        </p>
        ${data.recruiterNotes ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 18px; font-size: 13px;"><strong>Recruiter Note:</strong> ${escapeHtml(data.recruiterNotes)}</div>` : ''}
        <a href="${escapeHtml(dashboardUrl)}" style="display: inline-block; padding: 10px 18px; background: #1d4ed8; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">
          View Application Status
        </a>
      </div>
      <div style="background: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
        Apna Role · Sahi Naukri, Sahi Mauka – Apna Role Ke Saath!
      </div>
    </div>
  `;

  return { subject, text, html };
}

export const onApplicationStatusEmailNotify = onDocumentUpdated(
  {
    document: 'applications/{applicationId}',
    database: FIRESTORE_DATABASE_ID,
    region: 'asia-south1',
    secrets: [smtpHostSecret, smtpPortSecret, smtpUserSecret, smtpPassSecret, smtpFromSecret],
  },
  async (event) => {
    const beforeData = event.data?.before.data() as ApplicationDoc | undefined;
    const afterData = event.data?.after.data() as ApplicationDoc | undefined;

    if (!beforeData || !afterData) {
      return;
    }

    if (beforeData.status === afterData.status) {
      return;
    }

    if (!NOTIFY_STATUSES.has(afterData.status)) {
      return;
    }

    let recipientEmail = (afterData.candidateEmail || '').trim();
    if ((!recipientEmail || !recipientEmail.includes('@')) && afterData.candidateId) {
      try {
        const userSnap = await db.collection('users').doc(afterData.candidateId).get();
        const fallbackEmail = userSnap.data()?.email;
        if (typeof fallbackEmail === 'string') {
          recipientEmail = fallbackEmail.trim();
        }
      } catch (lookupErr) {
        logger.warn('Failed fallback user email lookup', {
          candidateId: afterData.candidateId,
          error: lookupErr instanceof Error ? lookupErr.message : String(lookupErr),
        });
      }
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      logger.warn('Skipping email notification: invalid or missing candidateEmail', {
        applicationId: event.params.applicationId,
      });
      return;
    }

    const host = readEnvOrSecret(smtpHostSecret, 'SMTP_HOST');
    const port = Number(readEnvOrSecret(smtpPortSecret, 'SMTP_PORT') || '587');
    const user = readEnvOrSecret(smtpUserSecret, 'SMTP_USER');
    const pass = readEnvOrSecret(smtpPassSecret, 'SMTP_PASS');
    const from = readEnvOrSecret(smtpFromSecret, 'SMTP_FROM') || `Apna Role <${user}>`;
    const baseUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
    const dashboardUrl = baseUrl ? `${baseUrl}/dashboard` : 'https://apnarole.in/dashboard';

    const { subject, text, html } = buildEmailContent(afterData, dashboardUrl);
    const logId = `mail_${event.params.applicationId}_${afterData.status.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;

    if (!host || !user || !pass) {
      logger.error('SMTP configuration missing; cannot send automated email.', {
        applicationId: event.params.applicationId,
      });
      await db.collection('emailLogs').doc(logId).set({
        id: logId,
        applicationId: event.params.applicationId,
        candidateId: afterData.candidateId,
        employerId: afterData.employerId,
        recipientEmail,
        statusTriggered: afterData.status,
        subject,
        deliveryStatus: 'failed_missing_smtp',
        errorMessage: 'SMTP environment variables or secrets (SMTP_HOST, SMTP_USER, SMTP_PASS) are not configured.',
        createdAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from,
        to: recipientEmail,
        subject,
        text,
        html,
      });

      logger.info('Automated status email sent', {
        applicationId: event.params.applicationId,
        status: afterData.status,
        messageId: info.messageId,
      });

      await db.collection('emailLogs').doc(logId).set({
        id: logId,
        applicationId: event.params.applicationId,
        candidateId: afterData.candidateId,
        employerId: afterData.employerId,
        recipientEmail,
        statusTriggered: afterData.status,
        subject,
        deliveryStatus: 'sent',
        messageId: info.messageId || '',
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to send automated status email', {
        applicationId: event.params.applicationId,
        error: errMsg,
      });

      await db.collection('emailLogs').doc(logId).set({
        id: logId,
        applicationId: event.params.applicationId,
        candidateId: afterData.candidateId,
        employerId: afterData.employerId,
        recipientEmail,
        statusTriggered: afterData.status,
        subject,
        deliveryStatus: 'failed',
        errorMessage: errMsg.slice(0, 400),
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }
);
