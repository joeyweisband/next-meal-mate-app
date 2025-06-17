"use client";
import { UserButton, useUser } from '@clerk/nextjs';
import SignOutButton from '../../components/SignOutButton';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <div style={{ padding: 32, textAlign: 'center' }}>You are not signed in.</div>;
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <UserButton afterSignOutUrl="/sign-in" />
        <div>
          <div style={{ fontWeight: 600, fontSize: 22 }}>{user.fullName || user.username || user.emailAddresses[0]?.emailAddress}</div>
          <div style={{ color: '#888', fontSize: 14 }}>{user.emailAddresses[0]?.emailAddress}</div>
        </div>
      </div>
      <div style={{ marginTop: 32 }}>
        <SignOutButton afterSignOutUrl="/sign-in" />
      </div>
    </div>
  );
}
