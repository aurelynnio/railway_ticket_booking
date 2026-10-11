import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface UploadedFilePayload {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export type UploadFolder = 'avatars' | 'trains';

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const SAFE_FILENAME_REGEX = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/i;

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly localUploadsRoot = resolve(__dirname, '..', '..', 'uploads');

  validateImageFile(file?: UploadedFilePayload): string {
    if (!file || !file.buffer || file.size <= 0) {
      throw new BadRequestException('File upload is required');
    }

    const ext = ALLOWED_MIME_TO_EXT[file.mimetype?.toLowerCase() ?? ''];
    if (!ext) {
      throw new BadRequestException(
        'Unsupported image type. Allowed: image/jpeg, image/png, image/webp, image/gif',
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Image file size must not exceed 5 MB');
    }

    return ext;
  }

  async uploadSingle(
    file: UploadedFilePayload | undefined,
    folder: UploadFolder,
  ): Promise<{ url: string }> {
    const ext = this.validateImageFile(file);
    const validFile = file!;
    const filename = `${randomUUID()}.${ext}`;
    const objectKey = `${folder}/${filename}`;

    const s3Url = await this.tryUploadToS3(
      objectKey,
      validFile.buffer,
      validFile.mimetype,
    );
    if (s3Url) {
      return { url: s3Url };
    }

    const localUrl = await this.saveToLocalFallback(
      folder,
      filename,
      validFile.buffer,
    );
    return { url: localUrl };
  }

  async uploadMultiple(
    files: UploadedFilePayload[] | undefined,
    folder: UploadFolder,
  ): Promise<{ urls: string[] }> {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('At least one image file is required');
    }
    if (files.length > 20) {
      throw new BadRequestException('Maximum 20 images allowed per upload');
    }

    for (const file of files) {
      this.validateImageFile(file);
    }

    const results = await Promise.all(
      files.map((file) => this.uploadSingle(file, folder)),
    );
    return { urls: results.map((item) => item.url) };
  }

  resolveLocalFile(
    folder: string,
    filename: string,
  ): { filePath: string; contentType: string } {
    if (folder !== 'avatars' && folder !== 'trains') {
      throw new NotFoundException('File not found');
    }
    if (!SAFE_FILENAME_REGEX.test(filename)) {
      throw new NotFoundException('File not found');
    }

    const targetPath = resolve(this.localUploadsRoot, folder, filename);
    const allowedPrefix = resolve(this.localUploadsRoot, folder);
    if (!targetPath.startsWith(allowedPrefix) || !existsSync(targetPath)) {
      throw new NotFoundException('File not found');
    }

    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const contentType = EXT_TO_MIME[ext] ?? 'application/octet-stream';
    return { filePath: targetPath, contentType };
  }

  private async tryUploadToS3(
    objectKey: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string | null> {
    if (process.env.S3_DISABLED === 'true') {
      return null;
    }

    const endpoint = (
      process.env.S3_ENDPOINT || 'http://localhost:9000'
    ).replace(/\/+$/, '');
    const bucket = (process.env.S3_BUCKET || 'railway-media').trim();
    const accessKey = (process.env.S3_ACCESS_KEY || 'minioadmin').trim();
    const secretKey = (process.env.S3_SECRET_KEY || 'minioadmin123').trim();
    const region = (process.env.S3_REGION || 'us-east-1').trim();
    const publicBaseUrl = (
      process.env.S3_PUBLIC_URL || `${endpoint}/${bucket}`
    ).replace(/\/+$/, '');

    const targetUrl = `${endpoint}/${bucket}/${objectKey}`;
    try {
      let response = await this.signedS3Put(
        targetUrl,
        buffer,
        contentType,
        accessKey,
        secretKey,
        region,
      );

      if (response.status === 404) {
        // Bucket does not exist yet — create it via signed PUT /{bucket} and retry
        await this.signedS3Put(
          `${endpoint}/${bucket}`,
          Buffer.alloc(0),
          'application/octet-stream',
          accessKey,
          secretKey,
          region,
        );
        response = await this.signedS3Put(
          targetUrl,
          buffer,
          contentType,
          accessKey,
          secretKey,
          region,
        );
      }

      if (response.ok) {
        return `${publicBaseUrl}/${objectKey}`;
      }

      this.logger.warn(
        `S3 PUT returned ${response.status} for ${objectKey}; falling back to local storage`,
      );
      return null;
    } catch (error) {
      this.logger.debug(
        `S3 unreachable (${(error as Error)?.message ?? 'unknown'}); using local storage fallback`,
      );
      return null;
    }
  }

  private async signedS3Put(
    urlStr: string,
    body: Buffer,
    contentType: string,
    accessKey: string,
    secretKey: string,
    region: string,
  ): Promise<Response> {
    const parsedUrl = new URL(urlStr);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = createHash('sha256').update(body).digest('hex');

    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${parsedUrl.host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      'PUT',
      parsedUrl.pathname,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const kDate = createHmac('sha256', `AWS4${secretKey}`)
      .update(dateStamp)
      .digest();
    const kRegion = createHmac('sha256', kDate).update(region).digest();
    const kService = createHmac('sha256', kRegion).update('s3').digest();
    const kSigning = createHmac('sha256', kService)
      .update('aws4_request')
      .digest();
    const signature = createHmac('sha256', kSigning)
      .update(stringToSign)
      .digest('hex');

    const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      return await fetch(urlStr, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'x-amz-content-sha256': payloadHash,
          'x-amz-date': amzDate,
          Authorization: authorization,
        },
        body: new Uint8Array(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async saveToLocalFallback(
    folder: UploadFolder,
    filename: string,
    buffer: Buffer,
  ): Promise<string> {
    const dir = join(this.localUploadsRoot, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);

    const gatewayPort = process.env.PORT || '8081';
    const gatewayPublicUrl = (
      process.env.GATEWAY_PUBLIC_URL || `http://localhost:${gatewayPort}`
    ).replace(/\/+$/, '');

    return `${gatewayPublicUrl}/uploads/files/${folder}/${filename}`;
  }
}

