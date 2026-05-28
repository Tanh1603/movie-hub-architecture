import { MovieSection } from '../_components/movie-section';
export default async function ShowingPage() {
  return (
    <div className="flex flex-col gap-10 pb-20">
      <h1 className="text-3xl font-bold text-gray-300 mb-6 text-center mt-10">
        🎬 PHIM ĐANG CHIẾU
      </h1>
      <MovieSection isShowing={true} />
    </div>
  );
}

