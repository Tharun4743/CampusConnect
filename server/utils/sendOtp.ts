import nodemailer from 'nodemailer';
import axios from 'axios';

export async function sendOtp(
  email: string,
  otp: string,
  purpose: string
): Promise<{ success: boolean; error?: string }> {
  // Always log OTP during development so login/signup can work without SMTP
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n============================`);
    console.log(`OTP for ${email} (${purpose}): ${otp}`);
    console.log(`============================\n`);
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim();
  const smtpFrom = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || process.env.EMAIL_USER?.trim() || process.env.GMAIL_USER?.trim() || "noreply@campusconnect.dev";

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;
                border:1px solid #e5e7eb;border-radius:8px;padding:32px;">
      <h2 style="color:#0EA5E9;margin-bottom:8px;">Campus Placement Portal</h2>
      <p style="color:#374151;">Your One-Time Password is:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;
                  color:#0EA5E9;text-align:center;padding:16px 0;">
        ${otp}
      </div>
      <p style="color:#6B7280;font-size:13px;">
        This OTP is valid for 10 minutes. Do not share it with anyone.
      </p>
    </div>
  `;

  // 1. Try Resend Web API if configured
  if (resendApiKey) {
    console.log(`Attempting to send OTP email to ${email} via Resend HTTP API...`);
    try {
      const fromEmail = smtpFrom.includes("@") && !smtpFrom.includes("gmail.com") && !smtpFrom.includes("yahoo.com") && !smtpFrom.includes("outlook.com")
        ? smtpFrom 
        : "onboarding@resend.dev"; // Resend free tier sandbox restriction fallback

      const response = await axios.post(
        "https://api.resend.com/emails",
        {
          from: `Campus Placement Portal <${fromEmail}>`,
          to: [email],
          subject: `Campus Connect OTP — ${purpose}`,
          html: emailHtml,
        },
        {
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );
      if (response.status === 200 || response.status === 201) {
        console.log(`✅ OTP email sent to ${email} via Resend HTTP API successfully!`);
        return { success: true };
      }
      throw new Error(`Resend API returned status ${response.status}`);
    } catch (resendError: any) {
      const apiErr = resendError?.response?.data || resendError?.message || resendError;
      console.error("Resend API attempt failed:", apiErr);
      return { success: false, error: `Resend API failed: ${JSON.stringify(apiErr)}` };
    }
  }

  // 2. Try SendGrid Web API if configured
  if (sendgridApiKey) {
    console.log(`Attempting to send OTP email to ${email} via SendGrid HTTP API...`);
    try {
      const response = await axios.post(
        "https://api.sendgrid.com/v3/mail/send",
        {
          personalizations: [
            {
              to: [{ email: email }],
              subject: `Campus Connect OTP — ${purpose}`,
            },
          ],
          from: {
            email: smtpFrom,
            name: "Campus Placement Portal",
          },
          content: [
            {
              type: "text/html",
              value: emailHtml,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${sendgridApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );
      if (response.status === 200 || response.status === 202) {
        console.log(`✅ OTP email sent to ${email} via SendGrid HTTP API successfully!`);
        return { success: true };
      }
      throw new Error(`SendGrid API returned status ${response.status}`);
    } catch (sendgridError: any) {
      const apiErr = sendgridError?.response?.data || sendgridError?.message || sendgridError;
      console.error("SendGrid API attempt failed:", apiErr);
      return { success: false, error: `SendGrid API failed: ${JSON.stringify(apiErr)}` };
    }
  }

  // SMTP config (prefer explicit SMTP_* vars; fallback to legacy EMAIL_USER/EMAIL_PASS if present)
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPortRaw = process.env.SMTP_PORT?.trim();
  const smtpPort = smtpPortRaw ? Number(smtpPortRaw) : 587;
  const smtpUser = process.env.SMTP_USER?.trim() || process.env.EMAIL_USER?.trim() || process.env.GMAIL_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim() || process.env.EMAIL_PASS?.trim() || process.env.GMAIL_APP_PASSWORD?.trim();

  // If SMTP is not configured, do not block flows; console logging already happened in dev.
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("SMTP/HTTP email service not fully configured.");
    return { success: false, error: "Email configuration missing on the server. Please set SENDGRID_API_KEY or SMTP parameters." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 5000, // 5 seconds connection timeout
      greetingTimeout: 5000,   // 5 seconds greeting timeout
      socketTimeout: 5000,     // 5 seconds socket timeout
      family: 4,               // Force IPv4 to resolve ENETUNREACH issues on IPv4-only hosts
    } as any);

    // In case of misconfiguration, verify will throw and we catch below.
    await transporter.verify();

    await transporter.sendMail({
      from: `"Campus Placement Portal" <${smtpFrom}>`,
      to: email,
      subject: `Campus Connect OTP — ${purpose}`,
      html: emailHtml,
    });

    return { success: true };
  } catch (error: any) {
    console.error("First SMTP attempt failed:", error?.message || error);

    // If the first attempt used port 587 (or anything else besides 465), try a fallback on port 465 (SSL)
    if (smtpPort !== 465) {
      console.warn("Attempting fallback to port 465 (SSL) over IPv4...");
      try {
        const fallbackTransporter = nodemailer.createTransport({
          host: smtpHost,
          port: 465,
          secure: true,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 5000,
          greetingTimeout: 5000,
          socketTimeout: 5000,
          family: 4,
        } as any);

        await fallbackTransporter.verify();
        await fallbackTransporter.sendMail({
          from: `"Campus Placement Portal" <${smtpFrom}>`,
          to: email,
          subject: `Campus Connect OTP — ${purpose}`,
          html: emailHtml,
        });
        console.log("✅ Fallback SMTP send on port 465 succeeded!");
        return { success: true };
      } catch (fallbackError: any) {
        console.error("Fallback SMTP attempt failed:", fallbackError?.message || fallbackError);
        return {
          success: false,
          error: `Port ${smtpPort} failed (${error.message || error}). Port 465 fallback also failed (${fallbackError.message || fallbackError}).`,
        };
      }
    }

    return { success: false, error: error?.message || "Failed to send OTP via SMTP" };
  }
}

export default sendOtp;

