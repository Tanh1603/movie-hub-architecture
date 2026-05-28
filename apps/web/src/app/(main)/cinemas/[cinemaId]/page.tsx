import {
  getCinemaDetail
} from '@/api/services';
import { getQueryClient } from '@/libs/get-query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import CinemaDetailCard from './_components/cinema-detail-card';
import { MoviesAtCinema } from './_components/movies-list-cinema';

export default async function CinemaDetailPage({
  params,
}: {
  params: Promise<{ cinemaId: string }>;
}) {
  const { cinemaId } = await params;
  const queryClient = getQueryClient();
  const cinema = await queryClient.fetchQuery({
    queryKey: ['cinemas', 'detail', cinemaId],
    queryFn:() => getCinemaDetail(cinemaId)
  });
  // queryClient.prefetchInfiniteQuery({
  //   queryKey: ['movies-at-cinema', cinemaId],
  //   queryFn: async ({pageParam = 1}) => {
  //     const response = await getMovieAtCinemas(cinemaId, {
  //       page: pageParam,
  //       limit: 20,
  //     });
  //     return response.data;
  //   },

  //   select: (data) => {
  //     return {
  //       pages: data.pages.flatMap((page) => page.data),
  //       pageParams: data.pageParams,
  //     };
  //   },
  //   initialPageParam: 1,
  // });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="w-full flex flex-col items-center justify-center gap-4">
        <CinemaDetailCard cinema={cinema.data} />
        <MoviesAtCinema cinemaId={cinemaId} />
      </div>
    </HydrationBoundary>
  );
}
