import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { KeyRound, Loader2, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { toast } from '../../utils/toast';

/**
 * Reset-password screen, opened from the emailed one-time link
 * (`/reset-password?token=...`).
 *
 * The token is validated before the form is enabled, so the user is not told
 * "invalid" only after typing a new password.
 */

const inputClass =
  'block w-full pl-10 pr-3 bg-white border border-gray-300 rounded-lg py-2.5 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors';

type TokenState = 'checking' | 'valid' | 'invalid';

const REASON_COPY: Record<string, string> = {
  expired: 'This reset link has expired. Reset links are valid for 60 minutes.',
  used: 'This reset link has already been used. Please request a new one.',
  invalid: 'This reset link is not valid. Please request a new one.',
  invalid_or_used: 'This reset link is no longer valid. Please request a new one.',
  malformed: 'This reset link is incomplete. Please use the full link from your email.',
};

export const ResetPasswordPage: React.FC = () => {
  const [token, setToken] = useState('');
  const [tokenState, setTokenState] = useState<TokenState>('checking');
  const [reason, setReason] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('token') || '';

    // Supports both ?token=... and /reset-password/<token> style links.
    const fromPath = window.location.pathname.split('/').filter(Boolean).pop() || '';

    const candidate = fromQuery || fromPath;
    setToken(candidate);

    if (!candidate || candidate === 'reset-password') {
      setTokenState('invalid');
      setReason('malformed');
      return;
    }

    let cancelled = false;
    authApi
      .validateResetToken(candidate)
      .then((result) => {
        if (cancelled) return;
        setTokenState(result.valid ? 'valid' : 'invalid');
        setReason(result.reason);
      })
      .catch(() => {
        if (cancelled) return;
        setTokenState('invalid');
        setReason('invalid');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error('Password must contain at least one letter and one number');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authApi.resetPassword(token, password);
      setIsDone(true);
      toast.success(result.message || 'Password reset successfully');
      // Never leave the raw token in the address bar.
      window.history.replaceState({}, '', '/login');
    } catch (error: any) {
      toast.error(error.message || 'Could not reset your password');
      // The token may have just expired or been consumed.
      setTokenState('invalid');
      setReason('invalid_or_used');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[28rem] h-[28rem] rounded-full bg-emerald-100/60 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-600 p-2.5 rounded-xl shadow-lg shadow-emerald-200/50">
              <KeyRound className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                Set a new password
              </h1>
              <p className="text-[13px] text-gray-500">
                One more step to secure your account
              </p>
            </div>
          </div>

          {tokenState === 'checking' && (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking your reset link…
            </div>
          )}

          {tokenState === 'invalid' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    This link cannot be used
                  </p>
                  <p className="text-[13px] text-gray-600 mt-1">
                    {REASON_COPY[reason] || REASON_COPY.invalid}
                  </p>
                </div>
              </div>
              <a
                href="/login"
                className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-200/50 transition-all"
              >
                Back to sign in
              </a>
            </div>
          )}

          {isDone && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Password updated</p>
                  <p className="text-[13px] text-gray-600 mt-1">
                    You can now sign in with your new password. We have also emailed you a
                    confirmation.
                  </p>
                </div>
              </div>
              <a
                href="/login"
                className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-200/50 transition-all"
              >
                Sign in
              </a>
            </div>
          )}

          {tokenState === 'valid' && !isDone && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="At least 8 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm new password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheck className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Repeat your new password"
                  />
                </div>
              </div>

              <p className="text-[12px] text-gray-500 leading-relaxed">
                Use at least 8 characters including a letter and a number.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-200/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Reset password
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
