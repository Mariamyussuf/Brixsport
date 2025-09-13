import React from 'react';

export default function LoginFormLoading() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4 animate-pulse">
            <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
          </div>
          <div className="h-8 bg-gray-700 rounded w-3/4 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto animate-pulse"></div>
        </div>

        <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
          <div className="flex-1 py-2 px-4 rounded-md">
            <div className="h-4 bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div className="flex-1 py-2 px-4 rounded-md">
            <div className="h-4 bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse"></div>
            <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse"></div>
            <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="pt-4">
            <div className="h-10 bg-blue-600 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}