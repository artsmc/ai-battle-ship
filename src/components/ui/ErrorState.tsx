/**
 * ErrorState component for Battleship Naval Strategy Game
 *
 * A comprehensive error state component with naval theming.
 * Supports different error types, retry functionality, and accessible error messaging.
 */

'use client';

import React from 'react';
import {
  ExclamationTriangleIcon,
  XCircleIcon,
  WifiIcon,
  ServerIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ArrowPathIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

export type ErrorType =
  | 'network'
  | 'server'
  | 'timeout'
  | 'authentication'
  | 'permission'
  | 'not-found'
  | 'validation'
  | 'game-error'
  | 'unknown';

export interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  showRetry?: boolean;
  onRetry?: () => void;
  retryText?: string;
  retryLoading?: boolean;
  showHomeButton?: boolean;
  onHome?: () => void;
  showSupportButton?: boolean;
  onSupport?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'unknown',
  title,
  message,
  icon,
  showRetry = true,
  onRetry,
  retryText = 'Try Again',
  retryLoading = false,
  showHomeButton = false,
  onHome,
  showSupportButton = false,
  onSupport,
  className = '',
  size = 'md',
}) => {
  // Default error configurations
  const getErrorConfig = (errorType: ErrorType) => {
    const configs = {
      network: {
        title: 'Network Connection Failed',
        message: 'Unable to connect to the game servers. Please check your internet connection and try again.',
        icon: <WifiIcon className="h-12 w-12 text-red-500" />,
        color: 'text-red-600',
      },
      server: {
        title: 'Server Error',
        message: 'Our servers are experiencing issues. Our crew is working to fix this problem.',
        icon: <ServerIcon className="h-12 w-12 text-red-500" />,
        color: 'text-red-600',
      },
      timeout: {
        title: 'Request Timeout',
        message: 'The request took too long to complete. The servers might be busy.',
        icon: <ClockIcon className="h-12 w-12 text-yellow-500" />,
        color: 'text-yellow-600',
      },
      authentication: {
        title: 'Authentication Required',
        message: 'You need to sign in to access this feature. Please log in to your admiral account.',
        icon: <ShieldExclamationIcon className="h-12 w-12 text-yellow-500" />,
        color: 'text-yellow-600',
      },
      permission: {
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action. Contact support if you believe this is an error.',
        icon: <ShieldExclamationIcon className="h-12 w-12 text-red-500" />,
        color: 'text-red-600',
      },
      'not-found': {
        title: 'Page Not Found',
        message: 'The page or resource you\'re looking for has sailed away. Check the URL or navigate back to safety.',
        icon: <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />,
        color: 'text-yellow-600',
      },
      validation: {
        title: 'Invalid Input',
        message: 'Please check your input and correct any errors before proceeding.',
        icon: <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />,
        color: 'text-yellow-600',
      },
      'game-error': {
        title: 'Game Error',
        message: 'Something went wrong with the game state. This might be a temporary issue.',
        icon: <XCircleIcon className="h-12 w-12 text-red-500" />,
        color: 'text-red-600',
      },
      unknown: {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
        icon: <XCircleIcon className="h-12 w-12 text-red-500" />,
        color: 'text-red-600',
      },
    };

    return configs[errorType] || configs.unknown;
  };

  const config = getErrorConfig(type);
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;
  const displayIcon = icon || config.icon;

  // Size configurations
  const sizeClasses = {
    sm: {
      container: 'py-8 px-4',
      title: 'text-lg',
      message: 'text-sm',
      button: 'px-4 py-2 text-sm',
      spacing: 'space-y-4',
    },
    md: {
      container: 'py-12 px-6',
      title: 'text-xl',
      message: 'text-base',
      button: 'px-6 py-2.5 text-sm',
      spacing: 'space-y-6',
    },
    lg: {
      container: 'py-16 px-8',
      title: 'text-2xl',
      message: 'text-lg',
      button: 'px-8 py-3 text-base',
      spacing: 'space-y-8',
    },
  };

  const { container, title: titleSize, message: messageSize, button, spacing } = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center justify-center text-center ${container} ${className}`}>
      <div className={`max-w-md mx-auto ${spacing}`}>
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {displayIcon}
        </div>

        {/* Title */}
        <h2 className={`font-semibold text-steel-900 dark:text-steel-100 ${titleSize}`}>
          {displayTitle}
        </h2>

        {/* Message */}
        <p className={`text-steel-600 dark:text-steel-400 leading-relaxed ${messageSize}`}>
          {displayMessage}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
          {showRetry && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retryLoading}
              className={`
                inline-flex items-center justify-center ${button} font-medium rounded-lg
                text-white bg-navy-600 hover:bg-navy-700 focus:ring-4 focus:ring-navy-200 dark:focus:ring-navy-800
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200
              `}
            >
              {retryLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Retrying...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  {retryText}
                </>
              )}
            </button>
          )}

          {showHomeButton && onHome && (
            <button
              type="button"
              onClick={onHome}
              className={`
                inline-flex items-center justify-center ${button} font-medium rounded-lg
                text-steel-700 dark:text-steel-300 bg-white dark:bg-steel-700 border border-steel-300 dark:border-steel-600
                hover:bg-steel-50 dark:hover:bg-steel-600 focus:ring-4 focus:ring-steel-200 dark:focus:ring-steel-700
                transition-colors duration-200
              `}
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              Go Home
            </button>
          )}

          {showSupportButton && onSupport && (
            <button
              type="button"
              onClick={onSupport}
              className={`
                inline-flex items-center justify-center ${button} font-medium rounded-lg
                text-steel-700 dark:text-steel-300 bg-white dark:bg-steel-700 border border-steel-300 dark:border-steel-600
                hover:bg-steel-50 dark:hover:bg-steel-600 focus:ring-4 focus:ring-steel-200 dark:focus:ring-steel-700
                transition-colors duration-200
              `}
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
              Contact Support
            </button>
          )}
        </div>

        {/* Additional help text for specific error types */}
        {(type === 'network' || type === 'server') && (
          <div className="mt-6 p-4 bg-steel-50 dark:bg-steel-800 rounded-lg">
            <h3 className="text-sm font-medium text-steel-900 dark:text-steel-100 mb-2">
              Troubleshooting Tips:
            </h3>
            <ul className="text-xs text-steel-600 dark:text-steel-400 space-y-1 text-left">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Clear your browser cache</li>
              <li>• Disable browser extensions temporarily</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorState;