import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { ImageOptimizationService } from './image-optimization.service';

describe('ImageOptimizationService', () => {
  const uploadBuffer = jest.fn().mockResolvedValue({
    Location: 'https://bucket.s3.ap-south-1.amazonaws.com/categories/test.webp',
    Key: 'categories/test.webp',
    Bucket: 'bucket',
    ETag: 'etag',
  });
  const service = new ImageOptimizationService(
    { uploadBuffer } as unknown as S3Service,
    { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService,
  );

  beforeEach(() => {
    uploadBuffer.mockClear();
  });

  it('accepts and optimizes SVG uploads supported by Sharp', async () => {
    const buffer = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="red"/></svg>',
    );

    const result = await service.processAndUpload(
      {
        buffer,
        originalname: 'test.svg',
        mimetype: 'image/svg+xml',
        size: buffer.length,
      } as Express.Multer.File,
      'category',
    );

    expect(result.Location).toContain('.webp');
    expect(uploadBuffer).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringContaining('categories/'),
      'image/webp',
    );
  });

  it('includes the Sharp decode detail for invalid image data', async () => {
    const buffer = Buffer.from('not an image');

    await expect(
      service.processAndUpload(
        {
          buffer,
          originalname: 'invalid.jpg',
          mimetype: 'image/jpeg',
          size: buffer.length,
        } as Express.Multer.File,
        'category',
      ),
    ).rejects.toThrow(/^Invalid or corrupted image: .+/);
  });
});
