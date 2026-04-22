'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { ApiError, apiJson } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type AuthResponse = {
  user: {
    id: string;
    email: string;
  };
};

type Locale = 'zh' | 'en';

const LOCALE_COPY = {
  zh: {
    heroTitle: '打造你的求职指挥中心，统一管理每次投递与面试。',
    heroDescription: '创建账号后，你可以在专属空间里查看岗位进展，并获得只属于你的 AI 分析建议。',
    heroBadge: '数据按用户身份隔离',
    createAccount: '创建账号',
    createAccountHint: '立即加入，在高效工作台中管理你的求职进度。',
    email: '邮箱',
    password: '密码',
    confirmPassword: '确认密码',
    passwordPlaceholder: '至少 8 位字符',
    confirmPasswordPlaceholder: '请再次输入密码',
    passwordMismatch: '两次输入的密码不一致。',
    registerFailedEmailUsed: '注册失败，邮箱可能已被占用。',
    registerFailed: '注册失败，请稍后重试。',
    creatingAccount: '创建中...',
    alreadyHaveAccount: '已有账号？',
    signIn: '去登录',
  },
  en: {
    heroTitle: 'Build your personal command center for every application and interview.',
    heroDescription:
      'Create your account to unlock a private, secure workflow where all opportunities and AI insights are scoped only to you.',
    heroBadge: 'Private data partitioned by user identity',
    createAccount: 'Create Account',
    createAccountHint: 'Join now and start tracking your job search in a premium workspace.',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    passwordPlaceholder: 'At least 8 characters',
    confirmPasswordPlaceholder: 'Repeat your password',
    passwordMismatch: 'Passwords do not match.',
    registerFailedEmailUsed: 'Registration failed. Email may already be in use.',
    registerFailed: 'Registration failed. Please try again.',
    creatingAccount: 'Creating account...',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign in',
  },
} as const;

export default function RegisterPage() {
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const copy = LOCALE_COPY[locale];

  const handleSwitchLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }

    setLocale(nextLocale);
    globalThis.localStorage.setItem('apply-flow-locale', nextLocale);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage(copy.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiJson<AuthResponse>('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      router.replace('/');
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setErrorMessage(copy.registerFailedEmailUsed);
      } else {
        setErrorMessage(copy.registerFailed);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.35),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_48%_96%,rgba(56,189,248,0.2),transparent_36%)]" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-slate-900/60 shadow-[0_30px_80px_rgba(2,6,23,0.65)] backdrop-blur-xl lg:grid-cols-[1.1fr_1fr]">
        <section className="hidden flex-col justify-between border-r border-white/10 bg-linear-to-br from-sky-500/15 via-slate-900/10 to-blue-500/20 p-10 text-slate-100 lg:flex">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs tracking-wide uppercase">
            <Sparkles className="size-3.5" />
            Apply Flow
          </div>
          <div className="space-y-5">
            <h1 className="text-4xl leading-tight font-semibold">{copy.heroTitle}</h1>
            <p className="max-w-md text-sm leading-6 text-slate-200/80">{copy.heroDescription}</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs text-slate-200/90">
            <ShieldCheck className="size-3.5" />
            {copy.heroBadge}
          </div>
        </section>

        <Card className="w-full rounded-none border-0 bg-white/95 shadow-none">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-2xl font-semibold text-slate-900">{copy.createAccount}</CardTitle>
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
            <CardDescription className="text-sm text-slate-600">{copy.createAccountHint}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                  {copy.email}
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-11 border-slate-200 bg-white transition focus-visible:ring-sky-400"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium tracking-wide text-slate-500 uppercase"
                >
                  {copy.password}
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
                  placeholder={copy.confirmPasswordPlaceholder}
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full bg-sky-600 text-white transition hover:bg-sky-500"
              >
                {isSubmitting ? copy.creatingAccount : copy.createAccount}
                <ArrowRight className="size-4" />
              </Button>
            </form>
            <p className="mt-5 text-sm text-slate-600">
              {copy.alreadyHaveAccount}{' '}
              <Link href="/login" className="font-medium text-sky-700 hover:text-sky-600">
                {copy.signIn}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
