'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { Eye, Filter, Trash2, Star } from 'lucide-react';
import { Button } from '@movie-hub/shacdn-ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@movie-hub/shacdn-ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@movie-hub/shacdn-ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { Label } from '@movie-hub/shacdn-ui/label';
import { Input } from '@movie-hub/shacdn-ui/input';
import { useReviews, useDeleteReview, useMovies } from '@/libs/api';

export default function ReviewsPage() {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string>('');
  
  // Filters
  const [filterMovieId, setFilterMovieId] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [page, setPage] = useState(1);

  // API hooks
  const { data: moviesData = [] } = useMovies();
  const movies = useMemo(() => Array.isArray(moviesData) ? moviesData : [], [moviesData]);

  const { data: reviewsData = [], isLoading: loading } = useReviews({
    movieId: filterMovieId === 'all' ? undefined : filterMovieId,
    rating: filterRating === 'all' ? undefined : parseInt(filterRating),
    startDate: filterStartDate || undefined,
    endDate: filterEndDate || undefined,
    page,
  });
  const reviews = useMemo(() => Array.isArray(reviewsData) ? reviewsData : [], [reviewsData]);

  // Create movie map for enrichment
  const movieMap = useMemo(() => {
    const map = new Map<string, string>();
    movies.forEach((movie) => {
      if (movie?.id) {
        map.set(movie.id, movie.title || 'Unknown Movie');
      }
    });
    return map;
  }, [movies]);

  // Enrich reviews with movie titles
  const enrichedReviews = useMemo(() => {
    return reviews.map((review) => {
      const movieTitle = movieMap.get(review.movieId) || 'Unknown Movie';
      
      return {
        ...review,
        movieTitle,
        // userName/userEmail not available from BE, would need user-service integration
        userName: 'User', // Placeholder - BE doesn't return user info
        userEmail: '',
      };
    });
  }, [reviews, movieMap]);

  const selectedReview = enrichedReviews.find(r => r.id === selectedReviewId);
  const deleteReview = useDeleteReview();

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: enrichedReviews.length,
      avgRating: enrichedReviews.length > 0 
        ? (enrichedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / enrichedReviews.length).toFixed(1)
        : 0,
      fiveStars: enrichedReviews.filter(r => r.rating === 5).length,
      fourStars: enrichedReviews.filter(r => r.rating === 4).length,
      threeStars: enrichedReviews.filter(r => r.rating === 3).length,
      twoStars: enrichedReviews.filter(r => r.rating === 2).length,
      oneStars: enrichedReviews.filter(r => r.rating === 1).length,
    };
  }, [enrichedReviews]);

  const handleViewDetail = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setDetailDialogOpen(true);
  };

  const handleDeleteReview = async () => {
    if (!selectedReviewId) return;

    try {
      await deleteReview.mutateAsync(selectedReviewId);
      setDeleteDialogOpen(false);
      setDetailDialogOpen(false);
      setSelectedReviewId('');
    } catch {
      // Error toast already shown by mutation hook
    }
  };

  const handleClearFilters = () => {
    setFilterMovieId('all');
    setFilterRating('all');
    setFilterStartDate('');
    setFilterEndDate('');
    setPage(1);
  };

  const hasActiveFilters = filterMovieId !== 'all' || filterRating !== 'all' || filterStartDate || filterEndDate;

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Đánh Giá</h1>
          <p className="text-gray-500 mt-1">Quản lý bình luận và xếp hạng phim</p>
        </div>
      </div>

      {/* Statistics Cards with Modern Gradient Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700 uppercase tracking-wider">⭐ Tổng Bình Luận</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats.total}</div>
            <p className="text-xs text-purple-600 mt-2 font-medium">
              Trung bình: {stats.avgRating} / 5 sao
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-yellow-700 uppercase tracking-wider">⭐⭐⭐⭐⭐ 5 Sao</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">{stats.fiveStars}</div>
            <p className="text-xs text-yellow-600 mt-2 font-medium">
              {stats.total > 0 ? ((stats.fiveStars / stats.total) * 100).toFixed(0) : 0}% bình luận
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wider">⭐⭐⭐⭐ 4 Sao</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.fourStars}</div>
            <p className="text-xs text-blue-600 mt-2 font-medium">
              {stats.total > 0 ? ((stats.fourStars / stats.total) * 100).toFixed(0) : 0}% bình luận
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-red-700 uppercase tracking-wider">⚠️ Đánh Giá Thấp (1-2⭐)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{stats.oneStars + stats.twoStars}</div>
            <p className="text-xs text-red-600 mt-2 font-medium">
              Cần chú ý
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modern Filter Container */}
      <div className="p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 rounded-lg border border-purple-200/50 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Movie Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">🎬 Phim</label>
            <Select value={filterMovieId} onValueChange={(value) => {
              setFilterMovieId(value);
              setPage(1);
            }}>
              <SelectTrigger className="h-11 border-purple-200 focus:ring-purple-500">
                <SelectValue placeholder="Tất Cả Phim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Phim</SelectItem>
                {movies.map((movie) => (
                  <SelectItem key={movie.id} value={movie.id}>
                    {movie.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">⭐ Đánh Giá</label>
            <Select value={filterRating} onValueChange={(value) => {
              setFilterRating(value);
              setPage(1);
            }}>
              <SelectTrigger className="h-11 border-purple-200 focus:ring-purple-500">
                <SelectValue placeholder="Tất Cả Đánh Giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Đánh Giá</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐ 5 Sao</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ 4 Sao</SelectItem>
                <SelectItem value="3">⭐⭐⭐ 3 Sao</SelectItem>
                <SelectItem value="2">⭐⭐ 2 Sao</SelectItem>
                <SelectItem value="1">⭐ 1 Sao</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">📅 Ngày Bắt Đầu</label>
            <Input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setPage(1);
              }}
              className="h-11 border-purple-200 focus:ring-purple-500"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">📅 Ngày Kết Thúc</label>
            <Input
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setPage(1);
              }}
              className="h-11 border-purple-200 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-purple-200/50">
            {filterMovieId !== 'all' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                <span className="text-xs font-medium text-gray-700">
                  🎬 {movies.find(m => m.id === filterMovieId)?.title}
                </span>
                <button
                  onClick={() => {
                    setFilterMovieId('all');
                    setPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            {filterRating !== 'all' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                <span className="text-xs font-medium text-gray-700">⭐ {filterRating} Stars</span>
                <button
                  onClick={() => {
                    setFilterRating('all');
                    setPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            {filterStartDate && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                <span className="text-xs font-medium text-gray-700">📅 From {filterStartDate}</span>
                <button
                  onClick={() => {
                    setFilterStartDate('');
                    setPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            {filterEndDate && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                <span className="text-xs font-medium text-gray-700">📅 To {filterEndDate}</span>
                <button
                  onClick={() => {
                    setFilterEndDate('');
                    setPage(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors ml-auto"
            >
              Xóa Tất Cả
            </button>
          </div>
        )}
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bình Luận</CardTitle>
          <CardDescription>
            {enrichedReviews.length} bình luận được tìm thấy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-500">Đang tải bình luận...</p>
            </div>
          ) : enrichedReviews.length === 0 ? (
            <div className="text-center py-16">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Không tìm thấy bình luận với bộ lọc hiện tại.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Đánh Giá</TableHead>
                    <TableHead>Phim</TableHead>
                    <TableHead>Người Bình Luận</TableHead>
                    <TableHead>Bình Luận</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating || 0)}
                          <span className="font-medium">{review.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{review.movieTitle}</TableCell>
                      <TableCell>{review.userName || review.userEmail || 'Unknown'}</TableCell>
                      <TableCell className="max-w-lg truncate text-gray-600">{review.content}</TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDate(review.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(review.id)}
                            className="h-8 w-8 p-0"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReviewId(review.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Xóa bình luận"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi Tiết Bình Luận</DialogTitle>
            <DialogDescription>Xem thông tin bình luận đầy đủ</DialogDescription>
          </DialogHeader>

          {selectedReview ? (
            <div className="space-y-4">
              {/* Rating */}
              <div>
                <Label className="text-sm text-gray-500">Đánh Giá</Label>
                <div className="flex items-center gap-3 mt-1">
                  {renderStars(selectedReview.rating || 0)}
                  <span className="font-bold text-lg">{selectedReview.rating}/5</span>
                </div>
              </div>

              {/* Movie & Title */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Phim</Label>
                  <p className="font-medium">{selectedReview.movieTitle}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Tiêu Đề</Label>
                  <p className="font-medium">{selectedReview.title}</p>
                </div>
              </div>

              {/* Reviewer Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Thông Tin Người Bình Luận</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Tên</Label>
                    <p>{selectedReview.userName || 'Ẩn Dành'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Email</Label>
                    <p>{selectedReview.userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Bình Luận</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedReview.content}</p>
              </div>

              {/* Helpful Count */}
              {selectedReview.helpfulCount !== undefined && (
                <div className="border-t pt-4">
                  <Label className="text-sm text-gray-500">Phiếu Bổ Ích</Label>
                  <p className="font-medium">{selectedReview.helpfulCount}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t pt-4 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Tạo Lúc:</span>
                  <span>{formatDate(selectedReview.createdAt)}</span>
                </div>
                {selectedReview.updatedAt && (
                  <div className="flex justify-between">
                    <span>Cập Nhật Lúc:</span>
                    <span>{formatDate(selectedReview.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                setDetailDialogOpen(false);
                setDeleteDialogOpen(true);
              }}
            >
              Xóa Bình Luận
            </Button>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa Bình Luận</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa bình luận này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy Bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReview}
              disabled={deleteReview.isPending}
            >
              {deleteReview.isPending ? 'Đang Xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
