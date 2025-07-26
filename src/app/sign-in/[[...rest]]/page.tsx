"use client";

import { SignIn, useAuth } from '@clerk/nextjs';
import SignUpHandler from '@/components/SignUpHandler';

export default function SignInPage() {
  const { isSignedIn } = useAuth();

  // If user is signed in, use the same handler component
  if (isSignedIn) {
    return <SignUpHandler />;
  }

  return (
      <div className="flex justify-center py-24">
        <SignIn />
      </div>
  );
}
