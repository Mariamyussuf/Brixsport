# Brixsports Frontend

An offline-first Next.js 14 PWA for managing campus sports activities. Built with the App Router, TypeScript, and a custom service worker for basic offline support.

## Tech Stack
- Next.js ^14 (App Router)
- React 18 + TypeScript
- PWA: `public/manifest.json` + `public/service-worker.js`
- UI libs: `framer-motion`, `lucide-react`, `@hello-pangea/dnd`, `react-window`

## Project Structure
- `app/`
  - `page.tsx` → redirects to `/onboarding`
  - `onboarding/page.tsx` → onboarding screen with CTAs
  - `auth/page.tsx` → unified Login/Sign Up page (use `?tab=login` or `?tab=signup`)
  - `login/page.tsx` and `signup/page.tsx` → redirects to `/auth?tab=…` for backward compatibility
- `src/screens/AuthScreen.tsx` → shared auth UI (client component)
- `src/components/shared/PWARegister.tsx` → service worker registration helper
- `public/manifest.json` → PWA manifest
- `public/service-worker.js` → simple offline caching
- `public/offline.html` → offline fallback

## Getting Started

### Prerequisites
- Node.js 18+ recommended
- pnpm/yarn/npm (any)

### Install
```bash
npm install
# or
yarn
# or
pnpm install
```

### Run Dev Server
```bash
npm run dev
```
Open http://localhost:3000

### Build & Start
```bash
npm run build
npm start
```

## Scripts (from package.json)
- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`

## Routing
- `/onboarding` → entry screen
- `/auth?tab=signup` → sign up tab
- `/auth?tab=login` → login tab
- `/login` and `/signup` redirect to the unified `/auth`

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

## PWA Notes
- Add your app icons to `public/` to match entries in `public/manifest.json` (e.g., 192x192, 512x512 PNGs).
- Service worker (`public/service-worker.js`) performs basic caching and serves `public/offline.html` when offline.
- To register the service worker in UI, use `PWARegister` component (optional) or ensure registration is handled in `app/layout.tsx`.

## Deployment
- Recommended: Vercel (optimized for Next.js). Connect this repo and deploy with defaults.
- Ensure `next.config.js` and `manifest.json` are committed. Icons must exist for install prompts on devices.

## Contributing
- Branch from `main`
- Conventional commits recommended (e.g., `feat:`, `fix:`, `chore:`)
- PRs and code reviews welcome

## License
MIT (or your preferred license)
