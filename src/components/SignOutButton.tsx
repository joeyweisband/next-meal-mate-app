"use client";
import React from 'react'
import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const SignOutButton: React.FC<{ afterSignOutUrl?: string }> = ({ afterSignOutUrl = '/landing' }) => {
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push(afterSignOutUrl)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        background: '#e53935',
        color: 'white',
        border: 'none',
        borderRadius: 6,
        padding: '8px 16px',
        fontWeight: 600,
        cursor: 'pointer',
        marginTop: 8,
      }}
    >
      Sign Out
    </button>
  )
}

export default SignOutButton