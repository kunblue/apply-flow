'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type CreateJobPayload = {
  company: string;
  position: string;
  jdText: string;
  source: string;
  resumeFile: File | null;
};

type JobFormProps = {
  onSubmit: (payload: CreateJobPayload) => Promise<void>;
  isSubmitting: boolean;
  locale: 'zh' | 'en';
};

const COPY = {
  zh: {
    title: '添加职位',
    description: '先快速录入岗位基础信息；面试和跟进时间可在创建后随时设置。',
    companyLabel: '公司名',
    companyPlaceholder: '例如：字节跳动',
    positionLabel: '职位名',
    sourceLabel: '职位来源',
    positionPlaceholder: '例如：前端工程师',
    sourcePlaceholder: '例如：Boss直聘',
    jdLabel: '岗位描述（JD）',
    jdPlaceholder: '粘贴岗位职责、任职要求、技术栈...',
    resumeLabel: '上传简历（PDF / Word DOCX）',
    resumeSelected: '已选择：',
    resumeHint: '支持 PDF 或 DOCX（不支持老版 .doc）；未上传时将仅基于 JD 进行分析。',
    submitLoading: '提交中...',
    submitIdle: '保存职位',
  },
  en: {
    title: 'Add Job',
    description: 'Add core job info first. You can set interview and reminder times later.',
    companyLabel: 'Company',
    companyPlaceholder: 'e.g. ByteDance',
    positionLabel: 'Position',
    sourceLabel: 'Source',
    positionPlaceholder: 'e.g. Frontend Engineer',
    sourcePlaceholder: 'e.g. Boss zhipin',
    jdLabel: 'Job Description (JD)',
    jdPlaceholder: 'Paste responsibilities, requirements, and tech stack...',
    resumeLabel: 'Upload Resume (PDF / Word DOCX)',
    resumeSelected: 'Selected: ',
    resumeHint: 'Supports PDF or DOCX (legacy .doc is not supported). If omitted, analysis will be based on JD only.',
    submitLoading: 'Submitting...',
    submitIdle: 'Save Job',
  },
} as const;

export function JobForm({ onSubmit, isSubmitting, locale }: Readonly<JobFormProps>) {
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [source, setSource] = useState('');
  const [jdText, setJdText] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const copy = COPY[locale];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ company, position, jdText, source, resumeFile });
    setCompany('');
    setPosition('');
    setJdText('');
    setResumeFile(null);
  };

  return (
    <Card className="gap-0 rounded-xl border-slate-200/80 bg-white shadow-sm">
      <CardHeader className="gap-1 border-b border-slate-100">
        <CardTitle className="text-base font-semibold text-slate-900">{copy.title}</CardTitle>
        <CardDescription className="text-sm text-slate-500">{copy.description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label
              htmlFor="company"
              className="text-xs font-medium tracking-wide text-slate-500 uppercase"
            >
              {copy.companyLabel}
            </label>
            <Input
              id="company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder={copy.companyPlaceholder}
              className="h-10 border-slate-200 bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="position"
              className="text-xs font-medium tracking-wide text-slate-500 uppercase"
            >
              {copy.positionLabel}
            </label>
            <Input
              id="position"
              value={position}
              onChange={(event) => setPosition(event.target.value)}
              placeholder={copy.positionPlaceholder}
              className="h-10 border-slate-200 bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="source"
              className="text-xs font-medium tracking-wide text-slate-500 uppercase"
            >
              {copy.sourceLabel}
            </label>
            <Input
              id="source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder={copy.sourcePlaceholder}
              className="h-10 border-slate-200 bg-white"
              required
            />
          </div>

          <div className="space-y-1.5 lg:col-span-3">
            <label
              htmlFor="jd-text"
              className="text-xs font-medium tracking-wide text-slate-500 uppercase"
            >
              {copy.jdLabel}
            </label>
            <Textarea
              id="jd-text"
              value={jdText}
              onChange={(event) => setJdText(event.target.value)}
              placeholder={copy.jdPlaceholder}
              className="min-h-32 border-slate-200 bg-white leading-6"
              required
            />
          </div>

          <div className="space-y-1.5 lg:col-span-3">
            <label
              htmlFor="resume-pdf"
              className="text-xs font-medium tracking-wide text-slate-500 uppercase"
            >
              {copy.resumeLabel}
            </label>
            <Input
              id="resume-pdf"
              type="file"
              accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="h-10 border-slate-200 bg-white file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:text-slate-600"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0] ?? null;
                setResumeFile(selectedFile);
              }}
            />
            <p className="text-xs text-slate-500">
              {resumeFile ? `${copy.resumeSelected}${resumeFile.name}` : copy.resumeHint}
            </p>
          </div>

          <div className="lg:col-span-3">
            <Button type="submit" disabled={isSubmitting} className="h-10 px-5 text-sm">
              {isSubmitting ? copy.submitLoading : copy.submitIdle}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
