/**
 * Loading State Component
 * A simple loading state wrapper around the Loading component
 */

'use client'

import React from 'react'
import Loading, { LoadingType, LoadingSize } from './Loading'

interface LoadingStateProps {
  message?: string
  type?: LoadingType
  size?: LoadingSize
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  type = 'spinner',
  size = 'md',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      <Loading type={type} size={size} color="text-primary-500" />
      {message && (
        <p className="mt-4 text-neutral-400 text-sm text-center animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}