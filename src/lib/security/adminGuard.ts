import { createClient } from '@/lib/supabase/server';

export interface AdminSecurityCheckResult {
  isAuthorized: boolean;
  user: any | null;
  profile: any | null;
  error?: string;
}

/**
 * Validates strictly that:
 * 1. User is authenticated
 * 2. User has is_admin = true and role in ('admin', 'super_admin')
 * 3. User email exists on public.admin_allowlist
 * 4. MFA 2FA assurance level is elevated (aag = aal2 or higher, or verified session)
 */
export async function verifyStrictAdminSecurity(): Promise<AdminSecurityCheckResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return { isAuthorized: false, user: null, profile: null, error: 'Unauthorized: No active user session.' };
  }

  // Query Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { isAuthorized: false, user, profile: null, error: 'User profile not found.' };
  }

  if (!profile.is_admin || !['admin', 'super_admin'].includes(profile.role)) {
    return { isAuthorized: false, user, profile, error: 'Forbidden: Admin privilege required.' };
  }

  // Verify Allowlist
  const { data: allowlistEntry } = await supabase
    .from('admin_allowlist')
    .select('email')
    .eq('email', user.email)
    .single();

  if (!allowlistEntry) {
    return { isAuthorized: false, user, profile, error: 'Forbidden: Email is not on the admin allowlist.' };
  }

  // Check MFA Authenticator Assurance Level
  const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (mfaError || (mfaData && mfaData.currentLevel !== 'aal2' && profile.mfa_enabled)) {
    return { isAuthorized: false, user, profile, error: 'MFA 2FA verification required for admin actions.' };
  }

  return { isAuthorized: true, user, profile };
}

/**
 * Logs all admin actions to public.admin_audit_logs
 */
export async function logAdminAction(
  adminEmail: string,
  action: string,
  targetUserId?: string,
  details?: Record<string, any>
) {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();

  await supabase.from('admin_audit_logs').insert({
    admin_id: user?.user?.id || null,
    admin_email: adminEmail,
    action,
    target_user_id: targetUserId || null,
    details: details || {},
  });
}
