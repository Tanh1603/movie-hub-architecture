import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PaymentMethod } from '@movie-hub/shared-types';
import { IPaymentStrategy } from './payment.strategy';
import { VNPayStrategy } from './providers/vnpay.strategy';

/**
 * Payment Strategy Factory
 * Resolves and returns the appropriate payment strategy based on payment method.
 * Supports extensible registration of new payment provider strategies.
 * Follows the Factory Pattern for clean strategy instantiation.
 */
@Injectable()
export class PaymentStrategyFactory {
  private readonly logger = new Logger(PaymentStrategyFactory.name);
  private strategies: Map<PaymentMethod, IPaymentStrategy>;

  constructor(private vnpayStrategy: VNPayStrategy) {
    this.strategies = new Map();
    this.registerStrategy(PaymentMethod.VNPAY, vnpayStrategy);
    // Future strategies will be registered here:
    // this.registerStrategy(PaymentMethod.MOMO, momoStrategy);
    // this.registerStrategy(PaymentMethod.STRIPE, stripeStrategy);
  }

  /**
   * Register a payment strategy for a specific payment method
   * @param method - Payment method enum value
   * @param strategy - Strategy implementation instance
   */
  private registerStrategy(
    method: PaymentMethod,
    strategy: IPaymentStrategy
  ): void {
    this.strategies.set(method, strategy);
    this.logger.debug(`Registered strategy for payment method: ${method}`);
  }

  /**
   * Get a payment strategy by payment method
   * @param method - Payment method to resolve strategy for
   * @returns Strategy implementation for the given payment method
   * @throws BadRequestException if payment method is not supported
   */
  getStrategy(method: PaymentMethod): IPaymentStrategy {
    const strategy = this.strategies.get(method);

    if (!strategy) {
      this.logger.warn(`Payment method not supported: ${method}`);
      throw new BadRequestException(
        `Payment method '${method}' is not supported. Supported methods: ${Array.from(
          this.strategies.keys()
        ).join(', ')}`
      );
    }

    return strategy;
  }

  /**
   * Get list of supported payment methods
   * @returns Array of supported payment methods
   */
  getSupportedMethods(): PaymentMethod[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Check if a payment method is supported
   * @param method - Payment method to check
   * @returns True if payment method is supported
   */
  isSupported(method: PaymentMethod): boolean {
    return this.strategies.has(method);
  }
}
