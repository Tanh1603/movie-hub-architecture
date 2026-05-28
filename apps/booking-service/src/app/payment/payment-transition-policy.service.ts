import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@movie-hub/shared-types';

@Injectable()
export class PaymentTransitionPolicyService {
  private readonly allowedTransitions: Record<PaymentStatus, Set<PaymentStatus>> = {
    [PaymentStatus.PENDING]: new Set([
      PaymentStatus.COMPLETED,
      PaymentStatus.FAILED,
    ]),
    [PaymentStatus.PROCESSING]: new Set([
      PaymentStatus.PENDING,
      PaymentStatus.FAILED,
    ]),
    [PaymentStatus.COMPLETED]: new Set([]),
    [PaymentStatus.FAILED]: new Set([]),
    [PaymentStatus.REFUNDED]: new Set([]),
  };

  canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
    if (from === to) {
      return true;
    }
    return this.allowedTransitions[from]?.has(to) ?? false;
  }

  assertTransition(from: PaymentStatus, to: PaymentStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Illegal payment transition ${from} -> ${to}`);
    }
  }

  isTerminal(status: PaymentStatus): boolean {
    return (
      status === PaymentStatus.COMPLETED ||
      status === PaymentStatus.FAILED ||
      status === PaymentStatus.REFUNDED
    );
  }
}

