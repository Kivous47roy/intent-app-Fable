import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';

// Token-hash verification landing (@supabase/ssr pattern). Handles links
// minted by the admin generate_link API — used as the email-free sign-in
// path while the project is on Supabase's rate-limited built-in SMTP.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = (searchParams.get('type') as EmailOtpType) ?? 'email';

  if (tokenHash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
