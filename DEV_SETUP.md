# Development Environment Setup

## Quick Start

### Option 1: Docker Setup (Recommended)
```bash
# Start all services with Docker
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Option 2: Local Setup
```bash
# Install dependencies
npm install

# Setup database
npm run db:setup

# Start development server
npm run dev
```

## Environment Variables

1. Copy `.env.example` to `.env.local`
2. Update the values according to your local setup
3. Key variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `REDIS_URL`: Redis connection string
   - `ELECTRIC_SERVICE_URL`: Electric SQL sync service

## Available Scripts

### Development
- `npm run dev` - Start Next.js development server
- `npm run dev:turbo` - Start with Turbopack (experimental)
- `./scripts/dev.sh` - Interactive development menu

### Database
- `npm run db:setup` - Initialize database with schema
- `npm run db:seed` - Populate with sample data
- `npm run db:reset` - Reset and reseed database
- `npm run db:backup` - Create database backup

### Docker
- `npm run docker:up` - Start all services
- `npm run docker:down` - Stop all services
- `npm run docker:build` - Build containers
- `npm run docker:logs` - View container logs
- `npm run docker:clean` - Stop and remove volumes

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - TypeScript type checking
- `npm run format` - Format with Prettier
- `npm run check-all` - Run all checks

## Development Tools

### VS Code Extensions
Install recommended extensions:
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for `@recommended`
4. Install all workspace recommendations

### Database UI
Access Adminer at http://localhost:8080
- Server: `postgres`
- Username: `battleship_user`
- Password: `battleship_pass`
- Database: `battleship_db`

### API Testing
- Health check: http://localhost:3000/api/health
- Use Thunder Client or REST Client VS Code extensions

## Project Structure

```
/src
├── /app              # Next.js App Router
│   ├── /api         # API routes
│   ├── /game        # Game pages
│   └── layout.tsx   # Root layout
├── /components      # React components
├── /lib            # Utilities and helpers
├── /hooks          # Custom React hooks
├── /services       # Business logic
├── /store          # State management
└── /types          # TypeScript types

/scripts
├── /db             # Database scripts
├── setup-db.sh     # Database setup
└── dev.sh          # Development helper

/public             # Static assets
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
```

### Database Connection Issues
```bash
# Check PostgreSQL status
docker ps | grep postgres
# Restart PostgreSQL
docker restart battleship-postgres
```

### Clean Install
```bash
# Remove all dependencies and reinstall
npm run clean
```

### Docker Issues
```bash
# Remove all containers and volumes
npm run docker:clean
# Rebuild containers
npm run docker:build
```

## Hot Reload Configuration

The project is configured for optimal hot reloading:
- File watching with proper exclusions
- Source maps for debugging
- Fast refresh for React components
- WebAssembly support for Electric SQL

## Performance Tips

1. Use Turbopack for faster builds: `npm run dev:turbo`
2. Exclude large directories from file watching
3. Use Docker for consistent environment
4. Enable SWC minification in production

## Security Notes

- Never commit `.env.local` file
- Use strong passwords in production
- Enable CORS only for trusted origins
- Implement rate limiting for APIs
- Use HTTPS in production

## Getting Help

- Check existing issues in the repository
- Review the documentation in `/docs`
- Use the interactive dev menu: `./scripts/dev.sh`