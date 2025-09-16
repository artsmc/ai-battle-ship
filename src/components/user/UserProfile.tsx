/**
 * User Profile Component
 * Displays and manages user profile information
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/auth/useAuth'
import { UserIcon, CogIcon, ChartBarIcon, TrophyIcon } from '@heroicons/react/24/outline'
import { ProfileEditor } from './ProfileEditor'
import { UserStatistics } from './UserStatistics'
import { UserSettings } from './UserSettings'
import { LoadingState } from '../ui/LoadingState'
import { ErrorState } from '../ui/ErrorState'

type ActiveTab = 'profile' | 'statistics' | 'settings'

interface UserProfileData {
  id: string
  username: string
  email: string
  display_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  country_code?: string | null
  preferred_language?: string
  rating: number
  peak_rating: number
  games_played: number
  games_won: number
  games_drawn: number
  level: number
  experience_points: number
  achievements: any[]
  unlocked_ships: string[]
  created_at: string
  last_active: string
  is_premium: boolean
}

export const UserProfile: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfileData()
    } else if (!isLoading && !isAuthenticated) {
      setError('Please sign in to view your profile.')
      setLoading(false)
    }
  }, [isAuthenticated, user, isLoading])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user/profile', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch profile data')
      }

      const data = await response.json()
      if (data.success) {
        setProfileData(data.profile)
      } else {
        throw new Error(data.message || 'Failed to load profile')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = (updatedData: Partial<UserProfileData>) => {
    if (profileData) {
      setProfileData({ ...profileData, ...updatedData })
    }
  }

  if (isLoading || loading) {
    return <LoadingState message="Loading profile..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Profile Error"
        message={error}
        action={
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary mt-4"
          >
            Retry
          </button>
        }
      />
    )
  }

  if (!profileData) {
    return (
      <ErrorState
        title="Profile Not Found"
        message="Unable to load profile data."
      />
    )
  }

  const tabs = [
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: UserIcon,
      description: 'View and edit your profile information',
    },
    {
      id: 'statistics' as const,
      label: 'Statistics',
      icon: ChartBarIcon,
      description: 'View your game statistics and achievements',
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: CogIcon,
      description: 'Manage your account and game preferences',
    },
  ]

  const getWinRate = () => {
    if (profileData.games_played === 0) return 0
    return Math.round((profileData.games_won / profileData.games_played) * 100)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="bg-surface-primary rounded-lg border border-neutral-700 p-6 mb-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
              {profileData.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt={profileData.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-10 h-10 text-white" />
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-grow">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-white">
                {profileData.display_name || profileData.username}
              </h1>
              {profileData.is_premium && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <TrophyIcon className="w-3 h-3 mr-1" />
                  Premium
                </span>
              )}
            </div>
            <p className="text-neutral-400 mb-3">@{profileData.username}</p>
            {profileData.bio && (
              <p className="text-neutral-300 mb-4 max-w-2xl">{profileData.bio}</p>
            )}

            {/* Quick Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-neutral-400">Level:</span>
                <span className="text-white font-medium">{profileData.level}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-neutral-400">Rating:</span>
                <span className="text-primary-400 font-medium">{profileData.rating}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-neutral-400">Games:</span>
                <span className="text-white font-medium">{profileData.games_played}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-neutral-400">Win Rate:</span>
                <span className="text-green-400 font-medium">{getWinRate()}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-surface-secondary rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium
                  transition-colors duration-200 flex-1 justify-center
                  ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-400 hover:text-white hover:bg-surface-primary'
                  }
                `}
                title={tab.description}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-surface-primary rounded-lg border border-neutral-700 p-6">
        {activeTab === 'profile' && (
          <ProfileEditor
            profile={profileData}
            onUpdate={handleProfileUpdate}
          />
        )}
        {activeTab === 'statistics' && (
          <UserStatistics profile={profileData} />
        )}
        {activeTab === 'settings' && (
          <UserSettings />
        )}
      </div>
    </div>
  )
}