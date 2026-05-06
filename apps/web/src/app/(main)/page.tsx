import MovieSlider from './_components/MovieSlider';
import PromotionsSection from './_components/PromotionsSection';
import MovieGrid from './_components/MovieGrid';
import OtherServices from './_components/OtherServices';
import HeroSection from './_components/HeroSection';
import MembershipSection from './_components/MembershipSection';

import { CinemaListNearby } from './_components/cinema-near-list';
import QuickBooking from './_components/QuickBooking';
import { getQueryClient } from '@/shared/query/get-query-client';
import { getMovies } from '@/api/services';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function MainPage() {
  const queryClient = getQueryClient();

  // Prefetch with error handling - on failure, client-side React Query will fetch
  try {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['movies', { status: 'now_showing', page: 1, limit: 10 }],
        queryFn: () => getMovies({ status: 'now_showing', page: 1, limit: 10 }),
      }),
      queryClient.prefetchQuery({
        queryKey: ['movies', { status: 'upcoming', page: 1, limit: 10 }],
        queryFn: () => getMovies({ status: 'upcoming', page: 1, limit: 10 }),
      }),
    ]);
  } catch (error) {
    // Log but don't crash SSR - client will fetch if prefetch fails
    console.error('[MainPage] Failed to prefetch movies:', error);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-col w-full -mt-28">
        {' '}
        {/* Negative margin to pull Hero under transparent navbar if needed, check layout */}
        {/* Full Width Hero */}
        <HeroSection />
        {/* Quick Booking - Overlapping Hero */}
        {/* The QuickBooking component has built-in -mt-8, we can enhance it here if needed */}
        <QuickBooking />
        {/* Main Content Container - Centered and constrained */}
        <div className="flex flex-col gap-16 max-w-[1440px] mx-auto w-full px-4 sm:px-8 md:px-12 lg:px-24 xl:px-32 pb-20">
          {/* Các rạp gần vị trí */}
          <section>
            <h2 className="text-[32px] font-bold text-white mb-6 border-l-4 border-primary pl-3 uppercase">
              Rạp chiếu gần bạn
            </h2>
            <CinemaListNearby />
          </section>

          {/* Slider phim đang chiếu - Converted to Grid as requested */}
          <section>
            <MovieGrid
              title="🎬 PHIM ĐANG CHIẾU"
              href="showing"
              status="now_showing"
            />
          </section>

          {/* Slider phim sắp chiếu - Keep as Slider or Grid? User asked to refactor 'Now Showing'. 
              I'll keep 'Upcoming' as Slider for variety, or make both Grids if preferred. 
              Let's keep Upcoming as Slider to distinguish sections. 
          */}
          <section>
            <MovieSlider
              title="🎥 PHIM SẮP CHIẾU"
              href="upcoming"
              status="upcoming"
            />
          </section>

          <PromotionsSection />

          <MembershipSection />

          <OtherServices />
        </div>
      </div>
    </HydrationBoundary>
  );
}

