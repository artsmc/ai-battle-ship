/**
 * User Settings Component
 * Manages user preferences and account settings
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CogIcon,
  BellIcon,
  EyeIcon,
  VolumeUpIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline'
import { UserPreferences } from '../../lib/auth/types'
import { LoadingState } from '../ui/LoadingState'

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.string(),
  notifications: z.object({
    email: z.boolean(),
    browser: z.boolean(),
    gameUpdates: z.boolean(),
    achievements: z.boolean(),
  }),
  gameSettings: z.object({
    soundEffects: z.boolean(),
    backgroundMusic: z.boolean(),
    animationSpeed: z.enum(['slow', 'normal', 'fast']),
    autoConfirmMoves: z.boolean(),
  }),
  privacy: z.object({
    showOnlineStatus: z.boolean(),
    allowFriendRequests: z.boolean(),
    showGameHistory: z.boolean(),
  }),
})

type PreferencesFormData = z.infer<typeof preferencesSchema>

export const UserSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
  })

  // Load preferences on mount
  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/user/preferences', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }

      const data = await response.json()
      if (data.success) {
        setPreferences(data.preferences)
        reset(data.preferences)
      } else {
        throw new Error(data.message || 'Failed to load preferences')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: PreferencesFormData) => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update preferences')
      }

      if (result.success) {
        setPreferences(result.preferences)
        setSuccess('Settings saved successfully!')

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error(result.message || 'Failed to update preferences')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingState message="Loading settings..." />
  }

  if (error && !preferences) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-md p-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchPreferences}
          className="mt-3 text-red-300 hover:text-red-200 text-sm underline"
        >
          Try again
        </button>
      </div>
    )
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'auto', label: 'System', icon: ComputerDesktopIcon },
  ]

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'ja', label: 'Japanese' },
    { value: 'pt', label: 'Portuguese' },
  ]

  const animationSpeedOptions = [
    { value: 'slow', label: 'Slow' },
    { value: 'normal', label: 'Normal' },
    { value: 'fast', label: 'Fast' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Settings</h2>
        <p className="text-neutral-400">Manage your account and game preferences</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-md p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-700 rounded-md p-4">
          <p className="text-green-400">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Appearance Settings */}
        <div className="bg-surface-secondary rounded-lg border border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <MoonIcon className="w-5 h-5 mr-2" />
            Appearance
          </h3>
          <div className="space-y-4">
            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <label key={option.value} className="cursor-pointer">
                      <input
                        {...register('theme')}
                        type="radio"
                        value={option.value}
                        className="sr-only"
                      />
                      <div
                        className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors duration-200
                          ${watch('theme') === option.value
                            ? 'border-primary-500 bg-primary-900/20'
                            : 'border-neutral-600 bg-surface-primary hover:border-neutral-500'
                          }`}
                      >
                        <Icon className="w-5 h-5 text-neutral-400" />
                        <span className="text-white text-sm">{option.label}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-neutral-300 mb-2">
                Language
              </label>
              <select
                {...register('language')}
                id="language"
                className="w-full max-w-xs px-3 py-2 bg-surface-primary border border-neutral-600
                         rounded-md text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-surface-secondary rounded-lg border border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BellIcon className="w-5 h-5 mr-2" />
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="email-notifications" className="text-sm font-medium text-white">
                  Email Notifications
                </label>
                <p className="text-xs text-neutral-400">Receive game updates via email</p>
              </div>
              <input
                {...register('notifications.email')}
                type="checkbox"
                id="email-notifications"
                className="w-4 h-4 text-primary-600 bg-surface-primary border-neutral-600 rounded
                         focus:ring-primary-500 focus:ring-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="browser-notifications" className="text-sm font-medium text-white">
                  Browser Notifications
                </label>
                <p className="text-xs text-neutral-400">Show notifications in your browser</p>
              </div>
              <input
                {...register('notifications.browser')}
                type="checkbox"
                id="browser-notifications"
                className="w-4 h-4 text-primary-600 bg-surface-primary border-neutral-600 rounded
                         focus:ring-primary-500 focus:ring-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="game-updates" className="text-sm font-medium text-white">
                  Game Updates
                </label>
                <p className="text-xs text-neutral-400">Notifications about new features and updates</p>
              </div>
              <input
                {...register('notifications.gameUpdates')}
                type="checkbox"
                id="game-updates"
                className="w-4 h-4 text-primary-600 bg-surface-primary border-neutral-600 rounded
                         focus:ring-primary-500 focus:ring-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="achievements" className="text-sm font-medium text-white">
                  Achievement Notifications
                </label>
                <p className="text-xs text-neutral-400">Get notified when you unlock achievements</p>
              </div>
              <input
                {...register('notifications.achievements')}
                type="checkbox"
                id="achievements"
                className="w-4 h-4 text-primary-600 bg-surface-primary border-neutral-600 rounded
                         focus:ring-primary-500 focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Game Settings */}
        <div className="bg-surface-secondary rounded-lg border border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <CogIcon className="w-5 h-5 mr-2" />
            Game Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="sound-effects" className="text-sm font-medium text-white">
                  Sound Effects
                </label>
                <p className="text-xs text-neutral-400">Play sound effects during gameplay</p>
              </div>
              <input
                {...register('gameSettings.soundEffects')}
                type="checkbox"
                id="sound-effects"
                className="w-4 h-4 text-primary-600 bg-surface-primary border-neutral-600 rounded
                         focus:ring-primary-500 focus:ring-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="background-music" className="text-sm font-medium text-white">
                  Background Music
                </label>
                <p className="text-xs text-neutral-400">Play background music while playing</p>
              </div>
              <input
                {...register('gameSettings.backgroundMusic')}
                type="checkbox"
                id="background-music"
                className="w-4 h-4 text-primary-600 bg-surface-primary border-neutral-600 rounded
                         focus:ring-primary-500 focus:ring-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="auto-confirm" className="text-sm font-medium text-white">
                  Auto-confirm Moves
                </label>
                <p className="text-xs text-neutral-400">Automatically confirm move selections</p>
              </div>
              <input
                {...register('gameSettings.autoConfirmMoves')}
                type="checkbox"
                id="auto-confirm"
                className="w-4 h-4 text-primary-600 bg-surface-primary border-neutral-600 rounded
                         focus:ring-primary-500 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="animation-speed" className="block text-sm font-medium text-neutral-300 mb-2">
                Animation Speed
              </label>
              <select
                {...register('gameSettings.animationSpeed')}
                id="animation-speed"
                className="w-full max-w-xs px-3 py-2 bg-surface-primary border border-neutral-600
                         rounded-md text-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {animationSpeedOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-surface-secondary rounded-lg border border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <EyeIcon className="w-5 h-5 mr-2" />
            Privacy
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="online-status" className="text-sm font-medium text-white">
                  Show Online Status
                </label>
                <p className="text-xs text-neutral-400">Allow others to see when you're online</p>
              </div>
              <input
                {...register('privacy.showOnlineStatus')}
                type="checkbox"
                id="online-status"
                className="w-4 h-4 text-primary-600 bg-surface-primary border-neutral-600 rounded
                         focus:ring-primary-500 focus:ring-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="friend-requests" className="text-sm font-medium text-white">
                  Allow Friend Requests
                </label>
                <p className="text-xs text-neutral-400">Let other players send you friend requests</p>
              </div>
              <input
                {...register('privacy.allowFriendRequests')}
                type="checkbox"
                id="friend-requests"
                className="w-4 h-4 text-primary-600 bg-surface-primary border-neutral-600 rounded
                         focus:ring-primary-500 focus:ring-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="game-history" className="text-sm font-medium text-white">
                  Show Game History
                </label>
                <p className="text-xs text-neutral-400">Allow others to view your match history</p>
              </div>
              <input
                {...register('privacy.showGameHistory')}
                type="checkbox"
                id="game-history"
                className="w-4 h-4 text-primary-600 bg-surface-primary border-neutral-600 rounded
                         focus:ring-primary-500 focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="px-6 py-2 bg-primary-600 text-white rounded-md
                     hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}