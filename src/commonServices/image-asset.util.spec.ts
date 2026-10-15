import { productImageColumnFields } from './image-asset.util';

describe('productImageColumnFields', () => {
  const originalUrl =
    'https://vrindavan-rasa.s3.ap-south-1.amazonaws.com/products/asset-id/original/image.jpg';

  it('preserves explicit missing optimized sizes instead of inventing sibling URLs', () => {
    expect(
      productImageColumnFields({
        originalUrl,
        webp400: 'https://cdn.example.com/400.webp',
        webp800: null,
        webp1200: null,
      }),
    ).toEqual({
      originalUrl,
      webp400: 'https://cdn.example.com/400.webp',
      webp800: null,
      webp1200: null,
    });
  });

  it('continues deriving optimized sizes for legacy inputs without size metadata', () => {
    expect(productImageColumnFields({ originalUrl })).toEqual({
      originalUrl,
      webp400:
        'https://vrindavan-rasa.s3.ap-south-1.amazonaws.com/products/asset-id/400/image.webp',
      webp800:
        'https://vrindavan-rasa.s3.ap-south-1.amazonaws.com/products/asset-id/800/image.webp',
      webp1200:
        'https://vrindavan-rasa.s3.ap-south-1.amazonaws.com/products/asset-id/1200/image.webp',
    });
  });
});
