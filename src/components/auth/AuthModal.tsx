/**
 * Authentication Modal
 * Modal component that handles both login and registration
 */

'use client'

import React, { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import Modal from '../ui/Modal'

type AuthMode = 'login' | 'register'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: AuthMode
  onSuccess?: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>(defaultMode)

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  const handleSwitchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <div className="relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white
                     focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-1"
          aria-label="Close"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Content */}
        <div className="pt-2">
          {mode === 'login' ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={handleSwitchMode}
            />
          ) : (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={handleSwitchMode}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}