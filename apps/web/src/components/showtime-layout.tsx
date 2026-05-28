'use client';
import {
  SignInButton,
  SignedIn,
  SignedOut
} from '@clerk/nextjs';
import { Button } from '@movie-hub/shacdn-ui/button';
import { Film, LogIn } from 'lucide-react';
import { BlurCircle } from './blur-circle';

export const RequireSignIn = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>

      <SignedOut>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <BlurCircle top="-100px" left="-100px" />
          <BlurCircle bottom="0" right="0" />

          <Film className="w-16 h-16 text-rose-600 mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            Bạn cần đăng nhập để tiếp tục
          </h1>
          <p className="text-gray-400 max-w-md mb-6 text-center">
            Hãy đăng nhập để đặt chỗ, xem lịch chiếu và lưu vé yêu thích của bạn.
          </p>
          <SignInButton mode="modal">
            <Button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg transition active:scale-95">
              <LogIn className="w-5 h-5" />
              Đăng nhập ngay
            </Button>
          </SignInButton>
        </div>
      </SignedOut>
    </>
  );
};
