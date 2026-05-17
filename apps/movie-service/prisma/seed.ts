import { PrismaClient, AgeRating, LanguageOption } from '../generated/prisma';

const prisma = new PrismaClient();

const movieIds = {
  dune2: '11111111-1111-1111-1111-111111111111',
  insideOut2: '22222222-2222-2222-2222-222222222222',
  oppenheimer: '33333333-3333-3333-3333-333333333333',
  gxk: '44444444-4444-4444-4444-444444444444',
};

const releaseIds = {
  dune2: '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  insideOut2: '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  oppenheimer: '33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  gxk: '44444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
};

async function main() {
  console.log('🌱 Seeding Movie Service database...');

  await prisma.review.deleteMany();
  await prisma.movieGenre.deleteMany();
  await prisma.movieRelease.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.genre.deleteMany();

  const genreNames = [
    'Hành động',
    'Khoa học viễn tưởng',
    'Tâm lý',
    'Hoạt hình',
    'Phiêu lưu',
    'Thảm họa',
    'Chính kịch',
    'Giật gân',
    'Quái vật',
  ];

  const genres = await Promise.all(
    genreNames.map((name) => prisma.genre.create({ data: { name } }))
  );

  const genreByName = Object.fromEntries(genres.map((g) => [g.name, g.id]));

  const movies = [
    {
      id: movieIds.dune2,
      releaseId: releaseIds.dune2,
      title: 'Dune: Hành Tinh Cát - Phần Hai',
      originalTitle: 'Dune: Part Two',
      overview:
        'Paul Atreides liên minh với người Fremen để phục thù cho gia tộc, đồng thời đối mặt với lựa chọn giữa tình yêu và sứ mệnh giải phóng Arrakis.',
      posterUrl:
        'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=WayI4O0cZk0',
      backdropUrl:
        'https://image.tmdb.org/t/p/original/AcKVlWaNVVVFQwro3nLXqPljcYA.jpg',
      runtime: 166,
      releaseDate: new Date('2026-05-16'),
      ageRating: AgeRating.T13,
      originalLanguage: 'en',
      spokenLanguages: ['vi', 'en'],
      productionCountry: 'Hoa Kỳ',
      languageType: LanguageOption.SUBTITLE,
      director: 'Denis Villeneuve',
      cast: [
        { name: 'Timothée Chalamet', character: 'Paul Atreides' },
        { name: 'Zendaya', character: 'Chani' },
        { name: 'Rebecca Ferguson', character: 'Lady Jessica' },
      ],
      genres: ['Hành động', 'Khoa học viễn tưởng', 'Chính kịch'],
    },
    {
      id: movieIds.insideOut2,
      releaseId: releaseIds.insideOut2,
      title: 'Những Mảnh Ghép Cảm Xúc 2',
      originalTitle: 'Inside Out 2',
      overview:
        'Riley bước vào tuổi thiếu niên với những cảm xúc mới như Lo Âu và Xấu Hổ, khiến thế giới nội tâm của cô bé một lần nữa hỗn loạn.',
      posterUrl:
        'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=MR3CwFNojfQ',
      backdropUrl:
        'https://image.tmdb.org/t/p/original/w13Jg8p7icmPjOJ1rTmlQIP3h5E.jpg',
      runtime: 100,
      releaseDate: new Date('2026-05-20'),
      ageRating: AgeRating.P,
      originalLanguage: 'en',
      spokenLanguages: ['vi', 'en'],
      productionCountry: 'Hoa Kỳ',
      languageType: LanguageOption.DUBBED,
      director: 'Kelsey Mann',
      cast: [
        { name: 'Amy Poehler', character: 'Joy (lồng tiếng gốc)' },
        { name: 'Maya Hawke', character: 'Anxiety (lồng tiếng gốc)' },
        { name: 'Ayo Edebiri', character: 'Envy (lồng tiếng gốc)' },
      ],
      genres: ['Hoạt hình', 'Phiêu lưu', 'Chính kịch'],
    },
    {
      id: movieIds.oppenheimer,
      releaseId: releaseIds.oppenheimer,
      title: 'Oppenheimer',
      originalTitle: 'Oppenheimer',
      overview:
        'Chân dung J. Robert Oppenheimer trong cuộc chạy đua chế tạo bom nguyên tử, cùng những giằng xé đạo đức và hệ lụy hậu chiến.',
      posterUrl:
        'https://image.tmdb.org/t/p/w500/8Gxv8g8EXXuS1wE3q4PPRyuqX3y.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
      backdropUrl:
        'https://image.tmdb.org/t/p/original/jIvdc7HqE0nqnEqMAH0lZVzfCwZ.jpg',
      runtime: 180,
      releaseDate: new Date('2026-06-10'),
      ageRating: AgeRating.T18,
      originalLanguage: 'en',
      spokenLanguages: ['vi', 'en'],
      productionCountry: 'Hoa Kỳ',
      languageType: LanguageOption.SUBTITLE,
      director: 'Christopher Nolan',
      cast: [
        { name: 'Cillian Murphy', character: 'J. Robert Oppenheimer' },
        { name: 'Emily Blunt', character: 'Katherine Oppenheimer' },
        { name: 'Robert Downey Jr.', character: 'Lewis Strauss' },
      ],
      genres: ['Chính kịch', 'Tâm lý'],
    },
    {
      id: movieIds.gxk,
      releaseId: releaseIds.gxk,
      title: 'Godzilla x Kong: Đế Chúa & Quái Vật',
      originalTitle: 'Godzilla x Kong: The New Empire',
      overview:
        'Godzilla và Kong hợp lực trước mối đe dọa cổ xưa từ Lòng Trái Đất, hé lộ nguồn gốc của các Titan.',
      posterUrl:
        'https://image.tmdb.org/t/p/w500/bQ2ywkchIiaKLSEaMrcT6e29f91.jpg',
      trailerUrl: 'https://www.youtube.com/watch?v=sx6ihN32ISQ',
      backdropUrl:
        'https://image.tmdb.org/t/p/original/sRLC052ieEzkQs9dEtPMfFxYkej.jpg',
      runtime: 115,
      releaseDate: new Date('2026-05-15'),
      ageRating: AgeRating.T13,
      originalLanguage: 'en',
      spokenLanguages: ['vi', 'en'],
      productionCountry: 'Hoa Kỳ',
      languageType: LanguageOption.SUBTITLE,
      director: 'Adam Wingard',
      cast: [
        { name: 'Rebecca Hall', character: 'Dr. Ilene Andrews' },
        { name: 'Brian Tyree Henry', character: 'Bernie Hayes' },
        { name: 'Dan Stevens', character: 'Trapper' },
      ],
      genres: ['Hành động', 'Quái vật', 'Phiêu lưu'],
    },
  ];

  for (const movieData of movies) {
    const movie = await prisma.movie.create({
      data: {
        id: movieData.id,
        title: movieData.title,
        originalTitle: movieData.originalTitle,
        overview: movieData.overview,
        posterUrl: movieData.posterUrl,
        trailerUrl: movieData.trailerUrl,
        backdropUrl: movieData.backdropUrl,
        runtime: movieData.runtime,
        releaseDate: movieData.releaseDate,
        ageRating: movieData.ageRating,
        originalLanguage: movieData.originalLanguage,
        spokenLanguages: movieData.spokenLanguages,
        productionCountry: movieData.productionCountry,
        languageType: movieData.languageType,
        director: movieData.director,
        cast: movieData.cast,
      },
    });

    const releaseStart =
      movieData.title === 'Godzilla x Kong: Đế Chúa & Quái Vật'
        ? new Date('2026-06-10') // Upcoming (Future)
        : new Date('2026-05-16'); // Now Showing (Past)

    await prisma.movieRelease.create({
      data: {
        id: movieData.releaseId,
        movieId: movie.id,
        startDate: releaseStart,
        endDate: new Date('2026-07-15'),
        note: 'Lịch phát hành chiếu rạp dịp Tết 2026',
      },
    });

    await Promise.all(
      movieData.genres.map((name) =>
        prisma.movieGenre.create({
          data: {
            movieId: movie.id,
            genreId: genreByName[name],
          },
        })
      )
    );
  }

  const reviews = [
    {
      movieId: movieIds.dune2,
      userId: 'user-customer-001',
      rating: 5,
      content:
        'Hình ảnh sa mạc và âm thanh IMAX quá ấn tượng, nhịp phim chặt chẽ hơn phần 1.',
    },
    {
      movieId: movieIds.insideOut2,
      userId: 'user-customer-002',
      rating: 4,
      content:
        'Phim dễ thương, thông điệp lớn lên tinh tế và lồng tiếng Việt nghe ổn.',
    },
  ];

  await prisma.review.createMany({ data: reviews });

  console.log(
    '✅ Seeded genres, movies, releases, và đánh giá bằng dữ liệu TMDB (tiếng Việt)'
  );
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
