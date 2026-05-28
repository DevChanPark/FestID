import {
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UploadedFile as UploadedFileType } from '../common/types/uploaded-file.type';
import { UploadPurposeDto } from './dto/upload-purpose.dto';
import { UploadService } from './upload.service';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(':purpose')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param() params: UploadPurposeDto,
    @UploadedFile() file: UploadedFileType | undefined,
  ) {
    return this.uploadService.saveFile(params.purpose, file);
  }
}
