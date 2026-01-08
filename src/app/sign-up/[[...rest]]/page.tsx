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
  // Keep user on sign-up page after completion so SignUpHandler can run
  return (
    <div className="flex justify-center py-24">
      <SignUp
        afterSignUpUrl="/sign-up"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
