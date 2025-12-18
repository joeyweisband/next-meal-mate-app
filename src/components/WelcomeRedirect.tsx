'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function WelcomeRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Skip if not loaded, no user, or already checked
    if (!isLoaded || !user || hasChecked) return;

    // Skip if already on welcome, sign-in, sign-up, or landing pages
    if (pathname?.startsWith('/welcome') ||
        pathname?.startsWith('/sign-in') ||
        pathname?.startsWith('/sign-up') ||
        pathname === '/' ||
        pathname === '/landing') {
      return;
    }

    const checkWelcomeStatus = async () => {
      try {
        const response = await fetch('/api/user');
        const userData = await response.json();

        // If welcome hasn't been shown yet, redirect to welcome page
        if (userData && !userData.welcomeShown) {
          router.push('/welcome');
        }
      } catch (error) {
        console.error('Error checking welcome status:', error);
      } finally {
        setHasChecked(true);
      }
    };

    checkWelcomeStatus();
  }, [isLoaded, user, pathname, hasChecked, router]);

  return null;
}
