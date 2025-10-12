'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Something went wrong!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          onClick={() => reset()}
        >
          Try again
        </button>
      </div>
    </div>
  );
}