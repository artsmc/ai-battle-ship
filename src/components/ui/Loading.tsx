/**
 * Loading component for Battleship Naval Strategy Game
 *
 * A collection of loading indicators with naval theming and animations.
 * Supports multiple types: spinner, dots, bars, pulse, and naval-specific variants.
 */

'use client';

import React from 'react';

export type LoadingType = 'spinner' | 'dots' | 'bars' | 'pulse' | 'wave' | 'radar' | 'ship';
export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingProps {
  type?: LoadingType;
  size?: LoadingSize;
  color?: string;
  text?: string;
  className?: string;
  overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  type = 'spinner',
  size = 'md',
  color = 'text-navy-600',
  text,
  className = '',
  overlay = false,
}) => {
  // Size configurations
  const sizeClasses = {
    xs: { width: 'w-4 h-4', text: 'text-xs', spacing: 'space-x-1' },
    sm: { width: 'w-5 h-5', text: 'text-sm', spacing: 'space-x-1' },
    md: { width: 'w-8 h-8', text: 'text-base', spacing: 'space-x-2' },
    lg: { width: 'w-12 h-12', text: 'text-lg', spacing: 'space-x-2' },
    xl: { width: 'w-16 h-16', text: 'text-xl', spacing: 'space-x-3' },
  };

  const { width, text: textSize, spacing } = sizeClasses[size];

  // Spinner component
  const Spinner = () => (
    <div
      className={`${width} border-2 border-t-transparent rounded-full animate-spin ${color.replace('text-', 'border-')}`}
      role="status"
      aria-label="Loading"
    />
  );

  // Dots component
  const Dots = () => (
    <div className={`flex ${spacing}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${width.split(' ')[0]} ${width.split(' ')[0]} rounded-full bg-current animate-pulse ${color}`}
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s',
          }}
        />
      ))}
    </div>
  );

  // Bars component
  const Bars = () => (
    <div className={`flex items-end ${spacing}`} role="status" aria-label="Loading">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={`w-1 bg-current rounded-sm ${color}`}
          style={{
            height: size === 'xs' ? '12px' : size === 'sm' ? '16px' : size === 'md' ? '24px' : size === 'lg' ? '32px' : '40px',
            animation: `loading-bars 1.2s ease-in-out infinite`,
            animationDelay: `${index * 0.15}s`,
          }}
        />
      ))}
    </div>
  );

  // Pulse component
  const Pulse = () => (
    <div className={`${width} rounded-full bg-current animate-pulse ${color}`} role="status" aria-label="Loading" />
  );

  // Wave component (naval-themed)
  const Wave = () => (
    <div className="flex items-center justify-center" role="status" aria-label="Loading">
      <div className="relative">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`absolute left-1/2 top-1/2 ${width} rounded-full border-2 ${color.replace('text-', 'border-')} opacity-75`}
            style={{
              transform: 'translate(-50%, -50%)',
              animation: `wave-ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite`,
              animationDelay: `${index * 0.4}s`,
            }}
          />
        ))}
      </div>
    </div>
  );

  // Radar component (naval-themed)
  const Radar = () => (
    <div className="relative" role="status" aria-label="Loading">
      <div className={`${width} rounded-full border-2 border-steel-300 dark:border-steel-600`} />
      <div
        className={`absolute top-0 left-1/2 w-px bg-current ${color}`}
        style={{
          height: '50%',
          transformOrigin: 'bottom',
          animation: 'radar-sweep 2s linear infinite',
        }}
      />
    </div>
  );

  // Ship component (naval-themed)
  const Ship = () => (
    <div className="flex items-center" role="status" aria-label="Loading">
      <div className={`${color} ${size === 'xs' ? 'text-lg' : size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-3xl' : 'text-4xl'}`}>
        <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>⚓</span>
        <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>🌊</span>
        <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>⛵</span>
      </div>
    </div>
  );

  // Select loading component
  const LoadingComponent = () => {
    switch (type) {
      case 'dots':
        return <Dots />;
      case 'bars':
        return <Bars />;
      case 'pulse':
        return <Pulse />;
      case 'wave':
        return <Wave />;
      case 'radar':
        return <Radar />;
      case 'ship':
        return <Ship />;
      case 'spinner':
      default:
        return <Spinner />;
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center ${spacing} ${className}`}>
      <LoadingComponent />
      {text && (
        <p className={`mt-3 font-medium text-steel-600 dark:text-steel-400 ${textSize} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 dark:bg-steel-900/75 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

// CSS animations (you might want to add these to your global CSS)
const styles = `
  @keyframes loading-bars {
    0%, 40%, 100% { transform: scaleY(0.4); }
    20% { transform: scaleY(1); }
  }

  @keyframes wave-ripple {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
  }

  @keyframes radar-sweep {
    0% { transform: rotate(0deg); opacity: 1; }
    100% { transform: rotate(360deg); opacity: 1; }
  }
`;

export default Loading;
export { styles as LoadingStyles };