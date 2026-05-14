import { PaymentStatus } from '@movie-hub/shared-types';
import { PaymentTransitionPolicyService } from './payment-transition-policy.service';

describe('PaymentTransitionPolicyService', () => {
  const policy = new PaymentTransitionPolicyService();

  it('allows declared transitions', () => {
    expect(policy.canTransition(PaymentStatus.PROCESSING, PaymentStatus.PENDING)).toBe(true);
    expect(policy.canTransition(PaymentStatus.PENDING, PaymentStatus.COMPLETED)).toBe(true);
    expect(policy.canTransition(PaymentStatus.PENDING, PaymentStatus.FAILED)).toBe(true);
  });

  it('rejects terminal-state regression', () => {
    expect(policy.canTransition(PaymentStatus.COMPLETED, PaymentStatus.FAILED)).toBe(false);
    expect(policy.canTransition(PaymentStatus.FAILED, PaymentStatus.COMPLETED)).toBe(false);
    expect(() =>
      policy.assertTransition(PaymentStatus.COMPLETED, PaymentStatus.FAILED)
    ).toThrow('Illegal payment transition');
  });
});

