/**
 * Header/Navigation component for Battleship Naval Strategy Game
 *
 * A responsive navigation header with naval theming that adapts to different screen sizes.
 * Features include mobile navigation, theme toggle, and game-specific navigation items.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  PlayIcon,
  TrophyIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  external?: boolean;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Navigation items
  const navigation: NavItem[] = [
    { name: 'Play', href: '/game', icon: <PlayIcon className="h-5 w-5" /> },
    { name: 'Leaderboard', href: '/leaderboard', icon: <TrophyIcon className="h-5 w-5" /> },
    { name: 'Statistics', href: '/stats', icon: <ChartBarIcon className="h-5 w-5" /> },
    { name: 'Settings', href: '/settings', icon: <Cog6ToothIcon className="h-5 w-5" /> },
  ];

  const userNavigation = [
    { name: 'Profile', href: '/profile' },
    { name: 'Game History', href: '/history' },
    { name: 'Settings', href: '/settings' },
    { name: 'Sign Out', href: '/logout' },
  ];

  // Theme management
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (prefersDark) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActiveRoute = (href: string): boolean => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header className={`bg-white dark:bg-steel-900 shadow-naval border-b border-steel-200 dark:border-steel-700 ${className}`}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 justify-between items-center">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
              aria-label="Battleship Naval Strategy - Home"
            >
              <div className="w-10 h-10 bg-navy-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg" role="img" aria-label="Ship">
                  ⚓
                </span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-steel-900 dark:text-steel-100">
                  Battleship
                </h1>
                <p className="text-sm text-steel-600 dark:text-steel-400 -mt-1">
                  Naval Strategy
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {navigation.map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-navy-100 dark:bg-navy-900 text-navy-700 dark:text-navy-300'
                      : 'text-steel-600 dark:text-steel-400 hover:bg-steel-100 dark:hover:bg-steel-800 hover:text-steel-900 dark:hover:text-steel-200'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Theme toggle */}
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg text-steel-600 dark:text-steel-400 hover:bg-steel-100 dark:hover:bg-steel-800 hover:text-steel-900 dark:hover:text-steel-200 transition-colors duration-200"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <MoonIcon className="h-5 w-5" />
                ) : (
                  <SunIcon className="h-5 w-5" />
                )}
              </button>
            )}

            {/* User menu - Desktop */}
            <div className="hidden lg:block relative">
              <button
                type="button"
                className="flex items-center space-x-2 p-2 rounded-lg text-steel-600 dark:text-steel-400 hover:bg-steel-100 dark:hover:bg-steel-800 hover:text-steel-900 dark:hover:text-steel-200 transition-colors duration-200"
                aria-label="User menu"
                aria-haspopup="true"
              >
                <UserCircleIcon className="h-6 w-6" />
                <span className="text-sm font-medium">Admiral</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-steel-600 dark:text-steel-400 hover:bg-steel-100 dark:hover:bg-steel-800 hover:text-steel-900 dark:hover:text-steel-200 transition-colors duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile navigation menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-16 left-0 right-0 bg-white dark:bg-steel-900 shadow-maritime border-t border-steel-200 dark:border-steel-700 z-50">
            <div className="px-4 py-6 space-y-1">
              {/* Mobile navigation items */}
              <div className="space-y-1" role="menu">
                {navigation.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 ${
                        isActive
                          ? 'bg-navy-100 dark:bg-navy-900 text-navy-700 dark:text-navy-300'
                          : 'text-steel-600 dark:text-steel-400 hover:bg-steel-100 dark:hover:bg-steel-800 hover:text-steel-900 dark:hover:text-steel-200'
                      }`}
                      onClick={closeMobileMenu}
                      role="menuitem"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-steel-200 dark:border-steel-700 my-4"></div>

              {/* User menu items */}
              <div className="space-y-1">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-steel-900 dark:text-steel-100">Admiral</p>
                  <p className="text-sm text-steel-500 dark:text-steel-400">admiral@battleship.com</p>
                </div>
                {userNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block px-4 py-3 text-base font-medium text-steel-600 dark:text-steel-400 hover:bg-steel-100 dark:hover:bg-steel-800 hover:text-steel-900 dark:hover:text-steel-200 rounded-lg transition-colors duration-200"
                    onClick={closeMobileMenu}
                    role="menuitem"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;