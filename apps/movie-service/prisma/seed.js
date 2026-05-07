const fs = require('fs');
const {
  PrismaClient,
  AgeRating,
  LanguageOption,
} = require('../generated/prisma/index.js');

const prisma = new PrismaClient();

const main = async () => {
  const data = JSON.parse(fs.readFileSync('./prisma/data.json', 'utf8'));

  await prisma.$transaction([
    prisma.movieGenre.deleteMany(),
    prisma.movieRelease.deleteMany(),
    prisma.genre.deleteMany(),
    prisma.movie.deleteMany(),
  ]);

  console.log('✅ Đã xóa dữ liệu cũ.');

  console.log('🎭 Seed genres...');

  await prisma.$transaction(
    data.genres.map((g) =>
      prisma.genre.create({
        data: { name: g.name },
      })
    )
  );
  console.log(`✅ Đã seed ${data.genres.length} thể loại.`);

  for (const m of data.movies) {
    const movie = await prisma.movie.create({
      data: {
        title: m.title,
        originalTitle: m.original_title ?? m.title,
        overview: m.overview ?? '',
        posterUrl: m.poster_path,
        trailerUrl: m.trailerUrl ?? '',
        backdropUrl: m.backdrop_path
          ? `https://image.tmdb.org/t/p/original${m.backdrop_path}`
          : '',
        runtime: m.runtime ?? 120,
        releaseDate: new Date(m.release_date),
        ageRating: AgeRating.P,
        originalLanguage: m.original_language ?? 'en',
        spokenLanguages: [m.original_language ?? 'en'],
        productionCountry: m.production_countries,
        languageType: LanguageOption.SUBTITLE,
        director: m.director ?? 'Unknown',
        cast: m.cast,

        movieReleases: {
          create: await Promise.all(
            (m.release_dates || []).map(async (r) => {
              return {
                startDate: new Date(r),
              };
            })
          ),
        },

        movieGenres: {
          create: await Promise.all(
            (m.genres || []).map(async (g) => {
              const genreName = getGenreNameById(g.id);

              let genre = await prisma.genre.findFirst({
                where: { name: genreName },
              });
              if (!genre) {
                genre = await prisma.genre.create({
                  data: { name: genreName },
                });
              }
              return { genreId: genre.id };
            })
          ),
        },
      },
    });

    console.log(`🎬 Seeded movie: ${movie.title}`);
  }

  console.log('🌟 Seed hoàn tất!');
};

function getGenreNameById(id) {
  const map = {
    28: 'Phim Hành Động',
    12: 'Phim Phiêu Lưu',
    16: 'Phim Hoạt Hình',
    35: 'Phim Hài',
    80: 'Phim Hình Sự',
    99: 'Phim Tài Liệu',
    18: 'Phim Chính Kịch',
    10751: 'Phim Gia Đình',
    14: 'Phim Giả Tượng',
    36: 'Phim Lịch Sử',
    27: 'Phim Kinh Dị',
    10402: 'Phim Nhạc',
    9648: 'Phim Bí Ẩn',
    10749: 'Phim Lãng Mạn',
    878: 'Phim Khoa Học Viễn Tưởng',
    10770: 'Chương Trình Truyền Hình',
    53: 'Phim Gây Cấn',
    10752: 'Phim Chiến Tranh',
    37: 'Phim Miền Tây',
  };
  return map[id] || 'Unknown';
}

main()
  .then(async () => {
    console.log('🎉 Hoàn tất seed database.');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Lỗi seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
