'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DemoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">BrixSports Demo Pages</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/demo/intelligent-header')}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Intelligent Header</h2>
            <p className="text-gray-600 dark:text-gray-300">
              See the intelligent header that shrinks on scroll, similar to professional sports apps.
            </p>
            <div className="mt-4 text-blue-600 dark:text-blue-400 font-medium">View Demo →</div>
          </div>
          
          {/* Add more demo cards here as needed */}
        </div>
      </div>
    </div>
  );
}