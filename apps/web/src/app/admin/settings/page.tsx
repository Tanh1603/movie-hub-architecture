'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  CreditCard,
  Palette,
  Save,
  RefreshCw,
  Check,
  X,
  Eye,
  EyeOff,
  Upload,
  Download,
  Trash2,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { Button } from '@movie-hub/shacdn-ui/button';
import { Input } from '@movie-hub/shacdn-ui/input';
import { Label } from '@movie-hub/shacdn-ui/label';
import { Switch } from '@movie-hub/shacdn-ui/switch';
import { Badge } from '@movie-hub/shacdn-ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@movie-hub/shacdn-ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@movie-hub/shacdn-ui/tabs';
import { Separator } from '@movie-hub/shacdn-ui/separator';
import { useToast } from '../_libs/use-toast';
import { configApi } from '../../../libs/api/services';
import type { ThemeEffectType } from '../../../components/theme/theme-effects';

// Frontend-specific settings types
interface ProfileSettings {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  department: string;
  timezone: string;
  language: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  bookingAlerts: boolean;
  revenueReports: boolean;
  systemAlerts: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  loginNotifications: boolean;
  ipWhitelist: string[];
  lastPasswordChange: string;
}

interface SystemSettings {
  maintenanceMode: boolean;
  debugMode: boolean;
  apiRateLimit: number;
  maxUploadSize: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  backupFrequency: string;
  logRetention: number;
}

