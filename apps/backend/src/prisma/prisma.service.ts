import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          // Use a local default DB when DATABASE_URL is not explicitly set.
          url:
            process.env.DATABASE_URL ??
            'postgresql://postgres:postgres@localhost:5432/apply_flow',
        },
      },
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
