'use client';

export const dynamic = 'force-dynamic';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import { useToast } from '../../admin/_libs/use-toast';
import { useMovieReleases, useDeleteMovieRelease, useMovies, useCinemas, useHallsGroupedByCinema } from '@/libs/api';
import type { MovieRelease } from '@/libs/api';
import type { Movie, Hall } from '@/libs/api/types';
import { format } from 'date-fns';
import MovieReleaseDialog from '../../admin/_components/forms/MovieReleaseDialog';
import ShowtimeDialog from '../../admin/_components/forms/ShowtimeDialog';
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
  const [showtimeDialogOpen, setShowtimeDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<MovieRelease | null>(null);
  const [selectedReleaseForShowtime, setSelectedReleaseForShowtime] = useState<MovieRelease | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const { toast } = useToast();

  // API hooks
  const { data: releasesData = [], isLoading: loading, refetch: refetchReleases } = useMovieReleases();
  const releases = releasesData || [];
  const { data: moviesData = [] } = useMovies();
  const movies = moviesData || [];
  const { data: cinemasData = [] } = useCinemas();
  const cinemas = cinemasData || [];
  const deleteRelease = useDeleteMovieRelease();

  // Halls: derive a flat halls list from grouped halls by cinema
  const { data: hallsByCinema = {} } = useHallsGroupedByCinema();
  const halls: Hall[] = Object.values(hallsByCinema).flatMap((g: unknown) => (g as { halls?: Hall[] }).halls || []);

  const handleEdit = (release: MovieRelease) => {
    setEditingRelease(release);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this release?')) {
      return;
    }

    try {
      await deleteRelease.mutateAsync(id);
    } catch {
      // Error toast already shown by mutation hook
    }
  };

  const getMovieById = (movieId: string) => {
    return movies.find((m: Movie) => m.id === movieId);
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
  const filteredReleases = releases.filter((release: MovieRelease) => {
    const movie = getMovieById(release.movieId);
    const status = getReleaseStatus(release);
    
    // Search by movie name
    const matchSearch = !searchTerm || 
      (movie?.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by status
    const matchStatus = selectedStatus === 'all' || status === selectedStatus;
    
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movie Releases</h1>
          <p className="text-gray-500 mt-1">Manage movie release schedules</p>
        </div>
        <Button
          onClick={() => {
            setEditingRelease(null);
            setDialogOpen(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Release
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>All Releases</CardTitle>
            <CardDescription>
              {filteredReleases.length} of {releases.length} release schedule{releases.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 md:max-w-2xl">
              {/* Search */}
              <div className="flex-1">
                <Input
                  placeholder="Search by movie name..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Filter by Status */}
              <div className="w-full md:w-64">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || selectedStatus !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
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
            {filteredReleases.map((release: MovieRelease) => {
              const movie = getMovieById(release.movieId);
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
                            <span>Edit Release</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger 
                              className={getReleaseStatus(release) === 'ended' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                              disabled={getReleaseStatus(release) === 'ended'}
                            >
                              <Clock className="mr-2 h-4 w-4 text-purple-600" />
                              <span>Showtimes</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  const status = getReleaseStatus(release);
                                  if (status === 'ended') {
                                    toast({
                                      title: 'Cannot Add Showtime',
                                      description: 'Cannot create showtime for ended release',
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
                                <span>Single Showtime</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const status = getReleaseStatus(release);
                                  if (status === 'ended') {
                                    toast({
                                      title: 'Cannot Create Batch',
                                      description: 'Cannot create batch showtimes for ended release',
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
                                <span>Batch Showtimes</span>
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(release.id)}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
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
                        <p className="text-xs text-gray-500 font-medium mb-1">📝 DESCRIPTION</p>
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
        onOpenChange={(open: boolean) => {
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
        onOpenChange={(open: boolean) => {
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
            title: 'Success',
            description: 'Showtime created successfully',
          });
          refetchReleases();
        }}
      />
    </div>
  );
}
