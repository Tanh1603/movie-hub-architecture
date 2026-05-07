// Mock Data for Admin Dashboard
// All entities are properly linked with foreign keys for realistic relationships

import {
  Cinema,
  Hall,
  Movie,
  Genre,
  Showtime,
  Staff,
  MovieRelease,
  Seat,
  ShowtimeSeat,
  TicketPricing,
  HallType,
  LayoutType,
  AgeRating,
  LanguageType,
  SeatType,
  SeatStatus,
} from '@/libs/api/types';

import {
  CinemaStatus,
  HallStatus,
  ShowtimeFormat,
  ShowtimeStatus,
} from './types';

// Using plain string enum names in mock data to avoid runtime enum references
import { SeatStatusEnum, SeatTypeEnum, DayTypeEnum } from '@movie-hub/shared-types/cinema/enum';

// ========== MOVIE RELEASES ==========
export const mockReleases: MovieRelease[] = [
  {
    id: 'mr_001',
    movieId: 'm_001',
    startDate: '2025-11-20',
    endDate: '2026-01-31',
    status: 'ACTIVE',
    note: 'Standard Release - Bom tấn hành động đỉnh cao từ Tom Cruise',
  },
  {
    id: 'mr_002',
    movieId: 'm_002',
    startDate: '2025-12-01',
    endDate: '2026-02-15',
    status: 'ACTIVE',
    note: 'Extended Run - Tác phẩm được đề cử Oscar từ Christopher Nolan',
  },
  {
    id: 'mr_003',
    movieId: 'm_003',
    startDate: '2025-11-25',
    endDate: '2026-01-10',
    status: 'ACTIVE',
    note: 'Holiday Special - Siêu phẩm Sci-Fi đa giác quan',
  },
  {
    id: 'mr_004',
    movieId: 'm_004',
    startDate: '2025-11-15',
    endDate: '2026-01-20',
    status: 'ACTIVE',
    note: 'Standard Release - Hiện tượng phòng vé toàn cầu',
  },
  {
    id: 'mr_005',
    movieId: 'm_005',
    startDate: '2025-10-01',
    endDate: '2025-11-30',
    status: 'ENDED',
    note: 'Limited Release - Marvel Cinematic Universe Phase 5',
  },
  {
    id: 'mr_006',
    movieId: 'm_006',
    startDate: '2025-12-15',
    endDate: '2026-02-28',
    status: 'UPCOMING',
    note: 'Christmas Release - Câu chuyện nguồn gốc của Willy Wonka',
  },
];

