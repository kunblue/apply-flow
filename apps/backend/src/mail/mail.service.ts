import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  private formatMailError(error: unknown): string {
    if (error instanceof Error) {
      const maybeCode = (error as Error & { code?: string }).code;
      const maybeResponse = (error as Error & { response?: string }).response;
      return [maybeCode, error.message, maybeResponse]
        .filter(Boolean)
        .join(' | ');
    }

    return typeof error === 'string' ? error : JSON.stringify(error);
  }

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = String(process.env.SMTP_SECURE ?? 'false') === 'true';
    this.from = process.env.SMTP_FROM ?? 'check your email';

    const missingConfigs: string[] = [];
    if (!host) {
      missingConfigs.push('SMTP_HOST');
    }
    if (!user) {
      missingConfigs.push('SMTP_USER');
    }
    if (!pass) {
      missingConfigs.push('SMTP_PASS');
    }
    if (Number.isNaN(port)) {
      missingConfigs.push('SMTP_PORT');
    }

    if (missingConfigs.length > 0) {
      this.transporter = null;
      this.logger.warn(
        `SMTP is not fully configured (${missingConfigs.join(', ')}). Verification codes will be logged instead of emailed.`,
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendVerificationCode(
    to: string,
    code: string,
    type: 'REGISTER' | 'RESET_PASSWORD' | 'CHANGE_PASSWORD',
    expiresAt: Date,
  ): Promise<void> {
    const subjectMap = {
      REGISTER: 'Apply Flow - Registration Verification Code',
      RESET_PASSWORD: 'Apply Flow - Reset Password Verification Code',
      CHANGE_PASSWORD: 'Apply Flow - Change Password Verification Code',
    };
    const subject = subjectMap[type];
    const text = [
      `Your verification code is: ${code}`,
      `This code expires at ${expiresAt.toISOString()}.`,
      'If you did not request this, please ignore this email.',
    ].join('\n');

    if (!this.transporter) {
      this.logger.log(
        `[Mail fallback] ${type} code ${code} to ${to}, expires at ${expiresAt.toISOString()} | reason: SMTP transporter is unavailable`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text,
      });
    } catch (error) {
      const reason = this.formatMailError(error);
      this.logger.error(
        `Failed to send verification email to ${to}. reason: ${reason}`,
      );
      this.logger.log(
        `[Mail fallback] ${type} code ${code} to ${to}, expires at ${expiresAt.toISOString()} | reason: ${reason}`,
      );
    }
  }
}
