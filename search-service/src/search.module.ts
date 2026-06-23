import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { SearchElasticsearchModule } from './elasticsearch';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SearchElasticsearchModule,
  ],
  controllers: [SearchController],
  providers: [SearchService, PrismaClient],
})
export class SearchModule {}
