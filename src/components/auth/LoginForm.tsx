/**
 * User Login Form
 * React Hook Form component for user authentication
 */

'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../hooks/auth/useAuth'
import { loginSchema } from '../../lib/auth/validation/schemas'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
  className?: string
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  className = '',
}) => {
  const { login } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)

    try {
      const result = await login(data)

      if (result.success) {
        onSuccess?.()
      } else {
        setError('root', {
          type: 'manual',
          message: result.error || 'Login failed',
        })
      }
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'An unexpected error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="bg-surface-secondary p-6 rounded-lg shadow-lg border border-neutral-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              autoComplete="email"
              className="w-full px-3 py-2 bg-surface-primary border border-neutral-600 rounded-md
                         text-white placeholder-neutral-400 focus:outline-none focus:ring-2
                         focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                className="w-full px-3 py-2 pr-10 bg-surface-primary border border-neutral-600 rounded-md
                           text-white placeholder-neutral-400 focus:outline-none focus:ring-2
                           focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400
                           hover:text-white focus:outline-none"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-600
                           rounded bg-surface-primary"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-neutral-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="text-primary-400 hover:text-primary-300"
                onClick={(e) => {
                  e.preventDefault()
                  // TODO: Implement forgot password functionality
                  alert('Forgot password functionality coming soon!')
                }}
              >
                Forgot password?
              </a>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn btn-primary py-3 text-white font-medium rounded-md
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                       focus:ring-offset-surface-secondary"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Error Message */}
          {errors.root && (
            <div className="p-3 bg-red-900/20 border border-red-500 rounded-md">
              <p className="text-sm text-red-400">{errors.root.message}</p>
            </div>
          )}
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-3 bg-blue-900/20 border border-blue-500 rounded-md">
          <p className="text-sm text-blue-300 font-medium mb-2">Demo Accounts:</p>
          <div className="text-xs text-blue-200 space-y-1">
            <div>Admin: admin@battleship.dev / Admin123!</div>
            <div>Player: player1@battleship.dev / Player123!</div>
          </div>
        </div>

        {/* Switch to Register */}
        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-neutral-400">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                Create one
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}