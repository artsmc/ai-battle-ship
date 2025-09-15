# Battleship Naval Strategy Game - Design System

## Overview

This design system provides a comprehensive set of design tokens, components, and utilities specifically tailored for the Battleship Naval Strategy Game. It ensures consistency, accessibility, and maintainability across the entire application.

## Design Philosophy

### Naval/Maritime Aesthetic
The design system is built around naval and maritime themes, evoking the atmosphere of historical naval warfare while maintaining modern usability standards.

### Key Principles
- **Consistency**: Uniform visual language across all components
- **Accessibility**: WCAG 2.2 AA compliance with support for screen readers, keyboard navigation, and high contrast modes
- **Performance**: Optimized for game interfaces with smooth animations and responsive interactions
- **Scalability**: Modular system that supports both light and dark themes
- **Responsiveness**: Mobile-first approach with game-specific breakpoints

## Color Palette

### Primary Colors

#### Navy (Primary Brand Color)
```css
--navy-50: #f0f9ff   /* Lightest navy */
--navy-500: #0ea5e9  /* Primary navy */
--navy-900: #0c4a6e  /* Darkest navy */
--navy-950: #083344  /* Deep navy */
```

#### Ocean (Secondary Brand Color)
```css
--ocean-50: #ecfeff   /* Light ocean foam */
--ocean-500: #06b6d4  /* Ocean blue */
--ocean-900: #164e63  /* Deep ocean */
--ocean-950: #0c3a4a  /* Ocean depths */
```

#### Steel (Neutral Colors)
```css
--steel-50: #f8fafc   /* Light steel */
--steel-500: #64748b  /* Steel gray */
--steel-900: #0f172a  /* Dark steel */
--steel-950: #020617  /* Darkest steel */
```

### Game-Specific Colors

#### Game State Colors
- **Water**: `#0ea5e9` (Navy 500)
- **Ship**: `#1f2937` (Gray 800)
- **Hit**: `#dc2626` (Red 600)
- **Miss**: `#6b7280` (Gray 500)
- **Sunk**: `#991b1b` (Red 700)
- **Targeting**: `#f59e0b` (Amber 500)
- **Selected**: `#10b981` (Emerald 500)
- **Hover**: `#3b82f6` (Blue 500)

#### Status Indicators
- **Online**: `#10b981` (Green)
- **Offline**: `#6b7280` (Gray)
- **Waiting**: `#f59e0b` (Amber)
- **Playing**: `#3b82f6` (Blue)
- **Spectating**: `#8b5cf6` (Violet)

### Maritime Color Variants
Each color has light and dark theme variants:
- **Wave**: Light `#e0f2fe` / Dark `#164e63`
- **Depth**: Light `#0ea5e9` / Dark `#0891b2`
- **Ship**: Light `#475569` / Dark `#cbd5e1`
- **Deck**: Light `#94a3b8` / Dark `#64748b`
- **Anchor**: Light `#334155` / Dark `#f1f5f9`

## Typography

### Font Families
- **Sans**: Inter (Primary)
- **Mono**: JetBrains Mono (Code/Technical)
- **Display**: Inter (Headings)
- **Body**: Inter (Body text)

### Font Sizes
```css
text-xs: 0.75rem    /* 12px */
text-sm: 0.875rem   /* 14px */
text-base: 1rem     /* 16px */
text-lg: 1.125rem   /* 18px */
text-xl: 1.25rem    /* 20px */
text-2xl: 1.5rem    /* 24px */
text-3xl: 1.875rem  /* 30px */
text-4xl: 2.25rem   /* 36px */
text-5xl: 3rem      /* 48px */
```

### Font Weights
- **Light**: 300
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Spacing System

The spacing system follows an 8px base unit:
```css
1: 0.25rem  /* 4px */
2: 0.5rem   /* 8px */
3: 0.75rem  /* 12px */
4: 1rem     /* 16px */
5: 1.25rem  /* 20px */
6: 1.5rem   /* 24px */
8: 2rem     /* 32px */
10: 2.5rem  /* 40px */
12: 3rem    /* 48px */
16: 4rem    /* 64px */
20: 5rem    /* 80px */
24: 6rem    /* 96px */
```

## Responsive Breakpoints

### Standard Breakpoints
- **xs**: 475px
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Game-Specific Breakpoints
- **mobile-game**: max-width 768px
- **tablet-game**: 769px - 1024px
- **desktop-game**: min-width 1025px

### Orientation Support
- **portrait**: `(orientation: portrait)`
- **landscape**: `(orientation: landscape)`

## Components

### Buttons

#### Variants
```html
<!-- Primary -->
<button class="btn btn-primary">Primary Action</button>

<!-- Secondary -->
<button class="btn btn-secondary">Secondary Action</button>

<!-- Outline -->
<button class="btn btn-outline">Outline Button</button>

<!-- Ghost -->
<button class="btn btn-ghost">Ghost Button</button>

<!-- Danger -->
<button class="btn btn-danger">Dangerous Action</button>

<!-- Success -->
<button class="btn btn-success">Success Action</button>
```

#### Sizes
```html
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### Cards

#### Variants
```html
<!-- Default Card -->
<div class="card">Content</div>

<!-- Compact Card -->
<div class="card card-compact">Less padding</div>

<!-- Spacious Card -->
<div class="card card-spacious">More padding</div>

<!-- Hover Card -->
<div class="card card-hover">Interactive card</div>

<!-- Glass Effect Card -->
<div class="card card-glass">Glass morphism</div>

<!-- Maritime Themed Card -->
<div class="card card-maritime">Naval pattern</div>
```

### Game Board

```html
<div class="game-board">
  <div class="game-cell game-cell-water"></div>
  <div class="game-cell game-cell-ship"></div>
  <div class="game-cell game-cell-hit"></div>
  <div class="game-cell game-cell-miss"></div>
  <div class="game-cell game-cell-sunk"></div>
