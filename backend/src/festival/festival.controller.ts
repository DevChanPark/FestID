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
import { CreateFestivalDto } from './dto/create-festival.dto';
import { UpdateFestivalDto } from './dto/update-festival.dto';
import { FestivalService } from './festival.service';

@ApiTags('festivals')
@Controller('festivals')
export class FestivalController {
  constructor(private readonly festivalService: FestivalService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminCredentialGuard)
  createFestival(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateFestivalDto,
  ) {
    return this.festivalService.createFestival(user.sub, dto);
  }

  @Get()
  listPublicFestivals() {
    return this.festivalService.listPublicFestivals();
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminCredentialGuard)
  listMyFestivals(@CurrentUser() user: JwtUser) {
    return this.festivalService.listMyFestivals(user.sub);
  }

  @Get(':festivalId')
  getPublicFestival(@Param('festivalId') festivalId: string) {
    return this.festivalService.getPublicFestival(festivalId);
  }

  @Patch(':festivalId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminCredentialGuard)
  updateFestival(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
    @Body() dto: UpdateFestivalDto,
  ) {
    return this.festivalService.updateFestival(user, festivalId, dto);
  }
}
