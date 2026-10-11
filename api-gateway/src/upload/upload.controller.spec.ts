import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService, type UploadedFilePayload } from './upload.service';

describe('UploadController & UploadService', () => {
  let service: UploadService;
  let controller: UploadController;

  beforeEach(() => {
    process.env.S3_DISABLED = 'true';
    service = new UploadService();
    controller = new UploadController(service);
  });

  afterEach(() => {
    delete process.env.S3_DISABLED;
  });

  it('rejects missing file on uploadAvatar', async () => {
    await expect(controller.uploadAvatar(undefined)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects unsupported MIME types', async () => {
    const invalidFile: UploadedFilePayload = {
      originalname: 'malicious.svg',
      mimetype: 'image/svg+xml',
      size: 128,
      buffer: Buffer.from('<svg></svg>'),
    };
    await expect(controller.uploadAvatar(invalidFile)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('uploads avatar to local fallback when S3 is disabled and resolves local file', async () => {
    const validFile: UploadedFilePayload = {
      originalname: 'avatar.png',
      mimetype: 'image/png',
      size: 16,
      buffer: Buffer.from('fake-png-content'),
    };

    const result = await controller.uploadAvatar(validFile);
    expect(result.url).toMatch(
      /\/uploads\/files\/avatars\/[a-f0-9-]+\.png$/,
    );

    const filename = result.url.split('/').pop()!;
    const resolved = service.resolveLocalFile('avatars', filename);
    expect(resolved.contentType).toBe('image/png');
    expect(resolved.filePath).toContain(filename);
  });

  it('uploads multiple train images and rejects invalid local file traversal', async () => {
    const files: UploadedFilePayload[] = [
      {
        originalname: 'train1.jpg',
        mimetype: 'image/jpeg',
        size: 12,
        buffer: Buffer.from('fake-jpeg-1'),
      },
      {
        originalname: 'train2.webp',
        mimetype: 'image/webp',
        size: 12,
        buffer: Buffer.from('fake-webp-2'),
      },
    ];

    const result = await controller.uploadTrainImages(files);
    expect(result.urls).toHaveLength(2);
    expect(result.urls[0]).toMatch(/\/uploads\/files\/trains\/[a-f0-9-]+\.jpg$/);
    expect(result.urls[1]).toMatch(
      /\/uploads\/files\/trains\/[a-f0-9-]+\.webp$/,
    );

    expect(() => service.resolveLocalFile('trains', '../secret.png')).toThrow(
      NotFoundException,
    );
    expect(() => service.resolveLocalFile('other', 'test.png')).toThrow(
      NotFoundException,
    );
  });
});

