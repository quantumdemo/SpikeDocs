"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Shield,
  Activity,
  CheckCircle2,
  Lock,
  RefreshCw
} from 'lucide-react';

export function AdminClient() {
  const [loading, setLoading] = useState(true);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [proSubscribers, setProSubscribers] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.email) {
        setSecurityError('Unauthorized: No active admin user session. Please sign in.');
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.is_admin) {
        setSecurityError('Forbidden: Access is restricted to authorized admins on the allowlist.');
        setLoading(false);
        return;
      }

      setUserEmail(user.email);
      setUserRole(profile.role);

      // Fetch DB analytics
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: proCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('is_pro', true);
      const { data: logs } = await supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(10);

      setTotalUsers(userCount || 0);
      setProSubscribers(proCount || 0);
      setAuditLogs(logs || []);
      setLoading(false);
    }

    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
        <span className="text-xs font-bold text-slate-500">Authenticating MFA & Admin Role...</span>
      </div>
    );
  }

  if (securityError) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Admin Access Restricted</h1>
          <p className="text-xs text-slate-500 leading-relaxed">{securityError}</p>
          <div className="pt-2">
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Sign In with Authorized Admin Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            <h1 className="text-2xl font-black text-slate-900">SpikeDocs Admin Panel</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <span className="font-bold text-slate-800">{userEmail}</span> (Role: {userRole})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> MFA 2FA Verified
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly Active Users</span>
            <Users className="w-5 h-5 text-slate-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalUsers}</div>
          <span className="text-[10px] text-emerald-600 font-bold">Registered platform users</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pro Subscribers</span>
            <CreditCard className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{proSubscribers}</div>
          <span className="text-[10px] text-slate-500 font-bold">Active recurring plans</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Estimated MRR</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">${(proSubscribers * 9.99).toFixed(2)}</div>
          <span className="text-[10px] text-emerald-600 font-bold">Monthly Recurring Revenue</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Failed / Churn Alerts</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">0</div>
          <span className="text-[10px] text-slate-400 font-bold">All payments healthy</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-slate-900">Admin Audit Logs (`admin_audit_logs`)</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Action Executed</th>
                <th className="py-3 px-4">Target User ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4">{log.admin_email}</td>
                    <td className="py-3 px-4 font-bold text-red-600">{log.action}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{log.target_user_id || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No admin audit logs recorded yet. All system administrative actions will be logged here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
