# Admin Panel - Clerk Authentication

## ✅ Migration Complete

Admin panel đã được chuyển đổi hoàn toàn sang sử dụng Clerk authentication, giống với phần (main) app.

## 🎯 Cấu trúc mới

### 1. **ClerkProvider** - Root Layout
- File: `app/layout.tsx`
- ClerkProvider bao bọc toàn bộ app (cả main và admin)
- Cấu hình theme với màu primary: `#f43f5e` (rose)

### 2. **Admin Login Page** - `/admin/login`
- File: `app/admin/login/page.tsx`
- Sử dụng Clerk's `<SignIn />` component
- UI gradient đẹp mắt với background decorations
- Tự động redirect đến `/admin` sau khi đăng nhập

### 3. **RequireAdminClerkAuth** - Protected Routes
- File: `components/require-admin-clerk-auth.tsx`
- Bảo vệ tất cả admin routes
- Auto-redirect đến `/admin/login` nếu chưa đăng nhập
- Loading state trong khi kiểm tra auth

### 4. **Admin Layout** - Protected Wrapper
- File: `app/admin/layout.tsx`
- Sử dụng `useUser()` và `useClerk()` từ Clerk
- Hiển thị user info từ Clerk (fullName, email, avatar)
- Logout button gọi `signOut()` từ Clerk

## 🚀 Cách sử dụng

### Đăng nhập vào Admin Panel

1. Truy cập `/admin` → tự động redirect đến `/admin/login`
2. Đăng nhập bằng Clerk (email/password hoặc OAuth)
3. Sau khi đăng nhập thành công → redirect về `/admin`

### Trong Admin Components

```tsx
import { useUser, useAuth } from '@clerk/nextjs';

export default function AdminPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  
  const fetchData = async () => {
    const token = await getToken();
    // Sử dụng token cho API calls
  };
  
  return <div>Welcome {user?.firstName}</div>;
}
```

### Trong Admin Hooks/API Calls

```tsx
import { useAuth } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';

export const useCreateMovie = () => {
  const { getToken } = useAuth();
  
  return useMutation({
    mutationFn: async (data) => {
      const token = await getToken();
      return fetch('/api/v1/admin/movies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    },
  });
};
```

## 🔐 Clerk User Object

Thay đổi từ custom auth sang Clerk:

| Custom Auth | Clerk |
|-------------|-------|
| `user?.name` | `user?.fullName` hoặc `user?.firstName` |
| `user?.email` | `user?.primaryEmailAddress?.emailAddress` |
| `user?.id` | `user?.id` |
| `user?.role` | Dùng `user?.publicMetadata.role` |

## 📦 Files đã thay đổi

### ✅ Created/Updated
- ✅ `app/layout.tsx` - Enabled ClerkProvider
- ✅ `app/admin/layout.tsx` - Sử dụng Clerk hooks
- ✅ `app/admin/login/page.tsx` - Clerk SignIn component
- ✅ `components/require-admin-clerk-auth.tsx` - Auth protection

### ❌ Deleted (Custom Auth)
- ❌ `contexts/admin-auth-context.tsx`
- ❌ `components/require-admin-auth.tsx`
- ❌ `hooks/use-admin-token.ts`
- ❌ `app/admin/ADMIN_AUTH_README.md`
- ❌ `app/admin/MIGRATION_GUIDE.md`

## 🔄 Migration từ Custom → Clerk

Nếu bạn có admin components/hooks đang dùng custom auth:

### Before (Custom):
```tsx
import { useAdminAuth } from '@/contexts/admin-auth-context';

const { user, getToken } = useAdminAuth();
```

### After (Clerk):
```tsx
import { useUser, useAuth } from '@clerk/nextjs';

const { user } = useUser();
const { getToken } = useAuth();
```

## 🎨 UI Features

- ✨ Gradient background (purple → pink → rose)
- 🎭 Blur decorations
- 📱 Responsive design
- 🔄 Loading states
- 🚪 Auto-redirect logic
- 👤 User avatar with initials

## ⚙️ Clerk Configuration

Để setup Clerk keys, thêm vào `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/admin/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/admin
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/admin
```

## 🧪 Testing

1. **Login Flow**:
   - Truy cập `/admin` → redirect `/admin/login`
   - Đăng nhập → redirect `/admin`
   - User info hiển thị trong header

2. **Protected Routes**:
   - Không đăng nhập → không vào được admin pages
   - Đăng nhập → truy cập tất cả admin routes

3. **Logout**:
   - Click "Logout" button
   - Clerk signOut được gọi
   - Redirect về homepage `/`

## 📊 So sánh Main vs Admin Auth

| Feature | Main App | Admin Panel |
|---------|----------|-------------|
| Provider | ClerkProvider | ClerkProvider (shared) |
| Login UI | Modal (navbar) | Dedicated page `/admin/login` |
| Protection | `<RequireSignIn>` | `<RequireAdminClerkAuth>` |
| Hooks | `useAuth()`, `useUser()` | `useAuth()`, `useUser()` |
| Logout | Navbar UserButton | Sidebar button |

## 🎯 Next Steps

1. ✅ Tất cả admin routes đã được bảo vệ bởi Clerk
2. ✅ Token handling tự động qua Clerk
3. ⚠️ Nếu cần role-based access, sử dụng Clerk's `publicMetadata`
4. ⚠️ Update các admin hooks để dùng `useAuth()` thay vì custom token

## 🆘 Troubleshooting

**Issue**: Redirect loop ở `/admin/login`
- **Fix**: Kiểm tra `pathname === '/admin/login'` condition trong layout

**Issue**: Token không có trong API calls
- **Fix**: Đảm bảo gọi `await getToken()` trước khi fetch

**Issue**: User info không hiển thị
- **Fix**: Kiểm tra Clerk provider đã wrap đúng chưa

---

**Status**: ✅ Migration Complete  
**Date**: December 23, 2025  
**Auth System**: Clerk (unified for both main and admin)
