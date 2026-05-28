import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { UploadedFile } from '../common/types/uploaded-file.type';
import { UploadPurpose } from './dto/upload-purpose.dto';

const ALLOWED_MIME_BY_PURPOSE: Record<UploadPurpose, Set<string>> = {
  'admin-proof': new Set(['application/pdf', 'image/jpeg', 'image/png']),
  'student-proof': new Set(['application/pdf', 'image/jpeg', 'image/png']),
  'booth-poster': new Set(['image/jpeg', 'image/png', 'image/webp']),
  'festival-image': new Set(['image/jpeg', 'image/png', 'image/webp']),
};

const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  async saveFile(purpose: UploadPurpose, file: UploadedFile | undefined) {
    if (!file) {
      throw new BadRequestException({
        code: 'UPLOAD_FILE_REQUIRED',
        message: 'Upload file is required.',
      });
    }

    const maxBytes = Number(this.configService.get('UPLOAD_MAX_BYTES') ?? 10485760);
    if (file.size > maxBytes) {
      throw new BadRequestException({
        code: 'UPLOAD_FILE_TOO_LARGE',
        message: `Upload file must be ${maxBytes} bytes or smaller.`,
      });
    }

    const allowedMimeTypes = ALLOWED_MIME_BY_PURPOSE[purpose];
    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException({
        code: 'UPLOAD_FILE_TYPE_NOT_ALLOWED',
        message: `File type is not allowed for ${purpose}.`,
      });
    }

    const month = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
    }).format(new Date());
    const extension = this.safeExtension(file);
    const filename = `${randomUUID()}${extension}`;
    const relativePath = join(purpose, month, filename);
    const absoluteDir = join(process.cwd(), 'uploads', purpose, month);
    const absolutePath = join(process.cwd(), 'uploads', relativePath);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absolutePath, file.buffer);

    const publicBaseUrl =
      this.configService.get<string>('PUBLIC_BASE_URL') ?? 'http://localhost:3000';
    const normalizedPath = relativePath.split('\\').join('/');

    return {
      fileUrl: `${publicBaseUrl}/uploads/${normalizedPath}`,
      path: `/uploads/${normalizedPath}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  private safeExtension(file: UploadedFile) {
    const byMime = EXTENSION_BY_MIME[file.mimetype];
    if (byMime) {
      return byMime;
    }

    const originalExtension = extname(file.originalname).toLowerCase();
    return originalExtension || '.bin';
  }
}
