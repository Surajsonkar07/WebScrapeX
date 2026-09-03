import { NextRequest, NextResponse } from "next/server";
import { emailToUuid } from "@/lib/auth-utils";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, password, fullName } = body;

    if (!email || !code || !password) {
      return NextResponse.json(
        { error: "Email, verification code, and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const userId = emailToUuid(cleanEmail);
    const dbClient: any = supabaseAdmin || supabase;

    // 1. Look up public.verification_tokens where user_id = emailToUuid(email) AND token = code
    const { data: tokenRecord, error: tokenError } = await dbClient
      .from("verification_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("token", code.trim())
      .maybeSingle();

    if (tokenError || !tokenRecord) {
      // Zero user records are created if verification fails
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // 2. Check token expiration
    const expiresAt = new Date(tokenRecord.expires_at).getTime();
    if (Date.now() > expiresAt) {
      // Clean up expired token
      await dbClient.from("verification_tokens").delete().eq("id", tokenRecord.id);
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // 3. Admin Client Check (Service Role Key required for deferred user creation)
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for pre-signup verification." },
        { status: 500 }
      );
    }

    // 4. Create user in Supabase Auth using Service Role client
    const { data: authUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createUserError || !authUser.user) {
      console.error("Error creating user in Supabase Auth:", createUserError);
      return NextResponse.json(
        { error: createUserError?.message || "Failed to create user account." },
        { status: 400 }
      );
    }

    const newUserId = authUser.user.id;

    // 5. Upsert into public.profiles
    const { error: profileError } = await (supabaseAdmin as any).from("profiles").upsert({
      id: newUserId,
      full_name: fullName || null,
      email: cleanEmail,
      verified: true,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.warn("Profile upsert warning:", profileError.message);
    }

    // 6. Delete used token from verification_tokens
    await dbClient.from("verification_tokens").delete().eq("user_id", userId);

    return NextResponse.json({
      success: true,
      message: "Email verified and account created successfully.",
      user: {
        id: newUserId,
        email: cleanEmail,
      },
    });
  } catch (err: any) {
    console.error("Error in /api/auth/verify-email:", err);
    return NextResponse.json({ error: err.message || "Internal server error." }, { status: 500 });
  }
}