// ========== CINEMAS ==========
export const mockCinemas: Cinema[] = [
  {
    id: 'c_hcm_001',
    name: 'CGV Vincom Landmark 81',
    address: 'Tầng 5, TTTM Vincom Center Landmark 81, 720A Điện Biên Phủ',
    city: 'Hồ Chí Minh City',
    district: 'Quận Bình Thạnh',
    phone: '028 3933 1111',
    email: 'landmark81@cgv.vn',
    website: 'https://www.cgv.vn',
    latitude: 10.7937,
    longitude: 106.721,
    description: 'Rạp chiếu phim cao cấp với công nghệ IMAX lớn nhất Việt Nam.',
    amenities: ['IMAX', 'Lounge', '4DX', 'SweetBox'],
    facilities: { parking: 'Basement B2-B4', wifi: true },
    images: ['url_to_landmark81_img1.jpg', 'url_to_landmark81_img2.jpg'],
    virtualTour360Url: 'url_360_landmark81',
    rating: 4.8,
    totalReviews: 3500,
    operatingHours: { mon_sun: '9:00 - 24:00' },
    socialMedia: { facebook: 'cgvlandmark81' },
    status: 'ACTIVE' as CinemaStatus,
    timezone: 'Asia/Ho_Chi_Minh',
    createdAt: '2018-01-15T10:00:00Z',
    updatedAt: '2025-07-01T14:30:00Z',
  },
  {
    id: 'c_hn_002',
    name: 'Lotte Cinema Cầu Giấy',
    address: 'Tầng 6, Lotte Mart, 241 Xuân Thủy',
    city: 'Hà Nội',
    district: 'Quận Cầu Giấy',
    phone: '024 3788 2222',
    email: 'caugiau@lottecinema.vn',
    website: 'https://www.lottecinema.vn',
    latitude: 21.037,
    longitude: 105.78,
    description: 'Rạp chiếu phim lớn, tiện lợi cho khu vực phía Tây Hà Nội.',
    amenities: ['Standard', 'CineComfort'],
    facilities: { parking: 'Basement B1', wifi: true },
    images: ['url_to_caugiau_img1.jpg'],
    rating: 4.1,
    totalReviews: 1800,
    operatingHours: { mon_sun: '9:30 - 23:30' },
    socialMedia: {},
    status: 'ACTIVE' as CinemaStatus,
    timezone: 'Asia/Ho_Chi_Minh',
    createdAt: '2015-05-20T09:00:00Z',
    updatedAt: '2025-06-28T10:00:00Z',
  },
  {
    id: 'c_dn_003',
    name: 'Galaxy Cinema Đà Nẵng',
    address: '46 Trần Phú, Phường Hải Châu 1',
    city: 'Đà Nẵng',
    district: 'Quận Hải Châu',
    phone: '0236 389 7777',
    email: 'danang@galaxycine.vn',
    description: 'Rạp chiếu phim đang trong giai đoạn bảo trì.',
    amenities: ['Standard'],
    facilities: {},
    images: [],
    rating: 3.5,
    totalReviews: 50,
    operatingHours: { mon_fri: 'Tạm dừng', sat_sun: 'Tạm dừng' },
    socialMedia: {},
    status: 'MAINTENANCE' as CinemaStatus,
    timezone: 'Asia/Ho_Chi_Minh',
    createdAt: '2019-11-01T11:00:00Z',
    updatedAt: '2025-07-05T08:00:00Z',
  },
  {
    id: 'c_hcm_004',
    name: 'BHD Star Bitexco',
    address: 'Tầng 3, Bitexco Financial Tower, 2 Hải Triều',
    city: 'Hồ Chí Minh City',
    district: 'Quận 1',
    phone: '028 3914 6666',
    email: 'bitexco@bhdstar.vn',
    website: 'https://www.bhdstar.vn',
    latitude: 10.7717,
    longitude: 106.7039,
    description: 'Rạp chiếu phim sang trọng tại tòa nhà Bitexco.',
    amenities: ['Gold Class', 'Director Suite'],
    facilities: { parking: 'Basement B1-B3', wifi: true, restaurant: true },
    images: ['url_to_bitexco_img1.jpg'],
    rating: 4.6,
    totalReviews: 2200,
    operatingHours: { mon_sun: '10:00 - 23:30' },
    socialMedia: { facebook: 'bhdbitexco' },
    status: 'ACTIVE' as CinemaStatus,
    timezone: 'Asia/Ho_Chi_Minh',
    createdAt: '2017-09-01T10:00:00Z',
    updatedAt: '2025-07-01T10:00:00Z',
  },
  {
    id: 'c_hn_005',
    name: 'CGV Vincom Mega Mall Long Biên',
    address: 'Tầng 6, TTTM Vincom Mega Mall, 02 Phạm Hùng',
    city: 'Hà Nội',
    district: 'Quận Long Biên',
    phone: '024 3936 3333',
    email: 'longbien@cgv.vn',
    website: 'https://www.cgv.vn',
    latitude: 21.0369,
    longitude: 105.9229,
    description: 'Rạp chiếu phim hiện đại với nhiều phòng chiếu.',
    amenities: ['4DX', 'Gold Class', 'Standard'],
    facilities: { parking: 'Basement B2', wifi: true },
    images: ['url_to_longbien_img1.jpg'],
    rating: 4.4,
    totalReviews: 1500,
    operatingHours: { mon_sun: '9:00 - 23:00' },
    socialMedia: {},
    status: 'ACTIVE' as CinemaStatus,
    timezone: 'Asia/Ho_Chi_Minh',
    createdAt: '2019-03-15T10:00:00Z',
    updatedAt: '2025-06-30T10:00:00Z',
  },
  {
    id: 'c_hcm_006',
    name: 'Galaxy Cinema Tân Bình',
    address: '246 Nguyễn Hồng Đào, Phường 14',
    city: 'Hồ Chí Minh City',
    district: 'Quận Tân Bình',
    phone: '028 7300 8888',
    email: 'tanbih@galaxycine.vn',
    website: 'https://www.galaxycine.vn',
    latitude: 10.7993,
    longitude: 106.6513,
    description: 'Rạp chiếu phim phổ biến với giá cả phải chăng.',
    amenities: ['Standard', 'VIP'],
    facilities: { parking: 'Street', wifi: true },
    images: ['url_to_tanbhin_img1.jpg'],
    rating: 4.2,
    totalReviews: 1200,
    operatingHours: { mon_sun: '9:30 - 23:30' },
    socialMedia: {},
    status: 'ACTIVE' as CinemaStatus,
    timezone: 'Asia/Ho_Chi_Minh',
    createdAt: '2016-06-20T10:00:00Z',
    updatedAt: '2025-06-25T10:00:00Z',
  },
];

