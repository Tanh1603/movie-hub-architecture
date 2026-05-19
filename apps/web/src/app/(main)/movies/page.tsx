import { MovieListSummary } from './_components/movie-list';

const MoviesPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-300 mb-6 text-center mt-10">
        🎬 PHIM ĐANG CHIẾU
      </h1>
      <MovieListSummary isShowing={true} href="showing" />
      <h1 className="text-3xl font-bold text-gray-300 mb-6 text-center mt-10">
        🎬 PHIM SẮP CHIẾU
      </h1>
      <MovieListSummary isShowing={false} href="upcoming" />
    </div>
  );
};
export default MoviesPage;

