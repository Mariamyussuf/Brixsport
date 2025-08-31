'use client';

import React from 'react';
import CompetitionsDemo from '@/components/demo/CompetitionsDemo';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const APIDemoPage = () => {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Button 
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            ← Back
          </Button>
          
          <h1 className="text-3xl font-bold">BrixSports API Demo</h1>
          <p className="text-gray-600 mt-2">
            Demonstrating integration with the BrixSports backend API
          </p>
        </header>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Server</h3>
              <div className="flex items-center bg-gray-100 rounded p-2">
                <span className="text-gray-800 font-mono">http://localhost:3000/api</span>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Version</h3>
              <div className="flex items-center bg-gray-100 rounded p-2">
                <span className="text-gray-800 font-mono">1.0.0</span>
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">OAS 3.0</span>
              </div>
            </div>
          </div>
        </div>
        
        <section className="bg-white rounded-lg shadow-md mb-8">
          <CompetitionsDemo />
        </section>
      </div>
    </div>
  );
};

export default APIDemoPage;