"use client";
import { ClerkProvider, useUser } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect } from "react";
import { Home, Calendar, User, Settings } from "lucide-react";
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
  const { isSignedIn, isLoaded, user } = useUser();
  
  // Create user in database when signed in
  useEffect(() => {
    const createUserInDatabase = async () => {
      if (isSignedIn && user) {
        console.log("Layout - Creating user in database:", user.id);
        try {
          // Store user ID in localStorage for API calls
          if (typeof window !== 'undefined') {
            localStorage.setItem('clerk-db-user-id', user.id);
          }
          
          const response = await fetch('/api/test-create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              name: user.fullName || user.username || 'New User',
              email: user.emailAddresses[0]?.emailAddress || '',
            }),
          });
          
          const result = await response.json();
          console.log("Layout - User creation result:", result);
        } catch (error) {
          console.error("Layout - Error creating user:", error);
        }
      }
    };
    
    createUserInDatabase();
  }, [isSignedIn, user]);

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
          <a href="/meal-plan" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 13, gap: 4 }}>
            <Home size={24} strokeWidth={2} />
            Home
          </a>
          <a href="/meal-plan" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 13, gap: 4 }}>
            <Calendar size={24} strokeWidth={2} />
            Meal Plan
          </a>
          <a href="/profile" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 13, gap: 4 }}>
            <User size={24} strokeWidth={2} />
            Profile
          </a>
          <a href="/settings" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 13, gap: 4 }}>
            <Settings size={24} strokeWidth={2} />
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Meal Mate" />
        {/* Add multiple apple-touch-icon sizes for iOS PWA support */}
        <link rel="apple-touch-icon" sizes="180x180" href="/web-app-manifest-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/web-app-manifest-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/web-app-manifest-192x192.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/web-app-manifest-192x192.png" />
        {/* Fallback icon for older iOS devices */}
        <link rel="apple-touch-icon" href="/web-app-manifest-192x192.png" />
        {/* Add maskable icon for Android/Chrome PWA */}
        <link rel="icon" type="image/png" sizes="192x192" href="/web-app-manifest-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/web-app-manifest-512x512.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <LayoutContent>{children}</LayoutContent>
        </ClerkProvider>
      </body>
    </html>
  );
}