// ========== HALLS ==========
export const mockHalls: Hall[] = [
  {
    id: 'h_lm81_imax',
    cinemaId: 'c_hcm_001',
    name: 'Hall 1 - IMAX Laser',
    type: 'IMAX' as HallType,
    capacity: 350,
    rows: 15,
    screenType: 'Giant Screen',
    soundSystem: '12-Channel Sound',
    features: ['3D capable', 'Wheelchair access'],
    layoutType: 'STADIUM' as LayoutType,
    status: 'ACTIVE' as HallStatus,
    createdAt: '2018-01-15T11:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'h_lm81_premium',
    cinemaId: 'c_hcm_001',
    name: "Hall 5 - L'amour Premium",
    type: 'PREMIUM' as HallType,
    capacity: 50,
    rows: 5,
    screenType: 'Standard',
    soundSystem: 'Dolby 7.1',
    features: ['Recliner Seats', 'Blankets'],
    layoutType: 'STANDARD' as LayoutType,
    status: 'ACTIVE' as HallStatus,
    createdAt: '2018-01-15T11:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'h_lm81_4dx',
    cinemaId: 'c_hcm_001',
    name: 'Hall 3 - 4DX',
    type: 'FOUR_DX' as HallType,
    capacity: 120,
    rows: 10,
    screenType: '4DX Motion',
    soundSystem: 'Dolby Atmos',
    features: ['Motion seats', 'Environmental effects'],
    layoutType: 'STADIUM' as LayoutType,
    status: 'ACTIVE' as HallStatus,
    createdAt: '2018-01-15T11:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'h_caugiau_std',
    cinemaId: 'c_hn_002',
    name: 'Hall 3 - Standard',
    type: 'STANDARD' as HallType,
    capacity: 180,
    rows: 12,
    screenType: 'Standard',
    soundSystem: 'Dolby Digital',
    features: ['Popcorn & Drink holders'],
    layoutType: 'STANDARD' as LayoutType,
    status: 'ACTIVE' as HallStatus,
    createdAt: '2015-05-20T10:00:00Z',
    updatedAt: '2025-06-15T10:00:00Z',
  },
  {
    id: 'h_caugiau_comfort',
    cinemaId: 'c_hn_002',
    name: 'Hall 1 - CineComfort',
    type: 'PREMIUM' as HallType,
    capacity: 80,
    rows: 8,
    screenType: 'Standard',
    soundSystem: 'Dolby 7.1',
    features: ['Recliner Seats', 'Extra legroom'],
    layoutType: 'STANDARD' as LayoutType,
    status: 'ACTIVE' as HallStatus,
    createdAt: '2015-05-20T10:00:00Z',
    updatedAt: '2025-06-15T10:00:00Z',
  },
  {
    id: 'h_bitexco_gold',
    cinemaId: 'c_hcm_004',
    name: 'Gold Class 1',
    type: 'PREMIUM' as HallType,
    capacity: 40,
    rows: 4,
    screenType: 'Premium',
    soundSystem: 'Dolby Atmos',
    features: ['Luxury recliners', 'Waiter service'],
    layoutType: 'STANDARD' as LayoutType,
    status: 'ACTIVE' as HallStatus,
    createdAt: '2017-09-01T11:00:00Z',
    updatedAt: '2025-06-20T10:00:00Z',
  },
  {
    id: 'h_bitexco_director',
    cinemaId: 'c_hcm_004',
    name: 'Director Suite',
    type: 'PREMIUM' as HallType,
    capacity: 24,
    rows: 3,
    screenType: 'Premium',
    soundSystem: 'Dolby Atmos',
    features: ['Private lounge', 'Premium food'],
    layoutType: 'STANDARD' as LayoutType,
    status: 'ACTIVE' as HallStatus,
    createdAt: '2017-09-01T11:00:00Z',
    updatedAt: '2025-06-20T10:00:00Z',
  },
  {
    id: 'h_longbien_4dx',
    cinemaId: 'c_hn_005',
    name: 'Hall 2 - 4DX',
    type: 'FOUR_DX' as HallType,
    capacity: 100,
    rows: 10,
    screenType: '4DX Motion',
    soundSystem: 'Dolby Atmos',
    features: ['Motion seats', 'Wind & Water effects'],
    layoutType: 'STADIUM' as LayoutType,
    status: 'ACTIVE' as HallStatus,
    createdAt: '2019-03-15T11:00:00Z',
    updatedAt: '2025-06-28T10:00:00Z',
  },
  {
    id: 'h_longbien_std1',
    cinemaId: 'c_hn_005',
    name: 'Hall 4 - Standard',
    type: 'STANDARD' as HallType,
    capacity: 150,
    rows: 12,
    screenType: 'Standard',
    soundSystem: 'Dolby Digital',
    features: ['Standard seating'],
    layoutType: 'STANDARD' as LayoutType,
    status: 'ACTIVE' as HallStatus,
    createdAt: '2019-03-15T11:00:00Z',
    updatedAt: '2025-06-28T10:00:00Z',
  },
  {
    id: 'h_tanbinh_vip',
    cinemaId: 'c_hcm_006',
    name: 'Hall 1 - VIP',
    type: 'PREMIUM' as HallType,
    capacity: 60,
    rows: 6,
    screenType: 'Premium',
    soundSystem: 'Dolby 7.1',
    features: ['VIP recliners'],
    layoutType: 'STANDARD' as LayoutType,
    status: 'ACTIVE' as HallStatus,
    createdAt: '2016-06-20T11:00:00Z',
    updatedAt: '2025-06-22T10:00:00Z',
  },
  {
    id: 'h_tanbinh_std1',
    cinemaId: 'c_hcm_006',
    name: 'Hall 3 - Standard',
    type: 'STANDARD' as HallType,
    capacity: 140,
    rows: 11,
    screenType: 'Standard',
    soundSystem: 'Dolby Digital',
    features: ['Standard seating'],
    layoutType: 'STANDARD' as LayoutType,
    status: 'ACTIVE' as HallStatus,
    createdAt: '2016-06-20T11:00:00Z',
    updatedAt: '2025-06-22T10:00:00Z',
  },
  {
    id: 'h_tanbinh_std2',
    cinemaId: 'c_hcm_006',
    name: 'Hall 5 - Standard',
    type: 'STANDARD' as HallType,
    capacity: 130,
    rows: 10,
    screenType: 'Standard',
    soundSystem: 'Dolby Digital',
    features: ['Standard seating'],
    layoutType: 'STANDARD' as LayoutType,
    status: 'ACTIVE' as HallStatus,
    createdAt: '2016-06-20T11:00:00Z',
    updatedAt: '2025-06-22T10:00:00Z',
  },
];

