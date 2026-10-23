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

@Injectable()
export class ShippingService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

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

  async checkPincode(pincode: string) {
    if (!/^\d{6}$/.test(pincode)) {
      throw new BadRequestException('Enter a valid 6-digit PIN code');
    }

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

      return {
        pincode,
        serviceable: Boolean(
          postalCode &&
          postalCode.remarks !== 'Embargo' &&
          postalCode.pre_paid === 'Y',
        ),
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

  async calculateShipping(input: {
    deliveryPincode: string;
    weightGrams: number;
    paymentMode: PaymentMode;
  }): Promise<unknown> {
    const origin = this.config.get<string>('WAREHOUSE_PINCODE');

    if (!origin || !/^\d{6}$/.test(origin)) {
      throw new ServiceUnavailableException(
        'Configure a valid warehouse PIN code',
      );
    }

    if (!/^\d{6}$/.test(input.deliveryPincode)) {
      throw new BadRequestException('Invalid delivery PIN code');
    }

    if (!Number.isFinite(input.weightGrams) || input.weightGrams <= 0) {
      throw new BadRequestException('Weight must be greater than zero');
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
