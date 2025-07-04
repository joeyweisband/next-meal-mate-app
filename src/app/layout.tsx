"use client";
import { ClerkProvider, useUser } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: 16,
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, paddingBottom: 64 }}>{children}</div>
        <nav style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          height: 64,
          background: '#fff',
          borderTop: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 100,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.04)'
        }}>
          <a href="/meal-plan" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 13 }}>
            <span role="img" aria-label="Home" style={{ fontSize: 22 }}>🏠</span>
            Home
          </a>
          <a href="/meal-plan" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 13 }}>
            <span role="img" aria-label="Meal Plan" style={{ fontSize: 22 }}>📅</span>
            Meal Plan
          </a>
          <a href="/profile" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 13 }}>
            <span role="img" aria-label="Profile" style={{ fontSize: 22 }}>👤</span>
            Profile
          </a>
          <a href="/settings" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 13 }}>
            <span role="img" aria-label="Settings" style={{ fontSize: 22 }}>⚙️</span>
            Settings
          </a>
        </nav>
      </div>
    );
  }

  // User is signed out
  return <div>{children}</div>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <LayoutContent>{children}</LayoutContent>
        </ClerkProvider>
      </body>
    </html>
  );
}