// ========== GENRES ==========
export const mockGenres: Genre[] = [
  { id: 'g_001', name: 'Action' },
  { id: 'g_002', name: 'Thriller' },
  { id: 'g_003', name: 'Biography' },
  { id: 'g_004', name: 'Drama' },
  { id: 'g_005', name: 'History' },
  { id: 'g_006', name: 'Sci-Fi' },
  { id: 'g_007', name: 'Adventure' },
  { id: 'g_008', name: 'Comedy' },
  { id: 'g_009', name: 'Horror' },
  { id: 'g_010', name: 'Romance' },
  { id: 'g_011', name: 'Fantasy' },
  { id: 'g_012', name: 'Animation' },
];

// ========== MOVIES ==========
export const mockMovies: Movie[] = [
  {
    id: 'm_001',
    title: 'Mission: Impossible - Dead Reckoning Part One',
    originalTitle: 'Mission: Impossible - Dead Reckoning Part One',
    overview:
      'Ethan Hunt và nhóm IMF đối mặt với một vũ khí nguy hiểm mới có khả năng đe dọa toàn nhân loại.',
    posterUrl:
      'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/3/image/1800x/71252117777b696995f01934522c402d/7/0/700x1000_7_.jpg',
    backdropUrl:
      'https://image.tmdb.org/t/p/original/628Dep6AxEtDxjZoGP78TsOxYbK.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=avz06PDqDbM',
    runtime: 163,
    ageRating: 'T13' as AgeRating,
    productionCountry: 'US',
    languageType: 'SUBTITLE' as LanguageType,
    originalLanguage: 'en',
    spokenLanguages: ['en'],
    genre: [mockGenres[0]],
    cast: [
      {
        name: 'Tom Cruise',
        profileUrl:
          'https://image.tmdb.org/t/p/w500/eOh4ubpOm2Igdg0QH2ghj0mFtC.jpg',
      },
      {
        name: 'Hayley Atwell',
        profileUrl:
          'https://image.tmdb.org/t/p/w500/sFxDYkU9Hg7Pk1VN8lCXJsVLX6A.jpg',
      },
    ],
    director: 'Christopher McQuarrie',
    releaseDate: '2023-07-12',
    status: 'NOW_SHOWING',
  },
  {
    id: 'm_002',
    title: 'Oppenheimer',
    originalTitle: 'Oppenheimer',
    overview:
      'Câu chuyện về nhà vật lý J. Robert Oppenheimer và vai trò của ông trong việc phát triển bom nguyên tử.',
    posterUrl:
      'https://iguov8nhvyobj.vcdn.cloud/media/catalog/product/cache/1/image/c5f0a1eff4c394a251036189ccddaacd/7/0/700x1000-oppen.jpg',
    backdropUrl:
      'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    runtime: 180,
    ageRating: 'T16' as AgeRating,
    productionCountry: 'US',
    languageType: 'SUBTITLE' as LanguageType,
    originalLanguage: 'en',
    spokenLanguages: ['en'],
    genre: [mockGenres[2]],
    cast: [
      {
        name: 'Cillian Murphy',
        profileUrl:
          'https://image.tmdb.org/t/p/w500/dm6V24NjjvjMiCtbMkc8Y2WPm2e.jpg',
      },
      {
        name: 'Emily Blunt',
        profileUrl:
          'https://image.tmdb.org/t/p/w500/5nCSG5TL4fO28RZqBuSuC7oxLr8.jpg',
      },
    ],
    director: 'Christopher Nolan',
    releaseDate: '2023-07-21',
    status: 'NOW_SHOWING',
  },
  {
    id: 'm_003',
    title: 'Dune: Part Two',
    originalTitle: 'Dune: Part Two',
    overview:
      'Paul Atreides hợp lực với Chani và Fremen để trả thù những kẻ đã hủy hoại gia đình mình và thực hiện số phận vĩ đại của mình.',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_.jpg',
    backdropUrl:
      'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    runtime: 166,
    ageRating: 'T13' as AgeRating,
    productionCountry: 'US',
    languageType: 'SUBTITLE' as LanguageType,
    originalLanguage: 'en',
    spokenLanguages: ['en'],
    genre: [mockGenres[5]],
    cast: [
      {
        name: 'Timothée Chalamet',
        profileUrl:
          'https://image.tmdb.org/t/p/w500/831kFjeVRvbU5N2jZ0YjmY3BLNr.jpg',
      },
      {
        name: 'Zendaya',
        profileUrl:
          'https://image.tmdb.org/t/p/w500/b6RuZpWCLCBBIJ0d2uIezLmLAiI.jpg',
      },
    ],
    director: 'Denis Villeneuve',
    releaseDate: '2024-03-01',
    status: 'COMING_SOON',
  },
  {
    id: 'm_004',
    title: 'Barbie',
    originalTitle: 'Barbie',
    overview:
      'Barbie và Ken khám phá thế giới thực và tìm hiểu về bản thân họ trong hành trình đầy màu sắc.',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
    backdropUrl:
      'https://image.tmdb.org/t/p/original/nHf61UzkfFno5X1ofIhugCPus2R.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=pBk4NYhWNMM',
    runtime: 114,
    ageRating: 'P' as AgeRating,
    productionCountry: 'US',
    languageType: 'SUBTITLE' as LanguageType,
    originalLanguage: 'en',
    spokenLanguages: ['en'],
    genre: [mockGenres[7]],
    cast: [
      {
        name: 'Margot Robbie',
        profileUrl:
          'https://image.tmdb.org/t/p/w500/euDPyqLnuwaWMHajcU3oZ9uZezR.jpg',
      },
      {
        name: 'Ryan Gosling',
        profileUrl:
          'https://image.tmdb.org/t/p/w500/lyUyVARQKhGxaxy0FbPJCQRpiaW.jpg',
      },
    ],
    director: 'Greta Gerwig',
    releaseDate: '2023-07-21',
    status: 'NOW_SHOWING',
  },
  {
    id: 'm_005',
    title: 'The Marvels',
    originalTitle: 'The Marvels',
    overview:
      'Carol Danvers, Kamala Khan và Monica Rambeau hợp sức đối đầu với mối đe dọa vũ trụ mới.',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/tUtgLOESpCx7ue4BaeCTqp3vn1b.jpg',
    backdropUrl:
      'https://image.tmdb.org/t/p/original/zN41DPmPhwmgJjHwezALdrdvD0h.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=wS_qbDztgVY',
    runtime: 105,
    ageRating: 'T13' as AgeRating,
    productionCountry: 'US',
    languageType: 'SUBTITLE' as LanguageType,
    originalLanguage: 'en',
    spokenLanguages: ['en'],
    genre: [mockGenres[0]],
    cast: [
      {
        name: 'Brie Larson',
        profileUrl:
          'https://image.tmdb.org/t/p/w500/iqZ5uKJWbwSITCK4CqdlUHZTnXD.jpg',
      },
      {
        name: 'Teyonah Parris',
        profileUrl:
          'https://image.tmdb.org/t/p/w500/6jfVEeE9qRM3qGo8bLPOVk3kBKM.jpg',
      },
    ],
    director: 'Nia DaCosta',
    releaseDate: '2023-11-10',
    status: 'NOW_SHOWING',
  },
  {
    id: 'm_006',
    title: 'Wonka',
    originalTitle: 'Wonka',
    overview:
      'Câu chuyện về những ngày đầu của Willy Wonka và hành trình trở thành nhà sản xuất sô-cô-la vĩ đại nhất.',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg',
    backdropUrl:
      'https://image.tmdb.org/t/p/original/oe7mWkvYhK4PLRNAVSvonzyUXNy.jpg',
    trailerUrl: 'https://www.youtube.com/watch?v=wYX4r8wG6I8',
    runtime: 116,
    ageRating: 'P' as AgeRating,
    productionCountry: 'US',
    languageType: 'SUBTITLE' as LanguageType,
    originalLanguage: 'en',
    spokenLanguages: ['en'],
    genre: [mockGenres[7]],
    cast: [
      {
        name: 'Timothée Chalamet',
        profileUrl:
          'https://image.tmdb.org/t/p/w500/831kFjeVRvbU5N2jZ0YjmY3BLNr.jpg',
      },
      {
        name: 'Olivia Colman',
        profileUrl:
          'https://image.tmdb.org/t/p/w500/4ZwZ66zXZyX26Kf2wfeMt1tQZQf.jpg',
      },
    ],
    director: 'Paul King',
    releaseDate: '2023-12-15',
    status: 'COMING_SOON',
  },
];

