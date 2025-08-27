# BrixSports Frontend

An offline-first Next.js 14 PWA for managing campus sports activities. Built with the App Router, TypeScript, and comprehensive offline support through IndexedDB and a custom service worker.

## Tech Stack
- Next.js ^14 (App Router) with Static Export
- React 18 + TypeScript
- Tailwind CSS for styling
- PWA: `public/manifest.json` + `public/service-worker.js`
- UI Components: `framer-motion`, `lucide-react`, `@hello-pangea/dnd`, `react-window`
- Tournament Brackets: `@g-loot/react-tournament-brackets`

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

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

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

## Scripts (from package.json)
- `dev`: `next dev` - Run development server
- `build`: `next build` - Create production build
- `start`: `next start` - Start production server

## Routing
- `/onboarding` → Entry screen
- `/auth?tab=signup` → Sign up tab
- `/auth?tab=login` → Login tab
- `/login` and `/signup` → Redirect to the unified `/auth` page

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

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License
BrixSports