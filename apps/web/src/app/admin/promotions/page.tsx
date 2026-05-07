'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Percent,
  Tag,
  Calendar,
  DollarSign,
  AlertCircle,
  Gift,
  Coins,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
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
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  useTogglePromotionActive,
} from '@/libs/api';
import type {
  Promotion,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  PromotionType,
} from '@/libs/api/types';
import { cn } from '@movie-hub/shacdn-utils';
import { format } from 'date-fns';

const PROMOTION_TYPES = [
  {
    value: 'PERCENTAGE',
    label: 'Phần trăm (%)',
    icon: Percent,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    value: 'FIXED_AMOUNT',
    label: 'Số tiền cố định',
    icon: DollarSign,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    value: 'FREE_ITEM',
    label: 'Tặng quà',
    icon: Gift,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    value: 'POINTS',
    label: 'Điểm tích lũy',
    icon: Coins,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
];

export default function PromotionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string>('');
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null
  );

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState<CreatePromotionRequest>({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE' as PromotionType,
    value: 0,
    minPurchase: 0,
    maxDiscount: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    usageLimit: 100,
    usagePerUser: 1,
    active: true,
  });

  const { toast } = useToast();

  // API hooks
  const { data: promotionsData = [], isLoading: loading } = usePromotions({
    type: filterType !== 'all' ? (filterType as PromotionType) : undefined,
    active: filterActive !== 'all' ? filterActive === 'true' : undefined,
  });

  const promotions = (promotionsData || []) as Promotion[];
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();
  const toggleActive = useTogglePromotionActive();

  const filteredPromotions = promotions.filter(
    (p) =>
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!formData.code || !formData.name || formData.value === undefined) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ các thông tin bắt buộc',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingPromotion) {
        await updatePromotion.mutateAsync({
          id: editingPromotion.id,
          data: formData as UpdatePromotionRequest,
        });
      } else {
        await createPromotion.mutateAsync(formData);
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      // Error handled by mutation hook
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type,
      value: Number(promotion.value),
      minPurchase: promotion.minPurchase ? Number(promotion.minPurchase) : 0,
      maxDiscount: promotion.maxDiscount ? Number(promotion.maxDiscount) : 0,
      validFrom: new Date(promotion.validFrom).toISOString().split('T')[0],
      validTo: new Date(promotion.validTo).toISOString().split('T')[0],
      usageLimit: promotion.usageLimit || 0,
      usagePerUser: promotion.usagePerUser || 1,
      active: promotion.active,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deletePromotion.mutateAsync(deleteConfirmId);
      setDeleteDialogOpen(false);
    } catch {
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActive.mutateAsync(id);
    } catch {
      // Handled by hook
    }
  };

  const resetForm = () => {
    setEditingPromotion(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'PERCENTAGE' as PromotionType,
      value: 0,
      minPurchase: 0,
      maxDiscount: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      usageLimit: 100,
      usagePerUser: 1,
      active: true,
    });
  };

  // Stats
  const stats = {
    total: promotions.length,
    active: promotions.filter((p) => p.active).length,
    expired: promotions.filter((p) => new Date(p.validTo) < new Date()).length,
    usage: promotions.reduce((acc, p) => acc + (p.currentUsage || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Quản Lý Khuyến Mãi
          </h1>
          <p className="text-gray-500 mt-1">
            Tạo và quản lý các chương trình ưu đãi, mã giảm giá
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md transition-all active:scale-95"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm Khuyến Mãi
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-2">
              <Tag className="h-4 w-4" /> Tổng Chương Trình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {stats.total}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Toàn bộ chương trình đã tạo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Đang Hoạt Động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">
              {stats.active}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              Chương trình đang có hiệu lực
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-pink-700 uppercase tracking-wider flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Đã Hết Hạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-900">
              {stats.expired}
            </div>
            <p className="text-xs text-pink-600 mt-1">
              Chương trình đã qua ngày kết thúc
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700 uppercase tracking-wider flex items-center gap-2">
              <Percent className="h-4 w-4" /> Tổng Lượt Sử Dụng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {stats.usage}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Số lần mã được áp dụng thành công
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm theo mã hoặc tên khuyến mãi..."
            className="pl-9 h-11 border-gray-200 focus:ring-purple-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-11 border-gray-200">
            <SelectValue placeholder="Tất cả loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {PROMOTION_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="h-11 border-gray-200">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Đang hoạt động</SelectItem>
            <SelectItem value="false">Ngừng hoạt động</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Section */}
      <Card className="border-none shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Mã / Tên
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Loại & Giá Trị
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Thời Gian
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Sử Dụng
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && promotions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                    <p className="mt-2">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    Không tìm thấy khuyến mãi nào
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((p) => {
                  const typeInfo = PROMOTION_TYPES.find(
                    (t) => t.value === p.type
                  );
                  const Icon = typeInfo?.icon || Tag;
                  const isExpired = new Date(p.validTo) < new Date();

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                            {p.code}
                          </span>
                          <span className="text-sm text-gray-500">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn('p-2 rounded-lg', typeInfo?.bg)}>
                            <Icon className={cn('h-4 w-4', typeInfo?.color)} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {p.type === 'PERCENTAGE'
                                ? `${p.value}%`
                                : `${Number(p.value).toLocaleString()}đ`}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                              {typeInfo?.label}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(p.validFrom), 'dd/MM/yyyy')}
                          </span>
                          <span
                            className={cn(
                              'flex items-center gap-1',
                              isExpired
                                ? 'text-red-500 font-medium'
                                : 'text-gray-400'
                            )}
                          >
                            đến {format(new Date(p.validTo), 'dd/MM/yyyy')}
                            {isExpired && ' (Hết hạn)'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-900">
                              {p.currentUsage}
                            </span>
                            <span className="text-gray-300">/</span>
                            <span className="text-sm text-gray-500">
                              {p.usageLimit || '∞'}
                            </span>
                          </div>
                          <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all',
                                p.usageLimit &&
                                  p.currentUsage / p.usageLimit > 0.9
                                  ? 'bg-red-500'
                                  : 'bg-purple-600'
                              )}
                              style={{
                                width: p.usageLimit
                                  ? `${Math.min(
                                      (p.currentUsage / p.usageLimit) * 100,
                                      100
                                    )}%`
                                  : '10%',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(p.id)}
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-bold transition-all border',
                            p.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          )}
                        >
                          {p.active ? '● Hoạt động' : '○ Tạm dừng'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleEdit(p)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {editingPromotion ? 'Chỉnh Sửa Khuyến Mãi' : 'Tạo Khuyến Mãi Mới'}
            </DialogTitle>
            <DialogDescription>
              Vui lòng điền đầy đủ các thông tin chi tiết cho chương trình
              khuyến mãi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-700 font-semibold">
                  Mã Khuyến Mãi *
                </Label>
                <Input
                  id="code"
                  placeholder="Vd: CHAOMUNG2024"
                  className="uppercase font-bold tracking-widest text-purple-600 border-gray-200 focus:border-purple-500"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-semibold">
                  Tên Chương Trình *
                </Label>
                <Input
                  id="name"
                  placeholder="Vd: Ưu đãi đầu năm"
                  className="border-gray-200 focus:border-purple-500"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-700 font-semibold">
                  Loại Khuyến Mãi
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, type: v as PromotionType })
                  }
                >
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROMOTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="value"
                    className="text-gray-700 font-semibold"
                  >
                    Giá Trị Giảm *
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    className="border-gray-200 focus:border-purple-500"
                    placeholder={formData.type === 'PERCENTAGE' ? '%' : 'VND'}
                    value={formData.value || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        value: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="maxDiscount"
                    className="text-gray-700 font-semibold"
                  >
                    Giảm Tối Đa
                  </Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    className="border-gray-200 focus:border-purple-500"
                    placeholder="VND"
                    disabled={formData.type !== 'PERCENTAGE'}
                    value={formData.maxDiscount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDiscount: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="minPurchase"
                  className="text-gray-700 font-semibold"
                >
                  Giá Trị Đơn Tối Thiểu
                </Label>
                <Input
                  id="minPurchase"
                  type="number"
                  className="border-gray-200 focus:border-purple-500"
                  placeholder="VND"
                  value={formData.minPurchase || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minPurchase: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="validFrom"
                    className="text-gray-700 font-semibold"
                  >
                    Ngày Bắt Đầu
                  </Label>
                  <Input
                    id="validFrom"
                    type="date"
                    className="border-gray-200 focus:border-purple-500"
                    value={String(formData.validFrom)}
                    onChange={(e) =>
                      setFormData({ ...formData, validFrom: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="validTo"
                    className="text-gray-700 font-semibold"
                  >
                    Ngày Kết Thúc
                  </Label>
                  <Input
                    id="validTo"
                    type="date"
                    className="border-gray-200 focus:border-purple-500 text-red-600"
                    value={String(formData.validTo)}
                    onChange={(e) =>
                      setFormData({ ...formData, validTo: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="usageLimit"
                    className="text-gray-700 font-semibold"
                  >
                    Tổng Giới Hạn
                  </Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    className="border-gray-200 focus:border-purple-500"
                    placeholder="Vd: 500"
                    value={formData.usageLimit || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usageLimit: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="usagePerUser"
                    className="text-gray-700 font-semibold"
                  >
                    Lần/Khách Hàng
                  </Label>
                  <Input
                    id="usagePerUser"
                    type="number"
                    className="border-gray-200 focus:border-purple-500"
                    placeholder="Vd: 1"
                    value={formData.usagePerUser || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usagePerUser: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-gray-700 font-semibold"
                >
                  Mô Tả
                </Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết chương trình..."
                  rows={4}
                  className="border-gray-200 focus:border-purple-500"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                />
                <Label
                  htmlFor="active"
                  className="text-gray-700 font-semibold cursor-pointer"
                >
                  Kích hoạt chương trình ngay
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t pt-6">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white min-w-[120px]"
              disabled={createPromotion.isPending || updatePromotion.isPending}
            >
              {createPromotion.isPending || updatePromotion.isPending ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2" />
              ) : null}
              {editingPromotion ? 'Lưu Thay Đổi' : 'Tạo Khuyến Mãi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-6 w-6" /> Xác Nhận Xóa
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              Bạn có chắc chắn muốn xóa chương trình khuyến mãi này không? Thao
              tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletePromotion.isPending}
            >
              {deletePromotion.isPending && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2" />
              )}
              Xác Nhận Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
