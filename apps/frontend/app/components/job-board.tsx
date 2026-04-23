'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Bell,
  BellRing,
  BriefcaseBusiness,
  CalendarClock,
  CircleCheckBig,
  CircleX,
  ClockAlert,
  FileClock,
  LogOut,
  Plus,
  Rocket,
  Sparkles,
  TrendingUp,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react';
import { JobForm } from './job-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ApiError, apiFetch, apiJson } from '@/lib/api';
import { clearAuthToken } from '@/lib/auth-token';
import { cn } from '@/lib/utils';

type ApplicationStatus = 'DRAFT' | 'APPLIED' | 'INTERVIEW' | 'REJECTED' | 'OFFER';
type BoardColumnKey = Extract<ApplicationStatus, 'APPLIED' | 'INTERVIEW' | 'REJECTED' | 'OFFER'>;
type Locale = 'zh' | 'en';
type ReminderState = 'UNREAD' | 'READ' | 'IGNORED';
type NotificationFilter = 'all' | 'unread' | 'overdue';

export type JobApplication = {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  jdText: string;
  source: string;
  resumeText: string;
  interviewAt: string | null;
  followUpAt: string | null;
  reminderState: ReminderState;
  reminderSnoozedUntil: string | null;
  aiFeedback: string | null;
  createdAt: string;
  updatedAt: string;
};

const BOARD_COLUMNS = [
  { key: 'APPLIED' },
  { key: 'INTERVIEW' },
  { key: 'REJECTED' },
  { key: 'OFFER' },
] as const satisfies ReadonlyArray<{ key: BoardColumnKey }>;

const LOCALE_COPY = {
  zh: {
    appTitle: '职位作战看板',
    addJob: '新增职位',
    requestFailed: '请求失败',
    createNewJob: '创建新职位',
    editTimeline: '时间设置',
    viewDetails: '查看详情',
    editResume: '编辑简历',
    updatingResume: '上传中...',
    editTimelineTitle: '设置面试与提醒时间',
    interviewAtEmpty: '尚未设置面试时间',
    followUpAtEmpty: '尚未设置跟进提醒',
    saveTimeline: '保存时间设置',
    savingTimeline: '保存中...',
    unknownStatus: '未知状态',
    unknownTime: '未知时间',
    createdAt: '创建于',
    aiAnalyze: 'AI 分析',
    analyzing: '分析中...',
    aiParsing: 'AI 正在解析简历与 JD',
    matchScore: '岗位匹配度',
    resumeScore: '简历评分',
    resumeImprovements: '简历优化点',
    noResumeImprovements: '暂无明显优化建议',
    introTemplate: '推荐自我介绍模版',
    viewFullAnalysis: '查看完整分析',
    closeAnalysisModal: '关闭',
    closeDetailsModal: '关闭详情',
    jobDetailsTitle: '职位详情',
    companyLabel: '公司',
    positionLabel: '岗位',
    sourceLabel: '来源',
    jdTextLabel: '岗位描述（JD）',
    resumeTextLabel: '简历内容',
    resumeTextEmpty: '暂无简历内容',
    totalJobs: '总职位数',
    totalJobsHint: '当前追踪的岗位总量',
    inInterview: '面试进行中',
    inInterviewHint: '正在推进的面试机会',
    offerRate: 'Offer 转化率',
    offerRateHint: '已拿 Offer / 总职位',
    momentum: '求职势能',
    momentumStrong: '强劲',
    momentumRampUp: '爬坡中',
    momentumHint: '基于投递节奏的状态判断',
    fetchJobsError: '加载职位列表失败',
    createJobError: '创建职位失败',
    createJobErrorHint: '创建职位失败，请稍后重试。',
    updateResumeErrorHint: '更新简历失败，请稍后重试。',
    analyzeError: 'AI 分析失败',
    analyzeErrorHint: 'AI 分析失败，请确认已配置 GEMINI_API_KEY。',
    updateStatusError: '状态更新失败',
    dragUpdateError: '拖拽更新失败，已恢复到原状态。',
    authRequiredHint: '登录状态已失效，请重新登录。',
    loadingJobs: '正在加载你的职位数据...',
    logout: '退出登录',
    interviewCalendarTitle: '面试日历',
    interviewCalendarHint: '近期面试安排一目了然',
    noInterviewScheduled: '暂无已安排面试',
    reminderTitle: '自动提醒',
    reminderHint: '跟进和面试提醒会出现在这里',
    noReminder: '暂无待处理提醒',
    notificationCenterTitle: '通知中心',
    notificationCenterHint: '统一查看提醒并进行已读、忽略、延后',
    noNotifications: '暂无通知',
    interviewAt: '面试',
    followUpAt: '跟进',
    reminderDue: '已到提醒时间',
    reminderStaleApplied: '建议跟进，投递已超过 5 天',
    staleAppliedFormat: '已投递 {{days}} 天',
    reminderUpcoming: '即将到期',
    reminderOverdue: '已超期',
    actionRead: '标为已读',
    actionIgnore: '忽略',
    actionSnooze1d: '+1天',
    actionSnooze3d: '+3天',
    actionSnoozeWeekend: '周末',
    stateUnread: '未读',
    stateRead: '已读',
    stateIgnored: '已忽略',
    filterAll: '全部',
    filterUnread: '未读',
    filterOverdue: '超期',
    markAllRead: '全部标记为已读',
    markFilteredRead: '当前筛选标记已读',
    columns: {
      APPLIED: '已投递',
      INTERVIEW: '面试中',
      REJECTED: '未通过',
      OFFER: '已拿 Offer',
    },
    emptyStates: {
      APPLIED: {
        message: '还没有投递记录',
        hint: '先添加一个目标岗位，开始你的求职流程。',
      },
      INTERVIEW: {
        message: '暂无面试进展',
        hint: '把已投递的岗位拖到这里，跟踪面试状态。',
      },
      REJECTED: {
        message: '暂无拒绝记录',
        hint: '保持这个状态，继续优化简历与投递策略。',
      },
      OFFER: {
        message: '暂无 Offer，继续加油',
        hint: '保持投递节奏，下一份 Offer 在路上。',
      },
    },
  },
  en: {
    appTitle: 'Job Search Board',
    addJob: 'Add Job',
    requestFailed: 'Request Failed',
    createNewJob: 'Create New Job',
    editTimeline: 'Set Timeline',
    viewDetails: 'View Details',
    editResume: 'Edit Resume',
    updatingResume: 'Uploading...',
    editTimelineTitle: 'Set interview and reminder times',
    interviewAtEmpty: 'Interview time not set',
    followUpAtEmpty: 'Follow-up reminder not set',
    saveTimeline: 'Save timeline',
    savingTimeline: 'Saving...',
    unknownStatus: 'Unknown Status',
    unknownTime: 'Unknown Time',
    createdAt: 'Created',
    aiAnalyze: 'AI Analyze',
    analyzing: 'Analyzing...',
    aiParsing: 'AI is analyzing the resume and JD',
    matchScore: 'Role Match Score',
    resumeScore: 'Resume Score',
    resumeImprovements: 'Resume Improvements',
    noResumeImprovements: 'No obvious improvements',
    introTemplate: 'Suggested Intro Template',
    viewFullAnalysis: 'View full analysis',
    closeAnalysisModal: 'Close',
    closeDetailsModal: 'Close details',
    jobDetailsTitle: 'Job Details',
    companyLabel: 'Company',
    positionLabel: 'Position',
    sourceLabel: 'Source',
    jdTextLabel: 'Job Description (JD)',
    resumeTextLabel: 'Resume Content',
    resumeTextEmpty: 'No resume text yet',
    totalJobs: 'Total Jobs',
    totalJobsHint: 'Total tracked opportunities',
    inInterview: 'In Interview',
    inInterviewHint: 'Interview opportunities in progress',
    offerRate: 'Offer Conversion',
    offerRateHint: 'Offers / Total jobs',
    momentum: 'Search Momentum',
    momentumStrong: 'Strong',
    momentumRampUp: 'Building',
    momentumHint: 'Calculated from recent application pace',
    fetchJobsError: 'Failed to load jobs',
    createJobError: 'Failed to create job',
    createJobErrorHint: 'Failed to create job. Please try again later.',
    updateResumeErrorHint: 'Failed to update resume. Please try again later.',
    analyzeError: 'AI analysis failed',
    analyzeErrorHint: 'AI analysis failed. Please check GEMINI_API_KEY.',
    updateStatusError: 'Failed to update status',
    dragUpdateError: 'Drag update failed. Reverted to the previous state.',
    authRequiredHint: 'Your session has expired. Please sign in again.',
    loadingJobs: 'Loading your jobs...',
    logout: 'Logout',
    interviewCalendarTitle: 'Interview Calendar',
    interviewCalendarHint: 'Your upcoming interviews in one place',
    noInterviewScheduled: 'No interviews scheduled yet',
    reminderTitle: 'Auto Reminders',
    reminderHint: 'Due follow-ups and interview alerts appear here',
    noReminder: 'No pending reminders',
    notificationCenterTitle: 'Notification Center',
    notificationCenterHint: 'Manage reminders with read, ignore, and snooze',
    noNotifications: 'No notifications',
    interviewAt: 'Interview',
    followUpAt: 'Follow-up',
    reminderDue: 'Reminder is due',
    reminderStaleApplied: 'Follow-up suggested, application is over 5 days old',
    staleAppliedFormat: 'Applied for {{days}} days',
    reminderUpcoming: 'Upcoming',
    reminderOverdue: 'Overdue',
    actionRead: 'Mark read',
    actionIgnore: 'Ignore',
    actionSnooze1d: '+1 day',
    actionSnooze3d: '+3 days',
    actionSnoozeWeekend: 'Weekend',
    stateUnread: 'Unread',
    stateRead: 'Read',
    stateIgnored: 'Ignored',
    filterAll: 'All',
    filterUnread: 'Unread',
    filterOverdue: 'Overdue',
    markAllRead: 'Mark all as read',
    markFilteredRead: 'Mark filtered as read',
    columns: {
      APPLIED: 'Applied',
      INTERVIEW: 'Interview',
      REJECTED: 'Rejected',
      OFFER: 'Offer',
    },
    emptyStates: {
      APPLIED: {
        message: 'No applications yet',
        hint: 'Add your first target role to start tracking.',
      },
      INTERVIEW: {
        message: 'No interview progress yet',
        hint: 'Drag applied roles here to track interview stages.',
      },
      REJECTED: {
        message: 'No rejections so far',
        hint: 'Keep it that way by iterating your resume strategy.',
      },
      OFFER: {
        message: 'No offers yet, keep going',
        hint: 'Stay consistent and your next offer will come.',
      },
    },
  },
} as const;

