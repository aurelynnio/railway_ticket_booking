import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticsearchIndexService } from './elasticsearch.service';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        node: configService.get<string>('ELASTICSEARCH_URL', 'http://localhost:9200'),
        maxRetries: 5,
        requestTimeout: 30000,
      }),
    }),
  ],
  providers: [ElasticsearchIndexService],
  exports: [ElasticsearchIndexService],
})
export class SearchElasticsearchModule {}
