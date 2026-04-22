import { Module } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [AuthModule],
  controllers: [JobsController],
  providers: [JobsService, PrismaService, AiService],
})
export class JobsModule {}
