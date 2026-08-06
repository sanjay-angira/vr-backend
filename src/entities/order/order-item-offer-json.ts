
export type OrderItemOfferJson = {
  id?: number;
  offerName?: string | null;
  offerSlug?: string | null;
  discountType?: string | null;
  discountValue?: number | null;
  sources?: string[];
  listUnitPrice?: number;
  unitPrice?: number;
  discountAmount?: number;
  capturedAt?: string;
};
