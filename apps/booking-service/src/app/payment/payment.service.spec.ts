import { PaymentService } from './payment.service';
import { PaymentMethod, PaymentStatus } from '@movie-hub/shared-types';

describe('PaymentService phase04 initiation', () => {
  let service: PaymentService;
  let prisma: any;
  let adapter: any;
  let webhookGuard: any;

  beforeEach(() => {
    prisma = {
      bookings: {
        findUnique: jest.fn(),
      },
      payments: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
      tickets: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      promotions: { update: jest.fn() },
    };

    adapter = {
      method: PaymentMethod.VNPAY,
      initiatePayment: jest.fn(),
      parseIPN: jest.fn(),
      parseReturn: jest.fn(),
      buildIPNResponse: jest.fn((outcome: string) => ({
        RspCode: outcome === 'invalid_signature' ? '97' : '00',
        Message: outcome,
      })),
      buildReturnResponse: jest.fn((parsed: { validSignature: boolean; responseCode?: string }) =>
        parsed.validSignature
          ? { status: 'success', code: parsed.responseCode || '00' }
          : { status: 'error', code: '97' }
      ),
    };

    webhookGuard = {
      markIfFirstSeen: jest.fn(),
      auditSuspiciousCallback: jest.fn(),
      assertTimestampFresh: jest.fn(() => ({ fresh: true })),
    };
    const metricCounter = { inc: jest.fn() } as any;

    service = new PaymentService(
      prisma,
      { publishBookingConfirmed: jest.fn() } as any,
      webhookGuard,
      { assertTransition: jest.fn() } as any,
      { setConsumerCallback: jest.fn(), enqueueBookingConfirmed: jest.fn() } as any,
      { send: jest.fn() } as any,
      { sendBookingConfirmation: jest.fn(), sendBookingConfirmationSMS: jest.fn() } as any,
      { generateQRCode: jest.fn() } as any,
      [adapter],
      metricCounter,
      metricCounter,
      metricCounter
    );
  });

  it('reuses an existing pending payment URL for duplicate initiation context', async () => {
    prisma.bookings.findUnique.mockResolvedValue({
      id: 'b1',
      user_id: 'u1',
      showtime_id: 's1',
      final_amount: 100000,
      payment_status: PaymentStatus.PENDING,
      expires_at: new Date(Date.now() + 600000),
      promotion_code: null,
    });

    prisma.payments.findUnique.mockResolvedValue({
      id: 'p-existing',
      booking_id: 'b1',
      amount: 100000,
      payment_method: PaymentMethod.VNPAY,
      status: PaymentStatus.PENDING,
      transaction_id: 'idem',
      provider_transaction_id: null,
      payment_url: 'https://example.test/pay',
      paid_at: null,
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
    });

    const result = await service.createPayment('b1', { paymentMethod: PaymentMethod.VNPAY }, '127.0.0.1', 'u1');

    expect(result.data.id).toBe('p-existing');
    expect(result.data.status).toBe(PaymentStatus.PENDING);
    expect(result.data.paymentUrl).toBe('https://example.test/pay');
    expect(prisma.payments.create).not.toHaveBeenCalled();
    expect(prisma.payments.update).not.toHaveBeenCalled();
    expect(adapter.initiatePayment).not.toHaveBeenCalled();
  });

  it('marks payment failed and returns generic error when provider initiation fails', async () => {
    prisma.bookings.findUnique.mockResolvedValue({
      id: 'b2',
      user_id: 'u2',
      showtime_id: 's2',
      final_amount: 150000,
      payment_status: PaymentStatus.PENDING,
      expires_at: new Date(Date.now() + 600000),
      promotion_code: null,
    });

    prisma.payments.findUnique.mockResolvedValue(null);
    prisma.payments.create.mockResolvedValue({
      id: 'p-new',
      booking_id: 'b2',
      amount: 150000,
      payment_method: PaymentMethod.VNPAY,
      status: PaymentStatus.PROCESSING,
      transaction_id: 'idem',
      provider_transaction_id: null,
      payment_url: null,
      paid_at: null,
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
    });
    prisma.payments.update.mockResolvedValue({});

    jest
      .spyOn<any, any>(service as any, 'runWithTimeout')
      .mockRejectedValue(new Error('PAYMENT_PROVIDER_TIMEOUT'));

    await expect(
      service.createPayment('b2', { paymentMethod: PaymentMethod.VNPAY }, '127.0.0.1', 'u2')
    ).rejects.toThrow('Unable to initiate payment. Please retry later.');

    expect(prisma.payments.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p-new' },
        data: expect.objectContaining({
          status: PaymentStatus.FAILED,
        }),
      })
    );
  });

  it('returns canonical result when concurrent duplicate hits unique idempotency key', async () => {
    prisma.bookings.findUnique.mockResolvedValue({
      id: 'b3',
      user_id: 'u3',
      showtime_id: 's3',
      final_amount: 200000,
      payment_status: PaymentStatus.PENDING,
      expires_at: new Date(Date.now() + 600000),
      promotion_code: null,
    });

    prisma.payments.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'p-raced',
        booking_id: 'b3',
        amount: 200000,
        payment_method: PaymentMethod.VNPAY,
        status: PaymentStatus.PENDING,
        transaction_id: 'idem-raced',
        provider_transaction_id: null,
        payment_url: 'https://example.test/raced',
        paid_at: null,
        metadata: {},
        created_at: new Date(),
        updated_at: new Date(),
      });

    const uniqueError = Object.assign(new Error('Unique constraint failed'), {
      code: 'P2002',
    });
    prisma.payments.create.mockRejectedValue(uniqueError);

    const result = await service.createPayment(
      'b3',
      { paymentMethod: PaymentMethod.VNPAY },
      '127.0.0.1',
      'u3'
    );

    expect(result.data.id).toBe('p-raced');
    expect(adapter.initiatePayment).not.toHaveBeenCalled();
  });

  it('acknowledges duplicate callback without mutating state', async () => {
    adapter.parseIPN.mockReturnValue({
      validSignature: true,
      orderId: 'p-1',
      transactionId: 'tx-1',
      amount: 100000,
      isSuccess: true,
    });
    webhookGuard.markIfFirstSeen.mockResolvedValue({ duplicate: true });
    adapter.buildIPNResponse.mockReturnValue({ RspCode: '00', Message: 'Success' });

    const result = await service.handleProviderIPN(PaymentMethod.VNPAY, {
      vnp_TxnRef: 'p-1',
      vnp_TransactionNo: 'tx-1',
    });

    expect(result.data).toEqual({ RspCode: '00', Message: 'Success' });
    expect(prisma.payments.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('invalid signature callback does not mutate state and is audited', async () => {
    adapter.parseIPN.mockReturnValue({ validSignature: false });
    adapter.buildIPNResponse.mockReturnValue({ RspCode: '97', Message: 'Checksum failed' });

    const result = await service.handleProviderIPN(PaymentMethod.VNPAY, {});

    expect(result.data).toEqual({ RspCode: '97', Message: 'Checksum failed' });
    expect(webhookGuard.auditSuspiciousCallback).toHaveBeenCalled();
    expect(prisma.payments.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('late callback cannot regress terminal state', async () => {
    adapter.parseIPN.mockReturnValue({
      validSignature: true,
      orderId: 'p-final',
      transactionId: 'tx-final',
      amount: 100000,
      isSuccess: false,
    });
    webhookGuard.markIfFirstSeen.mockResolvedValue({ duplicate: false });
    prisma.payments.findUnique.mockResolvedValue({
      id: 'p-final',
      booking_id: 'b-final',
      amount: 100000,
      status: PaymentStatus.COMPLETED,
      booking: {
        id: 'b-final',
        user_id: 'u1',
        showtime_id: 's1',
        status: 'CONFIRMED',
        payment_status: PaymentStatus.COMPLETED,
        expires_at: null,
      },
    });
    adapter.buildIPNResponse.mockReturnValue({
      RspCode: '02',
      Message: 'already_processed',
    });

    const result = await service.handleProviderIPN(PaymentMethod.VNPAY, {
      vnp_TxnRef: 'p-final',
      vnp_TransactionNo: 'tx-final',
    });

    expect(result.data).toEqual({ RspCode: '02', Message: 'already_processed' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.payments.update).not.toHaveBeenCalled();
  });
});
