import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type AuthUser } from './current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterDto } from './dto/register.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';

type AuthResponse = {
  user: {
    id: string;
    email: string;
  };
  token: string;
};

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(200)
  @Post('register/send-code')
  async sendRegisterCode(
    @Body() dto: SendVerificationCodeDto,
  ): Promise<{ success: true }> {
    await this.authService.sendRegisterVerificationCode(dto.email);
    return { success: true };
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    const result = await this.authService.register(
      dto.email,
      dto.password,
      dto.verificationCode,
    );
    return { user: result.user, token: result.token };
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    const result = await this.authService.login(dto.email, dto.password);
    return { user: result.user, token: result.token };
  }

  @HttpCode(200)
  @Public()
  @Post('logout')
  logout(): { success: true } {
    return { success: true };
  }

  @Public()
  @HttpCode(200)
  @Post('password/forgot/send-code')
  async sendResetPasswordCode(
    @Body() dto: SendVerificationCodeDto,
  ): Promise<{ success: true }> {
    await this.authService.sendResetPasswordVerificationCode(dto.email);
    return { success: true };
  }

  @Public()
  @HttpCode(200)
  @Post('password/reset')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ success: true }> {
    await this.authService.resetPassword(
      dto.email,
      dto.newPassword,
      dto.verificationCode,
    );
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('password/change/send-code')
  async sendChangePasswordCode(
    @CurrentUser() user: AuthUser | null,
  ): Promise<{ success: true }> {
    if (!user) {
      throw new UnauthorizedException();
    }

    await this.authService.sendChangePasswordVerificationCode(user.sub);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('password/change')
  async changePassword(
    @CurrentUser() user: AuthUser | null,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ success: true }> {
    if (!user) {
      throw new UnauthorizedException();
    }

    await this.authService.changePassword(
      user.sub,
      dto.newPassword,
      dto.verificationCode,
    );
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(
    @CurrentUser() user: AuthUser | null,
  ): Promise<{ user: { id: string; email: string } }> {
    if (!user) {
      throw new UnauthorizedException();
    }
    return { user: await this.authService.me(user.sub) };
  }
}
