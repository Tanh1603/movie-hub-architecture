'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
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
import { Label } from '@movie-hub/shacdn-ui/label';
import { Input } from '@movie-hub/shacdn-ui/input';
import { useToast } from '../_libs/use-toast';
import { useGenres, useCreateGenre, useUpdateGenre, useDeleteGenre } from '@/libs/api';
import type { Genre } from '@/libs/api/types';

export default function GenresPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGenreForDelete, setSelectedGenreForDelete] = useState<Genre | null>(null);
  const [editingGenre, setEditingGenre] = useState<Genre | null>(null);
  const [genreSearch, setGenreSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
  });
  const { toast } = useToast();

  // API hooks
  const { data: genresData = [], isLoading: loading, error } = useGenres();
  const genres = genresData || [];
  const createGenre = useCreateGenre();
  const updateGenre = useUpdateGenre();
  const deleteGenre = useDeleteGenre();

  // Show error toast if query fails
  if (error) {
    toast({
      title: 'Error',
      description: 'Failed to fetch genres',
      variant: 'destructive',
    });
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Genre name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingGenre) {
        // Update existing genre
        await updateGenre.mutateAsync({ id: editingGenre.id, data: formData });
      } else {
        // Create new genre
        await createGenre.mutateAsync(formData);
      }
      setDialogOpen(false);
      resetForm();
    } catch {
      // Error toast already shown by mutation hooks
    }
  };

  const handleEdit = (genre: Genre) => {
    setEditingGenre(genre);
    setFormData({
      name: genre.name,
    });
    setDialogOpen(true);
  };

  const handleDelete = (genre: Genre) => {
    setSelectedGenreForDelete(genre);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGenreForDelete) return;

    try {
      await deleteGenre.mutateAsync(selectedGenreForDelete.id);
      setDeleteDialogOpen(false);
      setSelectedGenreForDelete(null);
    } catch {
      // Error toast already shown by mutation hook
    }
  };

  const resetForm = () => {
    setEditingGenre(null);
    setFormData({
      name: '',
    });
  };

  // Filter genres based on search
  const filteredGenres = genres.filter((g: Genre) =>
    g.name.toLowerCase().includes(genreSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thể loại</h1>
          <p className="text-gray-500 mt-1">Quản lý thể loại và danh mục phim</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm Thể Loại
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tất Cả Thể Loại</CardTitle>
            <CardDescription>
              {filteredGenres.length} trong {genres.length} thể loại được tìm thấy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="🔍 Tìm kiếm thể loại theo tên..."
              value={genreSearch}
              onChange={(e) => setGenreSearch(e.target.value)}
              className="w-full h-11 border-gray-200 focus:border-purple-400 focus:ring-purple-200 mb-6"
            />
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-500">Đang tải thể loại...</p>
          </div>
        ) : genres.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Không có thể loại nào. Thêm thể loại đầu tiên để bắt đầu.</p>
              <Button
                onClick={() => {
                  resetForm();
                  setDialogOpen(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm Thể Loại Đầu Tiên
              </Button>
            </CardContent>
          </Card>
        ) : filteredGenres.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Không có thể loại nào khớp với tìm kiếm của bạn.</p>
              <Button
                variant="outline"
                onClick={() => setGenreSearch('')}
              >
                Xóa Tìm Kiếm
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredGenres.map((genre) => (
              <Card 
                key={genre.id} 
                className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-2 hover:border-purple-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Tag className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(genre)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(genre)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-purple-600 transition-colors">
                      {genre.name}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Genre Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGenre ? 'Chỉnh Sửa Thể Loại' : 'Thêm Thể Loại Mới'}</DialogTitle>
            <DialogDescription>
              {editingGenre ? 'Cập nhật thông tin thể loại' : 'Tạo một thể loại phim mới'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên Thể Loại *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="VD: Hành Động, Kinh Dị, Hài Kịch"
                autoFocus
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
            >
              {editingGenre ? 'Cập Nhật Thể Loại' : 'Tạo Thể Loại'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác Nhận Xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa thể loại &quot;{selectedGenreForDelete?.name}&quot;? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedGenreForDelete(null);
              }}
            >
              Hủy Bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Xóa Thể Loại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