const EMPTY_STATE_ICON_BY_COLUMN: Record<BoardColumnKey, LucideIcon> = {
  APPLIED: FileClock,
  INTERVIEW: CircleCheckBig,
  REJECTED: CircleX,
  OFFER: Trophy,
};

type JobBoardProps = {
  initialJobs: JobApplication[];
};

type AuthUser = {
  id: string;
  email: string;
};

type ReminderItem = {
  jobId: string;
  company: string;
  position: string;
  dueAt: Date;
  reason: 'follow-up' | 'stale-applied';
  level: 'upcoming' | 'overdue';
  state: ReminderState;
};

type DashboardMetric = {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
};

const BOARD_COLUMN_KEYS = new Set(BOARD_COLUMNS.map((column) => column.key));

function isBoardColumnKey(value: string): value is BoardColumnKey {
  return BOARD_COLUMN_KEYS.has(value as BoardColumnKey);
}

function getStatusLabel(status: BoardColumnKey, locale: Locale): string {
  return LOCALE_COPY[locale].columns[status] ?? status;
}

type JobCardProps = {
  job: JobApplication;
  statusLabel: string;
  locale: Locale;
  isAnalyzing: boolean;
  isUpdatingResume: boolean;
  analyzeProgress?: number;
  onAnalyze: (jobId: string) => void;
  onEditTimeline: (job: JobApplication) => void;
  onUpdateResume: (jobId: string, file: File) => void;
  formatCreatedAt: (dateText: string) => string;
  formatDateTime: (dateText: string) => string;
  dragAttributes?: object;
  dragListeners?: object;
  dragRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
};

type StructuredAiFeedback = {
  matchScore: number;
  resumeScore: number;
  resumeImprovements: string[];
  introTemplate: string;
};

