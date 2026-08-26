import { Offer, DiscountType } from 'src/entities/product/offer.entity';
import { Category } from 'src/entities/productCategory/category.entity';
import {
  OfferPricingService,
  type OfferPricingResult,
} from './offer-pricing.service';

function offer(
  partial: Partial<Offer> & Pick<Offer, 'id' | 'discountType' | 'discountValue'>,
): Offer {
  return {
    offerName: `Offer ${partial.id}`,
    offerSlug: `offer-${partial.id}`,
    isActive: true,
    timeBased: false,
    startDate: null,
    endDate: null,
    ...partial,
  } as Offer;
}

/** Mirrors cart/checkout: charge finalPrice, never originalPrice (crossed MRP). */
function cartPayable(pricing: OfferPricingResult, quantity: number): number {
  return Number(pricing.finalPrice ?? 0) * quantity;
}

describe('OfferPricingService', () => {
  let service: OfferPricingService;

  beforeEach(() => {
    service = new OfferPricingService({} as never);
  });

  describe('percentage formula: crossed = P / (1 - D/100)', () => {
    const cases: Array<[number, number, number]> = [
      [1000, 10, 1120],
      [1000, 20, 1250],
      [1000, 30, 1430],
      [1000, 40, 1670],
      [1000, 50, 2000],
      [1000, 60, 2500],
    ];

    it.each(cases)(
      'P=%s D=%s% → pay %s, crossed expected third arg',
      (price, percent, crossed) => {
        const result = service.calculatePriceForOffer(
          price,
          offer({
            id: 1,
            discountType: DiscountType.PERCENTAGE,
            discountValue: percent,
          }),
        );

        expect(result.finalPrice).toBe(price);
        expect(result.originalPrice).toBe(crossed);
        expect(result.discountPercentage).toBe(percent);
        expect(result.discountAmount).toBe(
          Number((crossed - price).toFixed(2)),
        );
      },
    );

    it('does not reduce the stored selling price', () => {
      const result = service.calculateOfferPricing(1000, [
        offer({
          id: 1,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 50,
        }),
      ]);

      expect(result.finalPrice).toBe(1000);
      expect(result.originalPrice).toBe(2000);
      expect(result.appliedOffer?.discountValue).toBe(50);
    });
  });

  describe('edge cases', () => {
    it('no offer: pay stored price, no crossed MRP', () => {
      const result = service.calculateOfferPricing(1000, []);

      expect(result.finalPrice).toBe(1000);
      expect(result.originalPrice).toBeNull();
      expect(result.discountPercentage).toBe(0);
      expect(result.appliedOffer).toBeNull();
    });

    it('0% offer: do not calculate a cross price', () => {
      const result = service.calculateOfferPricing(1000, [
        offer({
          id: 1,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 0,
        }),
      ]);

      expect(result.finalPrice).toBe(1000);
      expect(result.originalPrice).toBeNull();
      expect(result.appliedOffer).toBeNull();
    });

    it('decimal crossed MRP rounds up to the next ₹10 (1111.11 → 1120)', () => {
      const result = service.calculatePriceForOffer(
        1000,
        offer({
          id: 1,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
        }),
      );

      expect(result.finalPrice).toBe(1000);
      expect(result.originalPrice).toBe(1120);
      expect(result.discountAmount).toBe(120);
    });

    it('whole crossed MRP is left unchanged', () => {
      const result = service.calculatePriceForOffer(
        1000,
        offer({
          id: 1,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 20,
        }),
      );

      expect(result.originalPrice).toBe(1250);
    });

    it('decimal discount 12.5% on ₹999 uses 2-decimal rounding then ceils to ₹10', () => {
      const result = service.calculatePriceForOffer(
        999,
        offer({
          id: 1,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 12.5,
        }),
      );

      expect(result.finalPrice).toBe(999);
      expect(result.originalPrice).toBe(1150);
      expect(result.discountPercentage).toBe(12.5);
    });

    it('100% offer is skipped (no Infinity / NaN)', () => {
      const result = service.calculateOfferPricing(1000, [
        offer({
          id: 1,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 100,
        }),
      ]);

      expect(result.finalPrice).toBe(1000);
      expect(result.originalPrice).toBeNull();
      expect(result.appliedOffer).toBeNull();
      expect(Number.isFinite(result.finalPrice)).toBe(true);
    });
  });

  describe('offer sources and selection', () => {
    it('applies a category (or any merged) 50% offer without reducing P', () => {
      const categoryOffer = offer({
        id: 10,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 50,
      });
      const category = {
        categoryOffers: [categoryOffer],
        parent: null,
      } as Category;

      const merged = service.getMergedActiveOffers({ category });
      const result = service.calculateOfferPricing(
        1000,
        merged.map((entry) => entry.offer),
      );

      expect(merged[0].sources).toContain('category');
      expect(result.finalPrice).toBe(1000);
      expect(result.originalPrice).toBe(2000);
    });

    it('applies a product-specific offer with the same formula', () => {
      const result = service.calculateOfferPricing(1000, [
        offer({
          id: 2,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 50,
        }),
      ]);

      expect(result.finalPrice).toBe(1000);
      expect(result.originalPrice).toBe(2000);
    });

    it('picks the offer with the largest crossed MRP when several apply', () => {
      const result = service.calculateOfferPricing(1000, [
        offer({
          id: 1,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
        }),
        offer({
          id: 2,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 50,
        }),
        offer({
          id: 3,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 20,
        }),
      ]);

      expect(result.appliedOffer?.id).toBe(2);
      expect(result.finalPrice).toBe(1000);
      expect(result.originalPrice).toBe(2000);
    });

    it('fixed ₹ offer inflates MRP by the amount and still charges P', () => {
      const result = service.calculateOfferPricing(1000, [
        offer({
          id: 4,
          discountType: DiscountType.FIXED,
          discountValue: 200,
        }),
      ]);

      expect(result.finalPrice).toBe(1000);
      expect(result.originalPrice).toBe(1200);
    });
  });

  describe('cart / checkout payable amount', () => {
    it('charges selling price × qty, not crossed MRP', () => {
      const pricing = service.calculateOfferPricing(1000, [
        offer({
          id: 1,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 50,
        }),
      ]);

      expect(cartPayable(pricing, 1)).toBe(1000);
      expect(cartPayable(pricing, 2)).toBe(2000);
      expect(cartPayable(pricing, 2)).not.toBe(
        Number(pricing.originalPrice) * 2,
      );
    });

    it('sums multiple products at stored selling prices', () => {
      const lineA = service.calculateOfferPricing(1000, [
        offer({
          id: 1,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 50,
        }),
      ]);
      const lineB = service.calculateOfferPricing(400, []);

      const total =
        cartPayable(lineA, 2) + cartPayable(lineB, 1);

      expect(total).toBe(2400);
    });
  });
});
