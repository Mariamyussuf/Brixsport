# BrixSports Frontend

An offline-first Next.js 14 PWA for managing campus sports activities. Built with the App Router, TypeScript, and comprehensive offline support through IndexedDB and a custom service worker.

## Tech Stack
- Next.js ^14 (App Router) with Static Export
- React 18 + TypeScript
- Tailwind CSS for styling
- PWA: `public/manifest.json` + `public/service-worker.js`
- UI Components: `framer-motion`, `lucide-react`, `@hello-pangea/dnd`, `react-window`
- Tournament Brackets: `@g-loot/react-tournament-brackets`
- Database: Supabase PostgreSQL

## Project Structure
- `app/` - Next.js App Router pages
  - `page.tsx` → redirects to `/onboarding`
  - `onboarding/page.tsx` → onboarding screen with CTAs
  - `auth/page.tsx` → unified Login/Sign Up page (use `?tab=login` or `?tab=signup`)
  - `login/page.tsx` and `signup/page.tsx` → redirects to `/auth?tab=…` for backward compatibility
- `src/screens/AuthScreen.tsx` → shared auth UI (client component)
- `src/components/shared/` → shared UI components
- `src/lib/` → utility functions and libraries
- `public/` → static assets, PWA manifest, service worker, and offline fallback

## Key Features
- **Offline-First Architecture**: Full functionality available even when offline
- **Background Sync**: Events automatically sync when connectivity is restored
- **Progressive Web App**: Installable on mobile and desktop devices
- **IndexedDB Storage**: Client-side event storage for offline access
- **Service Worker**: Custom implementation for caching and background sync
- **Notification System**: Real-time updates for matches, teams, and players with personalized alerts
- **Supabase Integration**: PostgreSQL database hosted on Supabase for production data storage
- **API Integration**: Full backend API connectivity with real-time data
- **Basketball Schedule Management**: Comprehensive schedule system for basketball leagues with fixture viewing and admin import capabilities

## Getting Started

### Prerequisites
- Node.js 18+ recommended
- npm/yarn/pnpm (any package manager)

### Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### Environment Setup
Create a `.env.local` file in the root directory with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_connection_string
```

**⚠️ SECURITY WARNING:** Never commit actual secret values to version control. Use the `.env.local` file for development and configure environment variables in your deployment platform for production.

For production deployment, configure these environment variables in your Vercel project settings or deployment platform.

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Setup
The backend services need to be running for full functionality:
```bash
cd brixsport-backend
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Offline Functionality
This application provides comprehensive offline support through:

1. **IndexedDB Storage**: Events are stored locally in the browser's IndexedDB when offline
2. **Service Worker**: Custom service worker handles caching strategies and background sync
3. **Background Sync API**: Automatically syncs events when connectivity is restored
4. **Offline UI**: Visual indicators show connection status and pending events

### How Offline Sync Works
1. When offline, events are stored in IndexedDB
2. When online, events are automatically synced to the server
3. Manual sync is available through the offline status indicator
4. Service worker handles background synchronization

## Database Integration
The application uses Supabase PostgreSQL for data storage:
- **Backend**: Prisma ORM with Supabase PostgreSQL
- **Frontend**: Supabase JS client for real-time subscriptions
- **Configuration**: See `src/lib/supabaseClient.ts` for client setup
- **Documentation**: See `docs/SUPABASE_SETUP.md` for detailed configuration

## API Integration
Full API connectivity has been implemented:
- **Competitions**: Create, read, update, delete competitions
- **Matches**: Real-time match data and updates
- **Teams**: Team information and rosters
- **Players**: Player profiles and statistics
- **Documentation**: See `docs/API_INTEGRATION_SUMMARY.md` for details

## Scripts (from package.json)
- `dev`: `next dev` - Run development server
- `build`: `next build` - Create production build
- `start`: `next start` - Start production server

## Routing
- `/onboarding` → Entry screen
- `/auth?tab=signup` → Sign up tab
- `/auth?tab=login` → Login tab
- `/login` and `/signup` → Redirect to the unified `/auth` page
- `/logger` → Logger dashboard (requires authentication)
- `/logger/login` → Logger login page

## Logger System
The application includes a dedicated logger system for match logging personnel:

- **Separate Authentication**: Loggers have their own authentication system with dedicated JWT handling
- **Role-Based Access**: Loggers can access match logging features based on their assigned competitions
- **Local Development**: Pre-configured credentials for local testing:
  - Email: `logger@example.com`
  - Password: `logger123`
- **Environment Variables**: Requires `LOGGER_JWT_SECRET` for secure token generation

## Path Aliases
Configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```
Use imports like `import { AuthScreen } from '@/screens/AuthScreen'`.

## PWA Configuration
- Manifest: `public/manifest.json`
- Service Worker: `public/service-worker.js`
- Offline Fallback: `public/offline.html`
- Icons: Multiple sizes in `public/` directory

To register the service worker in UI, use `PWARegister` component or ensure registration is handled in `app/layout.tsx`.

## Deployment
- Recommended: Vercel (optimized for Next.js)
- Ensure `next.config.js` and `manifest.json` are committed
- Icons must exist for install prompts on devices
- Static export mode is enabled for better offline capabilities
- Configure Supabase environment variables in Vercel project settings
- For logger system, set `LOGGER_JWT_SECRET` environment variable in Vercel
- See `vercel.env.example` for a complete list of required environment variables

## Basketball Schedule System
The application includes a comprehensive basketball schedule system with the following features:

- **Fixture Viewing**: Users can view the complete basketball league schedule organized by rounds and dates
- **Admin Import**: Administrators can import official schedules through a dedicated admin interface
- **API Integration**: Schedule data is stored in the Supabase database and accessible through REST API endpoints
- **Responsive UI**: Mobile-friendly schedule display with expandable rounds and match details

### Accessing the Schedule
- Users can access the basketball schedule through the "Fixtures" tab in the main navigation
- Administrators can import schedules through the admin dashboard at `/admin`
- Developers can access schedule data through the API endpoint at `/api/basketball-schedule`

### Schedule Data Structure
The basketball schedule is stored in `basketball_schedule.json` with the following structure:
- League information (name, season)
- Team list
- Rounds with dates and matches
- Special events (draft combine, all-star games)
- Trading period information

## Logger System Access
To access the logger system:
1. Visit `/logger/login` on your deployed site
2. For local development, use the pre-configured credentials:
   - Email: `logger@example.com`
   - Password: `logger123`
3. On production deployments, loggers will use their assigned credentials

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License
BrixSports