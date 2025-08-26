import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-8 bg-black text-white">
      <section className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center text-center gap-6">
        <h1 className="text-4xl font-extrabold">Welcome to BrixSports</h1>
        <p className="text-white/80 max-w-prose">
          Track campus sports with an offline-first, installable web app.
          Continue to create an account or log in to get started.
        </p>
        <div className="flex gap-4 mt-4">
          <Link href="/auth?tab=signup" className="px-6 py-3 rounded-xl bg-white/10 border-2 border-white hover:bg-white/20 transition">Sign Up</Link>
          <Link href="/auth?tab=login" className="px-6 py-3 rounded-xl bg-blue-600 border-2 border-blue-600 hover:bg-blue-700 transition">Log in</Link>
        </div>
      </section>
      <footer className="w-full max-w-2xl py-6 text-center text-white/60">
        Tip: You can install this app to your home screen from your browser menu for a native-like experience.
      </footer>
    </main>
  );
}
