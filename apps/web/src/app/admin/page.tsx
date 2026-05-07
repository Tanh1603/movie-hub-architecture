'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Building2,
  Film,
  Calendar,
  TrendingUp,
  DollarSign,
  Ticket,
  Star,
  MessageSquare,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import { Button } from '@movie-hub/shacdn-ui/button';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import Link from 'next/link';
import { cinemasApi } from '@/libs/api/services';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  getDashboardStats,
  getRevenueReport,
  getTopMovies,
  getTopCinemas,
  getRecentBookings,
  getRecentReviews,
  type DashboardStatsDto,
  type TopMovieDto,
  type TopCinemaDto,
  type RecentBookingDto,
  type RecentReviewDto,
  type RevenueReportDto,
} from '@/libs/api/dashboard-api';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueReportDto | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBookingDto[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReviewDto[]>([]);
  const [topMovies, setTopMovies] = useState<TopMovieDto[]>([]);
  const [topCinemas, setTopCinemas] = useState<TopCinemaDto[]>([]);

  // RBAC State - use Clerk metadata directly
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role as string | undefined;
  const userCinemaId = user?.publicMetadata?.cinemaId as string | undefined;
  const isAdmin = userRole === 'SUPER_ADMIN' || !userCinemaId;
  const [cinemas, setCinemas] = useState<{ id: string; name: string }[]>([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState<string | undefined>(
    undefined
  );

  // Initialize selectedCinemaId for managers and fetch cinemas for admins
  useEffect(() => {
    const initRBAC = async () => {
      if (!user) return;

      if (isAdmin) {
        // Admin can see all cinemas - fetch list for dropdown
        try {
          const c = await cinemasApi.getAll();
          setCinemas(c || []);
        } catch (e) {
          console.error('Failed to fetch cinemas', e);
        }
      } else if (userCinemaId) {
        // Manager - lock to their assigned cinema
        setSelectedCinemaId(userCinemaId);
      }
    };
    initRBAC();
  }, [user, isAdmin, userCinemaId]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // For managers, wait until selectedCinemaId is set to ensure scoped data
      if (!isAdmin && !selectedCinemaId) {
        return; // Wait for cinemaId to be set by initRBAC
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        // For managers, selectedCinemaId is their assigned cinema
        // For admins, selectedCinemaId can be undefined (all) or a specific cinema
        const [
          statsData,
          revenueRes,
          moviesData,
          cinemasData,
          bookingsData,
          reviewsData,
        ] = await Promise.all([
          getDashboardStats(selectedCinemaId),
          getRevenueReport({ groupBy: 'day', cinemaId: selectedCinemaId }),
          getTopMovies(5, selectedCinemaId),
          getTopCinemas(5, selectedCinemaId),
          getRecentBookings(10, selectedCinemaId),
          getRecentReviews(10, selectedCinemaId),
        ]);

        setStats(statsData);
        setRevenueData(revenueRes);
        setTopMovies(Array.isArray(moviesData) ? moviesData : []);
        setTopCinemas(Array.isArray(cinemasData) ? cinemasData : []);
        setRecentBookings(Array.isArray(bookingsData) ? bookingsData : []);
        setRecentReviews(Array.isArray(reviewsData) ? reviewsData : []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedCinemaId, isAdmin]);

  // Prepare chart data
  const revenueChartData = (revenueData?.revenueByPeriod || []).map(
    (period) => ({
      date: new Date(period.period).toLocaleDateString('vi-VN', {
        month: 'short',
        day: 'numeric',
      }),
      revenue: period.revenue / 1000000, // Convert to millions
      bookings: period.bookingCount,
    })
  );

  const movieChartData = topMovies.map((movie) => ({
    name:
      movie.title.length > 15
        ? movie.title.substring(0, 15) + '...'
        : movie.title,
    value: movie.totalBookings,
  }));

  const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  const statCards = [
    {
      title: 'Tổng số phim',
      value: stats?.totalMovies ?? 0,
      icon: Film,
      change: '+12.5%',
      changeType: 'positive' as const,
      color: 'from-purple-500 to-purple-600',
      href: '/admin/movies',
    },
    {
      title: 'Tổng số rạp',
      value: stats?.totalCinemas ?? 0,
      icon: Building2,
      change: '+8.2%',
      changeType: 'positive' as const,
      color: 'from-blue-500 to-blue-600',
      href: '/admin/cinemas',
    },
    {
      title: 'Suất chiếu hôm nay',
      value: stats?.todayShowtimes ?? 0,
      icon: Calendar,
      change: 'Hoạt động hôm nay',
      changeType: 'neutral' as const,
      color: 'from-emerald-500 to-emerald-600',
      href: '/admin/showtimes',
    },
    {
      title: 'Doanh thu tuần',
      value: `₫${((stats?.weekRevenue ?? 0) / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      change: '+18.7%',
      changeType: 'positive' as const,
      color: 'from-pink-500 to-pink-600',
      href: '/admin/reports',
    },
    {
      title: 'Tổng đặt chỗ',
      value: stats?.totalBookings ?? 0,
      icon: Ticket,
      change: '+24.3%',
      changeType: 'positive' as const,
      color: 'from-amber-500 to-amber-600',
      href: '/admin/reservations',
    },
    {
      title: 'Đánh giá trung bình',
      value: (stats?.averageRating ?? 0).toFixed(1),
      icon: Star,
      change: 'Tuyệt vời',
      changeType: 'positive' as const,
      color: 'from-yellow-500 to-yellow-600',
      href: '/admin/reviews',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Đang tải bảng điều khiển...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium text-lg">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">Welcome back, Admin! 👋</h1>
          <p className="text-purple-100 text-lg">
            Here&apos;s an overview of your cinema business today -{' '}
            {new Date().toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          {/* Cinema Selector for Admins */}
          {isAdmin && (
            <div className="mt-4 w-72">
              <Select
                value={selectedCinemaId || 'all'}
                onValueChange={(value) =>
                  setSelectedCinemaId(value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-full bg-white/10 text-white border-white/20 backdrop-blur-sm">
                  <SelectValue placeholder="All Cinemas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Check All Cinemas</SelectItem>
                  {cinemas.map((cinema) => (
                    <SelectItem key={cinema.id} value={cinema.id}>
                      {cinema.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const isPositive = stat.changeType === 'positive';
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-purple-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className="flex items-center gap-1">
                    {stat.changeType !== 'neutral' &&
                      (isPositive ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      ))}
                    <p
                      className={`text-sm font-medium ${
                        stat.changeType === 'positive'
                          ? 'text-green-600'
                          : stat.changeType === 'neutral'
                          ? 'text-gray-600'
                          : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Bar Chart */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Revenue Overview
            </CardTitle>
            <CardDescription>Daily revenue and booking trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue')
                      return [`₫${value.toFixed(1)}M`, 'Revenue'];
                    return [value, 'Bookings'];
                  }}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#colorRevenue)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={1} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Movies Pie Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-pink-600" />
              Top 5 Movies
            </CardTitle>
            <CardDescription>By total bookings today</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={movieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) =>
                    percent ? `${(percent * 100).toFixed(0)}%` : ''
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {movieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                  formatter={(value: number) => [`${value} seats`, 'Bookings']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Movies List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Top Movies
              </span>
              <Link href="/admin/movies">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Highest performing movies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topMovies.map((movie, index) => (
                <div
                  key={movie.movieId}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{movie.title}</p>
                      <p className="text-xs text-gray-500">
                        {movie.totalBookings} bookings
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">
                    ₫{(movie.totalRevenue / 1000000).toFixed(1)}M
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Cinemas List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Top Cinemas
              </span>
              <Link href="/admin/cinemas">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Best performing locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCinemas.map((cinema, index) => (
                <div
                  key={cinema.cinemaId}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{cinema.name}</p>
                      <p className="text-xs text-gray-500">{cinema.location}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">
                    ₫{(cinema.totalRevenue / 1000000).toFixed(1)}M
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                Recent Reviews
              </span>
              <Link href="/admin/reviews">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Latest customer feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{review.userName}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {review.comment}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {review.movieTitle}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-purple-600" />
              Recent Bookings
            </span>
            <Link href="/admin/reservations">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardTitle>
          <CardDescription>Latest ticket reservations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-semibold">{booking.movieTitle}</p>
                    <Badge
                      variant={
                        booking.status === 'CONFIRMED'
                          ? 'default'
                          : booking.status === 'PENDING'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {booking.cinemaName} • {booking.hallName}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(booking.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-emerald-600">
                    ₫{booking.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {booking.seatCount} seats
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isAdmin && (
              <Link href="/admin/movies">
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-300 transition-all"
                >
                  <Plus className="h-6 w-6" />
                  <span>Thêm phim</span>
                </Button>
              </Link>
            )}
            <Link href="/admin/showtimes">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <Plus className="h-6 w-6" />
                <span>Thêm suất chiếu</span>
              </Button>
            </Link>
            {isAdmin && (
              <Link href="/admin/cinemas">
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col gap-2 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                >
                  <Plus className="h-6 w-6" />
                  <span>Thêm rạp</span>
                </Button>
              </Link>
            )}
            <Link href="/admin/reports">
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col gap-2 hover:bg-pink-50 hover:border-pink-300 transition-all"
              >
                <TrendingUp className="h-6 w-6" />
                <span>Xem báo cáo</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
