'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Calendar as CalendarIcon, Pencil, Trash2, Film, Clock, Zap } from 'lucide-react';
import { Button } from '@movie-hub/shacdn-ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import { Input } from '@movie-hub/shacdn-ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@movie-hub/shacdn-ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import { useToast } from '../_libs/use-toast';
import { useAdminCinemas, useAdminHallsGroupedByCinema } from '@/features/admin/cinemas';
import { useAdminMovieReleases, useAdminDeleteMovieRelease } from '@/features/admin/movie-releases';
import { useAdminMovies } from '@/features/admin/movies';
import type { MovieRelease } from '@/types';
import type { Hall } from '@/types';
import { format } from 'date-fns';
import MovieReleaseDialog from '../_components/forms/MovieReleaseDialog';
import ShowtimeDialog from '../_components/forms/ShowtimeDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@movie-hub/shacdn-ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

export default function MovieReleasesPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReleaseForDelete, setSelectedReleaseForDelete] = useState<MovieRelease | null>(null);
  const [showtimeDialogOpen, setShowtimeDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<MovieRelease | null>(null);
  const [selectedReleaseForShowtime, setSelectedReleaseForShowtime] = useState<MovieRelease | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const { toast } = useToast();

  // API hooks
  const { data: releasesData = [], isLoading: loading, refetch: refetchReleases } = useAdminMovieReleases();
  const releases = releasesData || [];
  const { data: moviesData = [] } = useAdminMovies();
  const movies = moviesData || [];
  const { data: cinemasData = [] } = useAdminCinemas();
  const cinemas = cinemasData || [];
  const deleteRelease = useAdminDeleteMovieRelease();

  // Halls: derive a flat halls list from grouped halls by cinema
  const { data: hallsByCinema = {} } = useAdminHallsGroupedByCinema();
  const halls: Hall[] = Object.values(hallsByCinema).flatMap((g: unknown) => (g as { halls?: Hall[] }).halls || []);

  const handleEdit = (release: MovieRelease) => {
    setEditingRelease(release);
    setDialogOpen(true);
  };

  const handleDelete = (release: MovieRelease) => {
    setDeleteDialogOpen(true);
    setSelectedReleaseForDelete(release);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReleaseForDelete) return;

    try {
      await deleteRelease.mutateAsync(selectedReleaseForDelete.id);
      setDeleteDialogOpen(false);
      setSelectedReleaseForDelete(null);
    } catch {
      // Error toast already shown by mutation hook
    }
  };

  const getMovieById = (movieId: string, release?: MovieRelease) => {
    // First try to get from page's movies list
    const movieFromList = movies.find(m => m.id === movieId);
    if (movieFromList) return movieFromList;
    
    // If not found and release has enriched movie data, use that
    if (release?.movie) {
      return release.movie;
    }
    
    return undefined;
  };

  const getReleaseStatus = (release: MovieRelease) => {
    // Use status from mock data if available
    if (release.status) {
      return release.status.toLowerCase();
    }
    
    // Otherwise calculate from dates
    const now = new Date();
    const start = new Date(release.startDate);
    const end = new Date(release.endDate);

    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'ended':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Filter releases
  const filteredReleases = releases.filter(release => {
    const movie = getMovieById(release.movieId, release);
    const status = getReleaseStatus(release);
    
    // Search by movie name
    const matchSearch = !searchTerm || 
      (movie?.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by status
    const matchStatus = selectedStatus === 'all' || status === selectedStatus;
    
    // Filter by date range (check if release period intersects with filter range)
    let matchDateRange = true;
    if (dateFrom || dateTo) {
      const releaseStart = new Date(release.startDate);
      const releaseEnd = new Date(release.endDate);
      
      if (dateFrom) {
        const filterFrom = new Date(dateFrom);
        matchDateRange = matchDateRange && releaseEnd >= filterFrom;
      }
      
      if (dateTo) {
        const filterTo = new Date(dateTo);
        matchDateRange = matchDateRange && releaseStart <= filterTo;
      }
    }
    
    return matchSearch && matchStatus && matchDateRange;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Phát Hành Phim</h1>
          <p className="text-gray-500 mt-1">Quản lý lịch phát hành phim</p>
        </div>
        <Button
          onClick={() => {
            setEditingRelease(null);
            setDialogOpen(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm Phát Hành
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tất Cả Phát Hành</CardTitle>
            <CardDescription>
              {filteredReleases.length} trong {releases.length} lịch phát hành
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Single-line Filter Row - All 4 filters in purple box */}
            <div className="p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 rounded-lg border border-purple-200/50 shadow-sm">
              <div className="flex items-end gap-3">
                {/* Search Input */}
                <div className="flex-1 min-w-0">
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Tìm Kiếm</label>
                  <Input
                    placeholder="🔍 Tìm kiếm theo tên phim..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 border-purple-200 focus:border-purple-400 focus:ring-purple-200 bg-white"
                  />
                </div>

                {/* Status Select */}
                <div className="w-48 flex-shrink-0">
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Trạng Thái</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-10 border-purple-200 focus:border-purple-400 bg-white">
                      <SelectValue placeholder="Tất Cả Trạng Thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất Cả Trạng Thái</SelectItem>
                      <SelectItem value="active">Đang Hoạt Động</SelectItem>
                      <SelectItem value="upcoming">Sắp Tới</SelectItem>
                      <SelectItem value="ended">Đã Kết Thúc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* From Date */}
                <div className="w-40 flex-shrink-0">
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Từ Ngày</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full h-10 border-purple-200 focus:border-purple-400 focus:ring-purple-200 bg-white"
                  />
                </div>

                {/* To Date */}
                <div className="w-40 flex-shrink-0">
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Đến Ngày</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full h-10 border-purple-200 focus:border-purple-400 focus:ring-purple-200 bg-white"
                  />
                </div>
              </div>

              {/* Active Filter Tags */}
              {(searchTerm || selectedStatus !== 'all' || dateFrom || dateTo) && (
                <div className="flex flex-wrap gap-2 pt-3 mt-3 border-t border-purple-200/50">
                  {searchTerm && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                      <span className="text-xs text-gray-600">Search: <span className="font-semibold text-purple-700">{searchTerm}</span></span>
                      <button onClick={() => setSearchTerm('')} className="text-purple-400 hover:text-purple-600">✕</button>
                    </div>
                  )}
                  {selectedStatus !== 'all' && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                      <span className="text-xs text-gray-600">Status: <span className="font-semibold text-purple-700">{selectedStatus}</span></span>
                      <button onClick={() => setSelectedStatus('all')} className="text-purple-400 hover:text-purple-600">✕</button>
                    </div>
                  )}
                  {dateFrom && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                      <span className="text-xs text-gray-600">From: <span className="font-semibold text-purple-700">{dateFrom}</span></span>
                      <button onClick={() => setDateFrom('')} className="text-purple-400 hover:text-purple-600">✕</button>
                    </div>
                  )}
                  {dateTo && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-pink-200 shadow-sm">
                      <span className="text-xs text-gray-600">To: <span className="font-semibold text-pink-700">{dateTo}</span></span>
                      <button onClick={() => setDateTo('')} className="text-pink-400 hover:text-pink-600">✕</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || selectedStatus !== 'all' || dateFrom || dateTo) && (
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatus('all');
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                >
                  ✕ Clear All Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-500">Loading releases...</p>
          </div>
        ) : releases.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No movie releases found. Add your first release schedule.</p>
              <Button
                onClick={() => {
                  setEditingRelease(null);
                  setDialogOpen(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Release
              </Button>
            </CardContent>
          </Card>
        ) : filteredReleases.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No releases match your filters.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReleases.map((release) => {
              const movie = getMovieById(release.movieId, release);
              const status = getReleaseStatus(release);
              
              return (
                <Card 
                  key={release.id} 
                  className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0 bg-white"
                >
                  {/* Movie Poster Header */}
                  <div className="relative h-64 overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
                    {movie?.posterUrl ? (
                      <Image 
                        src={movie.posterUrl} 
                        alt={movie.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-24 w-24 text-slate-300" />
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <Badge 
                        className={`${getStatusColor(status)} border-0 shadow-lg backdrop-blur-sm font-semibold px-3 py-1`}
                      >
                        {status === 'active' ? '🎬 Now Showing' : status === 'upcoming' ? '🎭 Coming Soon' : '📼 Ended'}
                      </Badge>
                    </div>

                    {/* Action Menu */}
                    <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            className="h-9 w-9 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 shadow-lg"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem 
                            onClick={() => handleEdit(release)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 h-4 w-4 text-blue-600" />
                            <span>Sửa phát hành</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger 
                              className={getReleaseStatus(release) === 'ended' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                              disabled={getReleaseStatus(release) === 'ended'}
                            >
                              <Clock className="mr-2 h-4 w-4 text-purple-600" />
                              <span>Suất Chiếu</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  const status = getReleaseStatus(release);
                                  if (status === 'ended') {
                                    toast({
                                      title: 'Không Thể Thêm Lịch Chiếu',
                                      description: 'Không thể tạo lịch chiếu cho phát hành đã kết thúc',
                                      variant: 'destructive',
                                    });
                                    return;
                                  }
                                  setSelectedReleaseForShowtime(release);
                                  setShowtimeDialogOpen(true);
                                }}
                                className="cursor-pointer"
                              >
                                <Clock className="mr-2 h-4 w-4 text-green-600" />
                                <span>Lịch Chiếu Riêng</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const status = getReleaseStatus(release);
                                  if (status === 'ended') {
                                    toast({
                                      title: 'Không Thể Tạo Lịch Chiếu Hàng Loạt',
                                      description: 'Không thể tạo lịch chiếu hàng loạt cho phát hành đã kết thúc',
                                      variant: 'destructive',
                                    });
                                    return;
                                  }
                                  // Navigate to batch showtimes page with pre-filled data
                                  router.push(`/admin/batch-showtimes?movieId=${release.movieId}&releaseId=${release.id}`);
                                }}
                                className="cursor-pointer"
                              >
                                <Zap className="mr-2 h-4 w-4 text-orange-600" />
                                <span>Lịch Chiếu Hàng Loạt</span>
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(release)}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Xóa</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Movie Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-bold text-xl text-white drop-shadow-lg line-clamp-2 mb-1">
                        {movie?.title || 'Unknown Movie'}
                      </h3>
                      <div className="flex items-center gap-3 text-white/90 text-sm">
                        <span className="flex items-center gap-1">
                          ⏱️ {movie?.runtime} mins
                        </span>
                        <span className="flex items-center gap-1">
                          🎫 {movie?.ageRating}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-5">
                    {/* Release Period */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="mt-1 p-2 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                        <CalendarIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium mb-1">RELEASE PERIOD</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(release.startDate), 'MMM dd, yyyy')}
                        </p>
                        <div className="flex items-center gap-2 my-1">
                          <div className="h-px flex-1 bg-gradient-to-r from-purple-200 to-pink-200" />
                          <span className="text-xs text-gray-400">to</span>
                          <div className="h-px flex-1 bg-gradient-to-r from-pink-200 to-purple-200" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(release.endDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Release Note */}
                    <div className="relative">
                      <div className="absolute -left-1 top-0 w-1 h-full bg-gradient-to-b from-purple-400 to-pink-400 rounded-full" />
                      <div className="pl-4">
                        <p className="text-xs text-gray-500 font-medium mb-1">📝 MÔ TẢ</p>
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                          {release.note}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Release Dialog */}
      <MovieReleaseDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingRelease(null);
          }
        }}
        movies={movies}
        editingRelease={editingRelease}
        onSuccess={() => {
          refetchReleases();
        }}
      />

      {/* Add Showtime Dialog */}
      <ShowtimeDialog
        open={showtimeDialogOpen}
        onOpenChange={(open) => {
          setShowtimeDialogOpen(open);
          if (!open) {
            setSelectedReleaseForShowtime(null);
          }
        }}
        movies={movies}
        cinemas={cinemas}
        halls={halls}
        preSelectedMovieId={selectedReleaseForShowtime?.movieId}
        preSelectedReleaseId={selectedReleaseForShowtime?.id}
        onSuccess={() => {
          toast({
            title: 'Thành công',
            description: 'Lịch chiếu được tạo thành công',
          });
          refetchReleases();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác Nhận Xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa phát hành &quot;{selectedReleaseForDelete?.note || 'N/A'}&quot;? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedReleaseForDelete(null);
              }}
            >
              Hủy Bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Xóa Phát Hành
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

