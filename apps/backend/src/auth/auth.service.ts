import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

type VerificationCodeType = 'REGISTER' | 'RESET_PASSWORD' | 'CHANGE_PASSWORD';

type AuthResult = {
  user: {
    id: string;
    email: string;
  };
  token: string;
};

@Injectable()
export class AuthService {
  private readonly verificationCodeExpiresInSeconds = 10 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateVerificationCode(): string {
    return String(randomInt(0, 1000000)).padStart(6, '0');
  }

  private async issueVerificationCode(
    email: string,
    type: VerificationCodeType,
  ): Promise<void> {
    const code = this.generateVerificationCode();
    const key = this.buildVerificationCodeKey(email, type);
    await this.redisService.setEx(
      key,
      this.verificationCodeExpiresInSeconds,
      code,
    );

    const expiresAt = new Date(
      Date.now() + this.verificationCodeExpiresInSeconds * 1000,
    );
    await this.mailService.sendVerificationCode(email, code, type, expiresAt);
  }

  private buildVerificationCodeKey(
    email: string,
    type: VerificationCodeType,
  ): string {
    return `auth:verification-code:${type}:${email}`;
  }

  private async assertVerificationCode(
    email: string,
    inputCode: string,
    type: VerificationCodeType,
  ): Promise<void> {
    const key = this.buildVerificationCodeKey(email, type);
    const storedCode = await this.redisService.get(key);
    if (storedCode !== inputCode.trim()) {
      throw new BadRequestException('Invalid or expired verification code.');
    }
  }

  private async consumeVerificationCode(
    email: string,
    type: VerificationCodeType,
  ): Promise<void> {
    const key = this.buildVerificationCodeKey(email, type);
    await this.redisService.del(key);
  }

  private signToken(user: Pick<User, 'id' | 'email'>): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
  }

  private toAuthResult(user: Pick<User, 'id' | 'email'>): AuthResult {
    return {
      user: {
        id: user.id,
        email: user.email,
      },
      token: this.signToken(user),
    };
  }

  async sendRegisterVerificationCode(email: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered.');
    }

    await this.issueVerificationCode(normalizedEmail, 'REGISTER');
  }

  async register(
    email: string,
    password: string,
    verificationCode: string,
  ): Promise<AuthResult> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail || !password || !verificationCode) {
      throw new BadRequestException(
        'Email, password and verification code are required.',
      );
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new BadRequestException('Email is already registered.');
    }

    await this.assertVerificationCode(
      normalizedEmail,
      verificationCode,
      'REGISTER',
    );

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
      },
    });
    await this.consumeVerificationCode(normalizedEmail, 'REGISTER');

    return this.toAuthResult(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail || !password) {
      throw new BadRequestException('Email and password are required.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.toAuthResult(user);
  }

  async sendResetPasswordVerificationCode(email: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      return;
    }

    await this.issueVerificationCode(normalizedEmail, 'RESET_PASSWORD');
  }

  async resetPassword(
    email: string,
    newPassword: string,
    verificationCode: string,
  ): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail || !newPassword || !verificationCode) {
      throw new BadRequestException(
        'Email, new password and verification code are required.',
      );
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification request.');
    }

    await this.assertVerificationCode(
      normalizedEmail,
      verificationCode,
      'RESET_PASSWORD',
    );
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    await this.consumeVerificationCode(normalizedEmail, 'RESET_PASSWORD');
  }

  async sendChangePasswordVerificationCode(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.issueVerificationCode(user.email, 'CHANGE_PASSWORD');
  }

  async changePassword(
    userId: string,
    newPassword: string,
    verificationCode: string,
  ): Promise<void> {
    if (!newPassword || !verificationCode) {
      throw new BadRequestException(
        'New password and verification code are required.',
      );
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    await this.assertVerificationCode(
      user.email,
      verificationCode,
      'CHANGE_PASSWORD',
    );
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    await this.consumeVerificationCode(user.email, 'CHANGE_PASSWORD');
  }

  async me(userId: string): Promise<{ id: string; email: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    return user;
  }
}
