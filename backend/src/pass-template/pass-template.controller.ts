import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminCredentialGuard } from '../access/guards/admin-credential.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import { CreatePassTemplateDto } from './dto/create-pass-template.dto';
import { UpdatePassTemplateDto } from './dto/update-pass-template.dto';
import { PassTemplateService } from './pass-template.service';

@ApiTags('pass-templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminCredentialGuard)
@Controller()
export class PassTemplateController {
  constructor(private readonly passTemplateService: PassTemplateService) {}

  @Post('festivals/:festivalId/pass-templates')
  createTemplate(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
    @Body() dto: CreatePassTemplateDto,
  ) {
    return this.passTemplateService.createTemplate(user, festivalId, dto);
  }

  @Get('festivals/:festivalId/pass-templates')
  listTemplates(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
  ) {
    return this.passTemplateService.listTemplates(user, festivalId);
  }

  @Patch('pass-templates/:templateId')
  updateTemplate(
    @CurrentUser() user: JwtUser,
    @Param('templateId') templateId: string,
    @Body() dto: UpdatePassTemplateDto,
  ) {
    return this.passTemplateService.updateTemplate(user, templateId, dto);
  }
}
