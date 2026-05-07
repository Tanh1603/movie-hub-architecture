// src/app/(dashboard)/cinemas/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Star,
  Clock,
  Users,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@movie-hub/shacdn-ui/button';
import { Input } from '@movie-hub/shacdn-ui/input';
import { Card, CardContent } from '@movie-hub/shacdn-ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@movie-hub/shacdn-ui/dropdown-menu';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@movie-hub/shacdn-ui/dialog';
import { Label } from '@movie-hub/shacdn-ui/label';
import { Textarea } from '@movie-hub/shacdn-ui/textarea';
// removed unused toast import
import {
  useCinemas,
  useCreateCinema,
  useUpdateCinema,
  useDeleteCinema,
  useHallsGroupedByCinema,
} from '@/libs/api';
import type { CreateCinemaRequest as ApiCreateCinemaRequest } from '@/libs/api';
import type { Cinema, CreateCinemaRequest } from '@/libs/api/types';

// Preset amenities for quick selection
const PRESET_AMENITIES = [
  { name: 'WiFi', defaultValue: 'Miễn phí' },
  { name: 'Parking', defaultValue: 'Có' },
  { name: 'ATM', defaultValue: 'Có' },
  { name: 'Food Court', defaultValue: 'Có' },
  { name: 'Wheelchair Access', defaultValue: 'Có' },
  { name: 'Baby Care Room', defaultValue: 'Có' },
  { name: 'Restroom', defaultValue: 'Sạch sẽ' },
  { name: 'Concession', defaultValue: 'Bán đầy đủ' },
] as const;