// ========== SHOWTIMES ==========
const now = new Date();
const todayISO = now.toISOString().split('T')[0];

export const mockShowtimes: Showtime[] = [
  {
    id: 'st_001',
    movieId: 'm_001',
    movieReleaseId: 'mr_001',
    cinemaId: 'c_hcm_001',
    hallId: 'h_lm81_imax',
    startTime: `${todayISO}T10:00:00+07:00`,
    endTime: `${todayISO}T12:43:00+07:00`,
    format: 'IMAX' as ShowtimeFormat,
    language: 'en',
    subtitles: ['vi'],
    availableSeats: 200,
    status: 'SELLING' as ShowtimeStatus,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 'st_002',
    movieId: 'm_001',
    movieReleaseId: 'mr_001',
    cinemaId: 'c_hcm_001',
    hallId: 'h_lm81_4dx',
    startTime: `${todayISO}T14:30:00+07:00`,
    endTime: `${todayISO}T17:13:00+07:00`,
    format: 'FOUR_DX' as ShowtimeFormat,
    language: 'en',
    subtitles: ['vi'],
    availableSeats: 45,
    status: 'SELLING' as ShowtimeStatus,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 'st_003',
    movieId: 'm_001',
    movieReleaseId: 'mr_001',
    cinemaId: 'c_hcm_004',
    hallId: 'h_bitexco_gold',
    startTime: `${todayISO}T19:00:00+07:00`,
    endTime: `${todayISO}T21:43:00+07:00`,
    format: 'TWO_D' as ShowtimeFormat,
    language: 'en',
    subtitles: ['vi'],
    availableSeats: 12,
    status: 'SELLING' as ShowtimeStatus,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 'st_004',
    movieId: 'm_002',
    movieReleaseId: 'mr_002',
    cinemaId: 'c_hcm_001',
    hallId: 'h_lm81_premium',
    startTime: `${todayISO}T11:00:00+07:00`,
    endTime: `${todayISO}T14:00:00+07:00`,
    format: 'TWO_D' as ShowtimeFormat,
    language: 'en',
    subtitles: ['vi'],
    availableSeats: 0,
    status: 'SELLING' as ShowtimeStatus,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 'st_005',
    movieId: 'm_002',
    movieReleaseId: 'mr_002',
    cinemaId: 'c_hcm_001',
    hallId: 'h_lm81_imax',
    startTime: `${todayISO}T15:30:00+07:00`,
    endTime: `${todayISO}T18:30:00+07:00`,
    format: 'IMAX' as ShowtimeFormat,
    language: 'en',
    subtitles: ['vi'],
    availableSeats: 120,
    status: 'SELLING' as ShowtimeStatus,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 'st_006',
    movieId: 'm_003',
    movieReleaseId: 'mr_003',
    cinemaId: 'c_hcm_001',
    hallId: 'h_lm81_imax',
    startTime: `${todayISO}T20:00:00+07:00`,
    endTime: `${todayISO}T22:46:00+07:00`,
    format: 'IMAX' as ShowtimeFormat,
    language: 'en',
    subtitles: ['vi'],
    availableSeats: 180,
    status: 'SELLING' as ShowtimeStatus,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 'st_007',
    movieId: 'm_004',
    movieReleaseId: 'mr_004',
    cinemaId: 'c_hn_002',
    hallId: 'h_caugiau_comfort',
    startTime: `${todayISO}T10:30:00+07:00`,
    endTime: `${todayISO}T12:24:00+07:00`,
    format: 'TWO_D' as ShowtimeFormat,
    language: 'en',
    subtitles: ['vi'],
    availableSeats: 35,
    status: 'SELLING' as ShowtimeStatus,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 'st_008',
    movieId: 'm_005',
    movieReleaseId: 'mr_005',
    cinemaId: 'c_hcm_001',
    hallId: 'h_lm81_4dx',
    startTime: `${todayISO}T18:00:00+07:00`,
    endTime: `${todayISO}T19:45:00+07:00`,
    format: 'FOUR_DX' as ShowtimeFormat,
    language: 'en',
    subtitles: ['vi'],
    availableSeats: 55,
    status: 'SELLING' as ShowtimeStatus,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 'st_009',
    movieId: 'm_006',
    movieReleaseId: 'mr_006',
    cinemaId: 'c_hn_002',
    hallId: 'h_caugiau_comfort',
    startTime: `${todayISO}T15:00:00+07:00`,
    endTime: `${todayISO}T16:56:00+07:00`,
    format: 'TWO_D' as ShowtimeFormat,
    language: 'en',
    subtitles: ['vi'],
    availableSeats: 45,
    status: 'SELLING' as ShowtimeStatus,
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
  },
];

