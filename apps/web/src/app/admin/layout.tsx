'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Film,
  Building2,
  DoorOpen,
  Calendar,
  Users,
  Ticket,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Tag,
  Zap,
  Wrench,
  Eye,
  DollarSign,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import { Button } from '@movie-hub/shacdn-ui/button';
import { ScrollArea } from '@movie-hub/shacdn-ui/scroll-area';
import { cn } from '@movie-hub/shacdn-utils';
import { useClerk, useUser } from '@clerk/nextjs';
import { RequireAdminClerkAuth } from '@/components/require-admin-clerk-auth';
import PageWrapper from '@/components/providers/page-wrapper';

const menuSections = [
  {
    label: 'Chính',
    items: [
      {
        icon: LayoutDashboard,
        label: 'Bảng điều khiển',
        href: '/admin',
        disabled: false,
      },
    ],
  },
  {
    label: 'Cơ sở vật chất',
    items: [
      {
        icon: Building2,
        label: 'Rạp chiếu phim',
        href: '/admin/cinemas',
        disabled: false,
      },
      {
        icon: DoorOpen,
        label: 'Phòng chiếu',
        href: '/admin/halls',
        disabled: false,
      },
      {
        icon: Wrench,
        label: 'Trạng thái ghế',
        href: '/admin/seat-status',
        disabled: false,
      },
    ],
  },
  {
    label: 'Quản lý nội dung',
    items: [
      { icon: Film, label: 'Phim', href: '/admin/movies', disabled: false },
      {
        icon: Tag,
        label: 'Thể loại',
        href: '/admin/genres',
        disabled: false,
        adminOnly: true,
      },
      {
        icon: Calendar,
        label: 'Phát hành phim',
        href: '/admin/movie-releases',
        disabled: false,
        adminOnly: true,
      },
    ],
  },
  {
    label: 'Quản lý suất chiếu',
    items: [
      {
        icon: Calendar,
        label: 'Suất chiếu',
        href: '/admin/showtimes',
        disabled: false,
      },
      {
        icon: Eye,
        label: 'Ghế suất chiếu',
        href: '/admin/showtime-seats',
        disabled: false,
      },
      {
        icon: Zap,
        label: 'Suất chiếu hàng loạt',
        href: '/admin/batch-showtimes',
        disabled: false,
      },
    ],
  },
  {
    label: 'Doanh thu & Bán hàng',
    items: [
      {
        icon: DollarSign,
        label: 'Định giá vé',
        href: '/admin/ticket-pricing',
        disabled: false,
        adminOnly: true,
      },
      {
        icon: ShoppingBag,
        label: 'Đồ ăn',
        href: '/admin/concessions',
        disabled: false,
      },
      {
        icon: Ticket,
        label: 'Đặt chỗ',
        href: '/admin/reservations',
        disabled: false,
      },
      {
        icon: Percent,
        label: 'Khuyến mãi',
        href: '/admin/promotions',
        disabled: false,
        adminOnly: true,
      },
    ],
  },
  {
    label: 'Quan hệ khách hàng',
    items: [
      {
        icon: MessageSquare,
        label: 'Đánh giá',
        href: '/admin/reviews',
        disabled: false,
      },
    ],
  },
  {
    label: 'Quản lý',
    items: [
      {
        icon: Users,
        label: 'Nhân viên',
        href: '/admin/staff',
        disabled: false,
      },
      {
        icon: BarChart3,
        label: 'Báo cáo',
        href: '/admin/reports',
        disabled: false,
      },
      {
        icon: Settings,
        label: 'Cài đặt',
        href: '/admin/settings',
        disabled: false,
      },
    ],
  },
];

const menuItems = menuSections.flatMap((section) => section.items);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Auth pages (login, signup, reset-password) should not have admin layout
  const isAuthPage =
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/admin/sign-up') ||
    pathname.startsWith('/admin/reset-password') ||
    pathname.startsWith('/admin/verify');

  if (isAuthPage) {
    // Render auth pages without sidebar/navbar
    return <>{children}</>;
  }

  return (
    <RequireAdminClerkAuth>
      <PageWrapper>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </PageWrapper>
    </RequireAdminClerkAuth>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();

  // Check if user is a manager (has cinemaId assigned)
  const userRole = user?.publicMetadata?.role as string | undefined;
  const isManager = userRole === 'CINEMA_MANAGER';

  // Filter menu sections based on role
  const filteredMenuSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Hide admin-only items from managers
        if (isManager && (item as any).adminOnly) {
          return false;
        }
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);

  React.useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const hadDark = html.classList.contains('dark');
    const hadLight = html.classList.contains('light');

    html.classList.remove('dark');
    html.classList.add('light');
    body.classList.add('admin-light-mode');

    return () => {
      html.classList.remove('light');
      if (hadDark) html.classList.add('dark');
      if (!hadDark && !hadLight) {
        // If it didn't have either, we might want to default back to dark
        // since RootLayout has it hardcoded
        html.classList.add('dark');
      }
      body.classList.remove('admin-light-mode');
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 admin-light-mode">
      {/* Sidebar - Premium Deep Theme */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transition-all duration-300',
          'bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950',
          'border-r border-slate-700/50 shadow-2xl shadow-slate-900/50',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Header with Premium Styling */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
          {sidebarOpen && (
            <Link href="/admin">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/30">
                  🎬
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  Cinema
                </h1>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-700/50"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="px-3 py-6 space-y-6">
            {filteredMenuSections.map((section, idx) => (
              <div key={`section-${idx}`}>
                {sidebarOpen && (
                  <h3 className="px-3 mb-3 text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-slate-400 to-slate-500 bg-clip-text text-transparent">
                    {section.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/admin' &&
                        pathname.startsWith(item.href + '/'));

                    return (
                      <Link
                        key={item.href}
                        href={item.disabled ? '#' : item.href}
                        onClick={(e) => item.disabled && e.preventDefault()}
                        className="block"
                      >
                        <div
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300',
                            item.disabled
                              ? 'bg-amber-900/20 text-amber-400 border border-amber-500/30 cursor-not-allowed'
                              : isActive
                              ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/40 ring-1 ring-fuchsia-400/30'
                              : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md hover:shadow-slate-800/50 cursor-pointer'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-5 w-5 flex-shrink-0 transition-colors duration-300',
                              isActive
                                ? 'text-white'
                                : 'text-slate-400 group-hover:text-white'
                            )}
                          />
                          {sidebarOpen && (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="truncate">{item.label}</span>
                              {item.disabled && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold flex-shrink-0 border border-amber-500/30">
                                  NO API
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Logout Button with Premium Dark Theme */}
          <div className="px-3 py-6 border-t border-slate-700/50">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-950/30"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="ml-3">Đăng xuất</span>}
            </Button>
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {menuItems.find(
                  (item) =>
                    pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href))
                )?.label || 'Bảng điều khiển'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right mr-3">
                <p className="text-sm font-medium">
                  {user?.fullName || user?.firstName || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.primaryEmailAddress?.emailAddress ||
                    'admin@cinema.com'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold overflow-hidden">
                {user?.firstName?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