</div>
```

### Ship Cards

```html
<div class="ship-card ship-card-available">
  <!-- Available ship -->
</div>

<div class="ship-card ship-card-selected">
  <!-- Selected ship -->
</div>

<div class="ship-card ship-card-deployed">
  <!-- Deployed ship -->
</div>
```

### Status Indicators

```html
<span class="status-indicator status-online">Online</span>
<span class="status-indicator status-offline">Offline</span>
<span class="status-indicator status-waiting">Waiting</span>
<span class="status-indicator status-playing">Playing</span>
```

## Animations

### Custom Animations
- **fade-in**: Smooth fade in effect
- **fade-out**: Smooth fade out effect
- **slide-up/down/left/right**: Directional slides
- **scale-in/out**: Scaling effects
- **shake**: Error indication
- **wave**: Ocean-like movement
- **float**: Gentle floating motion
- **glow**: Pulsing glow effect
- **radar-sweep**: Rotating radar effect

### Usage
```html
<div class="animate-fade-in">Fades in</div>
<div class="animate-wave">Wave motion</div>
<div class="animate-glow">Glowing effect</div>
```

## Shadows

### Naval-Themed Shadows
```css
.shadow-naval      /* Subtle naval shadow */
.shadow-maritime   /* Medium maritime shadow */
.shadow-ocean-depth /* Deep ocean shadow */
.shadow-ship-outline /* Ship outline effect */
```

### Glow Effects
```css
.shadow-glow-blue    /* Blue glow */
.shadow-glow-green   /* Green glow */
.shadow-glow-red     /* Red glow */
.shadow-glow-yellow  /* Yellow glow */
```

## Utilities

### Glass Effect
```html
<div class="glass-effect">Light theme glass</div>
<div class="glass-effect-dark">Dark theme glass</div>
```

### Game-Specific Utilities
```html
<div class="water-pattern">Water background pattern</div>
<div class="maritime-pattern">Maritime background pattern</div>
<div class="naval-gradient">Naval gradient background</div>
<div class="ocean-gradient">Ocean gradient background</div>
```

### Text Effects
```html
<h1 class="text-gradient">Gradient text</h1>
<p class="text-maritime">Maritime colored text</p>
<span class="text-shadow">Text with shadow</span>
<span class="text-shadow-lg">Text with large shadow</span>
```

## Dark Mode Support

The design system includes comprehensive dark mode support:

### CSS Custom Properties
```css
:root {
  --bg-primary: 248 250 252;    /* Light theme */
  --text-primary: 15 23 42;
}

.dark {
  --bg-primary: 2 6 23;         /* Dark theme */
  --text-primary: 248 250 252;
}
```

### Usage
```html
<!-- Automatically adapts to theme -->
<div class="bg-primary text-primary">
  Content that adapts to theme
</div>

<!-- Manual dark mode variants -->
<div class="bg-white dark:bg-steel-800">
  Explicit theme variants
</div>
```

## Accessibility Features

### Focus Management
- Custom focus styles with naval theme
- Keyboard navigation support
- Screen reader friendly markup

### High Contrast Support
```css
@media (prefers-contrast: high) {
  .btn-primary {
    @apply border-2 border-navy-800;
  }
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  .animate-pulse,
  .animate-bounce,
  .animate-spin {
    animation: none;
  }
}
```

### Screen Reader Support
```html
<span class="sr-only">Screen reader only text</span>
```

## Game-Specific Features

### Board Layout
```html
<div class="game-layout">
  <!-- Responsive game layout -->
  <main>Game board</main>
  <aside>Ship selection</aside>
</div>
```

### Mobile Game Layout
```html
<div class="mobile-game-layout">
  <header>Game header</header>
  <main>Game content</main>
  <footer>Game controls</footer>
</div>
```

## Usage Guidelines

### Color Usage
- Use navy colors for primary actions and branding
- Use ocean colors for secondary elements and accents
- Use steel colors for neutral elements and text
- Use game state colors specifically for board interactions
- Always provide sufficient contrast ratios (4.5:1 minimum)

### Typography
- Use display font for headings and titles
- Use body font for general content
- Use mono font for technical information and coordinates
- Maintain consistent hierarchy with font sizes

### Spacing
- Use consistent spacing multiples of 4px
- Provide adequate touch targets (minimum 44px)
- Ensure proper content spacing for readability

### Animation
- Use subtle animations to enhance user experience
- Respect user motion preferences
- Keep animations purposeful and not decorative only

## Implementation

### Tailwind CSS Integration
All design tokens are integrated into Tailwind CSS configuration:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        navy: { /* naval colors */ },
        ocean: { /* ocean colors */ },
        steel: { /* steel colors */ }
      }
    }
  }
}
```

### TypeScript Support
Type definitions are provided for all design tokens:

```typescript
import { ColorScale, FontSize, Spacing } from '@/types/design-system';
import { getColor, getSpacing } from '@/styles/design-tokens';
```

## Browser Support
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)
- Progressive enhancement for older browsers

## Performance Considerations
- CSS custom properties for runtime theme switching
- Optimized animations with GPU acceleration
- Minimal CSS bundle size through Tailwind's purging
- Efficient component composition

## Future Enhancements
- Additional ship-specific color themes
- More sophisticated maritime patterns
- Enhanced accessibility features
- Additional game-specific utilities
- Animation library expansion

---

For technical implementation details, see:
- `/src/styles/design-tokens.ts` - Design token definitions
- `/src/types/design-system.ts` - TypeScript type definitions
- `/tailwind.config.js` - Tailwind configuration
- `/src/app/globals.css` - Base styles and components