// ========== STAFF ==========
export const mockStaff: Staff[] = [
  {
    id: 's_001',
    cinemaId: 'c_hcm_001',
    fullName: 'Nguyễn Văn A',
    email: 'anv@cinema.com',
    phone: '0901234567',
    gender: 'MALE',
    dob: '1990-05-15',
    position: 'CINEMA_MANAGER',
    status: 'ACTIVE',
    workType: 'FULL_TIME',
    shiftType: 'MORNING',
    salary: 5000000,
    hireDate: '2020-03-01',
  },
  {
    id: 's_002',
    cinemaId: 'c_hn_002',
    fullName: 'Trần Thị B',
    email: 'btt@cinema.com',
    phone: '0907654321',
    gender: 'FEMALE',
    dob: '1995-08-20',
    position: 'TICKET_CLERK',
    status: 'ACTIVE',
    workType: 'FULL_TIME',
    shiftType: 'AFTERNOON',
    salary: 3000000,
    hireDate: '2022-08-15',
  },
  {
    id: 's_003',
    cinemaId: 'c_dn_003',
    fullName: 'Lê Văn C',
    email: 'clv@cinema.com',
    phone: '0912345678',
    gender: 'MALE',
    dob: '1988-12-10',
    position: 'PROJECTIONIST',
    status: 'INACTIVE',
    workType: 'PART_TIME',
    shiftType: 'NIGHT',
    salary: 2500000,
    hireDate: '2019-01-20',
  },
];

