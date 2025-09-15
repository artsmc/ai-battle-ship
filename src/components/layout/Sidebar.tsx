/**
 * Sidebar component for Battleship Naval Strategy Game
 *
 * A responsive sidebar navigation designed for game screens.
 * Features collapsible design, game-specific navigation, and naval theming.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  PlayIcon,
  TrophyIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ClockIcon,
  BoltIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import {
  PlayIcon as PlayIconSolid,
  TrophyIcon as TrophyIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  HomeIcon as HomeIconSolid,
} from '@heroicons/react/24/solid';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  className?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  iconSolid: React.ReactNode;
  badge?: string | number;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  className = '',
}) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    setCollapsed(isCollapsed);
  }, [isCollapsed]);

  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onToggleCollapse?.(newCollapsed);
  };

  const navigation: NavSection[] = [
    {
      title: 'Main',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: <HomeIcon className="h-5 w-5" />,
          iconSolid: <HomeIconSolid className="h-5 w-5" />,
          description: 'Overview and quick access',
        },
        {
          name: 'Play Game',
          href: '/game',
          icon: <PlayIcon className="h-5 w-5" />,
          iconSolid: <PlayIconSolid className="h-5 w-5" />,
          description: 'Start or join a battle',
        },
        {
          name: 'Quick Match',
          href: '/game/quick',
          icon: <BoltIcon className="h-5 w-5" />,
          iconSolid: <BoltIcon className="h-5 w-5" />,
          description: 'Find opponents quickly',
        },
        {
          name: 'Create Game',
          href: '/game/create',
          icon: <PlusIcon className="h-5 w-5" />,
          iconSolid: <PlusIcon className="h-5 w-5" />,
          description: 'Custom game settings',
        },
      ],
    },
    {
      title: 'Statistics',
      items: [
        {
          name: 'Leaderboard',
          href: '/leaderboard',
          icon: <TrophyIcon className="h-5 w-5" />,
          iconSolid: <TrophyIconSolid className="h-5 w-5" />,
          description: 'Top players ranking',
        },
        {
          name: 'My Stats',
          href: '/stats',
          icon: <ChartBarIcon className="h-5 w-5" />,
          iconSolid: <ChartBarIconSolid className="h-5 w-5" />,
          description: 'Personal statistics',
        },
        {
          name: 'Game History',
          href: '/history',
          icon: <ClockIcon className="h-5 w-5" />,
          iconSolid: <ClockIcon className="h-5 w-5" />,
          description: 'Past matches record',
        },
      ],
    },
    {
      title: 'Social',
      items: [
        {
          name: 'Chat Rooms',
          href: '/chat',
          icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
          iconSolid: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
          badge: '3',
          description: 'Community discussions',
        },
        {
          name: 'Tournaments',
          href: '/tournaments',
          icon: <QueueListIcon className="h-5 w-5" />,
          iconSolid: <QueueListIcon className="h-5 w-5" />,
          badge: 'New',
          description: 'Competitive events',
        },
      ],
    },
  ];

  const bottomNavigation: NavItem[] = [
    {
      name: 'Profile',
      href: '/profile',
      icon: <UserCircleIcon className="h-5 w-5" />,
      iconSolid: <UserCircleIcon className="h-5 w-5" />,
      description: 'Account settings',
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Cog6ToothIcon className="h-5 w-5" />,
      iconSolid: <Cog6ToothIcon className="h-5 w-5" />,
      description: 'Game preferences',
    },
  ];

  const isActiveRoute = (href: string): boolean => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (!mounted) {
    return null;
  }

  return (
    <aside
      className={`bg-white dark:bg-steel-900 border-r border-steel-200 dark:border-steel-700 transition-all duration-300 ease-in-out flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      } ${className}`}
      aria-label="Game navigation sidebar"
    >
      {/* Sidebar header */}
      <div className="flex items-center justify-between p-4 border-b border-steel-200 dark:border-steel-700">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-navy-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm" role="img" aria-label="Ship">
                ⚓
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-steel-900 dark:text-steel-100 text-sm">
                Game Center
              </h2>
            </div>
          </div>
        )}
        <button
          onClick={handleToggleCollapse}
          className="p-1.5 rounded-lg text-steel-500 hover:text-steel-700 dark:text-steel-400 dark:hover:text-steel-200 hover:bg-steel-100 dark:hover:bg-steel-800 transition-colors duration-200"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation content */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h3 className="px-4 text-xs font-semibold text-steel-500 dark:text-steel-400 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1 px-2">
                {section.items.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                        isActive
                          ? 'bg-navy-100 dark:bg-navy-900 text-navy-700 dark:text-navy-300'
                          : 'text-steel-600 dark:text-steel-400 hover:bg-steel-100 dark:hover:bg-steel-800 hover:text-steel-900 dark:hover:text-steel-200'
                      }`}
                      title={collapsed ? item.name : undefined}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="flex-shrink-0">
                        {isActive ? item.iconSolid : item.icon}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="ml-3 flex-1 truncate">{item.name}</span>
                          {item.badge && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-navy-100 dark:bg-navy-900 text-navy-700 dark:text-navy-300 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Player status section */}
      {!collapsed && (
        <div className="p-4 border-t border-steel-200 dark:border-steel-700">
          <div className="bg-steel-50 dark:bg-steel-800 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm font-medium text-steel-900 dark:text-steel-100">
                Online
              </span>
            </div>
            <p className="text-xs text-steel-500 dark:text-steel-400 mb-2">
              Admiral • Rank: Captain
            </p>
            <div className="flex items-center space-x-1 text-xs text-steel-500 dark:text-steel-400">
              <ShieldCheckIcon className="h-3 w-3" />
              <span>ELO: 1,247</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="border-t border-steel-200 dark:border-steel-700 p-2 space-y-1">
        {bottomNavigation.map((item) => {
          const isActive = isActiveRoute(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-navy-100 dark:bg-navy-900 text-navy-700 dark:text-navy-300'
                  : 'text-steel-600 dark:text-steel-400 hover:bg-steel-100 dark:hover:bg-steel-800 hover:text-steel-900 dark:hover:text-steel-200'
              }`}
              title={collapsed ? item.name : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="flex-shrink-0">
                {isActive ? item.iconSolid : item.icon}
              </span>
              {!collapsed && <span className="ml-3 flex-1 truncate">{item.name}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;