function parseAiFeedback(aiFeedback: string | null): StructuredAiFeedback | null {
  if (!aiFeedback) {
    return null;
  }

  try {
    const parsed = JSON.parse(aiFeedback) as Record<string, unknown>;
    const matchScore = parsed.matchScore;
    const resumeScore = parsed.resumeScore;
    const resumeImprovements = parsed.resumeImprovements;
    const introTemplate = parsed.introTemplate;
    if (
      typeof matchScore === 'number' &&
      typeof resumeScore === 'number' &&
      Array.isArray(resumeImprovements) &&
      typeof introTemplate === 'string'
    ) {
      return {
        matchScore,
        resumeScore,
        resumeImprovements: resumeImprovements.filter(
          (item): item is string => typeof item === 'string',
        ),
        introTemplate,
      };
    }

    const legacyMissingSkills = parsed.missingSkills;
    const legacyTailoredIntro = parsed.tailoredIntro;
    if (
      typeof matchScore === 'number' &&
      Array.isArray(legacyMissingSkills) &&
      typeof legacyTailoredIntro === 'string'
    ) {
      return {
        matchScore,
        resumeScore: 0,
        resumeImprovements: legacyMissingSkills.filter(
          (item): item is string => typeof item === 'string',
        ),
        introTemplate: legacyTailoredIntro,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function JobCard({
  job,
  statusLabel,
  locale,
  isAnalyzing,
  isUpdatingResume,
  analyzeProgress,
  onAnalyze,
  onEditTimeline,
  onUpdateResume,
  formatCreatedAt,
  formatDateTime,
  dragAttributes,
  dragListeners,
  dragRef,
  style,
}: Readonly<JobCardProps>) {
  const resumeInputRef = useRef<HTMLInputElement | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const structuredFeedback = parseAiFeedback(job.aiFeedback);
  const copy = LOCALE_COPY[locale];
  let aiFeedbackPreviewNode: ReactNode = null;
  let aiFeedbackFullNode: ReactNode = null;
  const structuredTextLength = structuredFeedback
    ? structuredFeedback.introTemplate.length +
      structuredFeedback.resumeImprovements.join(' ').length
    : 0;
  const plainFeedbackLength = job.aiFeedback?.length ?? 0;
  const shouldShowAiToggle = structuredFeedback
    ? structuredTextLength > 260
    : plainFeedbackLength > 260;

  if (structuredFeedback) {
    const content = (
      <div className="space-y-2 text-xs leading-6 text-slate-700">
        <p>
          <span className="font-semibold text-slate-900">{copy.matchScore}: </span>
          {structuredFeedback.matchScore}/100
        </p>
        <p>
          <span className="font-semibold text-slate-900">{copy.resumeScore}: </span>
          {structuredFeedback.resumeScore}/100
        </p>
        <p>
          <span className="font-semibold text-slate-900">{copy.resumeImprovements}: </span>
          {structuredFeedback.resumeImprovements.length > 0
            ? structuredFeedback.resumeImprovements.join(locale === 'zh' ? '、' : '; ')
            : copy.noResumeImprovements}
        </p>
        <p>
          <span className="font-semibold text-slate-900">{copy.introTemplate}: </span>
          {structuredFeedback.introTemplate}
        </p>
      </div>
    );
    aiFeedbackPreviewNode = (
      <div
        className={cn(
          'mt-3 rounded-md border border-slate-200 bg-slate-50 p-3',
          shouldShowAiToggle && 'max-h-36 overflow-hidden',
        )}
      >
        {content}
      </div>
    );
    aiFeedbackFullNode = content;
  } else if (job.aiFeedback) {
    aiFeedbackPreviewNode = (
      <p
        className={cn(
          'mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-700',
          shouldShowAiToggle && 'max-h-28 overflow-hidden',
        )}
      >
        {job.aiFeedback}
      </p>
    );
    aiFeedbackFullNode = (
      <p className="text-xs leading-6 text-slate-700">{job.aiFeedback}</p>
    );
  }

  return (
    <Card
      ref={dragRef}
      style={style}
      className="gap-0 rounded-xl border-slate-200/80 bg-white shadow-none transition hover:border-slate-300"
      {...(dragAttributes ?? {})}
      {...(dragListeners ?? {})}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Placeholder for company logo; can be replaced with real logos later. */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600">
            {job.company.slice(0, 1)}
          </div>
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-semibold text-slate-900">{job.company}</CardTitle>
            <CardDescription className="text-sm text-slate-600">{job.position}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2.5">
          <Badge variant="secondary" className="w-fit rounded-md bg-sky-50 text-sky-700">
            {statusLabel}
          </Badge>
          <div className="grid grid-cols-2 gap-2">
            <input
              ref={resumeInputRef}
              type="file"
              accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                if (selectedFile) {
                  onUpdateResume(job.id, selectedFile);
                }
                event.currentTarget.value = '';
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => setIsDetailsModalOpen(true)}
              className="h-8 w-full justify-center rounded-md bg-slate-900 px-2.5 text-xs text-white hover:bg-slate-800"
            >
              {copy.viewDetails}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onAnalyze(job.id)}
              disabled={isAnalyzing}
              className="h-8 w-full justify-center rounded-md bg-sky-600 px-3 text-xs text-white hover:bg-sky-500"
            >
              <Sparkles className="size-3.5" />
              {isAnalyzing ? copy.analyzing : copy.aiAnalyze}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => resumeInputRef.current?.click()}
              disabled={isUpdatingResume}
              className="h-8 w-full justify-center rounded-md px-2.5 text-xs"
            >
              {isUpdatingResume ? copy.updatingResume : copy.editResume}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onEditTimeline(job)}
              className="h-8 w-full justify-center rounded-md px-2.5 text-xs"
            >
              {copy.editTimeline}
            </Button>
          </div>
        </div>

        {isAnalyzing && typeof analyzeProgress === 'number' ? (
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>{copy.aiParsing}</span>
              <span>{Math.round(analyzeProgress)}%</span>
            </div>
            <Progress value={analyzeProgress} />
          </div>
        ) : null}

        {job.interviewAt || job.followUpAt ? (
          <div className="mt-3 space-y-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            {job.interviewAt ? (
              <p>
                <span className="font-semibold text-slate-800">{copy.interviewAt}: </span>
                {formatDateTime(job.interviewAt)}
              </p>
            ) : (
              <p>{copy.interviewAtEmpty}</p>
            )}
            {job.followUpAt ? (
              <p>
                <span className="font-semibold text-slate-800">{copy.followUpAt}: </span>
                {formatDateTime(job.followUpAt)}
              </p>
            ) : (
              <p>{copy.followUpAtEmpty}</p>
            )}
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
            <p>{copy.interviewAtEmpty}</p>
            <p>{copy.followUpAtEmpty}</p>
          </div>
        )}

        {aiFeedbackPreviewNode}
        {aiFeedbackPreviewNode && shouldShowAiToggle ? (
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="text-xs font-medium text-sky-700 hover:text-sky-600"
            >
              {copy.viewFullAnalysis}
            </button>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="justify-between border-slate-100 bg-slate-50/80 py-2.5">
        <span className="text-xs text-slate-500">
          {copy.createdAt} {formatCreatedAt(job.createdAt)}
        </span>
        <span className="text-xs text-slate-400">ID {job.id.slice(0, 6)}</span>
      </CardFooter>

      {isAiModalOpen && aiFeedbackFullNode ? (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label={copy.closeAnalysisModal}
            className="absolute inset-0"
            onClick={() => setIsAiModalOpen(false)}
          />
          <div className="relative mx-auto mt-10 w-[92vw] max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{copy.aiAnalyze}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsAiModalOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
              {aiFeedbackFullNode}
            </div>
          </div>
        </div>
      ) : null}

      {isDetailsModalOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label={copy.closeDetailsModal}
            className="absolute inset-0"
            onClick={() => setIsDetailsModalOpen(false)}
          />
          <div className="relative mx-auto mt-10 w-[92vw] max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{copy.jobDetailsTitle}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="max-h-[70vh] space-y-3 overflow-y-auto">
              <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{job.company}</p>
                    <p className="text-sm text-slate-600">{job.position}</p>
                  </div>
                  <Badge variant="secondary" className="rounded-md bg-sky-50 text-sky-700">
                    {statusLabel}
                  </Badge>
                </div>
                <div className="mt-3 text-xs text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">{copy.sourceLabel}: </span>
                    {job.source}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-700">
                <p className="mb-2 text-sm font-semibold text-slate-900">{copy.jdTextLabel}</p>
                <p className="whitespace-pre-wrap">{job.jdText}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-700">
                <p className="mb-2 text-sm font-semibold text-slate-900">{copy.resumeTextLabel}</p>
                <p className="whitespace-pre-wrap">{job.resumeText || copy.resumeTextEmpty}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

type SortableJobCardProps = {
  job: JobApplication;
  statusLabel: string;
  locale: Locale;
  isAnalyzing: boolean;
  isUpdatingResume: boolean;
  analyzeProgress?: number;
  onAnalyze: (jobId: string) => void;
  onEditTimeline: (job: JobApplication) => void;
  onUpdateResume: (jobId: string, file: File) => void;
  formatCreatedAt: (dateText: string) => string;
  formatDateTime: (dateText: string) => string;
};

function SortableJobCard({
  job,
  statusLabel,
  locale,
  isAnalyzing,
  isUpdatingResume,
  analyzeProgress,
  onAnalyze,
  onEditTimeline,
  onUpdateResume,
  formatCreatedAt,
  formatDateTime,
}: Readonly<SortableJobCardProps>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
  });

  return (
    <JobCard
      job={job}
      statusLabel={statusLabel}
      locale={locale}
      isAnalyzing={isAnalyzing}
      isUpdatingResume={isUpdatingResume}
      analyzeProgress={analyzeProgress}
      onAnalyze={onAnalyze}
      onEditTimeline={onEditTimeline}
      onUpdateResume={onUpdateResume}
      formatCreatedAt={formatCreatedAt}
      formatDateTime={formatDateTime}
      dragAttributes={attributes}
      dragListeners={listeners}
      dragRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    />
  );
}

type ColumnProps = {
  columnKey: BoardColumnKey;
  columnLabel: string;
  locale: Locale;
  jobs: JobApplication[];
  analyzingProgress: Record<string, number>;
  updatingResumeIds: Record<string, boolean>;
  onAnalyze: (jobId: string) => void;
  onEditTimeline: (job: JobApplication) => void;
  onUpdateResume: (jobId: string, file: File) => void;
  formatCreatedAt: (dateText: string) => string;
  formatDateTime: (dateText: string) => string;
};

function BoardColumn({
  columnKey,
  columnLabel,
  locale,
  jobs,
  analyzingProgress,
  updatingResumeIds,
  onAnalyze,
  onEditTimeline,
  onUpdateResume,
  formatCreatedAt,
  formatDateTime,
}: Readonly<ColumnProps>) {
  const copy = LOCALE_COPY[locale];
  const { setNodeRef, isOver } = useDroppable({
    id: columnKey,
  });
  const EmptyStateIcon = EMPTY_STATE_ICON_BY_COLUMN[columnKey];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition',
        isOver && 'border-sky-300 ring-2 ring-sky-100',
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-700 uppercase">{columnLabel}</h2>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
          {jobs.length}
        </span>
      </div>

      <SortableContext items={jobs.map((job) => job.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {jobs.map((job) => (
            <SortableJobCard
              key={job.id}
              job={job}
              statusLabel={columnLabel}
              locale={locale}
              isAnalyzing={typeof analyzingProgress[job.id] === 'number'}
              isUpdatingResume={Boolean(updatingResumeIds[job.id])}
              analyzeProgress={analyzingProgress[job.id]}
              onAnalyze={onAnalyze}
              onEditTimeline={onEditTimeline}
              onUpdateResume={onUpdateResume}
              formatCreatedAt={formatCreatedAt}
              formatDateTime={formatDateTime}
            />
          ))}

          {jobs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
              <EmptyStateIcon className="mx-auto mb-2 size-5 text-slate-400" />
              <p className="text-xs font-medium text-slate-500">
                {copy.emptyStates[columnKey].message}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">{copy.emptyStates[columnKey].hint}</p>
            </div>
          ) : null}
        </div>
      </SortableContext>
    </div>
  );
}

export function JobBoard({ initialJobs }: Readonly<JobBoardProps>) {
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
  const [jobs, setJobs] = useState<JobApplication[]>(initialJobs);
  const [isCreating, setIsCreating] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [timelineJobId, setTimelineJobId] = useState<string | null>(null);
  const [timelineInterviewAt, setTimelineInterviewAt] = useState('');
  const [timelineFollowUpAt, setTimelineFollowUpAt] = useState('');
  const [isSavingTimeline, setIsSavingTimeline] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [updatingResumeIds, setUpdatingResumeIds] = useState<Record<string, boolean>>({});
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>('all');
  const [nowTs, setNowTs] = useState(0);
  const [analyzingProgress, setAnalyzingProgress] = useState<Record<string, number>>({});
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const analyzeTimerRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );
  const copy = LOCALE_COPY[locale];

  const handleSwitchLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) {
      return;
    }

    setLocale(nextLocale);
    globalThis.localStorage.setItem('apply-flow-locale', nextLocale);
  };

  const clearAnalyzeTimer = (jobId: string) => {
    const timer = analyzeTimerRef.current[jobId];
    if (timer) {
      clearInterval(timer);
      delete analyzeTimerRef.current[jobId];
    }
  };

  const handleUnauthorized = () => {
    clearAuthToken();
    setIsAuthChecking(false);
    setCurrentUser(null);
    setJobs([]);
    setIsFormOpen(false);
    setErrorMessage(copy.authRequiredHint);
    router.replace('/login');
  };

  useEffect(() => {
    return () => {
      Object.values(analyzeTimerRef.current).forEach((timer) => clearInterval(timer));
      analyzeTimerRef.current = {};
    };
  }, []);

  useEffect(() => {
    const updateNow = () => {
      setNowTs(new Date().getTime());
    };

    updateNow();
    const timer = setInterval(updateNow, 60 * 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      globalThis.document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      globalThis.document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isNotificationOpen]);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const profile = await apiJson<{ user: AuthUser }>('/api/auth/me');
        if (!isMounted) {
          return;
        }
        setCurrentUser(profile.user);

        const jobsResponse = await apiFetch('/api/jobs', { cache: 'no-store' });
        if (!isMounted) {
          return;
        }

        if (jobsResponse.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!jobsResponse.ok) {
          setErrorMessage(copy.fetchJobsError);
          return;
        }

        const jobData = (await jobsResponse.json()) as JobApplication[];
        setJobs(jobData);
      } catch (error) {
        if (error instanceof ApiError && error.status !== 401) {
          setErrorMessage(copy.fetchJobsError);
        } else {
          handleUnauthorized();
        }
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    };

    void checkSession();
    return () => {
      isMounted = false;
    };
  }, [copy.authRequiredHint, copy.fetchJobsError, router]);

  const fetchJobs = async () => {
    const response = await apiFetch('/api/jobs', { cache: 'no-store' });
    if (response.status === 401) {
      handleUnauthorized();
      return;
    }
    if (!response.ok) {
      throw new Error(copy.fetchJobsError);
    }
    const data = (await response.json()) as JobApplication[];
    setJobs(data);
  };

  const jobsByStatus = useMemo(() => {
    return BOARD_COLUMNS.reduce<Record<BoardColumnKey, JobApplication[]>>((acc, column) => {
      acc[column.key] = jobs.filter((job) => job.status === column.key);
      return acc;
    }, {} as Record<BoardColumnKey, JobApplication[]>);
  }, [jobs]);

  const dashboardMetrics = useMemo<DashboardMetric[]>(() => {
    const totalCount = jobs.length;
    const interviewCount = jobsByStatus.INTERVIEW.length;
    const offerCount = jobsByStatus.OFFER.length;
    const offerRate = totalCount > 0 ? `${Math.round((offerCount / totalCount) * 100)}%` : '0%';

    return [
      {
        key: 'total',
        label: copy.totalJobs,
        value: String(totalCount),
        hint: copy.totalJobsHint,
        icon: BriefcaseBusiness,
      },
      {
        key: 'interview',
        label: copy.inInterview,
        value: String(interviewCount),
        hint: copy.inInterviewHint,
        icon: Activity,
      },
      {
        key: 'offer-rate',
        label: copy.offerRate,
        value: offerRate,
        hint: copy.offerRateHint,
        icon: TrendingUp,
      },
      {
        key: 'momentum',
        label: copy.momentum,
        value: jobsByStatus.APPLIED.length >= 3 ? copy.momentumStrong : copy.momentumRampUp,
        hint: copy.momentumHint,
        icon: Rocket,
      },
    ];
  }, [copy, jobs, jobsByStatus]);

  const upcomingInterviews = useMemo(() => {
    const now = nowTs;
    return jobs
      .filter((job) => typeof job.interviewAt === 'string')
      .map((job) => ({
        jobId: job.id,
        company: job.company,
        position: job.position,
        interviewAt: job.interviewAt as string,
      }))
      .filter((job) => {
        const value = new Date(job.interviewAt).getTime();
        return Number.isFinite(value) && value >= now - 24 * 60 * 60 * 1000;
      })
      .sort((a, b) => new Date(a.interviewAt).getTime() - new Date(b.interviewAt).getTime())
      .slice(0, 6);
  }, [jobs, nowTs]);

  const reminderItems = useMemo<ReminderItem[]>(() => {
    const now = new Date(nowTs);
    const next24Hours = now.getTime() + 24 * 60 * 60 * 1000;

    return jobs
      .flatMap((job) => {
        const reminders: ReminderItem[] = [];
        const isIgnored = job.reminderState === 'IGNORED';
        if (isIgnored) {
          return reminders;
        }

        if (job.followUpAt) {
          const followUpDate = new Date(job.followUpAt);
          const snoozedUntil = job.reminderSnoozedUntil
            ? new Date(job.reminderSnoozedUntil).getTime()
            : null;
          if (
            !Number.isNaN(followUpDate.getTime()) &&
            followUpDate.getTime() <= next24Hours &&
            (snoozedUntil === null || snoozedUntil <= now.getTime()) &&
            (job.status === 'APPLIED' || job.status === 'INTERVIEW')
          ) {
            reminders.push({
              jobId: job.id,
              company: job.company,
              position: job.position,
              dueAt: followUpDate,
              reason: 'follow-up',
              level: followUpDate <= now ? 'overdue' : 'upcoming',
              state: job.reminderState,
            });
          }
        }

        if (!job.followUpAt && job.status === 'APPLIED') {
          const createdAt = new Date(job.createdAt);
          if (!Number.isNaN(createdAt.getTime())) {
            const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
            if (ageInDays >= 5) {
              reminders.push({
                jobId: job.id,
                company: job.company,
                position: job.position,
                dueAt: createdAt,
                reason: 'stale-applied',
                level: 'overdue',
                state: job.reminderState,
              });
            }
          }
        }

        return reminders;
      })
      .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
      .slice(0, 8);
  }, [jobs, nowTs]);

  const notificationItems = useMemo(() => {
    return reminderItems.filter((item) => item.state !== 'IGNORED');
  }, [reminderItems]);

  const filteredNotificationItems = useMemo(() => {
    if (notificationFilter === 'unread') {
      return notificationItems.filter((item) => item.state === 'UNREAD');
    }

    if (notificationFilter === 'overdue') {
      return notificationItems.filter((item) => item.level === 'overdue');
    }

    return notificationItems;
  }, [notificationFilter, notificationItems]);

  const unreadNotificationCount = useMemo(() => {
    return notificationItems.filter((item) => item.state === 'UNREAD').length;
  }, [notificationItems]);

  const pendingReminderItems = useMemo(() => {
    return reminderItems.filter((item) => item.state === 'UNREAD');
  }, [reminderItems]);

  const formatCreatedAt = (dateText: string) => {
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) {
      return copy.unknownTime;
    }
    return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatDateTime = (dateText: string) => {
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) {
      return copy.unknownTime;
    }

    return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatReminderAge = (days: number) => {
    return copy.staleAppliedFormat.replace('{{days}}', String(days));
  };

  const toDateTimeLocalValue = (dateText: string | null) => {
    if (!dateText) {
      return '';
    }
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const getWeekendSnoozeIso = () => {
    const base = new Date(nowTs);
    const day = base.getDay();
    const daysToSaturday = day <= 6 ? (6 - day + 7) % 7 : 0;
    const target = new Date(base.getTime() + (daysToSaturday || 7) * 24 * 60 * 60 * 1000);
    target.setHours(9, 0, 0, 0);
    return target.toISOString();
  };

  const handleReminderAction = async (
    jobId: string,
    action: 'read' | 'ignore' | 'snooze',
    snoozeUntil?: string,
  ) => {
    try {
      const response = await apiFetch(`/api/jobs/${jobId}/reminder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          snoozeUntil,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update reminder');
      }

      const updatedJob = (await response.json()) as JobApplication;
      setJobs((prev) => prev.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenTimelineEditor = (job: JobApplication) => {
    setTimelineJobId(job.id);
    setTimelineInterviewAt(toDateTimeLocalValue(job.interviewAt));
    setTimelineFollowUpAt(toDateTimeLocalValue(job.followUpAt));
  };

  const handleSaveTimeline = async () => {
    if (!timelineJobId) {
      return;
    }

    try {
      setIsSavingTimeline(true);
      const response = await apiFetch(`/api/jobs/${timelineJobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewAt: timelineInterviewAt || null,
          followUpAt: timelineFollowUpAt || null,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to update timeline.');
      }

      const updatedJob = (await response.json()) as JobApplication;
      setJobs((prev) => prev.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
      setTimelineJobId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingTimeline(false);
    }
  };

  const handleBulkMarkRead = async (jobIds?: string[]) => {
    try {
      const response = await apiFetch('/api/jobs/reminders/mark-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: jobIds,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to mark reminders as read.');
      }

      await fetchJobs();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateJob = async (payload: {
    company: string;
    position: string;
    jdText: string;
    source: string;
    resumeFile: File | null;
  }) => {
    try {
      setIsCreating(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append('company', payload.company);
      formData.append('position', payload.position);
      formData.append('source', payload.source);
      formData.append('jdText', payload.jdText);
      if (payload.resumeFile) {
        formData.append('resume', payload.resumeFile);
      }

      const response = await apiFetch('/api/jobs', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(copy.createJobError);
      }

      await fetchJobs();
      setIsFormOpen(false);
    } catch (error) {
      console.error(error);
      setErrorMessage(copy.createJobErrorHint);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateResume = async (jobId: string, file: File) => {
    try {
      setErrorMessage(null);
      setUpdatingResumeIds((prev) => ({ ...prev, [jobId]: true }));

      const formData = new FormData();
      formData.append('resume', file);

      const response = await apiFetch(`/api/jobs/${jobId}/resume`, {
        method: 'PATCH',
        body: formData,
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const rawError = (await response.text()).trim();
        let detailedMessage = '';

        if (rawError) {
          try {
            const parsed = JSON.parse(rawError) as { message?: string | string[] };
            if (Array.isArray(parsed.message)) {
              detailedMessage = parsed.message.join('; ');
            } else if (typeof parsed.message === 'string') {
              detailedMessage = parsed.message;
            } else {
              detailedMessage = rawError;
            }
          } catch {
            detailedMessage = rawError;
          }
        }

        throw new Error(detailedMessage || copy.updateResumeErrorHint);
      }

      const updatedJob = (await response.json()) as JobApplication;
      setJobs((prev) => prev.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : copy.updateResumeErrorHint);
    } finally {
      setUpdatingResumeIds((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
    }
  };

  const handleAnalyze = async (jobId: string) => {
    if (typeof analyzingProgress[jobId] === 'number') {
      return;
    }

    setAnalyzingProgress((prev) => ({ ...prev, [jobId]: 8 }));
    clearAnalyzeTimer(jobId);
    analyzeTimerRef.current[jobId] = setInterval(() => {
      setAnalyzingProgress((prev) => {
        const current = prev[jobId];
        if (typeof current !== 'number') {
          return prev;
        }
        const next = Math.min(92, current + Math.random() * 14);
        return { ...prev, [jobId]: next };
      });
    }, 350);

    try {
      setErrorMessage(null);
      const response = await apiFetch(`/api/jobs/${jobId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const rawError = (await response.text()).trim();
        let detailedMessage = '';

        if (rawError) {
          try {
            const parsed = JSON.parse(rawError) as { message?: string | string[] };
            if (Array.isArray(parsed.message)) {
              detailedMessage = parsed.message.join('; ');
            } else if (typeof parsed.message === 'string') {
              detailedMessage = parsed.message;
            } else {
              detailedMessage = rawError;
            }
          } catch {
            detailedMessage = rawError;
          }
        }

        throw new Error(detailedMessage || copy.analyzeErrorHint);
      }

      const updatedJob = (await response.json()) as JobApplication;
      clearAnalyzeTimer(jobId);
      setAnalyzingProgress((prev) => ({ ...prev, [jobId]: 100 }));
      setJobs((prev) => prev.map((job) => (job.id === updatedJob.id ? updatedJob : job)));
      setTimeout(() => {
        setAnalyzingProgress((prev) => {
          const next = { ...prev };
          delete next[jobId];
          return next;
        });
      }, 420);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : copy.analyzeErrorHint);
      clearAnalyzeTimer(jobId);
      setAnalyzingProgress((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
    }
  };

  const getDropStatus = (overId: string): BoardColumnKey | null => {
    if (isBoardColumnKey(overId)) {
      return overId;
    }

    const overJob = jobs.find((job) => job.id === overId);
    if (overJob && isBoardColumnKey(overJob.status)) {
      return overJob.status;
    }

    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveJobId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveJobId(null);

    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!overId) {
      return;
    }

    const sourceJob = jobs.find((job) => job.id === activeId);
    if (!sourceJob || !isBoardColumnKey(sourceJob.status)) {
      return;
    }

    const targetStatus = getDropStatus(overId);
    if (!targetStatus || targetStatus === sourceJob.status) {
      return;
    }

    // Optimistic update: move the card first and roll back on failure.
    const previousJobs = jobs;
    setJobs((prev) =>
      prev.map((job) => (job.id === activeId ? { ...job, status: targetStatus } : job)),
    );

    try {
      setErrorMessage(null);
      const response = await apiFetch(`/api/jobs/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(copy.updateStatusError);
      }

      const updatedJob = (await response.json()) as JobApplication;
      setJobs((prev) => prev.map((job) => (job.id === activeId ? updatedJob : job)));
    } catch (error) {
      console.error(error);
      setJobs(previousJobs);
      setErrorMessage(copy.dragUpdateError);
    }
  };

  const activeJob = activeJobId ? jobs.find((job) => job.id === activeJobId) : null;
  const activeJobStatusLabel =
    activeJob && isBoardColumnKey(activeJob.status)
      ? getStatusLabel(activeJob.status, locale)
      : copy.unknownStatus;

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error(error);
    } finally {
      clearAuthToken();
      setCurrentUser(null);
      setJobs([]);
      router.replace('/login');
    }
  };

  if (isAuthChecking) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <Card className="rounded-xl border-slate-200/80 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{copy.loadingJobs}</p>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <header className="relative rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-slate-500 uppercase">Apply Flow</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{copy.appTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            {currentUser ? (
              <span className="hidden rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600 sm:inline">
                {currentUser.email}
              </span>
            ) : null}
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1">
              <button
                type="button"
                onClick={() => handleSwitchLocale('zh')}
                className={cn(
                  'h-7 rounded-lg px-3 text-xs font-medium transition',
                  locale === 'zh'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                中文
              </button>
              <button
                type="button"
                onClick={() => handleSwitchLocale('en')}
                className={cn(
                  'h-7 rounded-lg px-3 text-xs font-medium transition',
                  locale === 'en'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                EN
              </button>
            </div>
            <Button onClick={() => setIsFormOpen(true)} className="h-9 rounded-lg px-4 text-sm">
              <Plus className="size-4" />
              {copy.addJob}
            </Button>
            <div ref={notificationPanelRef} className="relative">
              <Button
                variant="outline"
                onClick={() => setIsNotificationOpen((prev) => !prev)}
                className="relative h-9 w-9 rounded-lg p-0"
              >
                <Bell className="size-4" />
                {unreadNotificationCount > 0 ? (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                ) : null}
              </Button>

              {isNotificationOpen ? (
                <div className="absolute top-11 right-0 z-30 w-[360px]">
                  <Card className="rounded-xl border-slate-200/90 bg-white shadow-xl">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-sm font-semibold text-slate-900">
                          {copy.notificationCenterTitle}
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px]"
                          onClick={() =>
                            void handleBulkMarkRead(
                              filteredNotificationItems
                                .filter((item) => item.state === 'UNREAD')
                                .map((item) => item.jobId),
                            )
                          }
                          disabled={!filteredNotificationItems.some((item) => item.state === 'UNREAD')}
                        >
                          {notificationFilter === 'all' ? copy.markAllRead : copy.markFilteredRead}
                        </Button>
                      </div>
                      <CardDescription className="text-xs text-slate-500">
                        {copy.notificationCenterHint}
                      </CardDescription>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <Button
                          size="sm"
                          variant={notificationFilter === 'all' ? 'default' : 'outline'}
                          className="h-7 text-[11px]"
                          onClick={() => setNotificationFilter('all')}
                        >
                          {copy.filterAll}
                        </Button>
                        <Button
                          size="sm"
                          variant={notificationFilter === 'unread' ? 'default' : 'outline'}
                          className="h-7 text-[11px]"
                          onClick={() => setNotificationFilter('unread')}
                        >
                          {copy.filterUnread}
                        </Button>
                        <Button
                          size="sm"
                          variant={notificationFilter === 'overdue' ? 'default' : 'outline'}
                          className="h-7 text-[11px]"
                          onClick={() => setNotificationFilter('overdue')}
                        >
                          {copy.filterOverdue}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="max-h-[360px] space-y-2 overflow-y-auto">
                      {filteredNotificationItems.length === 0 ? (
                        <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                          {copy.noNotifications}
                        </p>
                      ) : (
                        filteredNotificationItems.map((reminder) => (
                          <div
                            key={`center-${reminder.jobId}-${reminder.reason}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                          >
                            <div>
                              <p className="text-xs font-medium text-slate-700">
                                {reminder.company} · {reminder.position}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {reminder.reason === 'follow-up'
                                  ? copy.reminderDue
                                  : copy.reminderStaleApplied}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="bg-white text-slate-700">
                                {reminder.state === 'READ'
                                  ? copy.stateRead
                                  : reminder.state === 'IGNORED'
                                    ? copy.stateIgnored
                                    : copy.stateUnread}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px]"
                                onClick={() => void handleReminderAction(reminder.jobId, 'read')}
                              >
                                {copy.actionRead}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[11px] text-slate-500"
                                onClick={() => void handleReminderAction(reminder.jobId, 'ignore')}
                              >
                                {copy.actionIgnore}
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </div>
            <Button
              variant="outline"
              onClick={() => void handleLogout()}
              className="h-9 rounded-lg px-3 text-sm"
            >
              <LogOut className="size-4" />
              {copy.logout}
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => {
          const MetricIcon = metric.icon;
          return (
            <Card
              key={metric.key}
              className="gap-0 rounded-xl border-slate-200/80 bg-white/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardContent className="flex items-start justify-between pt-3.5 pb-3">
                <div>
                  <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{metric.label}</p>
                  <p className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">{metric.value}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{metric.hint}</p>
                </div>
                <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                  <MetricIcon className="size-4" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CalendarClock className="size-4 text-sky-600" />
              {copy.interviewCalendarTitle}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {copy.interviewCalendarHint}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingInterviews.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                {copy.noInterviewScheduled}
              </p>
            ) : (
              upcomingInterviews.map((interview) => (
                <div
                  key={interview.jobId}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      {interview.company} · {interview.position}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                    {formatDateTime(interview.interviewAt)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BellRing className="size-4 text-amber-600" />
              {copy.reminderTitle}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">{copy.reminderHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingReminderItems.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                {copy.noReminder}
              </p>
            ) : (
              pendingReminderItems.map((reminder) => (
                <div
                  key={`${reminder.jobId}-${reminder.reason}`}
                  className={cn(
                    'rounded-lg border px-3 py-2.5',
                    reminder.level === 'overdue'
                      ? 'border-red-200 bg-red-50/70'
                      : 'border-amber-200 bg-amber-50/70',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        {reminder.company} · {reminder.position}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {reminder.reason === 'follow-up' ? copy.reminderDue : copy.reminderStaleApplied}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'h-6',
                        reminder.level === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700',
                      )}
                    >
                      {reminder.level === 'overdue' ? copy.reminderOverdue : copy.reminderUpcoming}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-white text-amber-700">
                      <ClockAlert className="mr-1 size-3.5" />
                      {reminder.reason === 'follow-up'
                        ? formatDateTime(reminder.dueAt.toISOString())
                        : formatReminderAge(
                            Math.floor(
                              (nowTs - reminder.dueAt.getTime()) / (24 * 60 * 60 * 1000),
                            ),
                          )}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      onClick={() => void handleReminderAction(reminder.jobId, 'read')}
                    >
                      {copy.actionRead}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      onClick={() => void handleReminderAction(reminder.jobId, 'snooze', new Date(nowTs + 24 * 60 * 60 * 1000).toISOString())}
                    >
                      {copy.actionSnooze1d}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      onClick={() => void handleReminderAction(reminder.jobId, 'snooze', new Date(nowTs + 3 * 24 * 60 * 60 * 1000).toISOString())}
                    >
                      {copy.actionSnooze3d}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px]"
                      onClick={() => void handleReminderAction(reminder.jobId, 'snooze', getWeekendSnoozeIso())}
                    >
                      {copy.actionSnoozeWeekend}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-[11px] text-slate-500"
                      onClick={() => void handleReminderAction(reminder.jobId, 'ignore')}
                    >
                      {copy.actionIgnore}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {errorMessage ? (
        <div className="fixed right-4 bottom-4 z-[60] w-[min(92vw,420px)]">
          <Alert
            variant="destructive"
            className="relative rounded-xl border-red-200 bg-red-50/95 pr-10 text-red-700 shadow-lg"
          >
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setErrorMessage(null)}
              className="absolute top-2 right-2 rounded p-1 text-red-500 transition hover:bg-red-100 hover:text-red-700"
            >
              <X className="size-4" />
            </button>
            <AlertTitle className="text-sm">{copy.requestFailed}</AlertTitle>
            <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label="Close form drawer"
            className="absolute inset-0"
            onClick={() => {
              if (!isCreating) {
                setIsFormOpen(false);
              }
            }}
          />
          <aside className="absolute top-0 right-0 flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-slate-50 p-4 shadow-2xl">
            <div className="mb-3 flex shrink-0 items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">{copy.createNewJob}</p>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  if (!isCreating) {
                    setIsFormOpen(false);
                  }
                }}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <JobForm onSubmit={handleCreateJob} isSubmitting={isCreating} locale={locale} />
            </div>
          </aside>
        </div>
      ) : null}

      {timelineJobId ? (
        <div className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[1px]">
          <button
            type="button"
            aria-label="Close timeline editor"
            className="absolute inset-0"
            onClick={() => {
              if (!isSavingTimeline) {
                setTimelineJobId(null);
              }
            }}
          />
          <aside className="absolute top-0 right-0 h-full w-full max-w-md border-l border-slate-200 bg-slate-50 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">{copy.editTimelineTitle}</p>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  if (!isSavingTimeline) {
                    setTimelineJobId(null);
                  }
                }}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="timeline-interview-at"
                  className="text-xs font-medium tracking-wide text-slate-500 uppercase"
                >
                  {copy.interviewAt}
                </label>
                <Input
                  id="timeline-interview-at"
                  type="datetime-local"
                  value={timelineInterviewAt}
                  onChange={(event) => setTimelineInterviewAt(event.target.value)}
                  className="h-10 border-slate-200 bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="timeline-follow-up-at"
                  className="text-xs font-medium tracking-wide text-slate-500 uppercase"
                >
                  {copy.followUpAt}
                </label>
                <Input
                  id="timeline-follow-up-at"
                  type="datetime-local"
                  value={timelineFollowUpAt}
                  onChange={(event) => setTimelineFollowUpAt(event.target.value)}
                  className="h-10 border-slate-200 bg-white"
                />
              </div>

              <Button
                onClick={() => void handleSaveTimeline()}
                disabled={isSavingTimeline}
                className="h-10 w-full"
              >
                {isSavingTimeline ? copy.savingTimeline : copy.saveTimeline}
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={(event) => void handleDragEnd(event)}
      >
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BOARD_COLUMNS.map((column) => (
            <BoardColumn
              key={column.key}
              columnKey={column.key}
              columnLabel={copy.columns[column.key]}
              locale={locale}
              jobs={jobsByStatus[column.key]}
              analyzingProgress={analyzingProgress}
              updatingResumeIds={updatingResumeIds}
              onAnalyze={(jobId) => void handleAnalyze(jobId)}
              onEditTimeline={(job) => handleOpenTimelineEditor(job)}
              onUpdateResume={(jobId, file) => void handleUpdateResume(jobId, file)}
              formatCreatedAt={formatCreatedAt}
              formatDateTime={formatDateTime}
            />
          ))}
        </section>

        <DragOverlay>
          {activeJob ? (
            <div className="w-[320px]">
              <JobCard
                job={activeJob}
                statusLabel={activeJobStatusLabel}
                locale={locale}
                isAnalyzing={false}
                isUpdatingResume={false}
                onAnalyze={() => {}}
                onEditTimeline={() => {}}
                onUpdateResume={() => {}}
                formatCreatedAt={formatCreatedAt}
                formatDateTime={formatDateTime}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}