interface BillingSettings {
  companyName: string;
  taxId: string;
  billingEmail: string;
  billingAddress: string;
  paymentMethod: string;
  autoRenewal: boolean;
  currentPlan: string;
  nextBillingDate: string;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  animations: boolean;
  sidebarCollapsed: boolean;
  effect: ThemeEffectType;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profile, setProfile] = useState<ProfileSettings>({
    name: 'Admin User',
    email: 'admin@moviehub.com',
    phone: '+84 123 456 789',
    avatar: '',
    role: 'Super Admin',
    department: 'Operations',
    timezone: 'Asia/Ho_Chi_Minh',
    language: 'en',
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    bookingAlerts: true,
    revenueReports: true,
    systemAlerts: true,
    marketingEmails: false,
    weeklyDigest: true,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    loginNotifications: true,
    ipWhitelist: ['192.168.1.1', '10.0.0.1'],
    lastPasswordChange: '2024-11-15',
  });

  const [system, setSystem] = useState<SystemSettings>({
    maintenanceMode: false,
    debugMode: false,
    apiRateLimit: 1000,
    maxUploadSize: 10,
    cacheEnabled: true,
    cacheTTL: 3600,
    backupFrequency: 'daily',
    logRetention: 30,
  });

  const [billing, setBilling] = useState<BillingSettings>({
    companyName: 'Movie Hub Inc.',
    taxId: '0123456789',
    billingEmail: 'billing@moviehub.com',
    billingAddress: '123 Cinema Street, District 1, HCMC',
    paymentMethod: 'credit_card',
    autoRenewal: true,
    currentPlan: 'enterprise',
    nextBillingDate: '2025-01-15',
  });

  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'system',
    accentColor: '#8b5cf6',
    fontSize: 'medium',
    compactMode: false,
    animations: true,
    sidebarCollapsed: false,
    effect: 'none',
  });

  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed.profile) setProfile(parsed.profile);
      if (parsed.notifications) setNotifications(parsed.notifications);
      if (parsed.security) setSecurity(parsed.security);
      if (parsed.system) setSystem(parsed.system);
      if (parsed.billing) setBilling(parsed.billing);
      if (parsed.appearance) setAppearance(parsed.appearance);
    }

    // Fetch Appearance from API (Source of Truth for Theme)
    const fetchConfig = async () => {
      try {
        const configs = await configApi.getAll();
        // Handle potential response wrapper or direct array
        const dataList = (configs as any).data || configs;
        const appConfig = Array.isArray(dataList)
          ? dataList.find((c: any) => c.key === 'appearance')
          : null;

        if (appConfig?.value) {
          setAppearance((prev) => ({ ...prev, ...appConfig.value }));
        }
      } catch (error) {
        console.error('Failed to sync settings from backend:', error);
      }
    };
    fetchConfig();
  }, []);

  const saveSettings = async (section: string) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const allSettings = {
        profile,
        notifications,
        security,
        system,
        billing,
        appearance,
      };
      localStorage.setItem('adminSettings', JSON.stringify(allSettings));

      // Sync Appearance to Backend
      if (section === 'Appearance') {
        await configApi.update('appearance', {
          key: 'appearance',
          value: {
            theme: appearance.theme,
            effect: appearance.effect,
          },
          description: 'Global Appearance Settings',
        });
      }

      toast({
        title: 'Settings Saved',
        description: `${section} settings have been updated successfully.`,
        variant: 'default', // Added variant explicitly
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Lưu cài đặt thất bại. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: 'Password Changed',
        description: 'Mật khẩu của bạn đã được cập nhật thành công.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to change password.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportSettings = () => {
    const allSettings = {
      profile,
      notifications,
      security,
      system,
      billing,
      appearance,
    };
    const blob = new Blob([JSON.stringify(allSettings, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admin-settings.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Settings Exported',
      description: 'Your settings have been exported successfully.',
    });
  };

  const ACCENT_COLORS = [
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#10b981', label: 'Emerald' },
    { value: '#f59e0b', label: 'Amber' },
    { value: '#ef4444', label: 'Red' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#3b82f6', label: 'Blue' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-gray-600" />
            Cài đặt
          </h1>
          <p className="text-gray-500 mt-1">
            Quản lý tài khoản của bạn và các tùy chọn ứng dụng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportSettings}>
            <Download className="h-4 w-4 mr-2" />
            Xuất Cài đặt
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Hồ Sơ</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Thông Báo</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Bảo Mật</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Hệ Thống</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Thanh Toán</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Giao Diện</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Cập nhật thông tin cá nhân và tùy chọn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.name.charAt(0)}
                  </div>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{profile.name}</h3>
                  <p className="text-gray-500">{profile.role}</p>
                  <Badge className="mt-1 bg-purple-100 text-purple-700">
                    {profile.department}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Địa chỉ Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={profile.department}
                    onValueChange={(value) =>
                      setProfile({ ...profile, department: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) =>
                      setProfile({ ...profile, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Ho_Chi_Minh">
                        Vietnam (GMT+7)
                      </SelectItem>
                      <SelectItem value="Asia/Singapore">
                        Singapore (GMT+8)
                      </SelectItem>
                      <SelectItem value="Asia/Tokyo">Japan (GMT+9)</SelectItem>
                      <SelectItem value="America/New_York">
                        New York (GMT-5)
                      </SelectItem>
                      <SelectItem value="Europe/London">
                        London (GMT+0)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={profile.language}
                    onValueChange={(value) =>
                      setProfile({ ...profile, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="vi">Vietnamese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveSettings('Profile')}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Lưu thay đổi
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notification Channels</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          emailNotifications: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive browser push notifications
                      </p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          pushNotifications: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Receive critical alerts via SMS
                      </p>
                    </div>
                    <Switch
                      checked={notifications.smsNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          smsNotifications: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Alert Types</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Booking Alerts</Label>
                      <p className="text-sm text-gray-500">
                        New bookings and cancellations
                      </p>
                    </div>
                    <Switch
                      checked={notifications.bookingAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          bookingAlerts: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Revenue Reports</Label>
                      <p className="text-sm text-gray-500">
                        Daily/weekly revenue summaries
                      </p>
                    </div>
                    <Switch
                      checked={notifications.revenueReports}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          revenueReports: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>System Alerts</Label>
                      <p className="text-sm text-gray-500">
                        System errors and maintenance notices
                      </p>
                    </div>
                    <Switch
                      checked={notifications.systemAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          systemAlerts: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-gray-500">
                        Promotional content and updates
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          marketingEmails: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Digest</Label>
                      <p className="text-sm text-gray-500">
                        Weekly summary of all activities
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyDigest}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          weeklyDigest: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveSettings('Notification')}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password regularly for security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Last changed: {security.lastPasswordChange}</span>
                </div>
                <Button onClick={handlePasswordChange} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Change Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure additional security measures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">
                      Add an extra layer of security
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {security.twoFactorEnabled ? (
                      <Badge className="bg-green-100 text-green-700">
                        <Check className="h-3 w-3 mr-1" /> Enabled
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700">
                        <X className="h-3 w-3 mr-1" /> Disabled
                      </Badge>
                    )}
                    <Switch
                      checked={security.twoFactorEnabled}
                      onCheckedChange={(checked) =>
                        setSecurity({ ...security, twoFactorEnabled: checked })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Select
                      value={security.sessionTimeout.toString()}
                      onValueChange={(value) =>
                        setSecurity({
                          ...security,
                          sessionTimeout: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Password Expiry (days)</Label>
                    <Select
                      value={security.passwordExpiry.toString()}
                      onValueChange={(value) =>
                        setSecurity({
                          ...security,
                          passwordExpiry: parseInt(value),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">180 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Login Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Get notified on new login attempts
                    </p>
                  </div>
                  <Switch
                    checked={security.loginNotifications}
                    onCheckedChange={(checked) =>
                      setSecurity({ ...security, loginNotifications: checked })
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => saveSettings('Security')}
                    disabled={loading}
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Advanced system settings for administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div>
                    <Label className="text-yellow-800">Maintenance Mode</Label>
                    <p className="text-sm text-yellow-600">
                      Temporarily disable access to the platform
                    </p>
                  </div>
                  <Switch
                    checked={system.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setSystem({ ...system, maintenanceMode: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-orange-50 border border-orange-200">
                  <div>
                    <Label className="text-orange-800">Debug Mode</Label>
                    <p className="text-sm text-orange-600">
                      Enable detailed error logging
                    </p>
                  </div>
                  <Switch
                    checked={system.debugMode}
                    onCheckedChange={(checked) =>
                      setSystem({ ...system, debugMode: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>API Rate Limit (requests/hour)</Label>
                  <Input
                    type="number"
                    value={system.apiRateLimit}
                    onChange={(e) =>
                      setSystem({
                        ...system,
                        apiRateLimit: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Upload Size (MB)</Label>
                  <Input
                    type="number"
                    value={system.maxUploadSize}
                    onChange={(e) =>
                      setSystem({
                        ...system,
                        maxUploadSize: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cache TTL (seconds)</Label>
                  <Input
                    type="number"
                    value={system.cacheTTL}
                    onChange={(e) =>
                      setSystem({
                        ...system,
                        cacheTTL: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Log Retention (days)</Label>
                  <Input
                    type="number"
                    value={system.logRetention}
                    onChange={(e) =>
                      setSystem({
                        ...system,
                        logRetention: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Caching</Label>
                  <p className="text-sm text-gray-500">
                    Improve performance with response caching
                  </p>
                </div>
                <Switch
                  checked={system.cacheEnabled}
                  onCheckedChange={(checked) =>
                    setSystem({ ...system, cacheEnabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Backup Frequency</Label>
                <Select
                  value={system.backupFrequency}
                  onValueChange={(value) =>
                    setSystem({ ...system, backupFrequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: 'Cache Cleared',
                      description:
                        'System cache has been cleared successfully.',
                    });
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
                <Button
                  onClick={() => saveSettings('System')}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  Your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <div>
                    <h3 className="text-xl font-bold capitalize">
                      {billing.currentPlan} Plan
                    </h3>
                    <p className="opacity-90">
                      Next billing date: {billing.nextBillingDate}
                    </p>
                  </div>
                  <Badge className="bg-white text-purple-600">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  Update your billing details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={billing.companyName}
                      onChange={(e) =>
                        setBilling({ ...billing, companyName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax ID</Label>
                    <Input
                      value={billing.taxId}
                      onChange={(e) =>
                        setBilling({ ...billing, taxId: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Email</Label>
                    <Input
                      type="email"
                      value={billing.billingEmail}
                      onChange={(e) =>
                        setBilling({ ...billing, billingEmail: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={billing.paymentMethod}
                      onValueChange={(value) =>
                        setBilling({ ...billing, paymentMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Billing Address</Label>
                  <Input
                    value={billing.billingAddress}
                    onChange={(e) =>
                      setBilling({ ...billing, billingAddress: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Renewal</Label>
                    <p className="text-sm text-gray-500">
                      Automatically renew subscription
                    </p>
                  </div>
                  <Switch
                    checked={billing.autoRenewal}
                    onCheckedChange={(checked) =>
                      setBilling({ ...billing, autoRenewal: checked })
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => saveSettings('Billing')}
                    disabled={loading}
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the admin panel looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Theme</Label>
                <div className="flex gap-4">
                  {[
                    {
                      value: 'light',
                      label: 'Light',
                      icon: Sun,
                    },
                    {
                      value: 'dark',
                      label: 'Dark',
                      icon: Moon,
                    },
                    {
                      value: 'system',
                      label: 'System',
                      icon: Monitor,
                    },
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      onClick={() =>
                        setAppearance({
                          ...appearance,
                          theme: theme.value as 'light' | 'dark' | 'system',
                        })
                      }
                      className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                        appearance.theme === theme.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <theme.icon className="h-6 w-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Accent Color</Label>
                <div className="flex gap-2">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() =>
                        setAppearance({
                          ...appearance,
                          accentColor: color.value,
                        })
                      }
                      className={`w-10 h-10 rounded-full transition-transform ${
                        appearance.accentColor === color.value
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Seasonal Effect</Label>
                <div className="flex gap-4">
                  {[
                    { value: 'none', label: 'None' },
                    { value: 'snow', label: 'Snow (Winter)' },
                    { value: 'sakura', label: 'Sakura (Spring)' },
                    { value: 'glow', label: 'Glow (Fireflies)' },
                  ].map((effectOption) => (
                    <button
                      key={effectOption.value}
                      onClick={() =>
                        setAppearance({
                          ...appearance,
                          effect: effectOption.value as ThemeEffectType,
                        })
                      }
                      className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                        appearance.effect === effectOption.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {effectOption.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Font Size</Label>
                <Select
                  value={appearance.fontSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') =>
                    setAppearance({ ...appearance, fontSize: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact Mode</Label>
                    <p className="text-sm text-gray-500">
                      Reduce spacing and padding
                    </p>
                  </div>
                  <Switch
                    checked={appearance.compactMode}
                    onCheckedChange={(checked) =>
                      setAppearance({ ...appearance, compactMode: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Animations</Label>
                    <p className="text-sm text-gray-500">
                      Enable UI animations and transitions
                    </p>
                  </div>
                  <Switch
                    checked={appearance.animations}
                    onCheckedChange={(checked) =>
                      setAppearance({ ...appearance, animations: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Collapsed Sidebar</Label>
                    <p className="text-sm text-gray-500">
                      Start with sidebar collapsed by default
                    </p>
                  </div>
                  <Switch
                    checked={appearance.sidebarCollapsed}
                    onCheckedChange={(checked) =>
                      setAppearance({
                        ...appearance,
                        sidebarCollapsed: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveSettings('Appearance')}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
