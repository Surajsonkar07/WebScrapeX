import crypto from "crypto";
import { supabaseAdmin, supabase } from "./supabase";

export function emailToUuid(email: string): string {
  const hash = crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

export async function isEmailAlreadyRegistered(email: string): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim();
  const client = supabaseAdmin || supabase;

  // 1. Check Supabase Auth users via service role client if available
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (!error && data?.users) {
        const existing = data.users.find((u) => u.email?.toLowerCase() === cleanEmail);
        // Consider user registered if confirmed or exists in auth
        if (existing && (existing.email_confirmed_at || existing.confirmed_at || existing.id)) {
          return true;
        }
      }
    } catch (e) {
      console.error("Error checking auth users:", e);
    }
  }

  // 2. Check public.profiles table
  try {
    const { data: profile } = await client
      .from("profiles")
      .select("id, verified")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (profile) {
      return true;
    }
  } catch (e) {
    // Ignore error if table is missing or RLS restricts
  }

  return false;
}

export async function sendMailjetOtp(email: string, fullName: string, code: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  const senderEmail = process.env.MAILJET_SENDER_EMAIL || "noreply@webscrape-x.com";

  if (!apiKey || !secretKey) {
    console.warn("⚠️ Mailjet API credentials missing (MAILJET_API_KEY / MAILJET_SECRET_KEY). Simulated OTP Code:", code);
    return { success: true };
  }

  const authHeader = `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString("base64")}`;

  try {
    const res = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: senderEmail,
              Name: "WebScrapeX Security",
            },
            To: [
              {
                Email: email.toLowerCase().trim(),
                Name: fullName || "User",
              },
            ],
            Subject: "Your WebScrapeX Verification Code",
            TextPart: `Your verification code is: ${code}`,
            HTMLPart: `
              <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0a0a0c; color: #ffffff; border-radius: 16px; border: 1px solid #27272a;">
                <h2 style="color: #6366f1; font-weight: 800; font-size: 24px; margin-bottom: 8px;">WebScrapeX</h2>
                <p style="color: #a1a1aa; font-size: 15px; margin-bottom: 24px;">Verify your email address to complete registration.</p>
                <div style="background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                  <span style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #6366f1;">${code}</span>
                </div>
                <p style="color: #71717a; font-size: 13px; margin-bottom: 0;">This 6-digit code will expire in 15 minutes. If you did not request this, you can safely ignore this email.</p>
              </div>
            `,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Mailjet API Error:", res.status, errText);
      return { success: false, error: `Failed to send email via Mailjet API (${res.status})` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error dispatching Mailjet email:", err);
    return { success: false, error: err.message || "Failed to send verification email" };
  }
}
