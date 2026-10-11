import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { UploadService, type UploadedFilePayload } from './upload.service';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar image (max 5 MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadAvatar(@UploadedFile() file?: UploadedFilePayload) {
    return this.uploadService.uploadSingle(file, 'avatars');
  }

  @Post('trains')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Upload up to 20 train/coach images (Admin only, max 5 MB each)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadTrainImages(@UploadedFiles() files?: UploadedFilePayload[]) {
    return this.uploadService.uploadMultiple(files, 'trains');
  }

  @Get('files/:folder/:filename')
  @Public()
  @ApiOperation({
    summary: 'Serve uploaded image from local fallback storage',
  })
  serveLocalFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const { filePath, contentType } = this.uploadService.resolveLocalFile(
      folder,
      filename,
    );
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(filePath);
  }
}

