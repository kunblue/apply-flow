import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JobApplication } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateJobDto } from './dto/create-job.dto';
import { MarkRemindersReadDto } from './dto/mark-reminders-read.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

type AnalyzeJobDto = {
  locale?: 'zh' | 'en';
};

@Controller('api/jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  private requireUserId(user: AuthUser | null): string {
    if (!user?.sub) {
      throw new UnauthorizedException();
    }
    return user.sub;
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser | null): Promise<JobApplication[]> {
    return this.jobsService.findAll(this.requireUserId(user));
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null,
  ): Promise<JobApplication> {
    return this.jobsService.findOne(id, this.requireUserId(user));
  }

  @Post()
  @UseInterceptors(FileInterceptor('resume'))
  create(
    @Body() dto: CreateJobDto,
    @UploadedFile() resumeFile?: Express.Multer.File,
    @CurrentUser() user?: AuthUser | null,
  ): Promise<JobApplication> {
    return this.jobsService.create(
      dto,
      this.requireUserId(user ?? null),
      resumeFile,
    );
  }

  @Patch('reminders/mark-read')
  markRemindersRead(
    @Body() dto: MarkRemindersReadDto,
    @CurrentUser() user: AuthUser | null,
  ): Promise<{ count: number }> {
    return this.jobsService.markRemindersRead(this.requireUserId(user), dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: AuthUser | null,
  ): Promise<JobApplication> {
    return this.jobsService.update(id, this.requireUserId(user), dto);
  }

  @Patch(':id/resume')
  @UseInterceptors(FileInterceptor('resume'))
  updateResume(
    @Param('id') id: string,
    @UploadedFile() resumeFile: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser | null,
  ): Promise<JobApplication> {
    return this.jobsService.updateResume(
      id,
      this.requireUserId(user),
      resumeFile,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | null,
  ): Promise<JobApplication> {
    return this.jobsService.remove(id, this.requireUserId(user));
  }

  @Post(':id/analyze')
  analyze(
    @Param('id') id: string,
    @Body() dto: AnalyzeJobDto | undefined,
    @CurrentUser() user: AuthUser | null,
  ): Promise<JobApplication> {
    return this.jobsService.analyze(id, this.requireUserId(user), dto?.locale);
  }

  @Patch(':id/reminder')
  updateReminder(
    @Param('id') id: string,
    @Body() dto: UpdateReminderDto,
    @CurrentUser() user: AuthUser | null,
  ): Promise<JobApplication> {
    return this.jobsService.updateReminder(id, this.requireUserId(user), dto);
  }
}
