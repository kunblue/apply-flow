import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

type Locale = 'zh' | 'en';

@Injectable()
export class AiService {
  async generateMatchAnalysis(
    jdText: string,
    resumeText: string,
    locale: Locale = 'zh',
  ): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        locale === 'zh'
          ? 'GEMINI_API_KEY 未配置，无法执行 AI 分析。'
          : 'GEMINI_API_KEY is not configured.',
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const normalizedResumeText =
      resumeText?.trim() ||
      (locale === 'zh'
        ? '未上传简历或未解析出有效文本。'
        : 'Resume not uploaded or no valid resume text was extracted.');

    // Request structured JSON output for reliable frontend rendering.
    const prompt =
      locale === 'zh'
        ? [
            '你是资深招聘顾问，请根据岗位 JD 和候选人简历做匹配分析。',
            '请严格输出 JSON（不要输出 markdown 代码块，不要输出额外说明），字段如下：',
            '{',
            '  "matchScore": number, // 0-100，岗位匹配度',
            '  "resumeScore": number, // 0-100，简历质量评分',
            '  "resumeImprovements": string[], // 3-5 条简历优化建议',
            '  "introTemplate": string // 推荐自我介绍模板，120-220 字',
            '}',
            '',
            '分析规则：',
            '1) matchScore 结合技能匹配、项目相关度、经验年限综合判断；',
            '2) resumeScore 关注简历结构、量化成果、关键词覆盖、表达清晰度；',
            '3) resumeImprovements 给出可执行建议，避免空泛；',
            '4) introTemplate 使用中文，语气专业、积极，贴合岗位。',
            '',
            '岗位描述：',
            jdText,
            '',
            '候选人简历文本：',
            normalizedResumeText,
          ].join('\n')
        : [
            'You are a senior recruiting advisor. Analyze the fit between this job description and candidate resume.',
            'Return strict JSON only (no markdown, no extra prose) using this schema:',
            '{',
            '  "matchScore": number, // 0-100 fit score for this role',
            '  "resumeScore": number, // 0-100 resume quality score',
            '  "resumeImprovements": string[], // 3-5 actionable resume improvements',
            '  "introTemplate": string // recommended self-introduction template, 90-160 words',
            '}',
            '',
            'Rules:',
            '1) matchScore should combine skills alignment, project relevance, and seniority fit.',
            '2) resumeScore should reflect structure, quantified outcomes, keyword coverage, and clarity.',
            '3) resumeImprovements must be concrete and actionable.',
            '4) introTemplate must be in English and tailored to the role.',
            '',
            'Job Description:',
            jdText,
            '',
            'Candidate Resume Text:',
            normalizedResumeText,
          ].join('\n');

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    if (!rawText) {
      throw new InternalServerErrorException('AI 未返回有效内容，请稍后重试。');
    }

    try {
      const normalizedText = rawText
        .replace(/^```json\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      const parsed = JSON.parse(normalizedText) as {
        matchScore?: number;
        resumeScore?: number;
        resumeImprovements?: string[];
        introTemplate?: string;
      };

      const structuredFeedback = {
        matchScore: Number.isFinite(parsed.matchScore)
          ? Math.max(0, Math.min(100, Math.round(parsed.matchScore as number)))
          : 0,
        resumeScore: Number.isFinite(parsed.resumeScore)
          ? Math.max(0, Math.min(100, Math.round(parsed.resumeScore as number)))
          : 0,
        resumeImprovements: Array.isArray(parsed.resumeImprovements)
          ? parsed.resumeImprovements.slice(0, 5)
          : [],
        introTemplate:
          parsed.introTemplate?.trim() ||
          (locale === 'zh'
            ? '暂无可用自我介绍模板建议。'
            : 'No intro template suggestion is available right now.'),
      };

      return JSON.stringify(structuredFeedback, null, 2);
    } catch {
      throw new InternalServerErrorException(
        locale === 'zh'
          ? 'AI 返回格式不符合预期，请重试。'
          : 'AI response format is invalid. Please try again.',
      );
    }
  }
}
