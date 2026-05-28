import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminCredentialGuard } from '../access/guards/admin-credential.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtUser } from '../common/types/jwt-user.type';
import { UploadedFile as UploadedFileType } from '../common/types/uploaded-file.type';
import { BoothService } from './booth.service';
import { CreateBoothDto } from './dto/create-booth.dto';
import { ImportBoothsCsvDto } from './dto/import-booths-csv.dto';
import { UpdateBoothStatusDto } from './dto/update-booth-status.dto';
import { UpdateBoothDto } from './dto/update-booth.dto';

@ApiTags('booths')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BoothController {
  constructor(private readonly boothService: BoothService) {}

  @Post('festivals/:festivalId/booths')
  @UseGuards(AdminCredentialGuard)
  createBooth(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
    @Body() dto: CreateBoothDto,
  ) {
    return this.boothService.createBooth(user, festivalId, dto);
  }

  @Post('festivals/:festivalId/booths/import-csv')
  @UseGuards(AdminCredentialGuard)
  @UseInterceptors(FileInterceptor('file'))
  importCsv(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
    @UploadedFile() file: UploadedFileType | undefined,
    @Body() dto: ImportBoothsCsvDto,
  ) {
    return this.boothService.importCsv(user, festivalId, file, dto);
  }

  @Get('festivals/:festivalId/booths')
  listBooths(
    @CurrentUser() user: JwtUser,
    @Param('festivalId') festivalId: string,
  ) {
    return this.boothService.listBooths(user, festivalId);
  }

  @Get('booths/:boothId')
  getBooth(@CurrentUser() user: JwtUser, @Param('boothId') boothId: string) {
    return this.boothService.getBooth(user, boothId);
  }

  @Patch('booths/:boothId')
  @UseGuards(AdminCredentialGuard)
  updateBooth(
    @CurrentUser() user: JwtUser,
    @Param('boothId') boothId: string,
    @Body() dto: UpdateBoothDto,
  ) {
    return this.boothService.updateBooth(user, boothId, dto);
  }

  @Patch('booths/:boothId/status')
  @UseGuards(AdminCredentialGuard)
  updateBoothStatus(
    @CurrentUser() user: JwtUser,
    @Param('boothId') boothId: string,
    @Body() dto: UpdateBoothStatusDto,
  ) {
    return this.boothService.updateBoothStatus(user, boothId, dto);
  }

  @Delete('booths/:boothId')
  @UseGuards(AdminCredentialGuard)
  deleteBooth(
    @CurrentUser() user: JwtUser,
    @Param('boothId') boothId: string,
  ) {
    return this.boothService.deleteBooth(user, boothId);
  }
}
