/**
 * Type definitions for the Design System
 *
 * This file contains TypeScript types and interfaces for all design system
 * components, ensuring type safety across the application.
 */

// Theme Mode Types
export type ThemeMode = 'light' | 'dark' | 'system';

// Color Types
export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950?: string;
};

export type MaritimeColorVariant = 'wave' | 'depth' | 'ship' | 'deck' | 'anchor';
export type GameStateColor = 'water' | 'ship' | 'hit' | 'miss' | 'sunk' | 'targeting' | 'selected' | 'hover';
export type StatusColor = 'online' | 'offline' | 'waiting' | 'playing' | 'spectating';
export type SemanticColor = 'success' | 'warning' | 'error' | 'info';

// Typography Types
export type FontFamily = 'sans' | 'mono' | 'display' | 'body';
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
export type FontWeight = 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
export type LetterSpacing = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';

// Spacing Types
export type Spacing = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '14' | '16' | '18' | '20' | '24' | '28' | '32' | '36' | '40' | '44' | '48' | '52' | '56' | '60' | '64' | '72' | '80' | '88' | '96' | '128' | '144';

// Breakpoint Types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'mobile-game' | 'tablet-game-min' | 'tablet-game-max' | 'desktop-game';

// Shadow Types
export type BoxShadow = 'sm' | 'default' | 'md' | 'lg' | 'xl' | '2xl' | 'inner' | 'inner-lg' | 'naval' | 'maritime' | 'ocean-depth' | 'ship-outline' | 'glow-blue' | 'glow-green' | 'glow-red' | 'glow-yellow';

// Border Radius Types
export type BorderRadius = 'none' | 'sm' | 'default' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

// Animation Types
export type AnimationDuration = '75' | '100' | '150' | '200' | '300' | '500' | '700' | '1000';
export type AnimationEase = 'linear' | 'in' | 'out' | 'in-out';

// Component Size Types
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Button Types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

// Card Types
export type CardVariant = 'default' | 'compact' | 'spacious' | 'hover' | 'glass' | 'maritime';

export interface CardProps {
  variant?: CardVariant;
  padding?: ComponentSize;
  shadow?: BoxShadow;
  rounded?: BorderRadius;
  border?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

// Game-Specific Types
export type ShipType = 'destroyer' | 'submarine' | 'cruiser' | 'battleship' | 'carrier';
export type GameBoardSize = 'mobile' | 'tablet' | 'desktop';
export type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export interface GameBoardProps {
  size?: GameBoardSize;
  interactive?: boolean;
  showGrid?: boolean;
  className?: string;
  onCellClick?: (row: number, col: number) => void;
}

export interface GameCellProps {
  state: CellState;
  row: number;
  col: number;
  size?: ComponentSize;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface ShipCardProps {
  type: ShipType;
  deployed: boolean;
  selected?: boolean;
  available?: boolean;
  onClick?: () => void;
  className?: string;
}

// Status Types
export type PlayerStatus = 'online' | 'offline' | 'away' | 'busy';
export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface StatusIndicatorProps {
  status: PlayerStatus | GameStatus | ConnectionStatus;
  text?: string;
  showIcon?: boolean;
  size?: ComponentSize;
  className?: string;
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
  className?: string;
}

// Form Types
export interface FormInputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
}

export interface FormLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface FormErrorProps {
  error?: string;
  className?: string;
}

// Navigation Types
export interface NavLinkProps {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

// Loading Types
export type LoadingType = 'spinner' | 'dots' | 'bars' | 'pulse';

export interface LoadingProps {
  type?: LoadingType;
  size?: ComponentSize;
  color?: string;
  className?: string;
}

// Tooltip Types
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'left-start' | 'left-end' | 'right-start' | 'right-end';

export interface TooltipProps {
  content: string | React.ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  children: React.ReactElement;
  className?: string;
}

// Layout Types
export interface LayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export interface GridProps {
  columns?: number | string;
  rows?: number | string;
  gap?: Spacing;
  className?: string;
  children: React.ReactNode;
}

export interface FlexProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'stretch' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: Spacing;
  className?: string;
  children: React.ReactNode;
}

// Responsive Design Types
export interface ResponsiveValue<T> {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

export type ResponsiveSize = ResponsiveValue<ComponentSize>;
export type ResponsiveSpacing = ResponsiveValue<Spacing>;
export type ResponsiveBoolean = ResponsiveValue<boolean>;

// Theme Context Types
export interface ThemeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  isLight: boolean;
}

// Design System Configuration
export interface DesignSystemConfig {
  defaultTheme: ThemeMode;
  enableAnimations: boolean;
  enableSounds: boolean;
  accessibilityMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

// Component Base Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

// Animation Props
export interface AnimationProps {
  duration?: AnimationDuration;
  ease?: AnimationEase;
  delay?: string;
  iteration?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

// Accessibility Props
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  role?: string;
  tabIndex?: number;
}