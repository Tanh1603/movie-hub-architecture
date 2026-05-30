'use client';

import { useEffect } from 'react';
import { useBookingStore } from '@/stores/booking-store';

export function PaymentSuccessCleanup() {
  const resetBooking = useBookingStore((state) => state.resetBooking);

  useEffect(() => {
    for (let index = window.sessionStorage.length - 1; index >= 0; index--) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith('pendingPaymentUrl:')) {
        window.sessionStorage.removeItem(key);
      }
    }
    resetBooking();
  }, [resetBooking]);

  return null;
}
