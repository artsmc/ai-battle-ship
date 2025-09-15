/**
 * Dialog component for Battleship Naval Strategy Game
 *
 * A higher-level dialog component built on top of Modal.
 * Provides common dialog patterns like confirmation, alert, and input dialogs.
 */

'use client';

import React from 'react';
import Modal, { ModalProps } from './Modal';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

export type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

export interface DialogProps extends Omit<ModalProps, 'children'> {
  type?: DialogType;
  icon?: React.ReactNode;
  description?: string;
  primaryButton?: {
    text: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'success';
    loading?: boolean;
  };
  secondaryButton?: {
    text: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({
  type = 'info',
  icon,
  title,
  description,
  primaryButton,
  secondaryButton,
  children,
  className = '',
  ...modalProps
}) => {
  // Default icons for dialog types
  const getDefaultIcon = (dialogType: DialogType): React.ReactNode => {
    const iconClasses = 'h-6 w-6';

    switch (dialogType) {
      case 'success':
        return <CheckCircleIcon className={`${iconClasses} text-green-600`} />;
      case 'warning':
        return <ExclamationTriangleIcon className={`${iconClasses} text-yellow-600`} />;
      case 'error':
        return <XCircleIcon className={`${iconClasses} text-red-600`} />;
      case 'confirm':
        return <QuestionMarkCircleIcon className={`${iconClasses} text-navy-600`} />;
      case 'info':
      default:
        return <InformationCircleIcon className={`${iconClasses} text-blue-600`} />;
    }
  };

  // Button variant styles
  const getButtonClasses = (variant: 'primary' | 'danger' | 'success' = 'primary', isSecondary = false) => {
    const baseClasses = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    if (isSecondary) {
      return `${baseClasses} text-steel-700 dark:text-steel-300 bg-white dark:bg-steel-700 border border-steel-300 dark:border-steel-600 hover:bg-steel-50 dark:hover:bg-steel-600 focus:ring-steel-500`;
    }

    switch (variant) {
      case 'danger':
        return `${baseClasses} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;
      case 'success':
        return `${baseClasses} text-white bg-green-600 hover:bg-green-700 focus:ring-green-500`;
      case 'primary':
      default:
        return `${baseClasses} text-white bg-navy-600 hover:bg-navy-700 focus:ring-navy-500`;
    }
  };

  return (
    <Modal
      {...modalProps}
      title={title}
      size={modalProps.size || 'md'}
      className={`${className}`}
    >
      <div className="py-4">
        {/* Icon and content area */}
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {icon || getDefaultIcon(type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Description */}
            {description && (
              <p className="text-steel-600 dark:text-steel-400 text-sm mb-4 leading-relaxed">
                {description}
              </p>
            )}

            {/* Custom children content */}
            {children && (
              <div className="mb-4">
                {children}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {(primaryButton || secondaryButton) && (
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-steel-200 dark:border-steel-600">
            {secondaryButton && (
              <button
                type="button"
                onClick={secondaryButton.onClick}
                className={getButtonClasses('primary', true)}
              >
                {secondaryButton.text}
              </button>
            )}

            {primaryButton && (
              <button
                type="button"
                onClick={primaryButton.onClick}
                disabled={primaryButton.loading}
                className={`${getButtonClasses(primaryButton.variant)} ${
                  primaryButton.loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {primaryButton.loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{primaryButton.text}</span>
                  </div>
                ) : (
                  primaryButton.text
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default Dialog;