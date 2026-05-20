'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  Search,
  RotateCcw,
  Save,
  Info,
  ShieldCheck,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '@movie-hub/shacdn-ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@movie-hub/shacdn-ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@movie-hub/shacdn-ui/tabs';
import { Switch } from '@movie-hub/shacdn-ui/switch';
import { Input } from '@movie-hub/shacdn-ui/input';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { toast } from 'sonner';
import {
  useRbacRoles,
  useRbacPermissions,
  useUpdateRolePermissions,
  useStaff,
  useAssignUserRole,
  useRemoveUserRole,
} from '@/features/admin/shared/api-hooks';
import type { PermissionView } from '@/types';

// Constants matching our RBAC domains
const RESOURCE_DESCRIPTIONS: Record<string, string> = {
  movie: 'Quản lý thông tin phim, thể loại và đánh giá phim.',
  cinema: 'Cấu hình rạp chiếu, phòng chiếu, lịch chiếu và giá vé.',
  booking: 'Quản lý đơn đặt vé, thanh toán, hoàn tiền và concessions.',
  user: 'Quản lý tài khoản khách hàng và phân quyền hệ thống.',
  staff: 'Quản lý thông tin nhân sự và ca làm việc.',
  system: 'Cấu hình hệ thống, tham số vận hành toàn cục.',
};

const ACTION_LABELS: Record<string, string> = {
  manage: 'Quản trị (Tất cả)',
  create: 'Tạo mới',
  read: 'Xem chi tiết',
  update: 'Cập nhật',
  delete: 'Xóa bỏ',
  view: 'Xem danh sách',
  cancel: 'Hủy đơn',
  pay: 'Thực hiện thanh toán',
  refund: 'Hoàn tiền',
};

