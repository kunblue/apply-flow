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
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    const result = await this.authService.register(dto.email, dto.password);
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
