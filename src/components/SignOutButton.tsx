import React from 'react'
import { useAuthStore } from '../store/auth-store'

const SignOutButton: React.FC<{ afterSignOutUrl?: string }> = ({ afterSignOutUrl }) => {
  const { signOut } = useAuthStore()
  const handleSignOut = () => {
    signOut()
    if (afterSignOutUrl) {
      window.location.href = afterSignOutUrl
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