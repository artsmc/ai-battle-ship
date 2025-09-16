/**
 * User Registration Form
 * React Hook Form component for user registration
 */

'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../hooks/auth/useAuth'
import { registerSchema } from '../../lib/auth/validation/schemas'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
  className?: string
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  className = '',
}) => {
  const { register: registerUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)

    try {
      const result = await registerUser(data)

      if (result.success) {
        onSuccess?.()
      } else {
        setError('root', {
          type: 'manual',
          message: result.error || 'Registration failed',
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
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-neutral-300 mb-2">
              Username
            </label>
            <input
              {...register('username')}
              type="text"
              id="username"
              className="w-full px-3 py-2 bg-surface-primary border border-neutral-600 rounded-md
                         text-white placeholder-neutral-400 focus:outline-none focus:ring-2
                         focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your username"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
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
                className="w-full px-3 py-2 pr-10 bg-surface-primary border border-neutral-600 rounded-md
                           text-white placeholder-neutral-400 focus:outline-none focus:ring-2
                           focus:ring-primary-500 focus:border-primary-500"
                placeholder="Create a strong password"
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
            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="text-xs text-neutral-400 mb-1">Password requirements:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div
                    className={`${
                      password.length >= 8 ? 'text-green-400' : 'text-neutral-500'
                    }`}
                  >
                    ✓ 8+ characters
                  </div>
                  <div
                    className={`${
                      /[A-Z]/.test(password) ? 'text-green-400' : 'text-neutral-500'
                    }`}
                  >
                    ✓ Uppercase
                  </div>
                  <div
                    className={`${
                      /[a-z]/.test(password) ? 'text-green-400' : 'text-neutral-500'
                    }`}
                  >
                    ✓ Lowercase
                  </div>
                  <div
                    className={`${
                      /[0-9]/.test(password) ? 'text-green-400' : 'text-neutral-500'
                    }`}
                  >
                    ✓ Number
                  </div>
                  <div
                    className={`${
                      /[^A-Za-z0-9]/.test(password) ? 'text-green-400' : 'text-neutral-500'
                    } col-span-2`}
                  >
                    ✓ Special character
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className="w-full px-3 py-2 pr-10 bg-surface-primary border border-neutral-600 rounded-md
                           text-white placeholder-neutral-400 focus:outline-none focus:ring-2
                           focus:ring-primary-500 focus:border-primary-500"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400
                           hover:text-white focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms Acceptance */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                {...register('acceptTerms')}
                id="acceptTerms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-600
                           rounded bg-surface-primary"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="acceptTerms" className="text-neutral-300">
                I agree to the{' '}
                <a href="#" className="text-primary-400 hover:text-primary-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-400 hover:text-primary-300">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-red-400">{errors.acceptTerms.message}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn btn-primary py-3 text-white font-medium rounded-md
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                       focus:ring-offset-surface-secondary"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* Error Message */}
          {errors.root && (
            <div className="p-3 bg-red-900/20 border border-red-500 rounded-md">
              <p className="text-sm text-red-400">{errors.root.message}</p>
            </div>
          )}
        </form>

        {/* Switch to Login */}
        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <p className="text-neutral-400">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}