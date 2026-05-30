'use client';

import { useEffect } from 'react';
import { useBookingStore } from '@/stores/booking-store';

export function PaymentSuccessCleanup() {
  const resetBooking = useBookingStore((state) => state.resetBooking);

  useEffect(() => {
    Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith('pendingPaymentUrl:'))
      .forEach((key) => window.sessionStorage.removeItem(key));
    resetBooking();
  }, [resetBooking]);

  return null;
}
