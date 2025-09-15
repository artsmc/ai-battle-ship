# Tech Context

## Technologies Used

### Core Framework Stack
- **Next.js 14.2.0**: Full-stack React framework with App Router, Server Components, and built-in optimizations
- **React 18.3.0**: Component-based UI library with Hooks, Concurrent Features, and Suspense
- **TypeScript 5.5.0**: Statically typed JavaScript with strict type checking enabled (no `any` types allowed)

### Game Rendering & Graphics
- **Konva.js 9.2.0**: High-performance 2D canvas library for 60fps game board rendering
- **React-Konva 18.2.10**: React bindings for Konva.js enabling declarative canvas components
- **Framer Motion 12.23.12**: Advanced animation library for smooth UI transitions and game effects

### State Management & Data Fetching
- **Zustand 4.5.0**: Lightweight state management with minimal boilerplate and TypeScript support
- **TanStack React Query 5.51.0**: Server state management with caching, background updates, and error handling

### Database & Synchronization
- **wa-sqlite 0.9.9**: WebAssembly SQLite implementation for browser-based local storage
- **Electric-SQL 0.12.0**: Real-time database synchronization with offline-first architecture and CRDT conflict resolution

### Styling & UI Framework
- **Tailwind CSS 3.4.0**: Utility-first CSS framework with responsive design and dark mode support
- **PostCSS 8.4.0**: CSS processing with autoprefixer and optimization plugins
- **Lucide React 0.544.0**: Comprehensive icon library with consistent design and TypeScript support

### Form Management & User Input
- **React Hook Form 7.62.0**: Performant form library with minimal re-renders and built-in validation

### Development & Quality Tools
- **ESLint 8.57.0**: JavaScript/TypeScript linting with strict rules and auto-fixing
- **Prettier 3.3.0**: Code formatting for consistent style across the codebase
- **Husky 9.0.0**: Git hooks for automated quality checks before commits
- **lint-staged 15.2.0**: Run linters only on staged files for performance

## Development Setup

### Environment Requirements
- **Node.js**: Version 18+ for modern JavaScript features and performance
- **npm/yarn**: Package manager for dependency installation and script execution
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ for development testing
- **Git**: Version control with pre-commit hooks for quality assurance

### Local Development Configuration
```bash
# Install dependencies
npm install

# Start development server
npm run dev              # Standard Next.js dev server
npm run dev:turbo        # Turbo mode for faster development

# Quality assurance
npm run type-check       # TypeScript type checking
npm run lint             # ESLint with auto-fix
npm run lint:fix         # Force ESLint fixes
npm run format           # Prettier formatting
npm run format:check     # Check formatting without changes
npm run check-all        # Run all quality checks

# Database management
npm run db:setup         # Initialize database
npm run db:seed          # Seed with sample data
npm run db:reset         # Reset and reseed database
npm run db:backup        # Backup database

# Docker development
npm run docker:up        # Start development containers
npm run docker:down      # Stop containers
npm run docker:build     # Build containers
npm run docker:logs      # View container logs
npm run docker:clean     # Clean containers and volumes

# Build and analysis
npm run build            # Production build
npm run start            # Start production server
npm run analyze          # Bundle analysis
npm run clean            # Clean and reinstall
```

### Development Server Features
- **Hot Reloading**: Instant updates during development without losing state
- **Turbo Mode**: Enhanced development server with faster builds and updates
- **TypeScript Integration**: Real-time type checking and IntelliSense support
- **Error Overlay**: Clear error messages with source code context and stack traces
- **Performance Monitoring**: Built-in performance metrics and optimization suggestions
- **Bundle Analysis**: Integrated bundle analyzer for optimization insights

### Database Setup (Local)
- **SQLite File**: Local database file created automatically in project directory
- **Electric-SQL Client**: Configured for local development with sync capabilities
- **Schema Migrations**: Automatic schema creation and updates during development
- **Data Seeding**: Sample game data and ship configurations for testing
- **Database Scripts**: Comprehensive management scripts for setup, seeding, backup, and reset
- **Docker Integration**: Containerized database setup for consistent development environment

## Technical Constraints

### Browser Compatibility Requirements
- **Canvas API Support**: Required for Konva.js game board rendering
- **WebAssembly Support**: Needed for wa-sqlite database operations
- **ES2020 Features**: Modern JavaScript syntax and APIs
- **Local Storage**: Minimum 50MB available for game data and assets
- **Network Connectivity**: Optional for local games, required for multiplayer

### Performance Constraints
- **60fps Rendering**: Consistent frame rate for smooth gameplay experience
- **Memory Usage**: Optimized for devices with 2GB+ RAM
- **Load Time**: Initial page load under 3 seconds, navigation under 1 second
- **Battery Efficiency**: Minimal power consumption on mobile devices
- **Network Bandwidth**: Efficient data usage for multiplayer synchronization

