'use client';

import React, { useEffect, useState } from 'react';
import { ThemeEffects, ThemeEffectType } from './theme-effects';
import { configApi } from '../../libs/api/services';
import { useAuth } from '@clerk/nextjs';
import { setAuthTokenGetter } from '../../libs/api/api-client';

interface AppearanceConfig {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  effect: ThemeEffectType;
  // Other fields might exist but we care about these
}

export default function ThemeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [effect, setEffect] = useState<ThemeEffectType>('none');
  const [mounted, setMounted] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => {
    setMounted(true);
    // Ensure token getter is set (might be redundant if PageWrapper does it, but safe)
    setAuthTokenGetter(getToken);

    const fetchConfig = async () => {
      try {
        const configs = await configApi.getAll();
        const data = (configs as any).data || configs;
        const appearanceConfig = Array.isArray(data)
          ? data.find((c: any) => c.key === 'appearance')
          : null;

        if (appearanceConfig && appearanceConfig.value) {
          const value = appearanceConfig.value as AppearanceConfig;

          // Apply Effect
          if (value.effect) {
            setEffect(value.effect);
          }

          // We could also apply Light/Dark mode here if we wanted to override the hardcoded 'dark'
          // but for now we stick to the requested "theme" (effect) feature.
          if (value.theme) {
            const html = document.documentElement;
            html.classList.remove('light', 'dark');
            if (value.theme === 'system') {
              const systemTheme = window.matchMedia(
                '(prefers-color-scheme: dark)'
              ).matches
                ? 'dark'
                : 'light';
              html.classList.add(systemTheme);
            } else {
              html.classList.add(value.theme);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch theme config:', error);
      }
    };

    fetchConfig();
  }, [getToken]);

  if (!mounted) return <>{children}</>;

  return (
    <>
      <ThemeEffects effect={effect} />
      {children}
    </>
  );
}
