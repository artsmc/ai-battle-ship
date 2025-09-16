/**
 * User Statistics Component
 * Displays detailed user game statistics and achievements
 */

'use client'

import React from 'react'
import {
  ChartBarIcon,
  TrophyIcon,
  TargetIcon,
  FireIcon,
  StarIcon,
  ShipIcon,
} from '@heroicons/react/24/outline'

interface UserStatisticsProps {
  profile: {
    rating: number
    peak_rating: number
    games_played: number
    games_won: number
    games_drawn: number
    level: number
    experience_points: number
    achievements: any[]
    unlocked_ships: string[]
  }
}

export const UserStatistics: React.FC<UserStatisticsProps> = ({ profile }) => {
  // Calculate derived statistics
  const gamesLost = profile.games_played - profile.games_won - profile.games_drawn
  const winRate = profile.games_played > 0 ? (profile.games_won / profile.games_played) * 100 : 0
  const drawRate = profile.games_played > 0 ? (profile.games_drawn / profile.games_played) * 100 : 0
  const lossRate = profile.games_played > 0 ? (gamesLost / profile.games_played) * 100 : 0

  // Calculate experience needed for next level
  const baseXpPerLevel = 1000
  const xpForCurrentLevel = (profile.level - 1) * baseXpPerLevel
  const xpForNextLevel = profile.level * baseXpPerLevel
  const currentLevelProgress = profile.experience_points - xpForCurrentLevel
  const xpNeededForNext = xpForNextLevel - profile.experience_points

  const statisticsCards = [
    {
      title: 'Current Rating',
      value: profile.rating.toLocaleString(),
      subtitle: `Peak: ${profile.peak_rating.toLocaleString()}`,
      icon: ChartBarIcon,
      color: 'text-primary-400',
      bgColor: 'bg-primary-900/20',
    },
    {
      title: 'Games Played',
      value: profile.games_played.toLocaleString(),
      subtitle: 'Total matches',
      icon: TargetIcon,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
    },
    {
      title: 'Games Won',
      value: profile.games_won.toLocaleString(),
      subtitle: `${winRate.toFixed(1)}% win rate`,
      icon: TrophyIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
    },
    {
      title: 'Current Level',
      value: profile.level.toString(),
      subtitle: `${currentLevelProgress}/${baseXpPerLevel} XP`,
      icon: StarIcon,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
    },
  ]

  const shipCategories = [
    { name: 'Destroyers', ships: ['destroyer', 'fletcher', 'gearing'] },
    { name: 'Cruisers', ships: ['cruiser', 'baltimore', 'cleveland'] },
    { name: 'Battleships', ships: ['battleship', 'iowa', 'missouri'] },
    { name: 'Carriers', ships: ['carrier', 'essex', 'midway'] },
    { name: 'Submarines', ships: ['submarine', 'gato', 'balao'] },
  ]

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-6">Game Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statisticsCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className={`${stat.bgColor} rounded-lg border border-neutral-700 p-6`}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm text-neutral-400">{stat.title}</p>
                    <p className="text-xs text-neutral-500 mt-1">{stat.subtitle}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Win/Loss Breakdown */}
        <div className="bg-surface-secondary rounded-lg border border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Game Results
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Wins</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-neutral-700 rounded-full h-2">
                  <div
                    className="bg-green-400 h-2 rounded-full"
                    style={{ width: `${winRate}%` }}
                  ></div>
                </div>
                <span className="text-green-400 text-sm font-medium min-w-[60px]">
                  {profile.games_won} ({winRate.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Draws</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-neutral-700 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${drawRate}%` }}
                  ></div>
                </div>
                <span className="text-yellow-400 text-sm font-medium min-w-[60px]">
                  {profile.games_drawn} ({drawRate.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Losses</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-neutral-700 rounded-full h-2">
                  <div
                    className="bg-red-400 h-2 rounded-full"
                    style={{ width: `${lossRate}%` }}
                  ></div>
                </div>
                <span className="text-red-400 text-sm font-medium min-w-[60px]">
                  {gamesLost} ({lossRate.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-surface-secondary rounded-lg border border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <StarIcon className="w-5 h-5 mr-2" />
            Level Progress
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300">Current Level</span>
              <span className="text-white font-bold text-xl">{profile.level}</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-400 text-sm">Progress to Level {profile.level + 1}</span>
                <span className="text-neutral-400 text-sm">
                  {currentLevelProgress}/{baseXpPerLevel} XP
                </span>
              </div>
              <div className="w-full bg-neutral-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-400 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(currentLevelProgress / baseXpPerLevel) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {xpNeededForNext > 0 ? `${xpNeededForNext.toLocaleString()} XP needed` : 'Ready to level up!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unlocked Ships */}
      <div className="bg-surface-secondary rounded-lg border border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <ShipIcon className="w-5 h-5 mr-2" />
          Unlocked Ships ({profile.unlocked_ships.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {shipCategories.map((category) => {
            const unlockedInCategory = category.ships.filter(ship =>
              profile.unlocked_ships.includes(ship)
            )

            return (
              <div
                key={category.name}
                className="bg-surface-primary rounded-lg border border-neutral-600 p-4"
              >
                <h4 className="text-sm font-medium text-white mb-2">{category.name}</h4>
                <div className="space-y-1">
                  {category.ships.map((ship) => {
                    const isUnlocked = profile.unlocked_ships.includes(ship)
                    return (
                      <div
                        key={ship}
                        className={`text-xs px-2 py-1 rounded ${
                          isUnlocked
                            ? 'bg-green-900/20 text-green-400 border border-green-700'
                            : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                        }`}
                      >
                        {ship.charAt(0).toUpperCase() + ship.slice(1)}
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  {unlockedInCategory.length}/{category.ships.length} unlocked
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-surface-secondary rounded-lg border border-neutral-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <TrophyIcon className="w-5 h-5 mr-2" />
          Achievements ({profile.achievements.length})
        </h3>
        {profile.achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.achievements.map((achievement, index) => (
              <div
                key={index}
                className="bg-surface-primary rounded-lg border border-yellow-700 p-4"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-yellow-900/20 rounded-lg">
                    <TrophyIcon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">
                      {achievement.name || `Achievement #${index + 1}`}
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      {achievement.description || 'No description available'}
                    </p>
                    <p className="text-xs text-yellow-400 mt-2">
                      Earned: {achievement.earned_at ? new Date(achievement.earned_at).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrophyIcon className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400">No achievements yet</p>
            <p className="text-sm text-neutral-500">Play more games to unlock achievements!</p>
          </div>
        )}
      </div>
    </div>
  )
}