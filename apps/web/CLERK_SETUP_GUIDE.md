# 🚨 Clerk Setup Guide - FIX Lỗi publishableKey

## Vấn đề
```
Error: The publishableKey passed to Clerk is invalid.
You can get your Publishable key at https://dashboard.clerk.com/last-active?path=api-keys
```

## ✅ Cách Fix

### Step 1: Lấy Clerk Keys
1. Truy cập: **https://dashboard.clerk.com**
2. Chọn application của bạn
3. Click **"API Keys"** ở left sidebar
4. Copy **Publishable Key** (bắt đầu với `pk_test_` hoặc `pk_live_`)
5. Copy **Secret Key** (bắt đầu với `sk_test_` hoặc `sk_live_`)

### Step 2: Update `.env.local`
File: `FE/movie-hub-fe/apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_API_URL=https://api-gateway.blueriver-433ab0c8.eastus.azurecontainerapps.io/api/v1
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:4000

# Clerk Configuration - THAY THẾ BẰNG KEYS THỰC TẾ
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxx  # ← PASTE KEY HERE
CLERK_SECRET_KEY=sk_test_xxxxxxxxx                    # ← PASTE KEY HERE

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/admin/login
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/admin
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/admin
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Step 3: Restart Dev Server
```bash
# Kill current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 4: Test
```
Navigate to: http://localhost:4200/admin
```

## ✨ Expected Flow
1. `/admin` → redirect `/admin/login`
2. See Clerk SignIn component
3. Login → redirect `/admin` dashboard
4. See user info in header

## 🔍 Verify Clerk Setup

After login, check:
1. ✅ User name shows in top-right
2. ✅ User email displays in header
3. ✅ Logout button works
4. ✅ Navigate between admin pages

## 🆘 Still Getting Error?

### Check 1: .env.local Format
- Không có space xung quanh `=`
- Mỗi dòng là 1 variable
- Không có quote quanh values

### Check 2: Key Format
- Publishable Key phải bắt đầu: `pk_test_` hoặc `pk_live_`
- Secret Key phải bắt đầu: `sk_test_` hoặc `sk_live_`

### Check 3: Dev Server Cache
```bash
# Xóa cache và restart
rm -rf .next
npm run dev
```

### Check 4: Clerk Dashboard Status
- Application tồn tại và active
- Keys không bị disable
- Correct environment (test vs live)

## 📱 Clerk Environment

### Development (Test Keys)
- Publishable: `pk_test_...`
- Secret: `sk_test_...`
- Use fake test accounts

### Production (Live Keys)
- Publishable: `pk_live_...`
- Secret: `sk_live_...`
- Use real user accounts

## 🎯 Admin Panel Clerk Routes

```
/admin/login          → Clerk SignIn page
/admin                → Protected dashboard
/admin/movies         → Protected CRUD
/admin/cinemas        → Protected CRUD
...
```

Tất cả routes ngoài `/admin/login` được bảo vệ bởi `RequireAdminClerkAuth`.

---

**Next**: Copy Clerk keys vào `.env.local` → Restart server → Test!
