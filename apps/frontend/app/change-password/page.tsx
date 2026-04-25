'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, KeyRound } from 'lucide-react';
import { ApiError, apiJson } from '@/lib/api';
import { clearAuthToken } from '@/lib/auth-token';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Locale = 'zh' | 'en';

type AuthUser = {
  id: string;
  email: string;
};

const LOCALE_COPY = {
  zh: {
    title: '修改密码',
    description: '向当前账号邮箱发送验证码后，完成密码修改。',
    accountEmail: '当前账号邮箱',
    verificationCode: '邮箱验证码',
    newPassword: '新密码',
    confirmPassword: '确认新密码',
    codePlaceholder: '输入 6 位验证码',
    passwordPlaceholder: '至少 8 位字符',
    sendCode: '发送验证码',
    sendingCode: '发送中...',
    changePassword: '修改密码',
    changingPassword: '修改中...',
    passwordMismatch: '两次输入的新密码不一致。',
    loadUserFailed: '登录状态已失效，请重新登录。',
    sendCodeSuccess: '验证码已发送，请注意查收（开发环境请看后端日志）。',
    sendCodeFailed: '发送验证码失败，请稍后重试。',
    changeSuccess: '密码修改成功。',
    changeFailedCode: '修改失败，验证码错误或已过期。',
    changeFailed: '修改失败，请稍后重试。',
    backToBoard: '返回看板',
  },
  en: {
    title: 'Change Password',
    description: 'Send a code to your account email and update password securely.',
    accountEmail: 'Account Email',
    verificationCode: 'Email Verification Code',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    codePlaceholder: 'Enter 6-digit code',
    passwordPlaceholder: 'At least 8 characters',
    sendCode: 'Send Code',
    sendingCode: 'Sending...',
    changePassword: 'Change Password',
    changingPassword: 'Updating...',
    passwordMismatch: 'New passwords do not match.',
    loadUserFailed: 'Session expired. Please sign in again.',
    sendCodeSuccess: 'Code sent. Check your inbox (or backend logs in local dev).',
    sendCodeFailed: 'Failed to send code. Please try again.',
    changeSuccess: 'Password updated successfully.',
    changeFailedCode: 'Update failed. Verification code is invalid or expired.',
    changeFailed: 'Update failed. Please try again.',
    backToBoard: 'Back to Board',
  },
} as const;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
      return 'zh';
    }

    const savedLocale = globalThis.localStorage.getItem('apply-flow-locale');
    if (savedLocale === 'zh' || savedLocale === 'en') {
      return savedLocale;
    }

    if ('navigator' in globalThis) {
      return globalThis.navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
    }

    return 'zh';
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = LOCALE_COPY[locale];

  useEffect(() => {
    let isMounted = true;

    const fetchCurrentUser = async () => {
      try {
        const result = await apiJson<{ user: AuthUser }>('/api/auth/me');
        if (!isMounted) {
          return;
        }
        setCurrentUser(result.user);
      } catch {
        if (isMounted) {
          clearAuthToken();
          setErrorMessage(copy.loadUserFailed);
          router.replace('/login');
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    };

    void fetchCurrentUser();
    return () => {
      isMounted = false;
    };
  }, [copy.loadUserFailed, router]);

  const handleSwitchLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }

    setLocale(nextLocale);
    globalThis.localStorage.setItem('apply-flow-locale', nextLocale);
  };

  const handleSendCode = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSendingCode(true);
    try {
      await apiJson<{ success: true }>('/api/auth/password/change/send-code', {
        method: 'POST',
      });
      setSuccessMessage(copy.sendCodeSuccess);
    } catch {
      setErrorMessage(copy.sendCodeFailed);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage(copy.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiJson<{ success: true }>('/api/auth/password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword,
          verificationCode,
        }),
      });
      setSuccessMessage(copy.changeSuccess);
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setErrorMessage(copy.changeFailedCode);
      } else {
        setErrorMessage(copy.changeFailed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.35),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_48%_96%,rgba(56,189,248,0.2),transparent_36%)]" />
      <Card className="relative z-10 w-full max-w-md border border-white/15 bg-white/95 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
              <KeyRound className="size-5 text-sky-700" />
              {copy.title}
            </CardTitle>
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1">
              <button
                type="button"
                onClick={() => handleSwitchLocale('zh')}
                className={`h-7 rounded-lg px-3 text-xs font-medium transition ${
                  locale === 'zh' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => handleSwitchLocale('en')}
                className={`h-7 rounded-lg px-3 text-xs font-medium transition ${
                  locale === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                EN
              </button>
            </div>
          </div>
          <CardDescription className="text-sm text-slate-600">{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="account-email"
                className="text-xs font-medium tracking-wide text-slate-500 uppercase"
              >
                {copy.accountEmail}
              </label>
              <Input
                id="account-email"
                type="email"
                value={isLoadingUser ? '' : (currentUser?.email ?? '')}
                className="h-11 border-slate-200 bg-slate-100 text-slate-600"
                readOnly
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="verification-code"
                className="text-xs font-medium tracking-wide text-slate-500 uppercase"
              >
                {copy.verificationCode}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replaceAll(/\D/g, ''))}
                  placeholder={copy.codePlaceholder}
                  className="h-11 border-slate-200 bg-white transition focus-visible:ring-sky-400"
                  required
                />
                <Button
                  type="button"
                  disabled={isSendingCode || isLoadingUser || !currentUser}
                  onClick={handleSendCode}
                  className="h-11 shrink-0 bg-slate-900 px-4 text-white transition hover:bg-slate-800"
                >
                  {isSendingCode ? copy.sendingCode : copy.sendCode}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="text-xs font-medium tracking-wide text-slate-500 uppercase"
              >
                {copy.newPassword}
              </label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder={copy.passwordPlaceholder}
                className="h-11 border-slate-200 bg-white transition focus-visible:ring-sky-400"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-xs font-medium tracking-wide text-slate-500 uppercase"
              >
                {copy.confirmPassword}
              </label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={copy.passwordPlaceholder}
                className="h-11 border-slate-200 bg-white transition focus-visible:ring-sky-400"
                minLength={8}
                required
              />
            </div>
            {errorMessage ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}
            <Button type="submit" disabled={isSubmitting} className="h-11 w-full bg-sky-600 text-white transition hover:bg-sky-500">
              {isSubmitting ? copy.changingPassword : copy.changePassword}
              <ArrowRight className="size-4" />
            </Button>
          </form>
          <p className="mt-5 text-sm text-slate-600">
            <Link href="/" className="font-medium text-sky-700 hover:text-sky-600">
              {copy.backToBoard}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
