import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Magic-link / recovery-link landing: exchange the code for a session, then
// route into the app. `next` (same-origin path only) lets password-recovery
// emails land on /reset-password instead of the root.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
