import { Module } from '@nestjs/common';
import { PassTemplateController } from './pass-template.controller';
import { PassTemplateService } from './pass-template.service';

@Module({
  controllers: [PassTemplateController],
  providers: [PassTemplateService],
  exports: [PassTemplateService],
})
export class PassTemplateModule {}
