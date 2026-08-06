import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Razorpay = require('razorpay');

export type RazorpayOrderResult = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
};

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly client: any | null;
  readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.keyId = (this.configService.get<string>('RAZORPAY_KEY_ID') || '').trim();
    this.keySecret = (
      this.configService.get<string>('RAZORPAY_KEY_SECRET') || ''
    ).trim();
    this.webhookSecret = (
      this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || ''
    ).trim();

    if (this.keyId && this.keySecret) {
      this.client = new Razorpay({
        key_id: this.keyId,
        key_secret: this.keySecret,
      });
    } else {
      this.client = null;
      this.logger.warn(
        'Razorpay keys missing (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET). Online payments disabled.',
      );
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client && this.keyId && this.keySecret);
  }

  assertConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
      );
    }
  }

  /** Amount in INR → paise (Razorpay expects integer paise). */
  toPaise(amountInr: number): number {
    return Math.round(Number(amountInr) * 100);
  }

  async createOrder(params: {
    amountInr: number;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrderResult> {
    this.assertConfigured();
    const amount = this.toPaise(params.amountInr);
    if (amount < 100) {
      throw new ServiceUnavailableException(
        'Order amount must be at least ₹1 for Razorpay',
      );
    }

    const order = await this.client!.orders.create({
      amount,
      currency: 'INR',
      receipt: params.receipt.slice(0, 40),
      notes: params.notes || {},
    });

    return {
      id: String(order.id),
      amount: Number(order.amount),
      currency: String(order.currency || 'INR'),
      receipt: String(order.receipt || params.receipt),
      status: String(order.status || 'created'),
    };
  }

  verifyPaymentSignature(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): boolean {
    this.assertConfigured();
    const payload = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
    const expected = crypto
      .createHmac('sha256', this.keySecret)
      .update(payload)
      .digest('hex');
    return expected === params.razorpaySignature;
  }

  verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('RAZORPAY_WEBHOOK_SECRET is not set');
      return false;
    }
    if (!signature) return false;
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');
    return expected === signature;
  }
}
