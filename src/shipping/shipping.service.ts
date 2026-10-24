import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';

export type PaymentMode = 'Pre-paid' | 'COD';

type DelhiveryPincodeResponse = {
  delivery_codes?: Array<{
    postal_code?: {
      remarks?: string | null;
      pre_paid?: string | null;
      cash?: string | null;
      city?: string | null;
    };
  }>;
};

type GoogleGeocodeResponse = {
  status?: string;
  error_message?: string;
  results?: Array<{
    address_components?: Array<{
      long_name?: string;
      short_name?: string;
      types?: string[];
    }>;
  }>;
};

export type ShippingQuote = {
  pincode: string;
  serviceable: boolean;
  shippingFee: number;
  freeShipping: boolean;
  prepaidAvailable: boolean;
  codAvailable: boolean;
  estimatedDeliveryDate: string | null;
  city: string | null;
  message: string;
};

@Injectable()
export class ShippingService {
  private readonly pinPattern = /^\d{6}$/;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  normalizePincode(value: string | null | undefined): string {
    const cleaned = String(value ?? '').replace(/\s+/g, '');
    return this.pinPattern.test(cleaned) ? cleaned : '';
  }

  private get baseUrl(): string {
    return (
      this.config.get<string>('DELHIVERY_BASE_URL') ??
      'https://staging-express.delhivery.com'
    ).replace(/\/+$/, '');
  }

  private get headers() {
    const token = this.config.get<string>('DELHIVERY_API_TOKEN');

    if (!token) {
      throw new ServiceUnavailableException(
        'Shipping provider is not configured',
      );
    }

    return {
      Authorization: `Token ${token}`,
      Accept: 'application/json',
    };
  }

  private get googleApiKey(): string {
    const key = this.config.get<string>('GOOGLE_MAPS_API_KEY');
    return typeof key === 'string' && key.trim() ? key.trim() : '';
  }

  private parseGooglePostalCode(data: GoogleGeocodeResponse): string | null {
    const results = Array.isArray(data?.results) ? data.results : [];

    for (const result of results) {
      const components = Array.isArray(result?.address_components)
        ? result.address_components
        : [];

      const postalCode = components.find((component) =>
        Array.isArray(component?.types) && component.types.includes('postal_code'),
      );

      if (postalCode?.long_name && /^\d{6}$/.test(postalCode.long_name.trim())) {
        return postalCode.long_name.trim();
      }
    }

    return null;
  }

  async reverseGeocode(
    latitude: number | string,
    longitude: number | string,
  ): Promise<{ pincode: string | null; message: string; city: string | null }> {
    const parsedLat = Number(latitude);
    const parsedLng = Number(longitude);

    if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      throw new BadRequestException('Latitude must be between -90 and 90 degrees');
    }

    if (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      throw new BadRequestException(
        'Longitude must be between -180 and 180 degrees',
      );
    }

    if (!this.googleApiKey) {
      throw new ServiceUnavailableException(
        'Google Maps API key is not configured',
      );
    }

