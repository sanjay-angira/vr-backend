export type OrderShippingAddress = {
  addressId?: number | null;
  label?: string | null;
  fullName: string;
  phone: string;
  email?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
};
