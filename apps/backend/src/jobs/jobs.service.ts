import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  JobApplication,
  ReminderState,
} from '@prisma/client';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { MarkRemindersReadDto } from './dto/mark-reminders-read.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  findAll(userId: string): Promise<JobApplication[]> {
    return this.prisma.jobApplication.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string): Promise<JobApplication> {
    const job = await this.prisma.jobApplication.findFirst({
      where: {
        id,
        userId,
      },
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} was not found.`);
    }
    return job;
  }

  private async extractResumeText(file?: Express.Multer.File): Promise<string> {
    if (!file) {
      return '';
    }

    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfName = file.originalname.toLowerCase().endsWith('.pdf');
    const isDocxMime = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream',
    ].includes(file.mimetype);
    const isDocxName = file.originalname.toLowerCase().endsWith('.docx');
    const isLegacyDoc =
      file.originalname.toLowerCase().endsWith('.doc') ||
      (file.mimetype === 'application/msword' && !isDocxName);

    let rawText = '';
    if (isPdfMime || isPdfName) {
      const parser = new PDFParse({ data: file.buffer });
      const parsed = await parser.getText();
      await parser.destroy();
      rawText = parsed.text;
    } else if (isLegacyDoc) {
      throw new BadRequestException(
        'Legacy .doc files are not supported yet. Please convert to .docx or PDF.',
      );
    } else if (isDocxMime || isDocxName) {
      const parsed = await mammoth.extractRawText({ buffer: file.buffer });
      rawText = parsed.value;
    } else {
      throw new BadRequestException(
        'Only PDF or DOCX resume files are supported.',
      );
    }

    const sanitizedText = rawText
      .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, ' ')
      .replaceAll('\u0000', ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

    if (!sanitizedText) {
      throw new BadRequestException(
        'Resume file could not be parsed into text. Please upload a text-based PDF or DOCX file.',
      );
    }

    return sanitizedText;
  }

  private parseOptionalDate(
    value: string | null | undefined,
    fieldName: string,
  ): Date | null | undefined {
    if (typeof value === 'undefined') {
      return undefined;
    }

    if (value === null || value.trim() === '') {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} is invalid.`);
    }

    return date;
  }

  async create(
    dto: CreateJobDto,
    userId: string,
    resumeFile?: Express.Multer.File,
  ): Promise<JobApplication> {
    const resumeText = await this.extractResumeText(resumeFile);
    const interviewAt = this.parseOptionalDate(dto.interviewAt, 'interviewAt');
    const followUpAt = this.parseOptionalDate(dto.followUpAt, 'followUpAt');

    return this.prisma.jobApplication.create({
      data: {
        company: dto.company,
        position: dto.position,
        jdText: dto.jdText,
        source: dto.source,
        resumeText,
        status: dto.status ?? ApplicationStatus.APPLIED,
        interviewAt: interviewAt ?? null,
        followUpAt: followUpAt ?? null,
        reminderState: ReminderState.UNREAD,
        reminderSnoozedUntil: null,
        userId,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateJobDto,
  ): Promise<JobApplication> {
    const existingJob = await this.findOne(id, userId);

    const interviewAt = this.parseOptionalDate(dto.interviewAt, 'interviewAt');
    const followUpAt = this.parseOptionalDate(dto.followUpAt, 'followUpAt');

    const shouldResetReminderState =
      typeof followUpAt !== 'undefined' &&
      existingJob.followUpAt?.toISOString() !== followUpAt?.toISOString();

    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        ...dto,
        interviewAt,
        followUpAt,
        ...(shouldResetReminderState
          ? {
              reminderState: ReminderState.UNREAD,
              reminderSnoozedUntil: null,
            }
          : {}),
      },
    });
  }

  async updateResume(
    id: string,
    userId: string,
    resumeFile?: Express.Multer.File,
  ): Promise<JobApplication> {
    await this.findOne(id, userId);
    const resumeText = await this.extractResumeText(resumeFile);
    if (!resumeText) {
      throw new BadRequestException('A PDF resume file is required.');
    }

    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        resumeText,
        aiFeedback: null,
      },
    });
  }

  async remove(id: string, userId: string): Promise<JobApplication> {
    await this.findOne(id, userId);
    return this.prisma.jobApplication.delete({ where: { id } });
  }

  async analyze(
    id: string,
    userId: string,
    locale?: 'zh' | 'en',
  ): Promise<JobApplication> {
    const job = await this.findOne(id, userId);
    if(job.resumeText.trim() === '') {
      throw new BadRequestException('Resume text is required.');
    }
    const aiFeedback = await this.aiService.generateMatchAnalysis(
      job.jdText,
      job.resumeText,
      locale ?? 'zh',
    );

    // Persist AI output so the frontend can display it directly.
    return this.prisma.jobApplication.update({
      where: { id },
      data: { aiFeedback },
    });
  }

  async updateReminder(
    id: string,
    userId: string,
    dto: UpdateReminderDto,
  ): Promise<JobApplication> {
    await this.findOne(id, userId);

    if (dto.action === 'read') {
      return this.prisma.jobApplication.update({
        where: { id },
        data: {
          reminderState: ReminderState.READ,
        },
      });
    }

    if (dto.action === 'ignore') {
      return this.prisma.jobApplication.update({
        where: { id },
        data: {
          reminderState: ReminderState.IGNORED,
          reminderSnoozedUntil: null,
        },
      });
    }

    if (dto.action === 'snooze') {
      const snoozeUntil = this.parseOptionalDate(
        dto.snoozeUntil,
        'snoozeUntil',
      );
      if (!snoozeUntil) {
        throw new BadRequestException(
          'snoozeUntil is required for snooze action.',
        );
      }

      return this.prisma.jobApplication.update({
        where: { id },
        data: {
          reminderState: ReminderState.UNREAD,
          reminderSnoozedUntil: snoozeUntil,
        },
      });
    }

    throw new BadRequestException('Unsupported reminder action.');
  }

  async markRemindersRead(
    userId: string,
    dto: MarkRemindersReadDto,
  ): Promise<{ count: number }> {
    const ids = dto.ids?.filter(
      (id) => typeof id === 'string' && id.trim().length > 0,
    );

    const result = await this.prisma.jobApplication.updateMany({
      where: {
        userId,
        ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
      },
      data: {
        reminderState: ReminderState.READ,
      },
    });

    return { count: result.count };
  }
}
