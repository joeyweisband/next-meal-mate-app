"use client";

import { SignUp, useAuth } from '@clerk/nextjs';
import SignUpHandler from '@/components/SignUpHandler';

export default function SignUpPage() {
  const { isSignedIn } = useAuth();

  // If user is signed in, show the handler component
  if (isSignedIn) {
    return <SignUpHandler />;
  }

  // Otherwise show the sign-up form
  // Note: No afterSignUpUrl here because SignUpHandler will handle the redirect to /welcome
  return (
    <div className="flex justify-center py-24">
      <SignUp />
    </div>
  );
}