// ========== SEATS ==========
const generateSeats = (hallId: string, rows: number, seatsPerRow: number): Seat[] => {
  const seats: Seat[] = [];
  const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  for (let r = 0; r < rows && r < rowLabels.length; r++) {
    for (let s = 1; s <= seatsPerRow; s++) {
      const seatType: SeatType = 
        r >= rows - 2 ? SeatTypeEnum.VIP : 
        r >= rows - 4 ? SeatTypeEnum.PREMIUM : 
        SeatTypeEnum.STANDARD;
      
      const status: SeatStatus = 
        Math.random() > 0.95 ? SeatStatusEnum.BROKEN : 
        Math.random() > 0.9 ? SeatStatusEnum.MAINTENANCE : 
        SeatStatusEnum.ACTIVE;
      
      seats.push({
        id: `seat_${hallId}_${rowLabels[r]}${s}`,
        rowLetter: rowLabels[r],
        seatNumber: s,
        type: seatType,
        status,
      });
    }
  }
  return seats;
};

export const mockSeats: Seat[] = [
  ...generateSeats('h_lm81_imax', 15, 25),
  ...generateSeats('h_lm81_4dx', 10, 12),
  ...generateSeats('h_lm81_premium', 8, 10),
  ...generateSeats('h_caugiau_comfort', 10, 8),
  ...generateSeats('h_bitexco_gold', 6, 8),
];

// Map seats by hall for easy lookup
const seatsByHall: Record<string, Seat[]> = {
  'h_lm81_imax': mockSeats.slice(0, 375),
  'h_lm81_4dx': mockSeats.slice(375, 495),
  'h_lm81_premium': mockSeats.slice(495, 575),
  'h_caugiau_comfort': mockSeats.slice(575, 655),
  'h_bitexco_gold': mockSeats.slice(655, 703),
};

// ========== SHOWTIME SEATS ==========
const generateShowtimeSeats = (showtimeId: string, hallId: string): ShowtimeSeat[] => {
  const hallSeats = seatsByHall[hallId] || [];
  return hallSeats.map((seat, index) => {
    const isBooked = index % 5 === 0;
    const isReserved = index % 7 === 0 && !isBooked;
    const basePrice = seat.type === 'VIP' ? 150000 : seat.type === 'PREMIUM' ? 120000 : 90000;
    
    return {
      ...seat,
      showtimeId,
      isReserved,
      isBooked,
      price: basePrice,
    };
  });
};

