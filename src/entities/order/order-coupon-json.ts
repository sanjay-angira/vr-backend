
export type OrderCouponJson = {
  id: number;
  couponCode: string;
  discountType: string;
  discountValue: number;
  couponDiscount: number;
  capturedAt?: string;
};
