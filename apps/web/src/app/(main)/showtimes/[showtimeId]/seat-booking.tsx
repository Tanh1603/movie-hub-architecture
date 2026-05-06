'use client';
import { RequireSignIn } from '@/components/require-sign-in';
import {
  useCheckUserBookingAtShowtime,
  useCreateBooking
} from '@/hooks/booking-hooks';
import {
  useGetSessionTTL,
  useGetShowtimeSeats,
} from '@/hooks/showtime-hooks';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@movie-hub/shacdn-ui/button';

import { useBookingStore } from '@/stores/booking-store';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BookingCheckout } from './booking-checkout';
import { FoodSelector } from './food-selector';
import { SeatMap } from './seat-map';

const steps = ['Chọn ghế', 'Chọn đồ ăn', 'Thanh toán'];

export const SeatBooking = ({ showtimeId }: { showtimeId: string }) => {
  const {
    initBookingData,
    updateHoldTimeSeconds,
    connectSocket,
    disconnectSocket,
    selectedSeats,
  } = useBookingStore();
  const { data: checking, isLoading } =
    useCheckUserBookingAtShowtime(showtimeId);
  const { mutateAsync: createBookingMutate } = useCreateBooking();

  useEffect(() => {
    if (isLoading) return;

    if (checking?.data) {
      return;
    }

    const create = async () => {
      try {
        await createBookingMutate({ showtimeId });
      } catch (err) {
        console.error('Error creating booking:', err);
      }
    };

    create();
  }, [isLoading, checking, showtimeId, createBookingMutate]);

  const { userId } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const disableFirstStep = currentStep === 0 && selectedSeats.length === 0;

  const { data } = useGetShowtimeSeats(showtimeId);
  const { data: ttlResponse } = useGetSessionTTL(showtimeId);

  useEffect(() => {
    if (data) initBookingData(data);
  }, [data, initBookingData]);

  useEffect(() => {
    if (!userId) return;

    connectSocket(showtimeId, userId);

    if (ttlResponse?.ttl && ttlResponse?.ttl > 0) {
      updateHoldTimeSeconds(ttlResponse.ttl);
    }
    return () => {
      disconnectSocket();
    };
  }, [
    data,
    connectSocket,
    disconnectSocket,
    showtimeId,
    ttlResponse,
    updateHoldTimeSeconds,
    userId,
  ]);

  return (
    <RequireSignIn>
      <>
        <div className="flex flex-col  w-full h-full justify-center items-center px-4 md:px-12">
          {/* Stepper */}
          <div className="flex justify-center items-center w-full mb-6 ">
            {steps.map((label, index) => (
              <div
                key={index}
                className={`flex items-center ${
                  index < steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                {/* Circle */}
                <div
                  className={`
          w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
          ${
            currentStep > index
              ? 'bg-rose-500'
              : currentStep === index
              ? 'bg-rose-500/20 border border-rose-500/70'
              : 'bg-gray-600'
          }
        `}
                >
                  {currentStep > index ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 ${
                      currentStep > index ? 'bg-rose-500' : 'bg-gray-600'
                    } transition-all`}
                  ></div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex w-full items-center justify-between gap-4 mt-6">
            {currentStep > 0 ? (
              <Button variant="outline" onClick={prevStep}>
                Quay lại
              </Button>
            ) : (
              <div></div>
            )}
            {currentStep < steps.length - 1 && (
              <Button disabled={disableFirstStep} onClick={nextStep}>
                Tiếp tục
              </Button>
            )}
          </div>

          {/* Step content */}
          <div className="flex-1 w-full p-4">
            {currentStep === 0 && <SeatMap data={data} />}
            {currentStep === 1 && <FoodSelector cinemaId={data?.cinemaId} />}
            {currentStep === 2 && <BookingCheckout data={data} />}
          </div>
        </div>
      </>
    </RequireSignIn>
  );
};
