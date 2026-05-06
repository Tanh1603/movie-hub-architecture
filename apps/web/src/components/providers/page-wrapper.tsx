'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { setAuthTokenGetter } from '../../libs/api/api-client';
import Loading from '../loading';

export default function PageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => {
    // Configure auth token getter for the canonical API client
    setAuthTokenGetter(getToken);

    // Khi client mount xong thì bật mounted
    setMounted(true);
  }, [getToken]);

  if (!mounted) {
    return <Loading />;
  }

  return <>{children}</>;
}
