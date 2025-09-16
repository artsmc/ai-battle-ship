/**
 * Profile Editor Component
 * Form for editing user profile information
 */

'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const profileSchema = z.object({
  display_name: z.string().max(50).optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  country_code: z.string().length(2).optional().or(z.literal('')),
  preferred_language: z.string().max(10).optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileEditorProps {
  profile: {
    display_name?: string | null
    bio?: string | null
    country_code?: string | null
    preferred_language?: string
    username: string
    email: string
    created_at: string
  }
  onUpdate: (data: any) => void
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile.display_name || '',
      bio: profile.bio || '',
      country_code: profile.country_code || '',
      preferred_language: profile.preferred_language || 'en',
    },
  })

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'AU', name: 'Australia' },
    { code: 'BR', name: 'Brazil' },
    // Add more countries as needed
  ]

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'pt', name: 'Portuguese' },
  ]

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
    setSuccess(null)
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
    setError(null)
    setSuccess(null)
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSaving(true)
      setError(null)

      // Convert empty strings to undefined for optional fields
      const submitData = {
        display_name: data.display_name || undefined,
        bio: data.bio || undefined,
        country_code: data.country_code || undefined,
        preferred_language: data.preferred_language || undefined,
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile')
      }

      if (result.success) {
        onUpdate(result.profile)
        setSuccess('Profile updated successfully!')
        setIsEditing(false)

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        throw new Error(result.message || 'Failed to update profile')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Profile Information</h2>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white
                     rounded-md hover:bg-primary-700 transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
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

      {isEditing ? (
        /* Edit Form */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Display Name */}
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-neutral-300 mb-2">
              Display Name
            </label>
            <input
              {...register('display_name')}
              type="text"
              id="display_name"
              className="w-full px-3 py-2 bg-surface-secondary border border-neutral-600
                       rounded-md text-white placeholder-neutral-400
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Your display name"
            />
            {errors.display_name && (
              <p className="text-red-400 text-sm mt-1">{errors.display_name.message}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-neutral-300 mb-2">
              Bio
            </label>
            <textarea
              {...register('bio')}
              id="bio"
              rows={4}
              className="w-full px-3 py-2 bg-surface-secondary border border-neutral-600
                       rounded-md text-white placeholder-neutral-400
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Tell others about yourself..."
            />
            {errors.bio && (
              <p className="text-red-400 text-sm mt-1">{errors.bio.message}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country_code" className="block text-sm font-medium text-neutral-300 mb-2">
              Country
            </label>
            <select
              {...register('country_code')}
              id="country_code"
              className="w-full px-3 py-2 bg-surface-secondary border border-neutral-600
                       rounded-md text-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            {errors.country_code && (
              <p className="text-red-400 text-sm mt-1">{errors.country_code.message}</p>
            )}
          </div>

          {/* Language */}
          <div>
            <label htmlFor="preferred_language" className="block text-sm font-medium text-neutral-300 mb-2">
              Preferred Language
            </label>
            <select
              {...register('preferred_language')}
              id="preferred_language"
              className="w-full px-3 py-2 bg-surface-secondary border border-neutral-600
                       rounded-md text-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {languages.map((language) => (
                <option key={language.code} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
            {errors.preferred_language && (
              <p className="text-red-400 text-sm mt-1">{errors.preferred_language.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={isSaving || !isDirty}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white
                       rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <CheckIcon className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 bg-neutral-600 text-white
                       rounded-md hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-neutral-500"
            >
              <XMarkIcon className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="space-y-6">
          {/* Account Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Username
              </label>
              <p className="text-white">{profile.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Email
              </label>
              <p className="text-white">{profile.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Display Name
              </label>
              <p className="text-white">
                {profile.display_name || <span className="text-neutral-500 italic">Not set</span>}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Country
              </label>
              <p className="text-white">
                {profile.country_code ?
                  countries.find(c => c.code === profile.country_code)?.name || profile.country_code :
                  <span className="text-neutral-500 italic">Not set</span>
                }
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Language
              </label>
              <p className="text-white">
                {languages.find(l => l.code === profile.preferred_language)?.name || 'English'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">
                Member Since
              </label>
              <p className="text-white">{formatDate(profile.created_at)}</p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">
              Bio
            </label>
            <div className="bg-surface-secondary rounded-md p-4 min-h-[100px]">
              {profile.bio ? (
                <p className="text-white whitespace-pre-wrap">{profile.bio}</p>
              ) : (
                <p className="text-neutral-500 italic">No bio provided</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}