const fs = require('fs');
const path = require('path');

// Helper to find PrismaClient in different environments (Local vs Docker)
function getPrismaClient() {
  const possiblePaths = [
    '../../apps/movie-service/generated/prisma', // Local development
    '../../generated/prisma', // Docker container (flattened)
  ];

  for (const p of possiblePaths) {
    try {
      // Check if the path exists before requiring
      if (fs.existsSync(path.resolve(__dirname, p))) {
        return require(p);
      }
    } catch (e) {
      // Ignore errors and try next path
    }
  }
  // Fallback to default
  return require('../../apps/movie-service/generated/prisma');
}

const { PrismaClient } = getPrismaClient();
const prisma = new PrismaClient();

/**
 * SANITIZATION HELPER
 * Ensures we never return "null", "undefined", or invalid "example.com" URLs.
 */
function sanitizeUrl(url, type = 'POSTER') {
  // If url is literally null/undefined or contains "null"/"undefined" string
  if (
    !url ||
    typeof url !== 'string' ||
    url.includes('null') ||
    url.includes('undefined')
  ) {
    return getFallbackImage(type);
  }

  // If TMDB url but ends in null (e.g. "https://image.tmdb.org/t/p/w500null")
  if (
    url.includes('tmdb.org') &&
    (url.endsWith('null') || url.endsWith('undefined'))
  ) {
    return getFallbackImage(type);
  }

  // If example.com (invalid for production/images)
  if (url.includes('example.com')) {
    return getFallbackImage(type);
  }

  // Valid URL
  return url;
}

function getFallbackImage(type) {
  switch (type) {
    case 'POSTER':
      return 'https://placehold.co/600x900/1e1e1e/FFF?text=Movie+Poster';
    case 'BACKDROP':
      return 'https://placehold.co/1920x1080/1e1e1e/FFF?text=No+Backdrop';
    case 'PROFILE':
      return 'https://placehold.co/200x300/1e1e1e/FFF?text=Unknown';
    default:
      return 'https://placehold.co/500x500?text=No+Image';
  }
}

/**
 * Maps TMDB genre IDs to Vietnamese genre names
 */
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
  return map[id] || 'Phim Khác';
}

