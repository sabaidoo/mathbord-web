import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// Wrapper: skip send if no API key configured (dev/CI)
async function sendEmail(params: Parameters<Resend["emails"]["send"]>[0]) {
  const r = getResend();
  if (!r) {
    console.log("[email] Skipping (no RESEND_API_KEY):", typeof params.to === "string" ? params.to : params.to?.[0]);
    return;
  }
  await r.emails.send(params);
}

const FROM = process.env.FROM_EMAIL ?? "hello@mathbord.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Shared HTML shell
// ---------------------------------------------------------------------------

function emailWrapper(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${previewText}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F0F2F4;font-family:'DM Sans',Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&#847;&zwj;&zwnj;&nbsp;&#847;&zwj;&zwnj;&nbsp;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F2F4;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#06A5FF;border-radius:10px;padding:12px 24px;">
                    <span style="font-family:'DM Sans',Inter,sans-serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Mathbord</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;border:1px solid #E4E8EE;padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#9CA3AF;">
                © ${new Date().getFullYear()} Mathbord — Canadian Tutoring Platform
              </p>
              <p style="margin:0;font-size:12px;">
                <a href="${APP_URL}/privacy-policy" style="color:#06A5FF;text-decoration:none;">Privacy Policy</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/terms-of-service" style="color:#06A5FF;text-decoration:none;">Terms of Service</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Shared style constants (inline, for email-client compatibility)
// ---------------------------------------------------------------------------

const CTAButton = (href: string, label: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:#06A5FF;border-radius:8px;">
      <a href="${href}" style="display:inline-block;padding:13px 28px;font-family:'DM Sans',Inter,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${label}</a>
    </td>
  </tr>
</table>`;

const sessionTable = (rows: [string, string][]) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-collapse:collapse;">
  ${rows
    .map(
      ([label, value]) => `
  <tr>
    <td style="padding:9px 12px;font-size:13px;font-weight:600;color:#6B7280;background-color:#F9FAFB;border:1px solid #E5E7EB;white-space:nowrap;width:140px;">${label}</td>
    <td style="padding:9px 12px;font-size:14px;color:#1F1F1F;background-color:#ffffff;border:1px solid #E5E7EB;">${value}</td>
  </tr>`
    )
    .join("")}
</table>`;

// ---------------------------------------------------------------------------
// Guard helper — skip send if API key is not configured
// ---------------------------------------------------------------------------

function hasApiKey(): boolean {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is not set — skipping email send.");
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// 1. sendInviteEmail
// ---------------------------------------------------------------------------

export async function sendInviteEmail(params: {
  to: string;
  toName: string;
  personalNote?: string | null;
  token: string;
  adminName: string;
}): Promise<void> {
  if (!hasApiKey()) return;

  const { to, toName, personalNote, token, adminName } = params;
  const inviteUrl = `${APP_URL}/register?token=${token}`;

  const noteBlock = personalNote
    ? `<blockquote style="margin:20px 0;padding:14px 18px;background-color:#F0F9FF;border-left:4px solid #06A5FF;border-radius:4px;font-size:14px;color:#374151;font-style:italic;">"${personalNote}"</blockquote>`
    : "";

  const body = `
<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1F1F1F;">You're invited!</h2>
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${toName},</p>
<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
  <strong>${adminName}</strong> has invited you to set up your Mathbord tutoring account.
  Mathbord is a Canadian tutoring platform that connects tutors with students and families —
  click the button below to create your account and get started.
</p>
${noteBlock}
${CTAButton(inviteUrl, "Accept Invitation")}
<p style="margin:16px 0 0;font-size:13px;color:#9CA3AF;">
  This invitation link expires in <strong>7 days</strong>. If you did not expect this email, you can safely ignore it.
</p>`;

  await sendEmail({
    from: `Mathbord <${FROM}>`,
    to,
    replyTo: FROM,
    subject: `You're invited to Mathbord \u2014 ${toName}`,
    html: emailWrapper(body, `${adminName} has invited you to Mathbord`),
  });
}

// ---------------------------------------------------------------------------
// 2. sendBookingConfirmation
// ---------------------------------------------------------------------------

export async function sendBookingConfirmation(params: {
  tutorEmail: string;
  tutorName: string;
  clientEmail: string;
  clientName: string;
  studentName: string;
  subject: string | null;
  date: string;
  startTime: string;
  durationMinutes: number;
  lessonspaceUrl?: string | null;
}): Promise<void> {
  if (!hasApiKey()) return;

  const {
    tutorEmail,
    tutorName,
    clientEmail,
    clientName,
    studentName,
    subject,
    date,
    startTime,
    durationMinutes,
    lessonspaceUrl,
  } = params;

  const emailSubject = `Session Confirmed \u2014 ${studentName} on ${date}`;

  const joinBlock = lessonspaceUrl
    ? CTAButton(lessonspaceUrl, "Join Your Session")
    : "";

  function buildBody(recipientName: string): string {
    const rows: [string, string][] = [
      ["Student", studentName],
      ["Date", date],
      ["Time", startTime],
      ["Duration", `${durationMinutes} minutes`],
      ["Subject", subject ?? "General Tutoring"],
    ];

    return `
<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1F1F1F;">Session Confirmed</h2>
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${recipientName},</p>
<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
  Your tutoring session has been confirmed. Here are the details:
</p>
${sessionTable(rows)}
${joinBlock}
<p style="margin:16px 0 0;font-size:13px;color:#9CA3AF;">
  If you need to reschedule or cancel, please contact us as soon as possible.
</p>`;
  }

  await Promise.all([
    sendEmail({
      from: `Mathbord <${FROM}>`,
      to: tutorEmail,
      replyTo: FROM,
      subject: emailSubject,
      html: emailWrapper(buildBody(tutorName), emailSubject),
    }),
    sendEmail({
      from: `Mathbord <${FROM}>`,
      to: clientEmail,
      replyTo: FROM,
      subject: emailSubject,
      html: emailWrapper(buildBody(clientName), emailSubject),
    }),
  ]);
}

// ---------------------------------------------------------------------------
// 3. send24HourReminder
// ---------------------------------------------------------------------------

export async function send24HourReminder(params: {
  tutorEmail: string;
  tutorName: string;
  clientEmail: string;
  clientName: string;
  studentName: string;
  subject: string | null;
  date: string;
  startTime: string;
  durationMinutes: number;
  lessonspaceUrl?: string | null;
}): Promise<void> {
  if (!hasApiKey()) return;

  const {
    tutorEmail,
    tutorName,
    clientEmail,
    clientName,
    studentName,
    subject,
    date,
    startTime,
    durationMinutes,
    lessonspaceUrl,
  } = params;

  const emailSubject = `Reminder: Session Tomorrow \u2014 ${studentName}`;

  const joinBlock = lessonspaceUrl
    ? CTAButton(lessonspaceUrl, "Join Your Session")
    : "";

  function buildBody(recipientName: string): string {
    const rows: [string, string][] = [
      ["Student", studentName],
      ["Date", `${date} (tomorrow)`],
      ["Time", startTime],
      ["Duration", `${durationMinutes} minutes`],
      ["Subject", subject ?? "General Tutoring"],
    ];

    return `
<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1F1F1F;">Session Tomorrow</h2>
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${recipientName},</p>
<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
  This is a friendly reminder that you have a tutoring session <strong>tomorrow</strong>.
  Please make sure you're prepared and ready to join on time.
</p>
${sessionTable(rows)}
${joinBlock}
<p style="margin:16px 0 0;font-size:13px;color:#9CA3AF;">
  If you need to reschedule, please contact us as soon as possible before the session.
</p>`;
  }

  await Promise.all([
    sendEmail({
      from: `Mathbord <${FROM}>`,
      to: tutorEmail,
      replyTo: FROM,
      subject: emailSubject,
      html: emailWrapper(buildBody(tutorName), emailSubject),
    }),
    sendEmail({
      from: `Mathbord <${FROM}>`,
      to: clientEmail,
      replyTo: FROM,
      subject: emailSubject,
      html: emailWrapper(buildBody(clientName), emailSubject),
    }),
  ]);
}

// ---------------------------------------------------------------------------
// 4. sendApplicationReceived
// ---------------------------------------------------------------------------

export async function sendApplicationReceived(params: {
  to: string;
  applicantName: string;
  subjects: string[];
}): Promise<void> {
  if (!hasApiKey()) return;

  const { to, applicantName, subjects } = params;

  const subjectList =
    subjects.length > 0
      ? `<ul style="margin:12px 0;padding-left:20px;">${subjects.map((s) => `<li style="font-size:14px;color:#374151;margin-bottom:4px;">${s}</li>`).join("")}</ul>`
      : `<p style="font-size:14px;color:#374151;margin:12px 0;">No subjects listed.</p>`;

  const body = `
<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1F1F1F;">Application Received</h2>
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${applicantName},</p>
<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
  Thank you for applying to the <strong>Mathbord Tutor Program</strong>! We've received your application
  and our team will review it carefully.
</p>
<p style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:600;">Subjects you applied to teach:</p>
${subjectList}
<p style="margin:16px 0 0;font-size:14px;color:#374151;line-height:1.6;">
  You can expect to hear back from us within <strong>5 business days</strong>.
  If you have any questions in the meantime, reply to this email and we'll be happy to help.
</p>
<p style="margin:16px 0 0;font-size:13px;color:#9CA3AF;">
  We appreciate your interest in helping students across Canada reach their potential.
</p>`;

  await sendEmail({
    from: `Mathbord <${FROM}>`,
    to,
    replyTo: FROM,
    subject: "Application received \u2014 Mathbord Tutor Program",
    html: emailWrapper(body, "We received your Mathbord tutor application"),
  });
}

// ---------------------------------------------------------------------------
// 5. sendApplicationStatus
// ---------------------------------------------------------------------------

export async function sendApplicationStatus(params: {
  to: string;
  applicantName: string;
  newStatus: "interview" | "approved" | "rejected";
  adminNote?: string;
}): Promise<void> {
  if (!hasApiKey()) return;

  const { to, applicantName, newStatus, adminNote } = params;

  const noteBlock = adminNote
    ? `<blockquote style="margin:20px 0;padding:14px 18px;background-color:#F9FAFB;border-left:4px solid #E5E7EB;border-radius:4px;font-size:14px;color:#374151;">${adminNote}</blockquote>`
    : "";

  const configs: Record<
    "interview" | "approved" | "rejected",
    { subject: string; heading: string; message: string; accentColor: string }
  > = {
    interview: {
      subject: "We\u2019d like to schedule an interview \u2014 Mathbord",
      heading: "Interview Invitation",
      message: `We were impressed by your application and would like to invite you to an interview.
        A member of our team will reach out shortly with available times.
        Please reply to this email if you have any scheduling constraints.`,
      accentColor: "#06A5FF",
    },
    approved: {
      subject: "Welcome to Mathbord! Your tutor account is ready.",
      heading: "You\u2019re Approved!",
      message: `Congratulations and welcome to the Mathbord team! Your tutor account has been approved.
        You should receive a separate email with your login details, or you can contact your Mathbord
        administrator to get your account credentials and complete your onboarding.`,
      accentColor: "#10B981",
    },
    rejected: {
      subject: "Re: Mathbord Tutor Application",
      heading: "Application Update",
      message: `Thank you for your interest in joining Mathbord as a tutor. After careful review,
        we are unable to move forward with your application at this time.
        We appreciate the time you invested and encourage you to reapply in the future
        as our needs evolve. We wish you all the best in your tutoring career.`,
      accentColor: "#6B7280",
    },
  };

  const { subject, heading, message, accentColor } = configs[newStatus];

  const body = `
<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1F1F1F;">${heading}</h2>
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${applicantName},</p>
<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">${message}</p>
${noteBlock}
<div style="margin-top:20px;padding:12px 16px;background-color:${accentColor}1A;border-radius:8px;border:1px solid ${accentColor}33;">
  <p style="margin:0;font-size:13px;color:#374151;">
    Have questions? Simply reply to this email and a member of our team will get back to you.
  </p>
</div>`;

  await sendEmail({
    from: `Mathbord <${FROM}>`,
    to,
    replyTo: FROM,
    subject,
    html: emailWrapper(body, subject),
  });
}

// ---------------------------------------------------------------------------
// 6. sendPasswordReset
// ---------------------------------------------------------------------------

export async function sendPasswordReset(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  if (!hasApiKey()) return;

  const { to, name, resetUrl } = params;

  const body = `
<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1F1F1F;">Reset Your Password</h2>
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${name},</p>
<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
  Someone requested a password reset for your Mathbord account. If this was you,
  click the button below to choose a new password.
</p>
${CTAButton(resetUrl, "Reset My Password")}
<div style="margin-top:20px;padding:12px 16px;background-color:#FFF7ED;border-radius:8px;border:1px solid #FED7AA;">
  <p style="margin:0;font-size:13px;color:#92400E;">
    <strong>This link expires in 1 hour.</strong> If you did not request a password reset,
    you can safely ignore this email — your password will not change.
  </p>
</div>`;

  await sendEmail({
    from: `Mathbord <${FROM}>`,
    to,
    replyTo: FROM,
    subject: "Reset your Mathbord password",
    html: emailWrapper(body, "Password reset request for your Mathbord account"),
  });
}

// ---------------------------------------------------------------------------
// 7. sendAdminConsultationAlert
// ---------------------------------------------------------------------------

export async function sendAdminConsultationAlert(params: {
  adminEmail: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  province?: string | null;
  subjects: string[];
  gradeLevel?: string | null;
  goals?: string | null;
}): Promise<void> {
  if (!hasApiKey()) return;

  const {
    adminEmail,
    firstName,
    lastName,
    email,
    phone,
    province,
    subjects,
    gradeLevel,
    goals,
  } = params;

  const rows: [string, string][] = [
    ["Name", `${firstName} ${lastName}`],
    ["Email", `<a href="mailto:${email}" style="color:#06A5FF;text-decoration:none;">${email}</a>`],
    ["Phone", phone ?? "Not provided"],
    ["Province", province ?? "Not provided"],
    ["Grade Level", gradeLevel ?? "Not provided"],
    ["Subjects", subjects.length > 0 ? subjects.join(", ") : "Not specified"],
    ["Goals", goals ?? "Not provided"],
  ];

  const dashboardUrl = `${APP_URL}/dashboard`;

  const body = `
<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1F1F1F;">New Consultation Request</h2>
<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
  A new consultation request has been submitted via the Mathbord website. Details are below:
</p>
${sessionTable(rows)}
${CTAButton(dashboardUrl, "View in Dashboard")}
<p style="margin:0;font-size:13px;color:#9CA3AF;">
  Please follow up with ${firstName} within 1 business day.
</p>`;

  await sendEmail({
    from: `Mathbord <${FROM}>`,
    to: adminEmail,
    replyTo: email,
    subject: `New Consultation Request \u2014 ${firstName} ${lastName}`,
    html: emailWrapper(
      body,
      `New consultation from ${firstName} ${lastName}`
    ),
  });
}