    try {
      const { data } = await firstValueFrom(
        this.http.get<GoogleGeocodeResponse>(
          'https://maps.googleapis.com/maps/api/geocode/json',
          {
            params: {
              latlng: `${parsedLat},${parsedLng}`,
              key: this.googleApiKey,
            },
            timeout: 8000,
          },
        ),
      );

      if (data?.status === 'OVER_QUERY_LIMIT') {
        throw new BadGatewayException('Google Maps API quota exceeded');
      }

      if (data?.status === 'REQUEST_DENIED') {
        throw new ServiceUnavailableException(
          'Google Maps API is not configured correctly',
        );
      }

      const pincode = this.parseGooglePostalCode(data);
      if (!pincode) {
        return {
          pincode: null,
          city: null,
          message:
            'We could not find a postal code for your current location. Please enter your PIN code manually.',
        };
      }

      return {
        pincode,
        city: null,
        message: 'Location matched your current delivery PIN code.',
      };
    } catch (error: unknown) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.response) {
        throw new BadGatewayException(
          `Google Maps API returned ${error.response.status}`,
        );
      }

      throw new BadGatewayException(
        'Could not determine your current PIN code from location data',
      );
    }
  }

  async checkPincode(
    pincode: string,
    options: {
      subtotal?: number;
      weightGrams?: number;
      packageHeightCm?: number;
      packageWidthCm?: number;
      packageLengthCm?: number;
      paymentMode?: PaymentMode;
    } = {},
  ): Promise<ShippingQuote> {
    const normalizedPin = this.normalizePincode(pincode);
    if (!normalizedPin) {
      throw new BadRequestException('Enter a valid 6-digit PIN code');
    }

    const serviceability = await this.getServiceability(normalizedPin);
    const subtotal = Number(options.subtotal ?? 0);
    const freeShipping = subtotal > 499;

    if (!serviceability.serviceable) {
      return {
        ...serviceability,
        pincode: normalizedPin,
        shippingFee: 0,
        freeShipping,
        estimatedDeliveryDate: null,
        message:
          serviceability.message ||
          'Delivery service is unavailable for this PIN code',
      };
    }

    const weightGrams = Number(options.weightGrams ?? 0);
    let shippingFee = 0;

    if (!freeShipping && Number.isFinite(weightGrams) && weightGrams > 0) {
      const origin = this.config.get<string>('WAREHOUSE_PINCODE');
      if (origin && this.pinPattern.test(origin)) {
        const quote = await this.calculateCarrierRate({
          deliveryPincode: normalizedPin,
          weightGrams,
          packageHeightCm: options.packageHeightCm ?? 0,
          packageWidthCm: options.packageWidthCm ?? 0,
          packageLengthCm: options.packageLengthCm ?? 0,
          paymentMode: options.paymentMode ?? 'Pre-paid',
          origin,
        });
        const quotePayload = (quote as Record<string, unknown> | null) ?? null;
        shippingFee =
          Number(
            quotePayload && typeof quotePayload === 'object'
              ? quotePayload.total_amount ?? quotePayload.amount ?? 0
              : 0,
          ) || 0;
      }
    }

    return {
      ...serviceability,
      pincode: normalizedPin,
      shippingFee,
      freeShipping,
      estimatedDeliveryDate: null,
      message: serviceability.message || 'PIN code checked',
    };
  }

  async calculateShipping(input: {
    deliveryPincode: string;
    weightGrams: number;
    packageHeightCm: number;
    packageWidthCm: number;
    packageLengthCm: number;
    paymentMode: PaymentMode;
  }): Promise<unknown> {
    const origin = this.config.get<string>('WAREHOUSE_PINCODE');

    if (!origin || !this.pinPattern.test(origin)) {
      throw new ServiceUnavailableException(
        'Configure a valid warehouse PIN code',
      );
    }

    const pincode = this.normalizePincode(input.deliveryPincode);
    if (!pincode) {
      throw new BadRequestException('Invalid delivery PIN code');
    }

    return this.calculateCarrierRate({
      deliveryPincode: pincode,
      weightGrams: input.weightGrams,
      packageHeightCm: input.packageHeightCm,
      packageWidthCm: input.packageWidthCm,
      packageLengthCm: input.packageLengthCm,
      paymentMode: input.paymentMode,
      origin,
    });
  }

  private async getServiceability(pincode: string) {
    try {
      const { data } = await firstValueFrom(
        this.http.get<DelhiveryPincodeResponse>(
          `${this.baseUrl}/c/api/pin-codes/json/`,
          {
            headers: this.headers,
            params: { filter_codes: pincode },
            timeout: 10000,
          },
        ),
      );

      const postalCode = data?.delivery_codes?.[0]?.postal_code;
      const serviceable = Boolean(
        postalCode &&
          postalCode.remarks !== 'Embargo' &&
          postalCode.pre_paid === 'Y',
      );

      return {
        pincode,
        serviceable,
        prepaidAvailable: postalCode?.pre_paid === 'Y',
        codAvailable: postalCode?.cash === 'Y',
        city: postalCode?.city ?? null,
        message: postalCode
          ? 'PIN code checked'
          : 'Delivery service is unavailable for this PIN code',
      };
    } catch (error: unknown) {
      this.rethrowProviderError(
        error,
        'Could not connect to the shipping provider',
      );
    }
  }

  private async calculateCarrierRate(input: {
    deliveryPincode: string;
    weightGrams: number;
    packageHeightCm: number;
    packageWidthCm: number;
    packageLengthCm: number;
    paymentMode: PaymentMode;
    origin?: string;
  }): Promise<unknown> {
    const origin = input.origin ?? this.config.get<string>('WAREHOUSE_PINCODE');

    if (!origin || !this.pinPattern.test(origin)) {
      throw new ServiceUnavailableException(
        'Configure a valid warehouse PIN code',
      );
    }

    if (!this.pinPattern.test(input.deliveryPincode)) {
      throw new BadRequestException('Invalid delivery PIN code');
    }

    if (!Number.isFinite(input.weightGrams) || input.weightGrams <= 0) {
      throw new BadRequestException('Weight must be greater than zero');
    }

    if (
      !Number.isFinite(input.packageHeightCm) ||
      input.packageHeightCm <= 0 ||
      !Number.isFinite(input.packageWidthCm) ||
      input.packageWidthCm <= 0 ||
      !Number.isFinite(input.packageLengthCm) ||
      input.packageLengthCm <= 0
    ) {
      throw new BadRequestException('Package dimensions must be greater than zero');
    }

    try {
      const { data } = await firstValueFrom(
        this.http.get<unknown>(
          `${this.baseUrl}/api/kinko/v1/invoice/charges/.json`,
          {
            headers: this.headers,
            params: {
              md: 'S',
              ss: 'Delivered',
              d_pin: input.deliveryPincode,
              o_pin: origin,
              cgm: input.weightGrams,
              h: input.packageHeightCm,
              b: input.packageWidthCm,
              l: input.packageLengthCm,
              pt: input.paymentMode,
            },
            timeout: 10000,
          },
        ),
      );

      return data;
    } catch (error: unknown) {
      this.rethrowProviderError(error, 'Could not calculate shipping charges');
    }
  }

  private rethrowProviderError(
    error: unknown,
    connectionMessage: string,
  ): never {
    if (
      error instanceof BadRequestException ||
      error instanceof ServiceUnavailableException ||
      error instanceof BadGatewayException
    ) {
      throw error;
    }

    if (axios.isAxiosError(error) && error.response) {
      throw new BadGatewayException(
        `Delhivery API returned ${error.response.status}`,
      );
    }

    throw new BadGatewayException(connectionMessage);
  }
}
