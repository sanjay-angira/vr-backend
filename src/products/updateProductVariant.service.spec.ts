import { hasVariantImageChanged } from './updateProductVariant.service';

describe('hasVariantImageChanged', () => {
  it('returns false when the image list is unchanged', () => {
    const existing = [
      'https://cdn.example.com/a.jpg',
      'https://cdn.example.com/b.jpg',
    ];

    expect(hasVariantImageChanged(existing, existing)).toBe(false);
  });

  it('returns true when a new image is added', () => {
    const existing = ['https://cdn.example.com/a.jpg'];
    const incoming = ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'];

    expect(hasVariantImageChanged(existing, incoming)).toBe(true);
  });

  it('returns true when the list is cleared', () => {
    const existing = ['https://cdn.example.com/a.jpg'];

    expect(hasVariantImageChanged(existing, [])).toBe(true);
  });
});