export default function CinemasPage() {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role as string;
  const userCinemaId = user?.publicMetadata?.cinemaId as string | undefined;
  const isManager = userRole === 'CINEMA_MANAGER';

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null);
  const [formData, setFormData] = useState<Partial<CreateCinemaRequest>>({
    name: '',
    address: '',
    city: '',
    district: '',
    phone: '',
    email: '',
    website: '',
    latitude: undefined,
    longitude: undefined,
    description: '',
    amenities: [],
    facilities: {},
    images: [],
    virtualTour360Url: '',
    operatingHours: { open: '', close: '' } as any,
    socialMedia: { facebook: '', instagram: '', twitter: '' } as any,
    timezone: 'Asia/Ho_Chi_Minh',
  });
  // toast not used in this page

  // API hooks
  const { data: cinemasData = [], isLoading: loading } = useCinemas();
  const cinemas = cinemasData || [];
  const { data: hallsByCinema = {} } = useHallsGroupedByCinema();
  const createCinema = useCreateCinema();
  const updateCinema = useUpdateCinema();
  const deleteCinema = useDeleteCinema();

  // Calculate halls count for each cinema - using actual API data
  const getHallsCount = (cinemaId: string) => {
    const hallsForCinema = hallsByCinema[cinemaId]?.halls || [];
    return hallsForCinema.length;
  };

  // Parse operating hours to display format
  const getOperatingHoursDisplay = (cinema: Cinema) => {
    if (!cinema.operatingHours) return '24/7';

    // Check if it's a GenericObject with common patterns
    const hours = cinema.operatingHours as Record<string, string | undefined>;

    // Pattern 1: { mon_sun: "9:00 - 24:00" }
    if (hours.mon_sun) {
      // Check if it's 24/7
      if (
        hours.mon_sun === '0:00 - 24:00' ||
        hours.mon_sun === '00:00 - 24:00'
      ) {
        return '24/7';
      }
      return hours.mon_sun;
    }

    // Pattern 2: { open: "9:00", close: "24:00" }
    if (hours.open && hours.close) {
      return `${hours.open} - ${hours.close}`;
    }

    // Pattern 3: { monday: "9:00-24:00", ... } - show first day
    const firstDay = Object.values(hours)[0];
    if (typeof firstDay === 'string') {
      return firstDay;
    }

    // Default fallback
    return '24/7';
  };

  // Normalize operating hours from DB format to form format (open/close time inputs)
  const normalizeOperatingHours = (hours: any) => {
    if (!hours) return { open: '', close: '' };

    const h = hours as Record<string, any>;

    // Already in open/close format
    if (h.open && h.close) {
      return { open: h.open, close: h.close };
    }

    // Parse from mon_sun format (e.g., "9:00 - 24:00")
    if (h.mon_sun && typeof h.mon_sun === 'string') {
      const parts = h.mon_sun.split(' - ');
      if (parts.length === 2) {
        return {
          open: parts[0].trim(),
          close: parts[1].trim(),
        };
      }
    }

    // Parse from day format (e.g., "9:00-24:00")
    const firstValue = Object.values(h)[0];
    if (typeof firstValue === 'string' && firstValue.includes('-')) {
      const parts = firstValue.split('-');
      if (parts.length === 2) {
        return {
          open: parts[0].trim(),
          close: parts[1].trim(),
        };
      }
    }

    return { open: '', close: '' };
  };

  const handleSubmit = async () => {
    try {
      // Normalize operatingHours back to mon_sun format for API
      const submitData = { ...formData };
      if (formData.operatingHours?.open && formData.operatingHours?.close) {
        submitData.operatingHours = {
          mon_sun: `${formData.operatingHours.open} - ${formData.operatingHours.close}`,
        };
      }

      if (selectedCinema) {
        await updateCinema.mutateAsync({
          id: selectedCinema.id,
          data: submitData,
        });
      } else {
        // ensure API-required fields have defaults
        const apiPayload = {
          ...submitData,
          district: submitData?.district ?? '',
        } as ApiCreateCinemaRequest;
        await createCinema.mutateAsync(apiPayload);
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      // Error toast already shown by mutation hooks
    }
  };

  const handleDelete = async () => {
    if (!selectedCinema) return;
    try {
      await deleteCinema.mutateAsync(selectedCinema.id);
      setDeleteDialogOpen(false);
    } catch {
      // Error toast already shown by mutation hook
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      district: '',
      phone: '',
      email: '',
      website: '',
      latitude: undefined,
      longitude: undefined,
      description: '',
      amenities: [],
      facilities: {},
      images: [],
      virtualTour360Url: '',
      operatingHours: {},
      socialMedia: {},
      timezone: 'Asia/Ho_Chi_Minh',
    });
    setSelectedCinema(null);
  };

  const openEditDialog = (cinema: Cinema) => {
    setSelectedCinema(cinema);
    // Normalize operatingHours to open/close format for the form
    const normalizedHours = normalizeOperatingHours(cinema.operatingHours);
    setFormData({
      name: cinema.name,
      address: cinema.address,
      city: cinema.city,
      district: cinema.district || '',
      phone: cinema.phone || '',
      email: cinema.email || '',
      website: cinema.website || '',
      latitude: cinema.latitude,
      longitude: cinema.longitude,
      description: cinema.description || '',
      amenities: cinema.amenities || [],
      facilities: cinema.facilities || {},
      images: cinema.images || [],
      virtualTour360Url: cinema.virtualTour360Url || '',
      operatingHours: normalizedHours,
      socialMedia: cinema.socialMedia || {},
      timezone: cinema.timezone || 'Asia/Ho_Chi_Minh',
    });
    setDialogOpen(true);
  };

  // Filter cinemas for managers - only show their assigned cinema
  const filteredCinemas = cinemas.filter((cinema) => {
    // Manager can only see their assigned cinema
    if (isManager && userCinemaId && cinema.id !== userCinemaId) {
      return false;
    }
    // Then apply search filter
    return (
      cinema.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cinema.city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
      case 'CLOSED':
        return 'bg-red-100 text-red-700 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Rạp Chiếu Phim
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý các vị trí rạp chiếu phim của bạn trên toàn hệ thống
          </p>
        </div>
        {!isManager && (
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm Rạp
          </Button>
        )}
      </div>

      {/* Search Bar & Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-3 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm rạp theo tên hoặc thành phố..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-purple-200 focus:border-purple-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold mb-1">
              {filteredCinemas.length}
            </div>
            <p className="text-sm text-white/80">Tổng số Rạp</p>
          </CardContent>
        </Card>
      </div>

      {/* Cinemas Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <div className="animate-pulse text-gray-400">Đang tải rạp...</div>
            </CardContent>
          </Card>
        ) : filteredCinemas.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-gray-500">
              Không tìm thấy rạp
            </CardContent>
          </Card>
        ) : (
          filteredCinemas.map((cinema) => (
            <Card
              key={cinema.id}
              className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
            >
              {/* Cinema Image/Header */}
              <div className="relative h-48 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 overflow-hidden">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24" />

                <div className="relative h-full p-6 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <Badge
                      className={`${getStatusColor(cinema.status)} shadow-lg`}
                    >
                      {cinema.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white hover:bg-white/20"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openEditDialog(cinema)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh Sửa
                        </DropdownMenuItem>
                        {!isManager && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCinema(cinema);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                      {cinema.name}
                    </h3>
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span className="drop-shadow">{cinema.city}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cinema Details */}
              <CardContent className="p-6 space-y-4">
                {/* Location */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {cinema.address}
                      </p>
                      <p className="text-gray-500">{cinema.district}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 pt-2 border-t">
                  {cinema.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-purple-600" />
                      <span className="text-gray-700">{cinema.phone}</span>
                    </div>
                  )}
                  {cinema.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-purple-600" />
                      <span className="text-gray-700">{cinema.email}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                  <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-lg text-purple-900">
                        {cinema.rating?.toFixed(1) || '-'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {cinema.totalReviews === 0
                        ? 'No reviews'
                        : `${cinema.totalReviews} reviews`}
                    </p>
                  </div>

                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-bold text-lg text-blue-900">
                        {getHallsCount(cinema.id)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Halls</p>
                  </div>

                  <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-sm text-green-900">
                        {getOperatingHoursDisplay(cinema)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Open</p>
                  </div>
                </div>

                {/* Description */}
                {cinema.description && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {cinema.description}
                    </p>
                  </div>
                )}

                {/* Amenities */}
                {cinema.amenities && cinema.amenities.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex flex-wrap gap-1">
                      {cinema.amenities.slice(0, 3).map((amenity, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {amenity}
                        </Badge>
                      ))}
                      {cinema.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{cinema.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCinema ? 'Chỉnh sửa Rạp' : 'Thêm Rạp Mới'}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết rạp chiếu phim bên dưới
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên Rạp *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Cinestar Quốc Thanh"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa Chỉ *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="271 Nguyễn Trãi"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Thành Phố *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Thành phố Hồ Chí Minh"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">Quận/Huyện</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                  placeholder="Quận 1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Điện Thoại</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="0283 933 3333"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="cinema@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                placeholder="https://cinema.example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Vĩ Độ</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latitude: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="10.762622"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Kinh Độ</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitude: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="106.660172"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Múi Giờ</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                placeholder="Asia/Ho_Chi_Minh"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô Tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter cinema description..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="virtualTour360Url">URL Tour 360 Ảo</Label>
              <Input
                id="virtualTour360Url"
                value={formData.virtualTour360Url}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    virtualTour360Url: e.target.value,
                  })
                }
                placeholder="https://example.com/virtual-tour"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amenities">
                  Tiện Nghi (phân tách bằng dấu phẩy)
                </Label>
                <Input
                  id="amenities"
                  value={formData.amenities?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amenities: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="WiFi, Parking, Food Court"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="images">
                  Hình Ảnh (URL phân tách bằng dấu phẩy)
                </Label>
                <Input
                  id="images"
                  value={formData.images?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      images: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
              </div>
            </div>

            {/* Facilities: dynamic key/value list - Full width */}
            <div className="space-y-2 flex flex-col col-span-full">
              <div className="flex items-center justify-between">
                <Label>Cơ Sở Vật Chất</Label>
                {/* Quick preset amenities dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Chọn Sẵn
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {PRESET_AMENITIES.map((amenity) => (
                      <DropdownMenuItem
                        key={amenity.name}
                        onClick={() => {
                          const fac = {
                            ...(formData.facilities || {}),
                          } as Record<string, any>;
                          // Only add if not already exists
                          if (!fac[amenity.name]) {
                            fac[amenity.name] = amenity.defaultValue;
                            setFormData({ ...formData, facilities: fac });
                          }
                        }}
                      >
                        {amenity.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-2 flex-1">
                {(
                  Object.entries(formData.facilities || {}) as [string, any][]
                ).map(([key, value], idx) => (
                  <div
                    key={key || idx}
                    className="grid grid-cols-[2fr_3fr_auto] gap-2 items-end"
                  >
                    <Input
                      value={key}
                      placeholder="Ví dụ: WiFi, Parking, ATM, Food Court..."
                      onChange={(e) => {
                        const newKey = e.target.value;
                        const fac = {
                          ...(formData.facilities || {}),
                        } as Record<string, any>;
                        // rename key
                        const val = fac[key];
                        delete fac[key];
                        fac[newKey] = val;
                        setFormData({ ...formData, facilities: fac });
                      }}
                    />
                    <Input
                      value={
                        value === undefined || value === null
                          ? ''
                          : String(value)
                      }
                      placeholder="Ví dụ: Có, Không, 10, Miễn phí..."
                      onChange={(e) => {
                        const fac = {
                          ...(formData.facilities || {}),
                        } as Record<string, any>;
                        const parsed = (() => {
                          const v = e.target.value.trim();
                          if (v === 'true') return true;
                          if (v === 'false') return false;
                          const n = Number(v);
                          return Number.isNaN(n) ? v : n;
                        })();
                        fac[key || `key_${idx}`] = parsed;
                        setFormData({ ...formData, facilities: fac });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const fac = {
                          ...(formData.facilities || {}),
                        } as Record<string, any>;
                        delete fac[key];
                        setFormData({ ...formData, facilities: fac });
                      }}
                    >
                      Xóa
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  const fac = { ...(formData.facilities || {}) } as Record<
                    string,
                    any
                  >;
                  // Start with empty key so user can type meaningful names like "WiFi", "Parking", etc.
                  fac[''] = '';
                  setFormData({ ...formData, facilities: fac });
                }}
                className="mt-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm Cơ Sở Vật Chất
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Operating hours: open/close times */}
              <div className="space-y-2">
                <Label>Giờ Hoạt Động</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-sm">Mở Cửa</Label>
                    <Input
                      type="time"
                      value={(formData.operatingHours?.open as string) || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          operatingHours: {
                            ...(formData.operatingHours || {}),
                            open: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Đóng Cửa</Label>
                    <Input
                      type="time"
                      value={(formData.operatingHours?.close as string) || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          operatingHours: {
                            ...(formData.operatingHours || {}),
                            close: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Social media: common fields */}
              <div className="space-y-2">
                <Label>Mạng Xã Hội</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="URL Facebook"
                    value={(formData.socialMedia?.facebook as string) || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialMedia: {
                          ...(formData.socialMedia || {}),
                          facebook: e.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    placeholder="URL Instagram"
                    value={(formData.socialMedia?.instagram as string) || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialMedia: {
                          ...(formData.socialMedia || {}),
                          instagram: e.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    placeholder="URL Twitter / X"
                    value={(formData.socialMedia?.twitter as string) || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        socialMedia: {
                          ...(formData.socialMedia || {}),
                          twitter: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {selectedCinema ? 'Cập nhật' : 'Tạo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa Rạp</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa {selectedCinema?.name}? Hành động này
              không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Hủy bỏ
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
