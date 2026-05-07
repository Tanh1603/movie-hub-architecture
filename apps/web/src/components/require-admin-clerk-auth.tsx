'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Loader2, Film, LogIn, ShieldX } from 'lucide-react';
import { Button } from '@movie-hub/shacdn-ui/button';

// Valid staff roles that can access admin panel
const VALID_STAFF_ROLES = [
  'SUPER_ADMIN',
  'CINEMA_MANAGER',
  'ASSISTANT_MANAGER',
  'TICKET_CLERK',
  'CONCESSION_STAFF',
  'USHER',
  'PROJECTIONIST',
  'CLEANER',
  'SECURITY',
];

export const RequireAdminClerkAuth = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !isSignedIn && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [isLoaded, isSignedIn, router, pathname]);

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  // If not signed in, show login prompt
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center space-y-6 p-8">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-2xl shadow-lg">
              <Film className="w-16 h-16 text-white" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Admin Access Required
            </h1>
            <p className="text-gray-600 max-w-md mx-auto text-lg">
              Please sign in with your admin credentials to access the dashboard
            </p>
          </div>

          <Button
            onClick={() => router.push('/admin/login')}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-6 rounded-lg shadow-lg transition-all duration-200 active:scale-95"
            size="lg"
          >
            <LogIn className="w-5 h-5" />
            Sign In to Admin Panel
          </Button>
        </div>
      </div>
    );
  }

  // Check if user has a valid staff role
  const userRole = user?.publicMetadata?.role as string | undefined;
  const isStaff = VALID_STAFF_ROLES.includes(userRole || '');

  // If signed in but not a staff member, show access denied
  if (!isStaff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-red-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center space-y-6 p-8">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 rounded-2xl shadow-lg">
              <ShieldX className="w-16 h-16 text-white" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Access Denied
            </h1>
            <p className="text-gray-600 max-w-md mx-auto text-lg">
              You do not have permission to access the admin panel. This area is
              restricted to authorized staff members only.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-6 rounded-lg shadow-lg transition-all duration-200 active:scale-95"
              size="lg"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If signed in and is staff, render children
  return <>{children}</>;
};
