'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation';
import { ArrowRight, BriefcaseBusiness, Sparkles } from 'lucide-react';
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
    heroTitle: '用更专业的方式管理你的求职流程。',
    heroDescription: '统一跟踪投递进度、面试节奏与 AI 建议，所有信息集中在一个看板。',
    heroBadge: '按账号隔离你的求职数据',
    welcomeBack: '欢迎回来',
    signInHint: '登录后继续管理你的私人求职看板。',
    email: '邮箱',
    password: '密码',
    passwordPlaceholder: '至少 8 位字符',
    invalidCredentials: '邮箱或密码错误。',
    loginFailed: '登录失败，请稍后重试。',
    signingIn: '登录中...',
    signIn: '登录',
    noAccountYet: '还没有账号？',
    createOne: '去注册',
  },
  en: {
    heroTitle: 'Secure your job search workflow with a premium dashboard experience.',
    heroDescription:
      'Track applications, monitor interview stages, and receive AI suggestions in one focused workspace built for serious candidates.',
    heroBadge: 'Personalized board data for each account',
    welcomeBack: 'Welcome Back',
    signInHint: 'Sign in to continue managing your private job board.',
    email: 'Email',
    password: 'Password',
    passwordPlaceholder: 'At least 8 characters',
    invalidCredentials: 'Invalid email or password.',
    loginFailed: 'Login failed. Please try again.',
    signingIn: 'Signing in...',
    signIn: 'Sign In',
    noAccountYet: 'No account yet?',
    createOne: 'Create one',
  },
} as const;

export default function LoginPage() {
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
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiJson<AuthResponse>('/api/auth/login', {
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
      if (error instanceof ApiError && error.status === 401) {
        setErrorMessage(copy.invalidCredentials);
      } else {
        setErrorMessage(copy.loginFailed);
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
            <p className="max-w-md text-sm leading-6 text-slate-200/80">
              {copy.heroDescription}
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs text-slate-200/90">
            <BriefcaseBusiness className="size-3.5" />
            {copy.heroBadge}
          </div>
        </section>

        <Card className="w-full rounded-none border-0 bg-white/95 shadow-none">
          <CardHeader className="space-y-2 pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-2xl font-semibold text-slate-900">{copy.welcomeBack}</CardTitle>
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
            <CardDescription className="text-sm text-slate-600">{copy.signInHint}</CardDescription>
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={copy.passwordPlaceholder}
                  className="h-11 border-slate-200 bg-white transition focus-visible:ring-sky-400"
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
                {isSubmitting ? copy.signingIn : copy.signIn}
                <ArrowRight className="size-4" />
              </Button>
            </form>
            <p className="mt-5 text-sm text-slate-600">
              {copy.noAccountYet}{' '}
              <Link href="/register" className="font-medium text-sky-700 hover:text-sky-600">
                {copy.createOne}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