async function main() {
  const dataPath = path.join(__dirname, 'data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log('🎬 Starting Movie Service seed...');
  console.log('🛡️  Enforcing Asset Integrity & Temporal Logic\n');

  // Clean existing data in correct order
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.movieGenre.deleteMany(),
    prisma.movieRelease.deleteMany(),
    prisma.genre.deleteMany(),
    prisma.movie.deleteMany(),
  ]);

  console.log('✅ Cleaned existing data');

  // ===========================
  // PHASE 1: Create Genres
  // ===========================
  console.log('\n🎭 Phase 1: Seeding genres...');

  const genreMap = {};
  for (const g of data.genres) {
    try {
      const genre = await prisma.genre.create({
        data: { name: g.name },
      });
      genreMap[g.name] = genre;
    } catch {
      const existing = await prisma.genre.findFirst({
        where: { name: g.name },
      });
      if (existing) genreMap[g.name] = existing;
    }
  }

  console.log(`✅ Created ${Object.keys(genreMap).length} genres`);

  // ===========================
  // PHASE 2: Create Movies with Relations
  // ===========================
  console.log('\n🎬 Phase 2: Seeding movies with releases and genres...');

  const NOW = new Date();

  for (const m of data.movies) {
    try {
      // 1. Build Genre Connections
      const genreConnects = [];
      for (const g of m.genres || []) {
        const genreName = getGenreNameById(g.id);
        const genre = genreMap[genreName];
        if (genre) {
          genreConnects.push({ genre: { connect: { id: genre.id } } });
        }
      }

      // 2. Temporal Logic (Dynamic Dates)
      // Determine if movie should be "Coming Soon" or "Now Showing"
      let releaseDate;
      let endDate = null;

      // Special handling for specific titles PLUS random selection to ensure population
      // Keywords that suggest "Future"
      const isHardcodedUpcoming =
        (m.title &&
          (m.title.includes('TRON') ||
            m.title.includes('Mufasa') ||
            m.title.includes('Captain') ||
            m.title.includes('Superman') ||
            m.title.includes('Avatar') ||
            m.title.includes('Batman') ||
            m.title.includes('Jurassic') ||
            m.title.includes('Fantastic'))) ||
        (m.original_title &&
          (m.original_title.includes('Last Rites') ||
            m.original_title.includes('TRON')));

      // Logic: If hardcoded OR 30% random chance -> Coming Soon
      const isUpComingTitle = isHardcodedUpcoming || Math.random() < 0.3;

      if (isUpComingTitle) {
        // COMING SOON: Release in 14-45 days (widened window)
        const daysInFuture = Math.floor(Math.random() * 30) + 14;
        releaseDate = new Date(
          NOW.getTime() + daysInFuture * 24 * 60 * 60 * 1000
        );
      } else {
        // NOW SHOWING: Released 1-60 days ago
        const daysAgo = Math.floor(Math.random() * 60) + 1;
        releaseDate = new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        // End date in future (so it's still showing)
        const runTimeDays = Math.floor(Math.random() * 30) + 30; // Runs for 30-60 days total
        endDate = new Date(
          releaseDate.getTime() + runTimeDays * 24 * 60 * 60 * 1000
        );
      }

      // 3. Asset Integrity (Sanitize URLs)
      let backdropUrl = sanitizeUrl(m.backdrop_path, 'BACKDROP');
      // Fix potential double-prefixing if source data wasn't clean
      if (
        m.backdrop_path &&
        !m.backdrop_path.startsWith('http') &&
        !backdropUrl.startsWith('http')
      ) {
        const fullUrl = `https://image.tmdb.org/t/p/original${m.backdrop_path}`;
        backdropUrl = sanitizeUrl(fullUrl, 'BACKDROP');
      }

      const posterUrl = sanitizeUrl(m.poster_path, 'POSTER');

      // Sanitize Cast Profiles
      const sanitizedCast = (m.cast || []).map((actor) => ({
        ...actor,
        profileUrl: sanitizeUrl(actor.profileUrl, 'PROFILE'),
      }));

      // 4. Create Movie
      const movie = await prisma.movie.create({
        data: {
          title: m.title,
          originalTitle: m.original_title ?? m.title,
          overview: m.overview ?? 'No description available.',
          posterUrl: posterUrl, // GUARANTEED valid
          trailerUrl: m.trailerUrl ?? '',
          backdropUrl: backdropUrl, // GUARANTEED valid
          runtime: m.runtime ?? 120,
          releaseDate: releaseDate,
          ageRating: 'P',
          originalLanguage: m.original_language ?? 'en',
          spokenLanguages: Array.isArray(m.spoken_languages)
            ? m.spoken_languages
            : [String(m.spoken_languages || 'en')],
          productionCountry: m.production_countries ?? 'Unknown',
          languageType: 'SUBTITLE',
          director: m.director ?? 'Unknown',
          cast: sanitizedCast,
          movieReleases: {
            create: [
              {
                startDate: releaseDate,
                endDate: endDate,
              },
            ],
          },
          movieGenres: {
            create: genreConnects,
          },
        },
      });

      console.log(
        `   ✅ Seeded: ${movie.title.substring(0, 30)}... [${
          isUpComingTitle ? 'COMING SOON' : 'NOW SHOWING'
        }]`
      );
    } catch (error) {
      console.error(
        `   ❌ Failed to seed movie "${m.title}": ${error.message}`
      );
    }
  }

  // Summary
  const count = await prisma.movie.count();
  console.log(`\n🎉 Movie Service seed completed! Total Movies: ${count}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
