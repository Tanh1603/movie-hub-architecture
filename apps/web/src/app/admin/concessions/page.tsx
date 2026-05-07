'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ShoppingBag, Package, AlertCircle } from 'lucide-react';
import { Button } from '@movie-hub/shacdn-ui/button';
import {
  Card,
  CardContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { Label } from '@movie-hub/shacdn-ui/label';
import { Input } from '@movie-hub/shacdn-ui/input';
import { Textarea } from '@movie-hub/shacdn-ui/textarea';
import { useToast } from '../_libs/use-toast';
import {
  useConcessions,
  useCreateConcession,
  useUpdateConcession,
  useDeleteConcession,
  useCinemas,
} from '@/libs/api';
import type {
  Concession,
  CreateConcessionRequest,
  UpdateConcessionRequest,
  ConcessionCategory,
} from '@/libs/api/types';

const CATEGORIES: { value: ConcessionCategory | string; label: string; icon: string }[] = [
  { value: 'FOOD', label: 'Thức Ăn', icon: '🍿' },
  { value: 'DRINK', label: 'Đồ Uống', icon: '🥤' },
  { value: 'COMBO', label: 'Combo', icon: '🍔' },
  { value: 'MERCHANDISE', label: 'Hàng Hóa', icon: '🎁' },
];

export default function ConcessionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string>('');
  const [editingConcession, setEditingConcession] = useState<Concession | null>(null);
  const [filterCinemaId, setFilterCinemaId] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAvailable, setFilterAvailable] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    category: 'FOOD',
    price: 0,
    imageUrl: '',
    available: true,
    inventory: 0,
    cinemaId: '',
    allergens: [] as string[],
  });
  const { toast } = useToast();

  // API hooks
  const { data: cinemasData = [] } = useCinemas();
  const cinemas = Array.isArray(cinemasData) ? cinemasData : [];

  const { data: concessionsData = [], isLoading: loading, error } = useConcessions({
    cinemaId: filterCinemaId !== 'all' ? filterCinemaId : undefined,
    category: filterCategory !== 'all' ? (filterCategory as ConcessionCategory) : undefined,
    available: filterAvailable !== 'all' ? filterAvailable === 'true' : undefined,
  });
  const concessions = concessionsData || [];

  const createConcession = useCreateConcession();
  const updateConcession = useUpdateConcession();
  const deleteConcession = useDeleteConcession();

  // Show error toast if query fails
  if (error) {
    toast({
      title: 'Lỗi',
      description: 'Không thể tải danh sách mặt hàng',
      variant: 'destructive',
    });
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Tên là bắt buộc',
        variant: 'destructive',
      });
      return;
    }

    if (formData.price < 0) {
      toast({
        title: 'Lỗi',
        description: 'Giá không thể âm',
        variant: 'destructive',
      });
      return;
    }

    if (formData.inventory !== undefined && formData.inventory < 0) {
      toast({
        title: 'Lỗi',
        description: 'Tồn kho không thể âm',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingConcession) {
        const updateData: UpdateConcessionRequest = {
          name: formData.name,
          nameEn: formData.nameEn || undefined,
          description: formData.description || undefined,
          category: formData.category as ConcessionCategory,
          price: formData.price,
          imageUrl: formData.imageUrl || undefined,
          available: formData.available,
          inventory: formData.inventory,
          cinemaId: formData.cinemaId || undefined,
          allergens: formData.allergens.length > 0 ? formData.allergens : undefined,
        };
        await updateConcession.mutateAsync({ id: editingConcession.id, data: updateData });
      } else {
        const createData: CreateConcessionRequest = {
          name: formData.name,
          nameEn: formData.nameEn || undefined,
          description: formData.description || undefined,
          category: formData.category as ConcessionCategory,
          price: formData.price,
          imageUrl: formData.imageUrl || undefined,
          available: formData.available,
          inventory: formData.inventory,
          cinemaId: formData.cinemaId || undefined,
          allergens: formData.allergens.length > 0 ? formData.allergens : undefined,
        };
        await createConcession.mutateAsync(createData);
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      // Error toast already shown by mutation hooks
    }
  };

  const handleEdit = (concession: Concession) => {
    setEditingConcession(concession);
    setFormData({
      name: concession.name,
      nameEn: concession.nameEn || '',
      description: concession.description || '',
      category: concession.category as string,
      price: concession.price,
      imageUrl: concession.imageUrl || '',
      available: concession.available,
      inventory: concession.inventory || 0,
      cinemaId: concession.cinemaId ? concession.cinemaId : 'all',
      allergens: concession.allergens || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await deleteConcession.mutateAsync(deleteConfirmId);
      setDeleteDialogOpen(false);
      setDeleteConfirmId('');
    } catch {
      // Error toast already shown by mutation hook
      setDeleteDialogOpen(false);
      setDeleteConfirmId('');
    }
  };

  const resetForm = () => {
    setEditingConcession(null);
    setFormData({
      name: '',
      nameEn: '',
      description: '',
      category: 'FOOD',
      price: 0,
      imageUrl: '',
      available: true,
      inventory: 0,
      cinemaId: 'all',
      allergens: [],
    });
  };

  const getCategoryBadgeColor = (category: ConcessionCategory | string) => {
    switch (category) {
      case 'FOOD':
        return 'bg-orange-100 text-orange-800';
      case 'DRINK':
        return 'bg-blue-100 text-blue-800';
      case 'COMBO':
        return 'bg-purple-100 text-purple-800';
      case 'MERCHANDISE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const stats = {
    total: concessions.length,
    available: concessions.filter((c: Concession) => c.available).length,
    unavailable: concessions.filter((c: Concession) => !c.available).length,
    food: concessions.filter((c: Concession) => String(c.category) === 'FOOD').length,
    drink: concessions.filter((c: Concession) => String(c.category) === 'DRINK').length,
    combo: concessions.filter((c: Concession) => String(c.category) === 'COMBO').length,
    merchandise: concessions.filter((c: Concession) => String(c.category) === 'MERCHANDISE').length,
    totalValue: concessions.reduce((sum: number, c: Concession) => sum + (c.price * (c.inventory || 0)), 0),
    avgPrice: concessions.length > 0 ? concessions.reduce((sum: number, c: Concession) => sum + c.price, 0) / concessions.length : 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản Lý Bán Hàng Bổ Sung</h1>
          <p className="text-gray-500 mt-1">Quản lý thức ăn, đồ uống và hàng hóa</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm Mặt Hàng
        </Button>
      </div>

      {/* Statistics Cards with Modern Gradient Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700 uppercase tracking-wider">📦 Tổng Mặt Hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{stats.total}</div>
            <p className="text-xs text-purple-600 mt-2 font-medium">
              {stats.available} có sẵn · {stats.unavailable} không có sẵn
            </p>
          </CardContent>
        </Card>

        {/* Category Breakdown Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wider">🎯 Theo Loại</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.food + stats.drink + stats.combo + stats.merchandise}</div>
            <p className="text-xs text-blue-600 mt-2 font-medium">
              🍿{stats.food} 🥤{stats.drink} 🍔{stats.combo} 🎁{stats.merchandise}
            </p>
          </CardContent>
        </Card>

        {/* Inventory Value Card */}
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-pink-700 uppercase tracking-wider">💰 Giá Trị Tồn Kho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-900">₫{(stats.totalValue / 1000).toFixed(1)}K</div>
            <p className="text-xs text-pink-600 mt-2 font-medium">
              Giá trị tồn kho toàn bộ
            </p>
          </CardContent>
        </Card>

        {/* Average Price Card */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200/60 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">💵 Giá Trung Bình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">₫{(stats.avgPrice / 1000).toFixed(1)}K</div>
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              Mỗi mặt hàng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modern Filter Container */}
      <div className="p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 rounded-lg border border-purple-200/50 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          {/* Cinema Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">🏢 Rạp</label>
            <Select value={filterCinemaId} onValueChange={setFilterCinemaId}>
              <SelectTrigger className="h-11 border-purple-200 focus:ring-purple-500">
                <SelectValue placeholder="Tất Cả Rạp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Rạp</SelectItem>
                {cinemas.map((cinema) => (
                  <SelectItem key={cinema.id} value={cinema.id}>
                    {cinema.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">🎯 Danh Mục</label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-11 border-purple-200 focus:ring-purple-500">
                <SelectValue placeholder="Tất Cả Danh Mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Danh Mục</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Availability Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">✅ Tính Sẵn Có</label>
            <Select value={filterAvailable} onValueChange={setFilterAvailable}>
              <SelectTrigger className="h-11 border-purple-200 focus:ring-purple-500">
                <SelectValue placeholder="Tất Cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Mặt Hàng</SelectItem>
                <SelectItem value="true">✅ Sẵn Có</SelectItem>
                <SelectItem value="false">❌ Không Sẵn Có</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(filterCinemaId !== 'all' || filterCategory !== 'all' || filterAvailable !== 'all') && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-purple-200/50">
            {filterCinemaId !== 'all' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                <span className="text-xs font-medium text-gray-700">
                  🏢 {cinemas.find(c => c.id === filterCinemaId)?.name}
                </span>
                <button
                  onClick={() => setFilterCinemaId('all')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            {filterCategory !== 'all' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                <span className="text-xs font-medium text-gray-700">
                  {CATEGORIES.find(c => c.value === filterCategory)?.icon} {CATEGORIES.find(c => c.value === filterCategory)?.label}
                </span>
                <button
                  onClick={() => setFilterCategory('all')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            {filterAvailable !== 'all' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-purple-200 shadow-sm">
                <span className="text-xs font-medium text-gray-700">
                  {filterAvailable === 'true' ? '✅ Sẵn Có' : '❌ Không Sẵn Có'}
                </span>
                <button
                  onClick={() => setFilterAvailable('all')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setFilterCinemaId('all');
                setFilterCategory('all');
                setFilterAvailable('all');
              }}
              className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors ml-auto"
            >
              Xóa Tất Cả
            </button>
          </div>
        )}
      </div>

      {/* Concessions Grid Cards */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Mặt Hàng Bổ Sung</h2>
            <p className="text-sm text-gray-600">
              {concessions.length} mặt hàng sẵn có
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-500">Đang tải mặt hàng bổ sung...</p>
          </div>
        ) : concessions.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
            <ShoppingBag className="h-16 w-16 text-purple-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4 font-medium">Không tìm thấy mặt hàng bổ sung.</p>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm Mặt Hàng Đầu Tiên
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {concessions.map((concession: Concession) => {
              const category = CATEGORIES.find((c) => c.value === concession.category);
              const isLowStock = concession.inventory !== undefined && concession.inventory < 10 && concession.inventory > 0;
              const isOutOfStock = concession.inventory === 0;
              
              return (
                <div
                  key={concession.id}
                  className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                >
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/0 via-transparent to-pink-50/0 group-hover:from-purple-50 group-hover:to-pink-50/50 transition-all duration-300 pointer-events-none"></div>

                  {/* Image Section */}
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {concession.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={concession.imageUrl}
                        alt={concession.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 right-2">
                      {isOutOfStock ? (
                        <div className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Hết Hàng
                        </div>
                      ) : isLowStock ? (
                        <div className="bg-orange-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Hàng Sắp Hết
                        </div>
                      ) : (
                        <div className="bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg">
                          Còn Hàng
                        </div>
                      )}
                    </div>

                    {/* Category Badge - Top Left */}
                    <div className="absolute top-2 left-2">
                      <div className={`${getCategoryBadgeColor(concession.category)} px-3 py-1 rounded-full text-xs font-semibold shadow-md`}>
                        {category?.icon} {category?.label}
                      </div>
                    </div>

                    {/* Availability Indicator */}
                    {!concession.available && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Không Sẵn Có</span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="relative p-4 space-y-3">
                    {/* Name & English Name */}
                    <div>
                      <h3 className="font-bold text-gray-900 text-base line-clamp-2">{concession.name}</h3>
                      {concession.nameEn && (
                        <p className="text-xs text-gray-500">{concession.nameEn}</p>
                      )}
                    </div>

                    {/* Description */}
                    {concession.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">{concession.description}</p>
                    )}

                    {/* Price Section */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-baseline justify-between">
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          ₫{(concession.price / 1000).toFixed(0)}K
                        </span>
                        <span className="text-xs text-gray-500">Giá</span>
                      </div>
                    </div>

                    {/* Inventory Bar */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">Tồn Kho</span>
                        <span className="text-xs font-bold text-gray-900">
                          {concession.inventory || 0} chiếc
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            concession.inventory === 0
                              ? 'bg-red-500'
                              : concession.inventory && concession.inventory < 10
                                ? 'bg-orange-500'
                                : 'bg-gradient-to-r from-green-400 to-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min((((concession.inventory || 0) / 50) * 100), 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Cinema Info */}
                    <div className="pt-1 text-xs text-gray-600">
                      <span className="font-semibold">
                        {concession.cinemaId
                          ? cinemas.find((c) => c.id === concession.cinemaId)?.name
                          : 'All Cinemas'}
                      </span>
                    </div>

                    {/* Allergens if present */}
                    {concession.allergens && concession.allergens.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {concession.allergens.slice(0, 2).map((allergen, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full"
                          >
                            ⚠ {allergen}
                          </span>
                        ))}
                        {concession.allergens.length > 2 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                            +{concession.allergens.length - 2} cái khác
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Bottom */}
                  <div className="relative px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(concession)}
                      className="flex-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Chỉnh Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(concession.id)}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConcession ? 'Chỉnh Sửa Mặt Hàng' : 'Thêm Mặt Hàng Bổ Sung'}
            </DialogTitle>
            <DialogDescription>
              {editingConcession ? 'Cập nhật thông tin mặt hàng' : 'Thêm mặt hàng bổ sung mới vào hệ thống'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                placeholder="Ví dụ: Ngô Lắn"
              />
            </div>

            {/* Name English */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nameEn" className="text-right">
                Tên (Anh)
              </Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="col-span-3"
                placeholder="Tên tiếng Anh tùy chọn"
              />
            </div>

            {/* Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Mô Tả
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                placeholder="Mô tả mặt hàng"
                rows={3}
              />
            </div>

            {/* Category & Price */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Danh Mục *
              </Label>
              <div className="col-span-3 grid grid-cols-2 gap-4">
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="price"
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="Giá (₫)"
                  min="0"
                />
              </div>
            </div>

            {/* Image URL */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">
                URL Hình ảnh
              </Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="col-span-3"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Cinema */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cinemaId" className="text-right">
                Rạp
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.cinemaId}
                  onValueChange={(value) => setFormData({ ...formData, cinemaId: value === 'all' ? '' : value })}
                >
                  <SelectTrigger id="cinemaId">
                    <SelectValue placeholder="Tất cả rạp (thẮa trống)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất Cả Rạp</SelectItem>
                    {cinemas.map((cinema) => (
                      <SelectItem key={cinema.id} value={cinema.id}>
                        {cinema.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Để trắng &quot;Tất Cả Rạp&quot; để có sẵn trong tất cả rạp
                </p>
              </div>
            </div>

            {/* Inventory & Available */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="inventory" className="text-right">
                Tồn Kho
              </Label>
              <div className="col-span-3 grid grid-cols-2 gap-4">
                <Input
                  id="inventory"
                  type="number"
                  value={formData.inventory || ''}
                  onChange={(e) => setFormData({ ...formData, inventory: parseInt(e.target.value) || 0 })}
                  placeholder="Số lượng tồn kho"
                  min="0"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.available}
                    onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="available" className="cursor-pointer">
                    Sẵn có để bán
                  </Label>
                </div>
              </div>
            </div>

            {/* Allergens */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="allergens" className="text-right">
                Chất Gây Dị Ứng
              </Label>
              <Input
                id="allergens"
                value={formData.allergens.join(', ')}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  allergens: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="col-span-3"
                placeholder="Ví dụ: hạt, sữa, lúa mì (phân tách bằng dấu phẩy)"
              />
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
              Hủy Bỏ
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
              disabled={createConcession.isPending || updateConcession.isPending || !formData.name.trim() || formData.price < 0}
            >
              {createConcession.isPending || updateConcession.isPending ? 'Đang Lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác Nhận Xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa mặt hàng này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmId('');
              }}
            >
              Hủy Bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteConcession.isPending}
            >
              {deleteConcession.isPending ? 'Đang Xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
