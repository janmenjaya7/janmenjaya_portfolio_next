/* Sends the admin login code through Resend's REST API (no SDK needed) */

const RESEND_API = process.env.RESEND_API_BASE || "https://api.resend.com";

export class MailError extends Error {}

export async function sendLoginCode(to: string, code: string, minutesValid: number): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new MailError("RESEND_API_KEY is not set.");
  const from = process.env.ADMIN_EMAIL_FROM || "Portfolio Admin <onboarding@resend.dev>";

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;background:#f3f3f4;border-radius:20px;color:#1d1d1f">
    <h1 style="margin:0 0 8px;font-size:22px">Your admin login code</h1>
    <p style="margin:0 0 24px;color:#4a4a4f">Enter this code on the login page to open your portfolio admin.</p>
    <div style="font-size:36px;font-weight:700;letter-spacing:10px;text-align:center;padding:18px;background:#fff;border-radius:14px">${code}</div>
    <p style="margin:24px 0 0;font-size:13px;color:#8e8e93">It expires in ${minutesValid} minutes. If you didn't try to log in, you can ignore this email — nobody can sign in without this code.</p>
  </div>`;

  let res: Response;
  try {
    res = await fetch(`${RESEND_API}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `${code} is your admin login code`,
        html,
        text: `Your admin login code is ${code}. It expires in ${minutesValid} minutes.`,
      }),
      cache: "no-store",
    });
  } catch (err) {
    throw new MailError(`Email request failed: ${String(err)}`);
  }
  if (!res.ok) {
    throw new MailError(`Resend responded ${res.status}: ${await res.text().catch(() => "")}`);
  }
}
