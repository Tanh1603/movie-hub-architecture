import {
  PaymentDetailDto,
  PaymentMethod,
  ServiceResult,
} from '@movie-hub/shared-types';

/**
 * Payment Strategy Contract
 * Defines the interface for different payment provider implementations.
 * Each payment provider (VNPay, MoMo, Stripe, etc.) implements this interface.
 */
export interface IPaymentStrategy {
  /**
   * Generate a payment URL for the user to complete payment
   * @param paymentId - Payment record ID
   * @param bookingId - Associated booking ID
   * @param expireAt - Payment expiration time
   * @param amount - Payment amount in currency units
   * @param ipAddr - User's IP address
   * @returns Payment URL for redirect
   */
  createPaymentUrl(
    paymentId: string,
    bookingId: string,
    expireAt: Date,
    amount: number,
    ipAddr: string
  ): Promise<string>;

  /**
   * Verify and process payment callback/IPN from provider
   * Handles payment confirmation, booking updates, and event publishing
   * @param params - Callback parameters from payment provider
   * @returns Provider response code and message
   */
  handlePaymentCallback(
    params: Record<string, string>
  ): Promise<ServiceResult<any>>;

  /**
   * Handle payment return URL (legacy, may be deprecated)
   * Some providers require handling of synchronous return after payment attempt
   * @param params - URL parameters from payment provider
   * @returns Payment status and code
   */
  handlePaymentReturn(
    params: Record<string, string>
  ): Promise<ServiceResult<any>>;

  /**
   * Get the supported payment method for this strategy
   * @returns PaymentMethod enum value
   */
  getSupportedMethod(): PaymentMethod;
}