export default function RbacPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'users'>('matrix');
  const [selectedRole, setSelectedRole] = useState<string>('STAFF');
  const [permissionSearch, setPermissionSearch] = useState<string>('');
  const [staffSearch, setStaffSearch] = useState<string>('');

  // Loaded permissions state for local editing before save
  const [dirtyPermissions, setDirtyPermissions] = useState<
    Record<string, string[]>
  >({});

  // Loaded staff roles state for local editing before save (userId -> newRole)
  const [dirtyStaffRoles, setDirtyStaffRoles] = useState<
    Record<string, string>
  >({});
  const [isSavingStaffRoles, setIsSavingStaffRoles] = useState(false);

  // API Queries
  const { data: roles = [], isLoading: isLoadingRoles } = useRbacRoles();
  const { data: allPermissions = [], isLoading: isLoadingPermissions } =
    useRbacPermissions();
  const { data: staffList = [], isLoading: isLoadingStaff } = useStaff();

  // Mutations
  const updateRolePermissions = useUpdateRolePermissions();
  const assignUserRole = useAssignUserRole();
  const removeUserRole = useRemoveUserRole();

  // Helper to get active permissions for selected role (either dirty state or api state)
  const currentRolePermissions = useMemo(() => {
    if (dirtyPermissions[selectedRole] !== undefined) {
      return dirtyPermissions[selectedRole];
    }
    const roleObj = roles.find((r) => r.role === selectedRole);
    return roleObj?.permissions || [];
  }, [selectedRole, roles, dirtyPermissions]);

  const isDirty = useMemo(() => {
    if (dirtyPermissions[selectedRole] === undefined) return false;
    const apiRoleObj = roles.find((r) => r.role === selectedRole);
    const apiPerms = [...(apiRoleObj?.permissions || [])].sort().join(',');
    const dirtyPerms = [...dirtyPermissions[selectedRole]].sort().join(',');
    return apiPerms !== dirtyPerms;
  }, [selectedRole, roles, dirtyPermissions]);

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, PermissionView[]> = {};
    const filtered = allPermissions.filter((p) => {
      const search = permissionSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(search) ||
        p.resource.toLowerCase().includes(search) ||
        p.action.toLowerCase().includes(search)
      );
    });

    filtered.forEach((p) => {
      if (!groups[p.resource]) {
        groups[p.resource] = [];
      }
      groups[p.resource].push(p);
    });

    return groups;
  }, [allPermissions, permissionSearch]);

  // Filter staff based on search query
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const search = staffSearch.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search) ||
        s.phone.toLowerCase().includes(search) ||
        String(s.position).toLowerCase().includes(search)
      );
    });
  }, [staffList, staffSearch]);

  const handleTogglePermission = (permissionName: string, enabled: boolean) => {
    let nextPerms = [...currentRolePermissions];
    if (enabled) {
      if (!nextPerms.includes(permissionName)) {
        nextPerms.push(permissionName);
      }
    } else {
      nextPerms = nextPerms.filter((p) => p !== permissionName);
    }

    setDirtyPermissions({
      ...dirtyPermissions,
      [selectedRole]: nextPerms,
    });
  };

  const handleReset = () => {
    const nextDirty = { ...dirtyPermissions };
    delete nextDirty[selectedRole];
    setDirtyPermissions(nextDirty);
    toast.info('Đã khôi phục cài đặt gốc của vai trò');
  };

  const handleSave = async () => {
    try {
      await updateRolePermissions.mutateAsync({
        role: selectedRole,
        permissions: currentRolePermissions,
      });
      // Clear dirty state for this role on success
      const nextDirty = { ...dirtyPermissions };
      delete nextDirty[selectedRole];
      setDirtyPermissions(nextDirty);
    } catch {
      // toast shown in hook
    }
  };

  const handleRoleChange = (
    userId: string,
    newRole: string,
    originalRole: string
  ) => {
    if (newRole === originalRole) {
      const nextDirty = { ...dirtyStaffRoles };
      delete nextDirty[userId];
      setDirtyStaffRoles(nextDirty);
    } else {
      setDirtyStaffRoles({
        ...dirtyStaffRoles,
        [userId]: newRole,
      });
    }
  };

  const handleResetStaffRoles = () => {
    setDirtyStaffRoles({});
    toast.info('Đã hủy bỏ các thay đổi phân vai trò nhân viên');
  };

  const handleSaveStaffRoles = async () => {
    setIsSavingStaffRoles(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const updatePromises = Object.entries(dirtyStaffRoles).map(
        async ([userId, newRole]) => {
          const staffMember = staffList.find((s) => s.id === userId);
          const originalRole = staffMember ? String(staffMember.position) : '';

          try {
            // Step 1: Remove current role if exists
            if (originalRole) {
              await removeUserRole.mutateAsync({ userId, role: originalRole });
            }
            // Step 2: Assign new role
            await assignUserRole.mutateAsync({ userId, role: newRole });
            successCount++;
          } catch {
            failCount++;
          }
        }
      );

      await Promise.all(updatePromises);

      if (successCount > 0) {
        toast.success(
          `Đã cập nhật vai trò thành công cho ${successCount} nhân viên`
        );
      }
      if (failCount > 0) {
        toast.error(`Thao tác thất bại cho ${failCount} nhân viên`);
      }

      setDirtyStaffRoles({});
    } catch {
      toast.error('Có lỗi xảy ra khi lưu thay đổi vai trò');
    } finally {
      setIsSavingStaffRoles(false);
    }
  };

  const isStaffDirty = useMemo(
    () => Object.keys(dirtyStaffRoles).length > 0,
    [dirtyStaffRoles]
  );

  const isLoading = isLoadingRoles || isLoadingPermissions || isLoadingStaff;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 rounded-xl text-purple-600">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              Phân Quyền Hệ Thống{' '}
              <Badge className="ml-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold border-0">
                RBAC
              </Badge>
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              Quản trị ma trận bảo mật, tùy chỉnh chi tiết quyền hạn vai trò và
              kiểm soát truy cập nhân viên.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-12">
          <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
          <p className="text-gray-500 font-medium text-sm">
            Đang tải cấu hình ma trận bảo mật...
          </p>
        </div>
      ) : (
        <Tabs
          defaultValue="matrix"
          className="w-full space-y-6"
          onValueChange={(v) => setActiveTab(v as any)}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
            <TabsList className="bg-gray-100 p-1 border rounded-xl gap-1">
              <TabsTrigger
                value="matrix"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 font-semibold px-4 py-2 text-sm transition-all"
              >
                <ShieldCheck className="h-4 w-4 mr-2" /> Ma trận Vai trò & Quyền
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 font-semibold px-4 py-2 text-sm transition-all"
              >
                <UserCheck className="h-4 w-4 mr-2" /> Gán Vai trò Nhân viên
              </TabsTrigger>
            </TabsList>

            {activeTab === 'matrix' && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <AnimatePresence>
                  {isDirty && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="text-gray-500 border-gray-200 hover:bg-gray-100"
                      >
                        <RotateCcw className="h-4 w-4 mr-1.5" /> Hoàn tác
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateRolePermissions.isPending}
                        className="bg-brand-gradient hover-brand-gradient text-white font-medium shadow-md shadow-purple-500/20"
                      >
                        {updateRolePermissions.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />{' '}
                            Đang lưu
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1.5" /> Lưu thay đổi
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <AnimatePresence>
                  {isStaffDirty && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetStaffRoles}
                        className="text-gray-500 border-gray-200 hover:bg-gray-100"
                      >
                        <RotateCcw className="h-4 w-4 mr-1.5" /> Hoàn tác
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveStaffRoles}
                        disabled={isSavingStaffRoles}
                        className="bg-brand-gradient hover-brand-gradient text-white font-medium shadow-md shadow-purple-500/20"
                      >
                        {isSavingStaffRoles ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />{' '}
                            Đang lưu
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1.5" /> Lưu gán vai trò
                            ({Object.keys(dirtyStaffRoles).length})
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Ma trận vai trò & quyền */}
          <TabsContent value="matrix" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Column: Roles Sidebar Selection */}
              <div className="space-y-4 lg:col-span-1">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 px-1">
                  Danh sách vai trò
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
                  {roles.map((r) => {
                    const isSelected = r.role === selectedRole;
                    const roleDirty = dirtyPermissions[r.role] !== undefined;
                    return (
                      <button
                        key={r.role}
                        onClick={() => setSelectedRole(r.role)}
                        className={`flex items-center justify-between p-4 rounded-xl text-left border transition-all shadow-sm ${
                          isSelected
                            ? 'bg-purple-50 border-purple-200 text-purple-700 font-semibold ring-1 ring-purple-500/30'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              isSelected
                                ? 'bg-purple-100 text-purple-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold tracking-tight">
                              {r.role}
                            </p>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                              {r.permissions.length} quyền
                            </p>
                          </div>
                        </div>
                        {roleDirty && (
                          <div
                            className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse shadow-md"
                            title="Có thay đổi chưa lưu"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <Card className="border border-gray-200/60  shadow-sm bg-gray-50/50 ">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-800 ">
                      <Info className="h-4 w-4 text-purple-600" /> Về Phân Quyền
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-gray-500 space-y-2 leading-relaxed font-medium">
                    <p>
                      Hệ thống sử dụng bảo mật dựa trên Vai trò và Phân quyền
                      tài nguyên (RBAC).
                    </p>
                    <p>
                      Mỗi vai trò chứa danh sách các quyền hạn cụ thể với phạm
                      vi truy cập:{' '}
                      <code className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded">
                        own
                      </code>{' '}
                      (cá nhân),{' '}
                      <code className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded">
                        cinema
                      </code>{' '}
                      (rạp) hoặc{' '}
                      <code className="text-purple-600 bg-purple-50 px-1 py-0.5 rounded">
                        global
                      </code>{' '}
                      (toàn cục).
                    </p>
                    <p className="text-amber-600  font-semibold">
                      Thay đổi quyền sẽ áp dụng ngay lập tức cho tất cả nhân
                      viên thuộc vai trò này.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Active Permissions Grid */}
              <div className="space-y-6 lg:col-span-3">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 -trangray-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm phân quyền, tài nguyên hoặc hành động..."
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      className="pl-10 h-11 border-gray-200 focus:ring-purple-600"
                    />
                  </div>
                </div>

                {Object.keys(groupedPermissions).length === 0 ? (
                  <div className="text-center py-16 bg-white  border border-gray-200  rounded-2xl shadow-sm">
                    <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      Không tìm thấy phân quyền nào phù hợp với bộ lọc.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedPermissions).map(
                      ([resource, perms]) => (
                        <Card
                          key={resource}
                          className="border border-gray-200/60  shadow-sm overflow-hidden"
                        >
                          <CardHeader className="bg-gray-50/50  border-b pb-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base font-extrabold text-gray-950  uppercase tracking-wider flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-purple-600" />{' '}
                                  {resource}
                                </CardTitle>
                                <CardDescription className="text-xs font-semibold text-gray-500 mt-1">
                                  {RESOURCE_DESCRIPTIONS[resource] ||
                                    `Các quyền hạn thao tác tài nguyên ${resource}.`}
                                </CardDescription>
                              </div>
                              <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 font-bold border  ">
                                {perms.length} quyền
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader className="bg-gray-50/30 ">
                                <TableRow>
                                  <TableHead className="w-1/2 pl-6">
                                    Hành động & Phân quyền
                                  </TableHead>
                                  <TableHead className="w-1/4">
                                    Phạm vi truy cập
                                  </TableHead>
                                  <TableHead className="w-1/4 text-right pr-6">
                                    Trạng thái quyền
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {perms.map((p) => {
                                  const isEnabled =
                                    currentRolePermissions.includes(p.name);
                                  const isGlobalAdmin =
                                    selectedRole === 'ADMIN'; // Admin should be protected or highly prominent
                                  return (
                                    <TableRow
                                      key={p.name}
                                      className="hover:bg-gray-50/30 :bg-gray-900/10 transition-colors"
                                    >
                                      <TableCell className="pl-6 py-4">
                                        <div className="flex flex-col gap-1">
                                          <span className="font-bold text-gray-900  text-sm">
                                            {ACTION_LABELS[p.action] ||
                                              p.action}
                                          </span>
                                          <code className="text-xs text-purple-600 bg-purple-50   px-1.5 py-0.5 rounded font-mono w-max">
                                            {p.name}
                                          </code>
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-4">
                                        <Badge
                                          className={`font-semibold capitalize px-2.5 py-0.5 rounded-full ${
                                            p.scope === 'global'
                                              ? 'bg-purple-50 text-purple-700 border-purple-200/50  '
                                              : p.scope === 'cinema'
                                              ? 'bg-blue-50 text-blue-700 border-blue-200/50  '
                                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/50  '
                                          }`}
                                        >
                                          {p.scope}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right pr-6 py-4">
                                        <div className="flex items-center justify-end gap-3.5">
                                          <span
                                            className={`text-xs font-semibold ${
                                              isEnabled
                                                ? 'text-purple-600 '
                                                : 'text-gray-400'
                                            }`}
                                          >
                                            {isEnabled ? 'Bật' : 'Tắt'}
                                          </span>
                                          <Switch
                                            checked={isEnabled}
                                            disabled={isGlobalAdmin} // Protect full admin from lockouts
                                            onCheckedChange={(checked) =>
                                              handleTogglePermission(
                                                p.name,
                                                checked
                                              )
                                            }
                                            className="data-[state=checked]:bg-purple-600"
                                          />
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Gán vai trò cho nhân sự */}
          <TabsContent value="users" className="space-y-6 outline-none">
            <Card className="border border-gray-200/60  shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50/50  border-b pb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" /> Danh sách
                      Phân vai trò Nhân sự
                    </CardTitle>
                    <CardDescription className="text-xs font-semibold text-gray-500 mt-1">
                      Xem danh sách nhân sự tại các rạp chiếu và gán vai trò vận
                      hành Clerk tương ứng.
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -trangray-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm kiếm nhân viên..."
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      className="pl-9 h-10 border-gray-200 focus:ring-purple-600"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">
                      Không tìm thấy nhân viên nào phù hợp.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/30 ">
                        <TableRow>
                          <TableHead className="pl-6 w-1/4">
                            Họ và Tên
                          </TableHead>
                          <TableHead className="w-1/4">
                            Liên hệ (Email / SĐT)
                          </TableHead>
                          <TableHead className="w-1/6">Rạp Công tác</TableHead>
                          <TableHead className="w-1/6">Chức danh</TableHead>
                          <TableHead className="w-1/6 text-right pr-6">
                            Vai trò Hệ thống (Clerk)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStaff.map((staffMember) => {
                          const originalRole = String(staffMember.position);
                          const currentRole =
                            dirtyStaffRoles[staffMember.id] !== undefined
                              ? dirtyStaffRoles[staffMember.id]
                              : originalRole;
                          const isRowDirty =
                            dirtyStaffRoles[staffMember.id] !== undefined;
                          return (
                            <TableRow
                              key={staffMember.id}
                              className="hover:bg-gray-50/30 :bg-gray-900/10 transition-colors"
                            >
                              <TableCell className="pl-6 py-4 font-semibold text-gray-950  flex items-center gap-2">
                                <span>{staffMember.fullName}</span>
                                {isRowDirty && (
                                  <Badge className="bg-amber-500/10 hover:bg-amber-500/10 text-amber-600  font-semibold text-[10px] border border-amber-500/20 py-0 px-1.5 rounded">
                                    Chờ lưu
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-700 ">
                                    {staffMember.email}
                                  </span>
                                  <span className="text-xs text-gray-400 font-medium mt-0.5">
                                    {staffMember.phone}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4 font-medium text-gray-600 ">
                                {staffMember.cinemaId ? (
                                  <Badge
                                    variant="outline"
                                    className="border-gray-200 text-gray-700 font-medium"
                                  >
                                    Mã Rạp: {staffMember.cinemaId.slice(0, 8)}
                                    ...
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 font-bold capitalize">
                                  {String(staffMember.position)
                                    .replace('_', ' ')
                                    .toLowerCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right pr-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Select
                                    value={currentRole}
                                    onValueChange={(val) =>
                                      handleRoleChange(
                                        staffMember.id,
                                        val,
                                        originalRole
                                      )
                                    }
                                    disabled={isSavingStaffRoles}
                                  >
                                    <SelectTrigger className="w-44 h-9 border-gray-200">
                                      <SelectValue placeholder="Chọn vai trò" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roles.map((r) => (
                                        <SelectItem
                                          key={r.role}
                                          value={r.role}
                                          className="font-semibold"
                                        >
                                          {r.role}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
