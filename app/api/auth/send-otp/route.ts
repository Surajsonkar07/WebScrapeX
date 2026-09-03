import { NextRequest, NextResponse } from "next/server";
import { emailToUuid, isEmailAlreadyRegistered, sendMailjetOtp } from "@/lib/auth-utils";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if email belongs to an already registered & verified user
    const alreadyRegistered = await isEmailAlreadyRegistered(cleanEmail);
    if (alreadyRegistered) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 400 });
    }

    // 2. Generate 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const userId = emailToUuid(cleanEmail);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    const dbClient: any = supabaseAdmin || supabase;

    // 3. Clean up any existing tokens for this user_id
    await dbClient.from("verification_tokens").delete().eq("user_id", userId);

    // 4. Store { token, user_id, expires_at } in public.verification_tokens
    const { error: dbError } = await dbClient.from("verification_tokens").insert({
      user_id: userId,
      token: code,
      expires_at: expiresAt,
    });

    if (dbError) {
      console.error("Database error inserting verification token:", dbError);
      return NextResponse.json({ error: "Failed to store verification token." }, { status: 500 });
    }

    // 5. Dispatch code via Mailjet API
    const mailResult = await sendMailjetOtp(cleanEmail, fullName || "", code);
    if (!mailResult.success) {
      return NextResponse.json({ error: mailResult.error || "Failed to send verification email." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (err: any) {
    console.error("Error in /api/auth/send-otp:", err);
    return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
  }
}