### Mobile Device Considerations
- **Touch Interface**: Responsive touch controls with appropriate target sizes
- **Screen Sizes**: Adaptive layouts from 320px to 1920px+ width
- **Orientation Support**: Both portrait and landscape modes
- **Performance Scaling**: Reduced visual effects on lower-end devices
- **Offline Capability**: Full local gameplay without network connection

## Dependencies

### Production Dependencies
```json
{
  "next": "^14.2.0",                    // Core framework
  "react": "^18.3.0",                  // UI library
  "react-dom": "^18.3.0",              // DOM rendering
  "konva": "^9.2.0",                   // Canvas graphics
  "react-konva": "^18.2.10",           // React canvas bindings
  "@tanstack/react-query": "^5.51.0",  // Server state management
  "zustand": "^4.5.0",                 // Client state management
  "electric-sql": "^0.12.0",           // Database synchronization
  "wa-sqlite": "^0.9.9",               // Local SQLite database
  "framer-motion": "^12.23.12",        // Advanced animations
  "lucide-react": "^0.544.0",          // Icon system
  "react-hook-form": "^7.62.0"         // Form management
}
```

### Development Dependencies
```json
{
  "@types/node": "^20.14.0",           // Node.js types
  "@types/react": "^18.3.0",           // React types
  "@types/react-dom": "^18.3.0",       // React DOM types
  "typescript": "^5.5.0",              // TypeScript compiler
  "eslint": "^8.57.0",                 // Code linting
  "eslint-config-next": "^14.2.0",     // Next.js ESLint config
  "@typescript-eslint/eslint-plugin": "^7.16.0", // TS linting
  "@typescript-eslint/parser": "^7.16.0",        // TS parser
  "prettier": "^3.3.0",                // Code formatting
  "tailwindcss": "^3.4.0",             // CSS framework
  "autoprefixer": "^10.4.0",           // CSS prefixes
  "postcss": "^8.4.0",                 // CSS processing
  "husky": "^9.0.0",                   // Git hooks
  "lint-staged": "^15.2.0"             // Staged file linting
}
```

### Dependency Management Strategy
- **Exact Versions**: Lock major versions to prevent breaking changes
- **Security Updates**: Regular dependency audits and security patches
- **Bundle Size**: Monitor and optimize package sizes for performance
- **Tree Shaking**: Eliminate unused code from production bundles
- **Peer Dependencies**: Ensure compatibility between related packages

## Tool Usage Patterns

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,              // Strict type checking
    "noImplicitAny": true,       // No implicit any types
    "noImplicitReturns": true,   // All code paths return values
    "noUnusedLocals": true,      // No unused variables
    "noUnusedParameters": true   // No unused parameters
  }
}
```

### ESLint Rules
- **TypeScript Strict**: Enforce type safety and best practices
- **React Hooks**: Validate hooks usage and dependencies
- **Import Order**: Consistent import organization and sorting
- **Naming Conventions**: Enforce consistent naming patterns
- **Performance**: Identify potential performance issues

### Prettier Configuration
- **Consistent Formatting**: Automatic code formatting on save
- **Team Standards**: Shared formatting rules across developers
- **Integration**: Works with ESLint and editor plugins
- **Pre-commit**: Automatic formatting before commits

### Build Optimization
- **Code Splitting**: Automatic route-based and dynamic imports
- **Tree Shaking**: Remove unused code from bundles
- **Minification**: Compress JavaScript and CSS for production
- **Image Optimization**: Automatic image resizing and format conversion
- **Caching**: Aggressive caching strategies for static assets

### Testing Strategy (Planned)
- **Unit Tests**: Jest with React Testing Library for component testing
- **Integration Tests**: End-to-end game flow validation
- **Performance Tests**: Canvas rendering and state management benchmarks
- **Accessibility Tests**: Screen reader and keyboard navigation validation
- **Cross-browser Tests**: Automated testing across target browsers

### Deployment Pipeline
- **Development**: Local development server with hot reloading
- **Staging**: Preview deployments for testing and review
- **Production**: Optimized builds with CDN distribution
- **Monitoring**: Error tracking and performance monitoring
- **Rollback**: Quick rollback capability for production issues

### Security Considerations
- **Input Validation**: All user inputs validated and sanitized
- **XSS Prevention**: React's built-in protection plus CSP headers
- **CSRF Protection**: Next.js built-in CSRF protection for API routes
- **Dependency Security**: Regular security audits and updates
- **Data Encryption**: Sensitive data encrypted in local storage

The technical context ensures all development decisions align with performance, security, and maintainability requirements while supporting the game's educational and entertainment objectives.
