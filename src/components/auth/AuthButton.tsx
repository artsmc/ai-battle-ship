/**
 * Authentication Button
 * Button component for login/logout functionality
 */

'use client'

import React, { useState } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { AuthModal } from './AuthModal'
import { UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

interface AuthButtonProps {
  className?: string
  showUsername?: boolean
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  className = '',
  showUsername = true,
}) => {
  const { user, isLoading, isAuthenticated, isGuest, logout, startGuestMode } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const handleOpenLogin = () => {
    setAuthMode('login')
    setIsModalOpen(true)
  }

  const handleOpenRegister = () => {
    setAuthMode('register')
    setIsModalOpen(true)
  }

  const handleLogout = async () => {
    await logout()
  }

  const handlePlayAsGuest = () => {
    startGuestMode()
  }

  if (isLoading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="animate-pulse bg-neutral-600 h-8 w-20 rounded"></div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        {/* User Info */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <UserIcon className="w-5 h-5 text-white" />
            )}
          </div>
          {showUsername && (
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white">
                {user.display_name || user.username}
              </p>
              {user.is_premium && (
                <p className="text-xs text-yellow-400">Premium</p>
              )}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1 px-3 py-2 text-sm font-medium
                     text-neutral-300 hover:text-white hover:bg-surface-primary
                     rounded-md transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
          title="Sign out"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </div>
    )
  }

  // Guest mode display
  if (isGuest) {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        {/* Guest Info */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-neutral-600 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-neutral-300" />
          </div>
          {showUsername && (
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-neutral-300">Guest Player</p>
              <p className="text-xs text-neutral-500">Playing offline</p>
            </div>
          )}
        </div>

        {/* Create Account Button */}
        <button
          onClick={handleOpenRegister}
          className="px-3 py-2 text-sm font-medium text-white bg-primary-600
                     hover:bg-primary-700 rounded-md transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Create Account
        </button>

        {/* Sign In Button */}
        <button
          onClick={handleOpenLogin}
          className="px-3 py-2 text-sm font-medium text-neutral-300 hover:text-white
                     hover:bg-surface-primary rounded-md transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Sign In
        </button>
      </div>
    )
  }

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* Play as Guest Button */}
        <button
          onClick={handlePlayAsGuest}
          className="px-4 py-2 text-sm font-medium text-neutral-300
                     hover:text-white hover:bg-surface-primary rounded-md
                     transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Play as Guest
        </button>

        {/* Login Button */}
        <button
          onClick={handleOpenLogin}
          className="px-4 py-2 text-sm font-medium text-white bg-transparent
                     border border-neutral-600 hover:border-primary-500
                     hover:text-primary-300 rounded-md transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Sign In
        </button>

        {/* Register Button */}
        <button
          onClick={handleOpenRegister}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600
                     hover:bg-primary-700 rounded-md transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Sign Up
        </button>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultMode={authMode}
        onSuccess={() => {
          // Optional: Add success notification here
          console.log('Authentication successful!')
        }}
      />
    </>
  )
}