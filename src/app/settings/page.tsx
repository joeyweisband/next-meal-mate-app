"use client";
import { useUser } from '@clerk/nextjs';

export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return <div style={{ padding: 32, textAlign: 'center' }}>You are not signed in.</div>;
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001' }}>
      <h2 style={{ fontWeight: 600, fontSize: 22, marginBottom: 24 }}>Settings</h2>
      <div style={{ marginBottom: 16 }}>
        <strong>Name:</strong> {user.fullName || user.username || user.emailAddresses[0]?.emailAddress}
      </div>
      <div style={{ marginBottom: 16 }}>
        <strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}
      </div>
      {/* Add more settings fields here as needed */}
      <div style={{ marginTop: 32, color: '#888', fontSize: 14 }}>
        More settings coming soon...
      </div>
    </div>
  );
}