export const mockShowtimeSeats: ShowtimeSeat[] = [
  ...generateShowtimeSeats('st_001', 'h_lm81_imax'),
  ...generateShowtimeSeats('st_002', 'h_lm81_4dx'),
  ...generateShowtimeSeats('st_003', 'h_bitexco_gold'),
];

// ========== TICKET PRICING ==========
export const mockTicketPricing: TicketPricing[] = [
  // IMAX Hall pricing
  { id: 'tp_001', hallId: 'h_lm81_imax', seatType: SeatTypeEnum.STANDARD, dayType: DayTypeEnum.WEEKDAY, price: 120000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_002', hallId: 'h_lm81_imax', seatType: SeatTypeEnum.STANDARD, dayType: DayTypeEnum.WEEKEND, price: 140000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_003', hallId: 'h_lm81_imax', seatType: SeatTypeEnum.STANDARD, dayType: DayTypeEnum.HOLIDAY, price: 160000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_004', hallId: 'h_lm81_imax', seatType: SeatTypeEnum.VIP, dayType: DayTypeEnum.WEEKDAY, price: 180000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_005', hallId: 'h_lm81_imax', seatType: SeatTypeEnum.VIP, dayType: DayTypeEnum.WEEKEND, price: 200000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_006', hallId: 'h_lm81_imax', seatType: SeatTypeEnum.VIP, dayType: DayTypeEnum.HOLIDAY, price: 220000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_007', hallId: 'h_lm81_imax', seatType: SeatTypeEnum.PREMIUM, dayType: DayTypeEnum.WEEKDAY, price: 150000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_008', hallId: 'h_lm81_imax', seatType: SeatTypeEnum.PREMIUM, dayType: DayTypeEnum.WEEKEND, price: 170000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  // 4DX Hall pricing
  { id: 'tp_009', hallId: 'h_lm81_4dx', seatType: SeatTypeEnum.STANDARD, dayType: DayTypeEnum.WEEKDAY, price: 150000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_010', hallId: 'h_lm81_4dx', seatType: SeatTypeEnum.STANDARD, dayType: DayTypeEnum.WEEKEND, price: 180000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_011', hallId: 'h_lm81_4dx', seatType: SeatTypeEnum.VIP, dayType: DayTypeEnum.WEEKDAY, price: 200000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_012', hallId: 'h_lm81_4dx', seatType: SeatTypeEnum.VIP, dayType: DayTypeEnum.WEEKEND, price: 230000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  // Premium Hall pricing
  { id: 'tp_013', hallId: 'h_lm81_premium', seatType: SeatTypeEnum.STANDARD, dayType: DayTypeEnum.WEEKDAY, price: 100000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_014', hallId: 'h_lm81_premium', seatType: SeatTypeEnum.STANDARD, dayType: DayTypeEnum.WEEKEND, price: 120000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_015', hallId: 'h_lm81_premium', seatType: SeatTypeEnum.VIP, dayType: DayTypeEnum.WEEKDAY, price: 150000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
  { id: 'tp_016', hallId: 'h_lm81_premium', seatType: SeatTypeEnum.VIP, dayType: DayTypeEnum.WEEKEND, price: 180000, createdAt: '2025-01-01T10:00:00Z', updatedAt: '2025-01-01T10:00:00Z' },
];

// ========== HELPER FUNCTIONS ==========
export const getCinemaById = (id: string): Cinema | undefined =>
  mockCinemas.find((c) => c.id === id);

export const getHallById = (id: string): Hall | undefined =>
  mockHalls.find((h) => h.id === id);

export const getMovieById = (id: string): Movie | undefined =>
  mockMovies.find((m) => m.id === id);

export const getHallsByCinemaId = (cinemaId: string): Hall[] =>
  mockHalls.filter((h) => h.cinemaId === cinemaId);

export const getSeatsByHallId = (hallId: string): Seat[] =>
  seatsByHall[hallId] || [];

export const getShowtimeSeatsByShowtimeId = (showtimeId: string): ShowtimeSeat[] =>
  mockShowtimeSeats.filter((s) => s.showtimeId === showtimeId);

export const getTicketPricingByHallId = (hallId: string): TicketPricing[] =>
  mockTicketPricing.filter((t) => t.hallId === hallId);

export const getShowtimesByMovieId = (movieId: string): Showtime[] =>
  mockShowtimes.filter((s) => s.movieId === movieId);

export const getShowtimesByCinemaId = (cinemaId: string): Showtime[] =>
  mockShowtimes.filter((s) => s.cinemaId === cinemaId);
