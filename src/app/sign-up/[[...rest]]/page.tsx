"use client";

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  // No need for afterSignUpUrl - environment variable NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL
  // will handle redirecting to /welcome, where user creation will happen
  return (
    <div className="flex justify-center py-24">
      <SignUp />
    </div>
  );
}
